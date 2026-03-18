import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    TextInput,
    Pressable,
    ScrollView,
    Linking
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../config/api';

type UserProfile = {
    id: string;
    full_name: string;
    school_name: string;
    batch_year: number;
    bio: string;
    tier: string;
    email: string; // Added to backend payload for the mailto link
};

const TIERS = ['All', 'Junior', 'Senior', 'Mentor'];

export default function SearchScreen() {
    const { token, user: currentUser } = useAuth();

    const [profiles, setProfiles] = useState<UserProfile[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMSG, setErrorMSG] = useState('');

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTier, setSelectedTier] = useState('All');

    // We could fetch on mount, but fetching on search/filter changes is better
    const handleSearch = async () => {
        if (!token) return;

        try {
            setIsLoading(true);
            setErrorMSG('');

            let url = `${API_URL}/profiles/search?name=${encodeURIComponent(searchQuery)}&school=${encodeURIComponent(searchQuery)}`;

            if (selectedTier !== 'All') {
                url += `&tier=${encodeURIComponent(selectedTier)}`;
            }

            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setProfiles(data);
            } else {
                const errData = await response.json();
                setErrorMSG(errData.error || 'Failed to search profiles');
            }
        } catch (e) {
            setErrorMSG('Network error while searching profiles.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Debounuce could be added here, but for simplicity we'll just search on tier change or manual submit
        handleSearch();
    }, [selectedTier, token]);

    const handleGuidanceRequest = (email: string, name: string) => {
        const subject = encodeURIComponent('Guidance Request from EduNexus');
        const body = encodeURIComponent(`Hi ${name},\n\nI found your profile on EduNexus and would love to ask you a few questions about your experience.\n\nBest, \n${currentUser?.email || 'A fellow student'}`);
        Linking.openURL(`mailto:${email}?subject=${subject}&body=${body}`);
    };

    const renderFilterButtons = () => (
        <View style={styles.filterContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
                {TIERS.map(tier => (
                    <Pressable
                        key={tier}
                        style={[styles.filterPill, selectedTier === tier && styles.filterPillActive]}
                        onPress={() => setSelectedTier(tier)}
                    >
                        <Text style={[styles.filterPillText, selectedTier === tier && styles.filterPillTextActive]}>{tier}</Text>
                    </Pressable>
                ))}
            </ScrollView>
        </View>
    );

    const renderItem = ({ item }: { item: UserProfile }) => (
        <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.full_name}</Text>
            <Text style={styles.cardSubtitle}>{item.school_name} - Class of {item.batch_year}</Text>

            <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>{item.tier} Tier</Text>
            </View>

            {item.bio ? (
                <Text style={styles.bioText} numberOfLines={3}>{item.bio}</Text>
            ) : null}

            {item.id !== currentUser?.id && item.email && (
                <Pressable
                    style={styles.primaryButton}
                    onPress={() => handleGuidanceRequest(item.email, item.full_name)}
                >
                    <Text style={styles.buttonText}>Request Guidance</Text>
                </Pressable>
            )}
        </View>
    );

    return (
        <View style={styles.outerContainer}>
        <View style={styles.container}>
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search by name or school..."
                    onSubmitEditing={handleSearch}
                    returnKeyType="search"
                />
                <Pressable style={styles.searchButton} onPress={handleSearch}>
                    <Text style={styles.searchButtonText}>Search</Text>
                </Pressable>
            </View>

            {renderFilterButtons()}

            {errorMSG ? <Text style={styles.errorText}>{errorMSG}</Text> : null}

            {isLoading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#0000ff" />
                </View>
            ) : (
                <FlatList
                    data={profiles}
                    keyExtractor={item => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>No profiles found matching your criteria.</Text>
                    }
                />
            )}
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
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 16,
        marginRight: 10,
    },
    searchButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
    },
    searchButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    filterContainer: {
        backgroundColor: '#fff',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    filterContent: {
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
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#eee',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#000',
    },
    cardSubtitle: {
        fontSize: 15,
        color: '#666',
        marginTop: 4,
        marginBottom: 10,
    },
    badgeContainer: {
        backgroundColor: '#E5F1FF',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 4,
        alignSelf: 'flex-start',
        marginBottom: 10,
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
        marginBottom: 16,
    },
    primaryButton: {
        backgroundColor: '#28a745', // Green for action
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 6,
    },
    buttonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: 'bold',
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
    }
});
