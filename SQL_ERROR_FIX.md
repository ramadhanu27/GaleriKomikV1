# 🔧 SQL Error Fix - UUID Invalid Input

## ❌ Error Message:
```
ERROR: 22P02: invalid input syntax for type uuid: "some-comment-id"
LINE 118: WHERE parent_id = 'some-comment-id'
```

## 🔍 Penyebab:
Error ini muncul karena ada **test queries** di SQL script yang menggunakan placeholder string `'some-comment-id'` yang bukan UUID valid. Test queries ini **tidak perlu dijalankan** - hanya contoh untuk referensi.

## ✅ Solusi:

### Opsi 1: Gunakan Safe SQL Script (RECOMMENDED)

Saya sudah membuat versi aman yang tidak ada placeholder:

```sql
-- File: add-comment-features-safe.sql
-- Safe to run directly, no placeholders!
```

**Cara pakai:**
1. Buka Supabase Dashboard → SQL Editor
2. Copy & paste dari `add-comment-features-safe.sql`
3. Klik "Run" - Aman! ✅
4. Lihat success message di output

---

### Opsi 2: Skip Test Queries

Jika menggunakan `add-comment-features.sql`:

**Jangan run bagian ini:**
```sql
-- ❌ JANGAN RUN INI
-- Test: Get replies for a comment
SELECT *
FROM public.comments
WHERE parent_id = 'some-comment-id'  -- ❌ Invalid UUID!
```

**Hanya run bagian ini:**
```sql
-- ✅ RUN INI SAJA
-- 1. Add columns
ALTER TABLE public.comments ADD COLUMN parent_id UUID...

-- 2. Create table
CREATE TABLE comment_likes...

-- 3. Create indexes
CREATE INDEX...

-- 4. Enable RLS
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY...

-- 5. Create policies
CREATE POLICY...
```

---

## 🎯 Quick Fix (Copy-Paste Ready)

### Run This Script:

```sql
-- ============================================
-- QUICK FIX - Comment Features Setup
-- ============================================

-- 1. Add parent_id column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'comments' AND column_name = 'parent_id'
    ) THEN
        ALTER TABLE public.comments 
        ADD COLUMN parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 2. Add is_edited column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'comments' AND column_name = 'is_edited'
    ) THEN
        ALTER TABLE public.comments 
        ADD COLUMN is_edited BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 3. Create comment_likes table
CREATE TABLE IF NOT EXISTS public.comment_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- 4. Create indexes
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON public.comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON public.comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON public.comment_likes(user_id);

-- 5. Enable RLS
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

-- 6. Create policies
DROP POLICY IF EXISTS "Anyone can read likes" ON public.comment_likes;
DROP POLICY IF EXISTS "Authenticated users can like comments" ON public.comment_likes;
DROP POLICY IF EXISTS "Users can unlike their own likes" ON public.comment_likes;

CREATE POLICY "Anyone can read likes"
  ON public.comment_likes FOR SELECT USING (true);

CREATE POLICY "Authenticated users can like comments"
  ON public.comment_likes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike their own likes"
  ON public.comment_likes FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ✅ DONE!
SELECT 'Comment features setup complete! ✅' as status;
```

---

## 🧪 Verification

Setelah run script, verify dengan query ini:

```sql
-- Check if columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'comments' 
AND column_name IN ('parent_id', 'is_edited');

-- Check if table exists
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'comment_likes';

-- Check if indexes exist
SELECT indexname
FROM pg_indexes
WHERE tablename IN ('comments', 'comment_likes')
AND (indexname LIKE '%parent%' OR indexname LIKE '%like%');

-- Check if policies exist
SELECT policyname
FROM pg_policies
WHERE tablename = 'comment_likes';
```

**Expected Results:**
```
✅ parent_id column exists
✅ is_edited column exists
✅ comment_likes table exists
✅ 3 indexes created
✅ 3 policies created
```

---

## 📊 What Each Part Does:

