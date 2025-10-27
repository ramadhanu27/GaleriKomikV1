# 💬 Enhanced Comment Features - Complete Guide

## 🎉 Fitur Baru yang Ditambahkan

### 1. **👍 Like/Upvote System**
- User bisa like komentar
- Real-time like counter
- Visual feedback (heart icon berubah merah)
- Unlike dengan klik lagi

### 2. **💬 Reply to Comments**
- Balas komentar user lain
- Nested replies (indented)
- Show/hide replies
- Reply counter

### 3. **📝 Edit Comment**
- Edit komentar sendiri
- Inline editing
- "edited" label
- Save/Cancel buttons

### 4. **🔄 Sort Comments**
- **Terbaru** - Sort by newest first
- **Populer** - Sort by most likes
- **Terlama** - Sort by oldest first

### 5. **📊 Comment Stats**
- Likes count
- Replies count
- Real-time updates

### 6. **⚡ Optimistic UI**
- Instant feedback
- No waiting for server
- Auto-revert on error

### 7. **🎨 Better UX**
- Hover effects
- Smooth animations
- Loading states
- Error handling

---

## 📁 File Structure

```
lib/
├── comments.ts              # Original comment functions
├── commentActions.ts        # NEW: Like, reply, edit functions
└── supabase.ts             # Supabase client

components/
├── CommentSection.tsx       # Original component
└── CommentSectionEnhanced.tsx  # NEW: Enhanced with all features

SQL/
└── add-comment-features.sql # Database schema updates
```

---

## 🗄️ Database Schema

### New Tables:

#### 1. **comment_likes**
```sql
CREATE TABLE comment_likes (
  id UUID PRIMARY KEY,
  comment_id UUID REFERENCES comments(id),
  user_id UUID NOT NULL,
  created_at TIMESTAMP,
  UNIQUE(comment_id, user_id)
)
```

### New Columns in `comments`:

```sql
ALTER TABLE comments 
ADD COLUMN parent_id UUID REFERENCES comments(id),
ADD COLUMN is_edited BOOLEAN DEFAULT FALSE;
```

### Indexes:
```sql
CREATE INDEX idx_comments_parent_id ON comments(parent_id);
CREATE INDEX idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX idx_comment_likes_user_id ON comment_likes(user_id);
```

---

## 🚀 Installation Steps

### Step 1: Run SQL Script

1. **Buka Supabase Dashboard**
   - Login ke https://supabase.com
   - Pilih project Anda

2. **Buka SQL Editor**
   - Klik "SQL Editor" di sidebar
   - Klik "New query"

3. **Copy & Paste**
   - Buka file `add-comment-features.sql`
   - Copy semua isi
   - Paste ke SQL Editor

4. **Run Script**
   - Klik "Run" atau `Ctrl+Enter`
   - Tunggu sampai selesai

### Step 2: Update Component

Replace `CommentSection` dengan `CommentSectionEnhanced`:

```tsx
// Before
import CommentSection from '@/components/CommentSection'

// After
import CommentSectionEnhanced from '@/components/CommentSectionEnhanced'

// Usage
<CommentSectionEnhanced 
  manhwaSlug={manhwa.slug} 
  onAuthRequired={() => setShowAuthModal(true)}
/>
```

### Step 3: Test Features

1. **Refresh browser** (`Ctrl+Shift+R`)
2. **Login** ke akun
3. **Test setiap fitur:**
   - ✅ Like komentar
   - ✅ Reply komentar
   - ✅ Edit komentar
   - ✅ Delete komentar
   - ✅ Sort comments

---

## 🎯 Feature Details

### 1. Like System

#### How it Works:
```typescript
// Click like button
handleLike(commentId) 
  → Optimistic update (instant UI change)
  → Call toggleCommentLike(commentId, userId)
  → Update database
  → Revert if error
```

#### Visual Feedback:
- **Not liked:** Gray heart outline
- **Liked:** Red filled heart
- **Count:** Shows number of likes

#### Code Example:
```tsx
<button onClick={() => handleLike(comment.id)}>
  <svg className={comment.user_has_liked ? 'fill-red-400' : ''}>
    ❤️
  </svg>
  <span>{comment.likes_count}</span>
</button>
```

---

### 2. Reply System

#### How it Works:
```typescript
// Click reply button
setReplyingTo(commentId)
  → Show reply textarea
  → Type reply
  → Press Enter
  → Call addReply(userId, manhwaSlug, text, parentId)
  → Increment replies_count
  → Show in replies list
```

