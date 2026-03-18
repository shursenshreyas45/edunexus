export interface EnvConfig {
    PORT: number;
    DATABASE_URL: string;
    JWT_SECRET: string;
    SUPABASE_URL: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
}

const getEnvVar = (key: string): string => {
    const value = process.env[key];
    if (!value) {
        throw new Error(`CRITICAL: Missing required environment variable: ${key}`);
    }
    return value;
};

const getOptionalEnvVar = (key: string): string => {
    return process.env[key] || '';
};

export const env: EnvConfig = {
    PORT: parseInt(process.env.PORT || '3000', 10),
    DATABASE_URL: getEnvVar('DATABASE_URL'),
    JWT_SECRET: getEnvVar('JWT_SECRET'),
    SUPABASE_URL: getOptionalEnvVar('SUPABASE_URL'),
    SUPABASE_SERVICE_ROLE_KEY: getOptionalEnvVar('SUPABASE_SERVICE_ROLE_KEY'),
};
