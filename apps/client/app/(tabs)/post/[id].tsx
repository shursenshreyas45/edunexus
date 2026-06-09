import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    TextInput,
    Pressable,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { API_URL } from '../../../config/api';

import { formatDistanceToNow } from 'date-fns';

type Post = {
    id: number;
    title: string;
    content: string;
    author_id: string;
    full_name?: string;
    school_name?: string;
    author_email?: string;
    metadata?: {
        tags?: string[];
    };
    created_at: string;
};

type Comment = {
    id: number;
    content: string;
    author_id: string;
    full_name?: string;
    school_name?: string;
    created_at: string;
};

export default function PostDetailScreen() {
    const { id } = useLocalSearchParams();
    const { token } = useAuth();

    const [post, setPost] = useState<Post | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMSG, setErrorMSG] = useState('');

    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchPostDetails = async () => {
        try {
            setIsLoading(true);
            setErrorMSG('');

            const response = await fetch(`${API_URL}/posts/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setPost(data.post);
                setComments(data.comments || []);
            } else {
                const errData = await response.json();
                setErrorMSG(errData.error || 'Failed to fetch post details');
            }
        } catch (e) {
            setErrorMSG('Network error while fetching post details.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (token && id) {
            fetchPostDetails();
        }
    }, [token, id]);

    const handleSendComment = async () => {
        if (!newComment.trim()) return;

        try {
            setIsSubmitting(true);
            setErrorMSG('');

            const response = await fetch(`${API_URL}/posts/${id}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ content: newComment.trim() })
            });

            if (response.ok) {
                setNewComment('');
                // Refresh the post details to get the new comment
                fetchPostDetails();
            } else {
                const errData = await response.json();
                setErrorMSG(errData.error || 'Failed to add comment');
            }
        } catch (e) {
            setErrorMSG('Network error while adding comment.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderComment = ({ item }: { item: Comment }) => {
        const timeAgo = item.created_at ? formatDistanceToNow(new Date(item.created_at), { addSuffix: true }) : '';
        const authorName = item.full_name
            ? `${item.full_name} ${item.school_name ? `(${item.school_name})` : ''}`
            : 'Unknown Author';

        return (
            <View style={styles.commentCard}>
                <Text style={styles.commentAuthor}>{authorName} • {timeAgo}</Text>
                <Text style={styles.commentContent}>{item.content}</Text>
            </View>
        );
    };

    const renderHeader = () => {
        if (!post) return null;

        const timeAgo = post.created_at ? formatDistanceToNow(new Date(post.created_at), { addSuffix: true }) : '';
        const authorName = post.full_name
            ? `${post.full_name} ${post.school_name ? `(${post.school_name})` : ''}`
            : (post.author_email || 'Unknown Author');

        return (
            <View style={styles.postContainer}>
                <Text style={styles.postTitle}>{post.title}</Text>

                <Text style={styles.postAuthor}>By {authorName} • {timeAgo}</Text>

                <Text style={styles.postContent}>{post.content}</Text>

                {post.metadata?.tags && post.metadata.tags.length > 0 && (
                    <View style={styles.tagsContainer}>
                        {post.metadata.tags.map(tag => (
                            <View key={tag} style={styles.tagView}>
                                <Text style={styles.tagText}>{tag.startsWith('#') ? tag : `#${tag}`}</Text>
                            </View>
                        ))}
                    </View>
                )}

                <Text style={styles.commentsHeader}>Comments ({comments.length})</Text>
            </View>
        );
    };

    if (isLoading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#3b82f6" />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0} // Adjust based on header heights
        >
            {errorMSG ? <Text style={styles.errorText}>{errorMSG}</Text> : null}

            <FlatList
                data={comments}
                keyExtractor={item => item.id.toString()}
                renderItem={renderComment}
                ListHeaderComponent={renderHeader}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>No comments yet. Be the first to reply!</Text>
                }
            />

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    value={newComment}
                    onChangeText={setNewComment}
                    placeholder="Add a comment..."
                    multiline
                    maxLength={500}
                />
                <Pressable
                    style={[styles.sendButton, !newComment.trim() && styles.sendButtonDisabled]}
                    onPress={handleSendComment}
                    disabled={isSubmitting || !newComment.trim()}
                >
                    {isSubmitting ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={styles.sendButtonText}>Send</Text>
                    )}
                </Pressable>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
    },
    container: {
        flex: 1,
        backgroundColor: '#f1f5f9',
    },
    listContent: {
        paddingBottom: 20,
    },
    postContainer: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        backgroundColor: '#ffffff',
    },
    postTitle: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 8,
        color: '#1e293b',
    },
    postAuthor: {
        fontSize: 14,
        color: '#64748b',
        marginBottom: 16,
    },
    postContent: {
        fontSize: 16,
        color: '#334155',
        lineHeight: 24,
        marginBottom: 16,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 20,
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
    commentsHeader: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1e293b',
        marginTop: 10,
    },
    commentCard: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        backgroundColor: '#ffffff',
    },
    commentAuthor: {
        fontSize: 13,
        color: '#64748b',
        marginBottom: 6,
        fontWeight: '600',
    },
    commentContent: {
        fontSize: 15,
        color: '#334155',
        lineHeight: 22,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 40,
        fontSize: 15,
        color: '#64748b',
    },
    errorText: {
        color: '#ef4444',
        textAlign: 'center',
        padding: 12,
        backgroundColor: '#fee2e2',
        fontWeight: '500',
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 12,
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        backgroundColor: '#ffffff',
        alignItems: 'flex-end',
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 24,
        paddingHorizontal: 18,
        paddingTop: 12,
        paddingBottom: 12,
        maxHeight: 100,
        fontSize: 15,
        backgroundColor: '#f1f5f9',
        color: '#1e293b',
    },
    sendButton: {
        marginLeft: 12,
        backgroundColor: '#3b82f6',
        borderRadius: 24,
        paddingHorizontal: 20,
        paddingVertical: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: '#93c5fd',
    },
    sendButtonText: {
        color: '#ffffff',
        fontWeight: '600',
        fontSize: 15,
    }
});
