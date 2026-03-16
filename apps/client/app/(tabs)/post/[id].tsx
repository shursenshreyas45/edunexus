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
                <ActivityIndicator size="large" color="#0000ff" />
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
    },
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    listContent: {
        paddingBottom: 20,
    },
    postContainer: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        backgroundColor: '#f9f9f9',
    },
    postTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#000',
    },
    postAuthor: {
        fontSize: 14,
        color: '#666',
        marginBottom: 16,
        fontStyle: 'italic',
    },
    postContent: {
        fontSize: 16,
        color: '#333',
        lineHeight: 24,
        marginBottom: 16,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 20,
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
    commentsHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
        marginTop: 10,
    },
    commentCard: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    commentAuthor: {
        fontSize: 13,
        color: '#666',
        marginBottom: 4,
        fontWeight: '500',
    },
    commentContent: {
        fontSize: 15,
        color: '#333',
        lineHeight: 20,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 40,
        fontSize: 15,
        color: '#888',
    },
    errorText: {
        color: 'red',
        textAlign: 'center',
        padding: 10,
        backgroundColor: '#ffe6e6',
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 12,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        backgroundColor: '#fff',
        alignItems: 'flex-end',
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 10,
        maxHeight: 100,
        fontSize: 15,
        backgroundColor: '#fafafa',
    },
    sendButton: {
        marginLeft: 12,
        backgroundColor: '#007AFF',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 2, // Align with text input visually if it's multiline
    },
    sendButtonDisabled: {
        backgroundColor: '#A0CFFF',
    },
    sendButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 15,
    }
});
