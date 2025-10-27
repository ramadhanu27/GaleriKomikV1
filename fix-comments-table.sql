-- ============================================
-- FIX COMMENTS TABLE - Add Missing Columns
-- ============================================
-- Run this in Supabase SQL Editor to fix the comments table

-- Check if username column exists, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'comments' 
        AND column_name = 'username'
    ) THEN
        ALTER TABLE public.comments ADD COLUMN username TEXT NOT NULL DEFAULT 'User';
    END IF;
END $$;

-- Check if avatar_url column exists, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'comments' 
        AND column_name = 'avatar_url'
    ) THEN
        ALTER TABLE public.comments ADD COLUMN avatar_url TEXT;
    END IF;
END $$;

-- Update existing comments with username from users table (if any exist)
UPDATE public.comments c
SET username = COALESCE(u.username, SPLIT_PART(u.email, '@', 1), 'User')
FROM public.users u
WHERE c.user_id = u.id
AND c.username IS NULL;

-- Update existing comments with avatar_url from users table (if any exist)
UPDATE public.comments c
SET avatar_url = u.avatar_url
FROM public.users u
WHERE c.user_id = u.id
AND c.avatar_url IS NULL;

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'comments'
ORDER BY ordinal_position;

-- Show sample data (if any)
SELECT 
    id,
    username,
    avatar_url,
    manhwa_slug,
    comment_text,
    created_at
FROM public.comments
LIMIT 5;
