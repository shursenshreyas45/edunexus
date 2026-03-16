import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable, RefreshControl, TextInput } from 'react-native';
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
        <ActivityIndicator size="small" color="#0000ff" />
      </View>
    );
  };

  if (initialLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
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
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80, // Space for FAB
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
    color: '#000',
  },
  cardPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#28a745',
  },
  cardCategory: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    marginBottom: 4,
  },
  cardOwner: {
    fontSize: 13,
    color: '#888',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  cardDescription: {
    fontSize: 14,
    color: '#444',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: '#888',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    padding: 10,
    backgroundColor: '#ffe6e6',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  fabText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '300',
    lineHeight: 34,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchButton: {
    backgroundColor: '#2563eb', // EduNexus Primary
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
