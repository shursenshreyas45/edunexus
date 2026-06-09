import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable, RefreshControl, TextInput } from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../config/api';

import { formatDistanceToNow } from 'date-fns';

type Listing = {
  id: number;
  title: string;
  description: string;
  category: string;
  condition: number;
  price: number;
  ownerId: string;
  ownerFullName?: string;
  ownerSchoolName?: string;
  ownerEmail?: string;
  imageUrl?: string | null;
  createdAt: string;
};

export default function MarketplaceFeed() {
  const router = useRouter();
  const { token } = useAuth();
  const params = useLocalSearchParams();

  const [listings, setListings] = useState<Listing[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [offset, setOffset] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [errorMSG, setErrorMSG] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);

  const fetchListings = async (isRefresh: boolean = false) => {
    if (!token) return;

    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoadingMore(true);
      }
      setErrorMSG('');

      const currentOffset = isRefresh ? 0 : offset;
      const limit = 20;

      let url = `${API_URL}/listings?limit=${limit}&offset=${currentOffset}`;
      if (searchQuery.trim()) {
        url += `&search=${encodeURIComponent(searchQuery.trim())}`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();

        const newData = Array.isArray(data) ? data : (Array.isArray(data.listings) ? data.listings : []);

        if (isRefresh) {
          setListings(newData);
          setOffset(limit);
        } else {
          setListings(prev => Array.isArray(newData) ? [...prev, ...newData] : prev);
          setOffset(currentOffset + limit);
        }

        if (newData.length < limit) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }
      } else {
        const errData = await response.json();
        setErrorMSG(errData.error || 'Failed to fetch listings');
      }
    } catch (e) {
      setErrorMSG('Network error while fetching listings.');
    } finally {
      setIsRefreshing(false);
      setIsLoadingMore(false);
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchListings(true);
    }
  }, [token]);

  // Re-fetch when navigating back from create-listing with refresh param
  useEffect(() => {
    if (params?.refresh) {
      fetchListings(true);
    }
  }, [params?.refresh]);

  const onRefresh = useCallback(() => {
    fetchListings(true);
  }, [token, searchQuery]);

  const onEndReached = () => {
    if (!isLoadingMore && !isRefreshing && hasMore) {
      fetchListings(false);
    }
  };

  const renderItem = ({ item }: { item: Listing }) => {
    const timeAgo = item.createdAt ? formatDistanceToNow(new Date(item.createdAt), { addSuffix: true }) : '';
    const authorName = item.ownerFullName
      ? `${item.ownerFullName} ${item.ownerSchoolName ? `(${item.ownerSchoolName})` : ''}`
      : (item.ownerEmail || 'Unknown Author');

    return (
      <View style={styles.card}>
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.listingImage}
            contentFit="cover"
          />
        ) : null}
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardPrice}>
            {!item.price || Number(item.price) === 0 ? 'FREE' : `$${Number(item.price).toFixed(2)}`}
          </Text>
        </View>

        <Text style={styles.cardCategory}>{item.category} • Condition: {item.condition}/5</Text>
        <Text style={styles.cardOwner}>Listed by {authorName} • {timeAgo}</Text>

        {item.description ? (
          <Text style={styles.cardDescription} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}
      </View>
    );
  };

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#3b82f6" />
      </View>
    );
  };

  if (initialLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={styles.outerContainer}>
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search for books, notes..."
          onSubmitEditing={() => fetchListings(true)}
          returnKeyType="search"
        />
        <Pressable style={styles.searchButton} onPress={() => fetchListings(true)}>
          <Text style={styles.searchButtonText}>Search</Text>
        </Pressable>
      </View>

      {errorMSG ? <Text style={styles.errorText}>{errorMSG}</Text> : null}

      <FlatList
        data={listings}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          !isRefreshing && !initialLoading ? (
            <Text style={styles.emptyText}>No listings found. Be the first to create one!</Text>
          ) : null
        }
      />

      <Pressable
        style={styles.fab}
        onPress={() => router.push('/create-listing')}
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
  },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 800,
    backgroundColor: '#f1f5f9',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#1e293b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  listingImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
    color: '#1e293b',
  },
  cardPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10b981',
  },
  cardCategory: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 4,
  },
  cardOwner: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: '#64748b',
  },
  errorText: {
    color: '#ef4444',
    textAlign: 'center',
    padding: 12,
    backgroundColor: '#fee2e2',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    fontWeight: '500',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  fabText: {
    fontSize: 28,
    color: '#ffffff',
    fontWeight: '300',
    lineHeight: 30,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    color: '#1e293b',
  },
  searchButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  searchButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 15,
  },
});
