// Determine if we are running in development or production
// In Expo, EXPO_PUBLIC_ prefix is injected automatically.
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
