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
                    <ActivityIndicator size="large" color="#3b82f6" />
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
    searchContainer: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        alignItems: 'center',
    },
    searchInput: {
        flex: 1,
        backgroundColor: '#f1f5f9',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        color: '#1e293b',
    },
    searchButton: {
        backgroundColor: '#3b82f6',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
    },
    searchButtonText: {
        color: '#ffffff',
        fontWeight: '600',
        fontSize: 15,
    },
    filterContainer: {
        backgroundColor: '#ffffff',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    filterContent: {
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
        fontSize: 20,
        fontWeight: '600',
        color: '#1e293b',
    },
    cardSubtitle: {
        fontSize: 15,
        color: '#64748b',
        marginTop: 4,
        marginBottom: 12,
    },
    badgeContainer: {
        backgroundColor: '#dbeafe',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginBottom: 12,
    },
    badgeText: {
        color: '#3b82f6',
        fontWeight: '600',
        fontSize: 13,
    },
    bioText: {
        fontSize: 15,
        color: '#475569',
        lineHeight: 22,
        marginBottom: 16,
    },
    primaryButton: {
        backgroundColor: '#10b981',
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 15,
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
    }
});
