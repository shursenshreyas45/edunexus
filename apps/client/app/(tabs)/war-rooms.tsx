import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable, RefreshControl, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../config/api';

import { formatDistanceToNow } from 'date-fns';

type Post = {
    id: number;
    title: string;
    content: string;
    authorId: string;
    authorFullName?: string;
    authorSchoolName?: string;
    authorEmail?: string;
    metadata?: {
        tags?: string[];
    };
    createdAt: string;
};

const DEFAULT_TAGS = ['All', '#UPSC', '#Class10', '#JEE', '#NEET', '#General'];

export default function WarRoomsScreen() {
    const router = useRouter();
    const { token } = useAuth();
    const params = useLocalSearchParams();

    const [posts, setPosts] = useState<Post[]>([]);
    const [offset, setOffset] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [errorMSG, setErrorMSG] = useState('');
    const [initialLoading, setInitialLoading] = useState(true);

    const [selectedTag, setSelectedTag] = useState('All');

    const fetchPosts = async (isRefresh: boolean = false, currentTag: string = selectedTag) => {
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

            let url = `${API_URL}/posts?limit=${limit}&offset=${currentOffset}`;
            if (currentTag !== 'All') {
                url += `&tag=${encodeURIComponent(currentTag.replace('#', '').toLowerCase())}`;
            }

            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                const newData = Array.isArray(data) ? data : (Array.isArray(data.posts) ? data.posts : []);

                if (isRefresh) {
                    setPosts(newData);
                    setOffset(limit);
                } else {
                    setPosts(prev => Array.isArray(newData) ? [...prev, ...newData] : prev);
                    setOffset(currentOffset + limit);
                }

                if (newData.length < limit) {
                    setHasMore(false);
                } else {
                    setHasMore(true);
                }
            } else {
                const errData = await response.json();
                setErrorMSG(errData.error || 'Failed to fetch posts');
            }
        } catch (e) {
            setErrorMSG('Network error while fetching posts.');
        } finally {
            setIsRefreshing(false);
            setIsLoadingMore(false);
            setInitialLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchPosts(true);
        }
    }, [token, selectedTag]); // Refetch when tag changes

    // Re-fetch when navigating back from create-post with refresh param
    useEffect(() => {
        if (params?.refresh) {
            // If we just created a post, probably want to show 'All' or keep current tag and refresh
            fetchPosts(true);
        }
    }, [params?.refresh]);

    const onRefresh = useCallback(() => {
        fetchPosts(true);
    }, [token, selectedTag]);

    const onEndReached = () => {
        if (!isLoadingMore && !isRefreshing && hasMore) {
            fetchPosts(false);
        }
    };

    const handleTagPress = (tag: string) => {
        if (selectedTag !== tag) {
            setInitialLoading(true); // Optional visual indicator for tag switch
            setSelectedTag(tag);
            setPosts([]); // Clear immediately for better UX
            // fetchPosts is triggered by useEffect on selectedTag change
        }
    };

    const renderTagFilters = () => (
        <View style={styles.tagFiltersContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagFiltersContent}>
                {DEFAULT_TAGS.map(tag => (
                    <Pressable
                        key={tag}
                        style={[styles.filterPill, selectedTag === tag && styles.filterPillActive]}
                        onPress={() => handleTagPress(tag)}
                    >
                        <Text style={[styles.filterPillText, selectedTag === tag && styles.filterPillTextActive]}>{tag}</Text>
                    </Pressable>
                ))}
            </ScrollView>
        </View>
    );

    const renderItem = ({ item }: { item: Post }) => {
        const timeAgo = item.createdAt ? formatDistanceToNow(new Date(item.createdAt), { addSuffix: true }) : '';
        const authorName = item.authorFullName
            ? `${item.authorFullName} ${item.authorSchoolName ? `(${item.authorSchoolName})` : ''}`
            : (item.authorEmail || 'Unknown Author');

        return (
            <Pressable style={styles.card} onPress={() => router.push(`/post/${item.id}`)}>
                <Text style={styles.cardTitle}>{item.title}</Text>

                <Text style={styles.cardAuthor}>By {authorName} • {timeAgo}</Text>

                <Text style={styles.cardContent} numberOfLines={3}>
                    {item.content}
                </Text>

                {item.metadata?.tags && item.metadata.tags.length > 0 && (
                    <View style={styles.tagsContainer}>
                        {item.metadata.tags.map(tag => (
                            <View key={tag} style={styles.tagView}>
                                <Text style={styles.tagText}>{tag.startsWith('#') ? tag : `#${tag}`}</Text>
                            </View>
                        ))}
                    </View>
                )}
            </Pressable>
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

    return (
        <View style={styles.outerContainer}>
        <View style={styles.container}>
            {renderTagFilters()}

            {errorMSG ? <Text style={styles.errorText}>{errorMSG}</Text> : null}

            {initialLoading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#3b82f6" />
                </View>
            ) : (
                <FlatList
                    data={posts}
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
                            <Text style={styles.emptyText}>No posts found in this category.</Text>
                        ) : null
                    }
                />
            )}

            <Pressable
                style={styles.fab}
                onPress={() => router.push('/create-post')}
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
    tagFiltersContainer: {
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        paddingVertical: 12,
    },
    tagFiltersContent: {
        paddingHorizontal: 16,
    },
    filterPill: {
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#f1f5f9',
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    filterPillActive: {
        backgroundColor: '#3b82f6',
        borderColor: '#3b82f6',
    },
    filterPillText: {
        color: '#64748b',
        fontWeight: '600',
        fontSize: 14,
    },
    filterPillTextActive: {
        color: '#ffffff',
    },
    listContent: {
        padding: 16,
        paddingBottom: 80,
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 18,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#1e293b',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 4,
        color: '#1e293b',
    },
    cardAuthor: {
        fontSize: 13,
        color: '#94a3b8',
        marginBottom: 12,
    },
    cardContent: {
        fontSize: 15,
        color: '#475569',
        lineHeight: 22,
        marginBottom: 12,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    tagView: {
        backgroundColor: '#dbeafe',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        marginRight: 6,
        marginBottom: 6,
    },
    tagText: {
        color: '#3b82f6',
        fontSize: 12,
        fontWeight: '600',
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
    }
});
