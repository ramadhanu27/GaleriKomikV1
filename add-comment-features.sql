-- ============================================
-- ADD COMMENT FEATURES - Likes, Replies, Edit
-- ============================================
-- Run this in Supabase SQL Editor

-- 1. Add new columns to comments table
ALTER TABLE public.comments 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT FALSE;

-- 2. Create comment_likes table
CREATE TABLE IF NOT EXISTS public.comment_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON public.comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON public.comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON public.comment_likes(user_id);

-- 4. Enable RLS on comment_likes
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for comment_likes
CREATE POLICY "Anyone can read likes"
  ON public.comment_likes FOR SELECT USING (true);

CREATE POLICY "Authenticated users can like comments"
  ON public.comment_likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike their own likes"
  ON public.comment_likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 6. Create function to get comment with likes count
CREATE OR REPLACE FUNCTION get_comment_stats(comment_id_param UUID)
RETURNS TABLE (
  likes_count BIGINT,
  replies_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM public.comment_likes WHERE comment_id = comment_id_param),
    (SELECT COUNT(*) FROM public.comments WHERE parent_id = comment_id_param);
END;
$$ LANGUAGE plpgsql;

-- 7. Create view for comments with stats (optional, for easier querying)
CREATE OR REPLACE VIEW public.comments_with_stats AS
SELECT 
  c.*,
  (SELECT COUNT(*) FROM public.comment_likes cl WHERE cl.comment_id = c.id) as likes_count,
  (SELECT COUNT(*) FROM public.comments cr WHERE cr.parent_id = c.id) as replies_count
FROM public.comments c;

-- 8. Grant permissions
GRANT SELECT ON public.comments_with_stats TO authenticated;
GRANT SELECT ON public.comments_with_stats TO anon;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check if columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'comments' 
AND column_name IN ('parent_id', 'is_edited')
ORDER BY ordinal_position;

-- Check if comment_likes table exists
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'comment_likes'
ORDER BY ordinal_position;

-- Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename IN ('comments', 'comment_likes')
AND schemaname = 'public'
ORDER BY tablename, indexname;

-- Check RLS policies
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename IN ('comments', 'comment_likes')
ORDER BY tablename, policyname;

-- ============================================
-- TEST QUERIES (Optional - DO NOT RUN AS-IS)
-- ============================================
-- ⚠️ WARNING: Replace placeholder values before running!
-- Replace 'your-manhwa-slug' with actual slug
-- Replace 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' with actual UUID

-- Test: Get comments with stats
-- SELECT 
--   id,
--   comment_text,
--   username,
--   likes_count,
--   replies_count,
--   created_at
-- FROM public.comments_with_stats
-- WHERE manhwa_slug = 'your-manhwa-slug'
-- ORDER BY created_at DESC
-- LIMIT 10;

-- Test: Get replies for a comment (replace UUID)
-- SELECT *
-- FROM public.comments
-- WHERE parent_id = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
-- ORDER BY created_at ASC;

-- Test: Get likes for a comment (replace UUID)
-- SELECT COUNT(*) as total_likes
-- FROM public.comment_likes
-- WHERE comment_id = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';

-- Test: Get actual comment IDs from your database
SELECT 
  id,
  comment_text,
  username,
  created_at
FROM public.comments
ORDER BY created_at DESC
LIMIT 5;

-- ============================================
-- DONE!
-- ============================================
