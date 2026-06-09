-- User tier enum
CREATE TYPE user_tier AS ENUM ('Junior', 'Senior', 'Mentor');

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    tier user_tier NOT NULL DEFAULT 'Junior',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Sessions table for auth
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on sessions
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Profiles table
CREATE TABLE profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    school_name VARCHAR(255),
    batch_year INTEGER,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Listing enums
CREATE TYPE listing_category AS ENUM ('Book', 'Notes', 'Bundle', 'Tech');
CREATE TYPE listing_status AS ENUM ('Available', 'Reserved', 'Sold');

-- Listings table
CREATE TABLE listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category listing_category NOT NULL,
    condition INTEGER NOT NULL CHECK (condition >= 1 AND condition <= 5),
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (price >= 0),
    status listing_status NOT NULL DEFAULT 'Available',
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on listings
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

-- Indexes for listings
CREATE INDEX idx_listings_category ON listings(category);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_created_at ON listings(created_at);

-- Posts table
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{"tags": [], "upvotes": 0}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on posts
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Indexes for posts
CREATE INDEX idx_posts_metadata_gin ON posts USING GIN (metadata);
CREATE INDEX idx_posts_created_at ON posts(created_at);

-- Comments table
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on comments
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Indexes for comments
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_created_at ON comments(created_at);

-- RLS Policies for users
CREATE POLICY "users_select_own" ON users FOR SELECT
    TO authenticated USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON users FOR UPDATE
    TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- RLS Policies for sessions
CREATE POLICY "sessions_select_own" ON sessions FOR SELECT
    TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "sessions_insert_own" ON sessions FOR INSERT
    TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "sessions_delete_own" ON sessions FOR DELETE
    TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for profiles
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT
    TO authenticated USING (true);

CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
    TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
    TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RLS Policies for listings
CREATE POLICY "listings_select_all" ON listings FOR SELECT
    TO authenticated USING (true);

CREATE POLICY "listings_insert_own" ON listings FOR INSERT
    TO authenticated WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "listings_update_own" ON listings FOR UPDATE
    TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "listings_delete_own" ON listings FOR DELETE
    TO authenticated USING (auth.uid() = owner_id);

-- RLS Policies for posts
CREATE POLICY "posts_select_all" ON posts FOR SELECT
    TO authenticated USING (true);

CREATE POLICY "posts_insert_own" ON posts FOR INSERT
    TO authenticated WITH CHECK (auth.uid() = author_id);

CREATE POLICY "posts_update_own" ON posts FOR UPDATE
    TO authenticated USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);

CREATE POLICY "posts_delete_own" ON posts FOR DELETE
    TO authenticated USING (auth.uid() = author_id);

-- RLS Policies for comments
CREATE POLICY "comments_select_all" ON comments FOR SELECT
    TO authenticated USING (true);

CREATE POLICY "comments_insert_own" ON comments FOR INSERT
    TO authenticated WITH CHECK (auth.uid() = author_id);

CREATE POLICY "comments_update_own" ON comments FOR UPDATE
    TO authenticated USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);

CREATE POLICY "comments_delete_own" ON comments FOR DELETE
    TO authenticated USING (auth.uid() = author_id);