import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

export default function RegisterScreen() {
    const { register } = useAuth();
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [tier, setTier] = useState('Junior');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        setError('');
        setLoading(true);
        try {
            await register(email, password, tier);
            // Automatically redirect to login upon successful registration
            router.replace('/login');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join the EduNexus community</Text>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
            />
            <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />

            <Text style={styles.label}>Select Tier:</Text>
            <View style={styles.tierContainer}>
                {['Junior', 'Senior', 'Mentor'].map((t) => (
                    <Pressable
                        key={t}
                        style={[styles.tierButton, tier === t && styles.tierButtonActive]}
                        onPress={() => setTier(t)}
                    >
                        <Text style={[styles.tierText, tier === t && styles.tierTextActive]}>{t}</Text>
                    </Pressable>
                ))}
            </View>

            <Pressable style={styles.button} onPress={handleRegister} disabled={loading}>
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>Register</Text>
                )}
            </Pressable>

            <Link href="/login" asChild>
                <Pressable style={styles.linkButton}>
                    <Text style={styles.linkText}>Already have an account? Login</Text>
                </Pressable>
            </Link>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 24,
        backgroundColor: '#f1f5f9',
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        marginBottom: 8,
        textAlign: 'center',
        color: '#1e293b',
    },
    subtitle: {
        fontSize: 16,
        color: '#64748b',
        textAlign: 'center',
        marginBottom: 32,
    },
    label: {
        fontSize: 14,
        marginBottom: 8,
        color: '#64748b',
        fontWeight: '600'
    },
    tierContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
        gap: 8,
    },
    tierButton: {
        flex: 1,
        padding: 14,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        alignItems: 'center',
        backgroundColor: '#ffffff',
    },
    tierButtonActive: {
        backgroundColor: '#3b82f6',
        borderColor: '#3b82f6',
    },
    tierText: {
        color: '#64748b',
        fontWeight: '500',
    },
    tierTextActive: {
        color: '#ffffff',
        fontWeight: '600',
    },
    input: {
        borderWidth: 1,
        borderColor: '#e2e8f0',
        backgroundColor: '#ffffff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        fontSize: 16,
        color: '#1e293b',
    },
    button: {
        backgroundColor: '#3b82f6',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    linkButton: {
        marginTop: 24,
        alignItems: 'center',
    },
    linkText: {
        color: '#3b82f6',
        fontSize: 16,
        fontWeight: '500',
    },
    errorText: {
        color: '#ef4444',
        marginBottom: 16,
        textAlign: 'center',
        backgroundColor: '#fee2e2',
        padding: 12,
        borderRadius: 8,
    },
});
