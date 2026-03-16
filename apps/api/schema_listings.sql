-- Listing Enums
CREATE TYPE listing_category AS ENUM ('Book', 'Notes', 'Bundle', 'Tech');
CREATE TYPE listing_status AS ENUM ('Available', 'Reserved', 'Sold');

-- Listings Table
CREATE TABLE listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category listing_category NOT NULL,
    condition INTEGER NOT NULL CHECK (condition >= 1 AND condition <= 5),
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (price >= 0),
    status listing_status NOT NULL DEFAULT 'Available',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for fast filtering and feed generation
CREATE INDEX idx_listings_category ON listings(category);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_created_at ON listings(created_at);
