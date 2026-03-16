import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../config/api';

export default function CreatePostScreen() {
    const router = useRouter();
    const { token } = useAuth();

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMSG, setErrorMSG] = useState('');

    const extractTags = (text: string): string[] => {
        // extract all words starting with #
        const regex = /#([a-zA-Z0-9_]+)/g;
        const matches = text.matchAll(regex);
        const tags = Array.from(matches, m => m[1].toLowerCase());
        return Array.from(new Set(tags));
    };

    const handleSubmit = async () => {
        if (!title.trim() || !content.trim()) {
            setErrorMSG('Please fill in title and content.');
            return;
        }

        try {
            setIsSubmitting(true);
            setErrorMSG('');

            const tags = extractTags(content);

            const response = await fetch(`${API_URL}/posts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: title.trim(),
                    content: content.trim(),
                    metadata: {
                        tags
                    }
                })
            });

            if (response.ok) {
                // Return to the feed and trigger refresh
                router.push({ pathname: '/war-rooms', params: { refresh: String(Date.now()) } });
            } else {
                const data = await response.json();
                setErrorMSG(data.error || 'Failed to create post.');
            }
        } catch (error) {
            setErrorMSG('Network error while creating post.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.headerTitle}>Create New Post</Text>

            {errorMSG ? <Text style={styles.errorText}>{errorMSG}</Text> : null}

            <Text style={styles.label}>Title</Text>
            <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="What's on your mind?"
            />

            <Text style={styles.label}>Content (Use #tags to categorize!)</Text>
            <TextInput
                style={[styles.input, styles.textArea]}
                value={content}
                onChangeText={setContent}
                placeholder="Ask a question or share a resource... e.g. How do I solve this #math problem?"
                multiline
                numberOfLines={8}
                textAlignVertical="top"
            />

            <Pressable
                style={styles.primaryButton}
                onPress={handleSubmit}
                disabled={isSubmitting}
            >
                {isSubmitting ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>Publish Post</Text>
                )}
            </Pressable>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333'
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        color: '#333',
        marginTop: 10,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 12,
        marginBottom: 10,
        fontSize: 16,
        backgroundColor: '#fafafa'
    },
    textArea: {
        height: 150,
        textAlignVertical: 'top',
    },
    errorText: {
        color: 'red',
        marginBottom: 16,
    },
    primaryButton: {
        backgroundColor: '#007AFF',
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