#### Features:
- **Nested display** - Replies indented with left margin
- **Show/Hide** - Toggle replies visibility
- **Counter** - Shows "X balasan"
- **Quick reply** - Enter to send, Shift+Enter for new line

#### Code Example:
```tsx
{replyingTo === comment.id && (
  <textarea 
    onKeyDown={(e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        handleReply(comment.id, e.target.value)
      }
    }}
  />
)}
```

---

### 3. Edit System

#### How it Works:
```typescript
// Click edit button
setEditingId(commentId)
setEditText(comment.comment_text)
  → Show edit textarea
  → Modify text
  → Click "Simpan"
  → Call editComment(commentId, userId, newText)
  → Update UI with "edited" label
```

#### Features:
- **Inline editing** - Edit in place
- **Save/Cancel** - Confirm or discard changes
- **"edited" label** - Shows comment was modified
- **Only own comments** - Can't edit others' comments

#### Code Example:
```tsx
{editingId === comment.id ? (
  <div>
    <textarea value={editText} onChange={...} />
    <button onClick={() => handleEdit(comment.id)}>Simpan</button>
    <button onClick={() => setEditingId(null)}>Batal</button>
  </div>
) : (
  <p>{comment.comment_text}</p>
)}
```

---

### 4. Sort System

#### Options:
1. **Terbaru (Newest)** - Default
   - Sort by `created_at DESC`
   - Newest comments first

2. **Populer (Popular)**
   - Sort by `likes_count DESC`
   - Most liked comments first

3. **Terlama (Oldest)**
   - Sort by `created_at ASC`
   - Oldest comments first

#### Code Example:
```tsx
const sortedComments = [...comments].sort((a, b) => {
  if (sortBy === 'newest') {
    return new Date(b.created_at) - new Date(a.created_at)
  } else if (sortBy === 'popular') {
    return (b.likes_count || 0) - (a.likes_count || 0)
  } else {
    return new Date(a.created_at) - new Date(b.created_at)
  }
})
```

---

## 🎨 UI/UX Improvements

### Visual Enhancements:

#### 1. **Like Button**
```
Not Liked: 🤍 0
Liked:     ❤️ 1
Hover:     Scale up + color change
```

#### 2. **Reply Button**
```
Icon: ↩️
Text: "Balas"
Hover: Color change
```

#### 3. **Edit/Delete Buttons**
```
Edit:   ✏️ (Blue on hover)
Delete: 🗑️ (Red on hover)
Only visible for own comments
```

#### 4. **Replies Display**
```
┌─────────────────────┐
│ Main Comment        │
│ ❤️ 5  💬 3 balasan  │
│   ↓ Show replies    │
│                     │
│   ┌───────────────┐ │
│   │ Reply 1       │ │
│   │ ❤️ 2          │ │
│   └───────────────┘ │
│                     │
│   ┌───────────────┐ │
│   │ Reply 2       │ │
│   │ ❤️ 1          │ │
│   └───────────────┘ │
└─────────────────────┘
```

---

## 📊 Performance Optimizations

### 1. **Optimistic UI Updates**
- Instant feedback
- No waiting for server
- Auto-revert on error

### 2. **Lazy Loading Replies**
- Replies loaded only when expanded
- Reduces initial load time
- Better performance

### 3. **Batch Stats Fetching**
- Fetch all stats in parallel
- `Promise.all()` for efficiency
- Single render cycle

### 4. **Memoization**
- Sort only when needed
- Prevent unnecessary re-renders
- Better React performance

---

## 🔒 Security & Permissions

### RLS Policies:

#### comment_likes:
```sql
-- Anyone can read likes
SELECT: true

-- Authenticated users can like
INSERT: auth.uid() = user_id

-- Users can unlike their own
DELETE: auth.uid() = user_id
```

#### comments (updated):
```sql
-- Anyone can read
SELECT: true

-- Authenticated can create
INSERT: auth.uid() = user_id

-- Users can edit own
UPDATE: auth.uid() = user_id

-- Users can delete own
DELETE: auth.uid() = user_id
```

---

## 🧪 Testing Checklist

### Like Feature:
- [ ] Click like → Heart turns red
- [ ] Like count increases
- [ ] Click again → Unlike
- [ ] Like count decreases
- [ ] Other users see updated count

### Reply Feature:
- [ ] Click "Balas" → Textarea appears
- [ ] Type reply → Press Enter
- [ ] Reply appears indented
- [ ] Replies count updates
- [ ] Can expand/collapse replies

