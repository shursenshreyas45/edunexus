import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../config/api';

type Profile = {
    full_name: string;
    school_name: string;
    batch_year: number;
    bio: string;
};

export default function ProfileScreen() {
    const router = useRouter();
    const { token, signOut, user } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [profile, setProfile] = useState<Profile | null>(null);

    // Form state
    const [fullName, setFullName] = useState('');
    const [schoolName, setSchoolName] = useState('');
    const [batchYear, setBatchYear] = useState('');
    const [bio, setBio] = useState('');

    const [errorMSG, setErrorMSG] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const fetchProfile = async () => {
        try {
            setIsLoading(true);
            setErrorMSG('');
            const response = await fetch(`${API_URL}/profile/me`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setProfile(data);
                setFullName(data.full_name || '');
                setSchoolName(data.school_name || '');
                setBatchYear(data.batch_year ? data.batch_year.toString() : '');
                setBio(data.bio || '');
                setIsEditing(false);
            } else if (response.status === 404) {
                // Profile does not exist, stay in edit mode
                setProfile(null);
                setIsEditing(true);
            } else {
                const errData = await response.json();
                setErrorMSG(errData.error || 'Failed to fetch profile.');
            }
        } catch (e) {
            setErrorMSG('Network error while fetching profile.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchProfile();
        }
    }, [token]);

    const saveProfile = async () => {
        try {
            setIsSaving(true);
            setErrorMSG('');

            if (!fullName.trim() || !schoolName.trim() || !batchYear.trim()) {
                setErrorMSG('Please fill in all required fields.');
                return;
            }

            const response = await fetch(`${API_URL}/profile/me`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    full_name: fullName.trim(),
                    school_name: schoolName.trim(),
                    batch_year: parseInt(batchYear, 10),
                    bio: bio.trim()
                })
            });

            if (response.ok) {
                const data = await response.json();
                setProfile(data);
                setIsEditing(false);
                router.push('/search');
            } else {
                const errData = await response.json();
                setErrorMSG(errData.error || 'Failed to save profile.');
            }
        } catch (e) {
            setErrorMSG('Network error while saving profile.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    // Render form (Create or Edit)
    if (isEditing || !profile) {
        return (
            <View style={styles.container}>
                <Text style={styles.headerTitle}>{profile ? 'Edit Profile' : 'Set Up Profile'}</Text>

                {errorMSG ? <Text style={styles.errorText}>{errorMSG}</Text> : null}

                <Text style={styles.label}>Full Name</Text>
                <TextInput
                    style={styles.input}
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="Jane Doe"
                />

                <Text style={styles.label}>School Name</Text>
                <TextInput
                    style={styles.input}
                    value={schoolName}
                    onChangeText={setSchoolName}
                    placeholder="e.g. Stanford University"
                />

                <Text style={styles.label}>Batch Year</Text>
                <TextInput
                    style={styles.input}
                    value={batchYear}
                    onChangeText={setBatchYear}
                    placeholder="e.g. 2026"
                    keyboardType="numeric"
                />

                <Text style={styles.label}>Bio</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    value={bio}
                    onChangeText={setBio}
                    placeholder="Tell us about yourself..."
                    multiline
                    numberOfLines={4}
                />

                <Pressable
                    style={styles.primaryButton}
                    onPress={saveProfile}
                    disabled={isSaving}
                >
                    {isSaving ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Save Profile</Text>
                    )}
                </Pressable>

                {profile && (
                    <Pressable style={styles.secondaryButton} onPress={() => setIsEditing(false)}>
                        <Text style={styles.secondaryButtonText}>Cancel</Text>
                    </Pressable>
                )}
            </View>
        );
    }

    // Render Directory Card
    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <Text style={styles.cardTitle}>{profile.full_name}</Text>
                <Text style={styles.cardSubtitle}>{profile.school_name} - Class of {profile.batch_year}</Text>

                <View style={styles.badgeContainer}>
                    <Text style={styles.badgeText}>{user?.tier || 'Junior'} Tier</Text>
                </View>

                {profile.bio ? (
                    <Text style={styles.bioText}>{profile.bio}</Text>
                ) : null}

                <Pressable style={styles.primaryButton} onPress={() => setIsEditing(true)}>
                    <Text style={styles.buttonText}>Edit Profile</Text>
                </Pressable>
            </View>

            <Pressable style={styles.dangerButton} onPress={signOut}>
                <Text style={styles.buttonText}>Logout</Text>
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
        padding: 20,
        backgroundColor: '#fff',
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
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        fontSize: 16,
        backgroundColor: '#fafafa'
    },
    textArea: {
        height: 100,
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
        marginTop: 10,
    },
    secondaryButton: {
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    secondaryButtonText: {
        color: '#007AFF',
        fontSize: 16,
        fontWeight: '600',
    },
    dangerButton: {
        backgroundColor: '#FF3B30',
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
    card: {
        backgroundColor: '#f9f9f9',
        borderRadius: 12,
        padding: 20,
        borderWidth: 1,
        borderColor: '#eee',
        marginBottom: 20,
    },
    cardTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#000',
    },
    cardSubtitle: {
        fontSize: 16,
        color: '#666',
        marginTop: 4,
        marginBottom: 12,
    },
    badgeContainer: {
        backgroundColor: '#E5F1FF',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 4,
        alignSelf: 'flex-start',
        marginBottom: 12,
    },
    badgeText: {
        color: '#007AFF',
        fontWeight: '600',
        fontSize: 12,
    },
    bioText: {
        fontSize: 15,
        color: '#444',
        lineHeight: 22,
        marginBottom: 20,
    }
});
