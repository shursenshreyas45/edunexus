-- Migration: add image_url column to listings table
ALTER TABLE listings ADD COLUMN IF NOT EXISTS image_url TEXT;
