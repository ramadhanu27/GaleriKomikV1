-- ============================================
-- ADD COMMENT FEATURES - SAFE VERSION
-- ============================================
-- This script is safe to run directly in Supabase SQL Editor
-- No placeholder values, only actual schema changes

-- ============================================
-- STEP 1: Add new columns to comments table
-- ============================================

-- Add parent_id column for replies (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'comments' 
        AND column_name = 'parent_id'
    ) THEN
        ALTER TABLE public.comments 
        ADD COLUMN parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE;
        RAISE NOTICE 'Column parent_id added successfully';
    ELSE
        RAISE NOTICE 'Column parent_id already exists';
    END IF;
END $$;

-- Add is_edited column for edit tracking (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'comments' 
        AND column_name = 'is_edited'
    ) THEN
        ALTER TABLE public.comments 
        ADD COLUMN is_edited BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Column is_edited added successfully';
    ELSE
        RAISE NOTICE 'Column is_edited already exists';
    END IF;
END $$;

-- ============================================
-- STEP 2: Create comment_likes table
-- ============================================

CREATE TABLE IF NOT EXISTS public.comment_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- ============================================
-- STEP 3: Create indexes for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_comments_parent_id 
ON public.comments(parent_id);

CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id 
ON public.comment_likes(comment_id);

CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id 
ON public.comment_likes(user_id);

-- ============================================
-- STEP 4: Enable Row Level Security
-- ============================================

ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 5: Create RLS Policies for comment_likes
-- ============================================

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Anyone can read likes" ON public.comment_likes;
DROP POLICY IF EXISTS "Authenticated users can like comments" ON public.comment_likes;
DROP POLICY IF EXISTS "Users can unlike their own likes" ON public.comment_likes;

-- Anyone can read likes
CREATE POLICY "Anyone can read likes"
  ON public.comment_likes 
  FOR SELECT 
  USING (true);

-- Authenticated users can like comments
CREATE POLICY "Authenticated users can like comments"
  ON public.comment_likes 
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can unlike their own likes
CREATE POLICY "Users can unlike their own likes"
  ON public.comment_likes 
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- STEP 6: Create helper function
-- ============================================

-- Function to get comment stats (likes and replies count)
CREATE OR REPLACE FUNCTION get_comment_stats(comment_id_param UUID)
RETURNS TABLE (
  likes_count BIGINT,
  replies_count BIGINT
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM public.comment_likes WHERE comment_id = comment_id_param),
    (SELECT COUNT(*) FROM public.comments WHERE parent_id = comment_id_param);
END;
$$;

-- ============================================
-- STEP 7: Create view for comments with stats
-- ============================================

-- Drop view if exists
DROP VIEW IF EXISTS public.comments_with_stats;

-- Create view
CREATE VIEW public.comments_with_stats AS
SELECT 
  c.*,
  (SELECT COUNT(*) FROM public.comment_likes cl WHERE cl.comment_id = c.id) as likes_count,
  (SELECT COUNT(*) FROM public.comments cr WHERE cr.parent_id = c.id) as replies_count
FROM public.comments c;

-- ============================================
-- STEP 8: Grant permissions
-- ============================================

GRANT SELECT ON public.comments_with_stats TO authenticated;
GRANT SELECT ON public.comments_with_stats TO anon;

-- ============================================
-- VERIFICATION - Check if everything is set up correctly
-- ============================================

-- Check columns in comments table
SELECT 
    'comments' as table_name,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'comments' 
AND column_name IN ('parent_id', 'is_edited', 'username', 'avatar_url')
ORDER BY column_name;

-- Check comment_likes table structure
SELECT 
    'comment_likes' as table_name,
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'comment_likes'
ORDER BY ordinal_position;

-- Check indexes
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('comments', 'comment_likes')
AND schemaname = 'public'
AND indexname LIKE '%parent%' OR indexname LIKE '%like%'
ORDER BY tablename, indexname;

-- Check RLS policies
SELECT 
    tablename,
    policyname,
    cmd as operation,
    CASE 
        WHEN qual IS NOT NULL THEN 'Has USING clause'
        ELSE 'No USING clause'
    END as using_clause,
    CASE 
        WHEN with_check IS NOT NULL THEN 'Has WITH CHECK clause'
        ELSE 'No WITH CHECK clause'
    END as with_check_clause
FROM pg_policies
WHERE tablename IN ('comments', 'comment_likes')
ORDER BY tablename, policyname;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$ 
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Comment Features Setup Complete! ✅';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Tables created:';
    RAISE NOTICE '  ✅ comment_likes';
    RAISE NOTICE '';
    RAISE NOTICE 'Columns added to comments:';
    RAISE NOTICE '  ✅ parent_id';
    RAISE NOTICE '  ✅ is_edited';
    RAISE NOTICE '';
    RAISE NOTICE 'Indexes created:';
    RAISE NOTICE '  ✅ idx_comments_parent_id';
    RAISE NOTICE '  ✅ idx_comment_likes_comment_id';
    RAISE NOTICE '  ✅ idx_comment_likes_user_id';
    RAISE NOTICE '';
    RAISE NOTICE 'RLS Policies created:';
    RAISE NOTICE '  ✅ Anyone can read likes';
    RAISE NOTICE '  ✅ Authenticated users can like comments';
    RAISE NOTICE '  ✅ Users can unlike their own likes';
    RAISE NOTICE '';
    RAISE NOTICE 'Views created:';
    RAISE NOTICE '  ✅ comments_with_stats';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '  1. Check verification results above';
    RAISE NOTICE '  2. Update your Next.js component';
    RAISE NOTICE '  3. Test all features';
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
END $$;

-- ============================================
-- DONE! 🎉
-- ============================================
