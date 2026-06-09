import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, ScrollView, Platform } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../config/api';

const CATEGORIES = ['Book', 'Notes', 'Bundle', 'Tech'];

export default function CreateListingScreen() {
    const router = useRouter();
    const { token } = useAuth();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState(CATEGORIES[0]);
    const [condition, setCondition] = useState('3');
    const [price, setPrice] = useState('');
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [imageBase64, setImageBase64] = useState<string | null>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMSG, setErrorMSG] = useState('');

    const conditionOptions = ['1', '2', '3', '4', '5'];

    const pickImage = async () => {
        if (Platform.OS !== 'web') {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                setErrorMSG('Permission to access photos is required.');
                return;
            }
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.7,
            base64: true,
        });

        if (!result.canceled && result.assets[0]) {
            setImageUri(result.assets[0].uri);
            setImageBase64(result.assets[0].base64 || null);
        }
    };

    const handleSubmit = async () => {
        if (!title.trim() || !description.trim() || !category || !condition || price === '') {
            setErrorMSG('Please fill in all required fields.');
            return;
        }

        try {
            setIsSubmitting(true);
            setErrorMSG('');
            const response = await fetch(`${API_URL}/listings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: title.trim(),
                    description: description.trim(),
                    category,
                    condition: parseInt(condition, 10),
                    price: parseFloat(price) || 0,
                    imageBase64: imageBase64 ? `data:image/jpeg;base64,${imageBase64}` : undefined,
                })
            });

            if (response.ok) {
                router.push({ pathname: '/', params: { refresh: String(Date.now()) } });
            } else {
                const data = await response.json();
                setErrorMSG(data.error || 'Failed to create listing.');
            }
        } catch (error) {
            setErrorMSG('Network error while creating listing.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.headerTitle}>Create New Listing</Text>

            {errorMSG ? <Text style={styles.errorText}>{errorMSG}</Text> : null}

            <Text style={styles.label}>Title</Text>
            <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Calculus 101 Textbook"
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Detail the condition and contents..."
                multiline
                numberOfLines={4}
            />

            <Text style={styles.label}>Photo (Optional)</Text>
            <Pressable style={styles.imagePicker} onPress={pickImage}>
                {imageUri ? (
                    <Image source={{ uri: imageUri }} style={styles.imagePreview} contentFit="cover" />
                ) : (
                    <Text style={styles.imagePickerText}>Tap to add a photo</Text>
                )}
            </Pressable>

            <Text style={styles.label}>Price ($)</Text>
            <TextInput
                style={styles.input}
                value={price}
                onChangeText={setPrice}
                placeholder="0 for FREE"
                keyboardType="numeric"
            />

            <Text style={styles.label}>Category</Text>
            <View style={styles.row}>
                {CATEGORIES.map(cat => (
                    <Pressable
                        key={cat}
                        style={[styles.pill, category === cat && styles.pillActive]}
                        onPress={() => setCategory(cat)}
                    >
                        <Text style={[styles.pillText, category === cat && styles.pillTextActive]}>{cat}</Text>
                    </Pressable>
                ))}
            </View>

            <Text style={styles.label}>Condition (1 = Poor, 5 = Like New)</Text>
            <View style={styles.row}>
                {conditionOptions.map(cond => (
                    <Pressable
                        key={cond}
                        style={[styles.pill, condition === cond && styles.pillActive]}
                        onPress={() => setCondition(cond)}
                    >
                        <Text style={[styles.pillText, condition === cond && styles.pillTextActive]}>{cond}</Text>
                    </Pressable>
                ))}
            </View>

            <Pressable
                style={styles.primaryButton}
                onPress={handleSubmit}
                disabled={isSubmitting}
            >
                {isSubmitting ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>Publish Listing</Text>
                )}
            </Pressable>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f1f5f9',
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: '700',
        marginBottom: 24,
        color: '#1e293b'
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 6,
        color: '#475569',
        marginTop: 12,
    },
    input: {
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        padding: 14,
        marginBottom: 8,
        fontSize: 16,
        backgroundColor: '#ffffff',
        color: '#1e293b',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    imagePicker: {
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        borderStyle: 'dashed',
        backgroundColor: '#ffffff',
        height: 160,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        overflow: 'hidden',
    },
    imagePickerText: {
        color: '#64748b',
        fontSize: 15,
        fontWeight: '500',
    },
    imagePreview: {
        width: '100%',
        height: '100%',
    },
    row: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 10,
        gap: 8,
    },
    pill: {
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 20,
        paddingVertical: 10,
        paddingHorizontal: 18,
        marginRight: 8,
        marginBottom: 8,
        backgroundColor: '#ffffff'
    },
    pillActive: {
        backgroundColor: '#3b82f6',
        borderColor: '#3b82f6',
    },
    pillText: {
        color: '#64748b',
        fontWeight: '600',
        fontSize: 14,
    },
    pillTextActive: {
        color: '#ffffff',
    },
    errorText: {
        color: '#ef4444',
        marginBottom: 16,
        backgroundColor: '#fee2e2',
        padding: 12,
        borderRadius: 8,
        textAlign: 'center',
        fontWeight: '500',
    },
    primaryButton: {
        backgroundColor: '#3b82f6',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 24,
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
});