### 1. **parent_id column**
```sql
ALTER TABLE comments ADD COLUMN parent_id UUID
```
- Untuk reply system
- Links reply to parent comment
- NULL = top-level comment

### 2. **is_edited column**
```sql
ALTER TABLE comments ADD COLUMN is_edited BOOLEAN
```
- Track if comment was edited
- Shows "edited" label
- Default: FALSE

### 3. **comment_likes table**
```sql
CREATE TABLE comment_likes (
  id, comment_id, user_id, created_at
)
```
- Store likes
- One like per user per comment
- CASCADE delete when comment deleted

### 4. **Indexes**
```sql
CREATE INDEX idx_comments_parent_id...
CREATE INDEX idx_comment_likes_comment_id...
CREATE INDEX idx_comment_likes_user_id...
```
- Speed up queries
- Better performance
- Essential for scale

### 5. **RLS Policies**
```sql
CREATE POLICY "Anyone can read likes"...
CREATE POLICY "Authenticated users can like"...
CREATE POLICY "Users can unlike own"...
```
- Security
- Access control
- Prevent abuse

---

## 🐛 Common Issues

### Issue 1: "Column already exists"
```
ERROR: column "parent_id" already exists
```
**Solution:** Column sudah ada, skip error ini. ✅

### Issue 2: "Table already exists"
```
ERROR: relation "comment_likes" already exists
```
**Solution:** Table sudah ada, skip error ini. ✅

### Issue 3: "Policy already exists"
```
ERROR: policy "Anyone can read likes" already exists
```
**Solution:** 
```sql
-- Drop first, then create
DROP POLICY IF EXISTS "Anyone can read likes" ON comment_likes;
CREATE POLICY "Anyone can read likes"...
```

### Issue 4: UUID error (your case)
```
ERROR: invalid input syntax for type uuid
```
**Solution:** 
- Don't run test queries
- Use `add-comment-features-safe.sql`
- Or use Quick Fix script above

---

## ✅ Checklist

After running script:

- [ ] No errors in output
- [ ] `parent_id` column exists
- [ ] `is_edited` column exists
- [ ] `comment_likes` table exists
- [ ] 3 indexes created
- [ ] 3 RLS policies created
- [ ] Verification queries pass
- [ ] Can insert test data

---

## 🎯 Next Steps

1. **✅ Run SQL script** (use safe version)
2. **✅ Verify** with queries above
3. **✅ Update component** to `CommentSectionEnhanced`
4. **✅ Test features** in browser
5. **✅ Deploy** to production

---

## 💡 Pro Tips

### Tip 1: Use Safe Script
Always use `add-comment-features-safe.sql` - no placeholders, no errors!

### Tip 2: Check Before Run
Before running any SQL:
```sql
-- Check what exists
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
```

### Tip 3: Backup First
Before major schema changes:
```sql
-- Backup comments table
CREATE TABLE comments_backup AS SELECT * FROM comments;
```

### Tip 4: Test in Dev
Test SQL changes in development database first!

### Tip 5: Read Output
Always read SQL output for errors or warnings.

---

## 📚 Files Reference

### Safe Scripts:
- ✅ `add-comment-features-safe.sql` - No placeholders
- ✅ `SQL_ERROR_FIX.md` - This guide

### Original Scripts:
- ⚠️ `add-comment-features.sql` - Has test queries (skip them)

### Components:
- `CommentSectionEnhanced.tsx` - New component
- `lib/commentActions.ts` - Like/reply functions

---

## 🎉 Summary

**Problem:** UUID error from test queries  
**Solution:** Use safe SQL script  
**Time:** 2 minutes  
**Difficulty:** Easy ⭐  

**What to do:**
1. Copy `add-comment-features-safe.sql`
2. Paste in Supabase SQL Editor
3. Click "Run"
4. Done! ✅

**Result:**
- ✅ No errors
- ✅ All features ready
- ✅ Safe to use

---

**Need help?** Check the verification queries or read `COMMENT_FEATURES_GUIDE.md` for detailed help.

Happy coding! 🚀
