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
        marginBottom: 6,
        color: '#333',
        marginTop: 10,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
        fontSize: 16,
        backgroundColor: '#fafafa'
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    imagePicker: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        borderStyle: 'dashed',
        backgroundColor: '#fafafa',
        height: 160,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        overflow: 'hidden',
    },
    imagePickerText: {
        color: '#888',
        fontSize: 15,
    },
    imagePreview: {
        width: '100%',
        height: '100%',
    },
    row: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 10,
    },
    pill: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 16,
        marginRight: 8,
        marginBottom: 8,
        backgroundColor: '#f0f0f0'
    },
    pillActive: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
    pillText: {
        color: '#333',
        fontWeight: '500',
    },
    pillTextActive: {
        color: '#fff',
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