### Edit Feature:
- [ ] Click edit → Textarea appears
- [ ] Modify text → Click "Simpan"
- [ ] Comment updates
- [ ] "edited" label appears
- [ ] Can cancel edit

### Sort Feature:
- [ ] Click "Terbaru" → Newest first
- [ ] Click "Populer" → Most liked first
- [ ] Click "Terlama" → Oldest first
- [ ] Sort persists during session

### General:
- [ ] Loading states work
- [ ] Error handling works
- [ ] Mobile responsive
- [ ] No console errors

---

## 🐛 Troubleshooting

### Issue: "Column 'parent_id' does not exist"
**Solution:** Run `add-comment-features.sql` in Supabase

### Issue: "Table 'comment_likes' does not exist"
**Solution:** Run `add-comment-features.sql` in Supabase

### Issue: Likes not updating
**Solution:** 
1. Check RLS policies
2. Verify user is authenticated
3. Check browser console for errors

### Issue: Replies not showing
**Solution:**
1. Click "X balasan" to expand
2. Check if `parent_id` column exists
3. Verify replies are being fetched

### Issue: Can't edit comments
**Solution:**
1. Verify you're the comment owner
2. Check `is_edited` column exists
3. Check user authentication

---

## 💡 Tips & Best Practices

### For Users:
1. **Like wisely** - Support good comments
2. **Reply thoughtfully** - Add value to discussion
3. **Edit carefully** - Others can see "edited" label
4. **Be respectful** - Follow community guidelines

### For Developers:
1. **Test thoroughly** - All features before deploy
2. **Monitor performance** - Watch for slow queries
3. **Handle errors** - Graceful degradation
4. **Update regularly** - Keep dependencies updated

---

## 📈 Future Enhancements

### Potential Features:
- [ ] **Emoji reactions** - 😂 😍 👍 👎
- [ ] **Mention system** - @username notifications
- [ ] **Rich text editor** - Bold, italic, links
- [ ] **Image uploads** - Attach images to comments
- [ ] **Report system** - Flag inappropriate content
- [ ] **Pin comments** - Highlight important comments
- [ ] **Sort by replies** - Most discussed comments
- [ ] **Real-time updates** - Live comment feed
- [ ] **Pagination** - Load more comments
- [ ] **Search comments** - Find specific comments

---

## 📚 API Reference

### Functions in `commentActions.ts`:

#### `toggleCommentLike(commentId, userId)`
```typescript
// Like or unlike a comment
const result = await toggleCommentLike(commentId, userId)
// Returns: { success: boolean, liked: boolean, error?: string }
```

#### `addReply(userId, manhwaSlug, text, parentId, chapterId?)`
```typescript
// Add a reply to a comment
const result = await addReply(userId, manhwaSlug, text, parentId)
// Returns: { success: boolean, comment?: Comment, error?: string }
```

#### `editComment(commentId, userId, newText)`
```typescript
// Edit a comment
const result = await editComment(commentId, userId, newText)
// Returns: { success: boolean, error?: string }
```

#### `getCommentReplies(commentId, limit?)`
```typescript
// Get replies for a comment
const replies = await getCommentReplies(commentId, 20)
// Returns: Comment[]
```

#### `getCommentLikesCount(commentId)`
```typescript
// Get likes count
const count = await getCommentLikesCount(commentId)
// Returns: number
```

#### `hasUserLikedComment(commentId, userId)`
```typescript
// Check if user liked
const hasLiked = await hasUserLikedComment(commentId, userId)
// Returns: boolean
```

---

## ✅ Summary

### What's New:
- ✅ **7 major features** added
- ✅ **3 new files** created
- ✅ **2 database tables** added
- ✅ **Better UX** overall

### Files Created:
1. `lib/commentActions.ts` - Like, reply, edit functions
2. `components/CommentSectionEnhanced.tsx` - Enhanced UI
3. `add-comment-features.sql` - Database schema
4. `COMMENT_FEATURES_GUIDE.md` - This guide

### Database Changes:
- ✅ `comment_likes` table
- ✅ `parent_id` column in comments
- ✅ `is_edited` column in comments
- ✅ RLS policies
- ✅ Indexes for performance

### Benefits:
- 📈 **Better engagement** - More interaction
- ⚡ **Faster UX** - Optimistic updates
- 🎨 **Modern UI** - Beautiful design
- 🔒 **Secure** - RLS policies
- 📊 **Scalable** - Efficient queries

---

**Enjoy the enhanced comment system! 🎉**

Need help? Check the troubleshooting section or open an issue.
