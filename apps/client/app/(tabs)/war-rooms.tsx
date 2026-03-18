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
                <ActivityIndicator size="small" color="#0000ff" />
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
                    <ActivityIndicator size="large" color="#0000ff" />
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
        backgroundColor: '#f5f5f5',
        alignItems: 'center',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        flex: 1,
        width: '100%',
        maxWidth: 800,
        backgroundColor: '#f5f5f5',
    },
    tagFiltersContainer: {
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingVertical: 10,
    },
    tagFiltersContent: {
        paddingHorizontal: 16,
    },
    filterPill: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        marginRight: 8,
    },
    filterPillActive: {
        backgroundColor: '#007AFF',
    },
    filterPillText: {
        color: '#333',
        fontWeight: '500',
    },
    filterPillTextActive: {
        color: '#fff',
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
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
        color: '#000',
    },
    cardAuthor: {
        fontSize: 13,
        color: '#888',
        marginBottom: 10,
        fontStyle: 'italic',
    },
    cardContent: {
        fontSize: 15,
        color: '#444',
        lineHeight: 22,
        marginBottom: 12,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    tagView: {
        backgroundColor: '#E5F1FF',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        marginRight: 6,
        marginBottom: 6,
    },
    tagText: {
        color: '#007AFF',
        fontSize: 12,
        fontWeight: '500',
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
    }
});
