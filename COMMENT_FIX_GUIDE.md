# 🔧 Fix Comments Table - Panduan Lengkap

## ❌ Masalah

Error: `Could not find the 'username' column of 'comments' in the schema cache`

Ini terjadi karena tabel `comments` di database Supabase Anda tidak memiliki kolom `username` dan `avatar_url`.

---

## ✅ Solusi

### Opsi 1: Jalankan Script SQL (Recommended)

1. **Buka Supabase Dashboard**
   - Login ke https://supabase.com
   - Pilih project Anda

2. **Buka SQL Editor**
   - Klik menu "SQL Editor" di sidebar kiri
   - Klik "New query"

3. **Copy & Paste Script**
   - Buka file `fix-comments-table.sql`
   - Copy semua isi file
   - Paste ke SQL Editor

4. **Run Script**
   - Klik tombol "Run" atau tekan `Ctrl+Enter`
   - Tunggu sampai selesai
   - Anda akan melihat hasil verifikasi di bagian bawah

5. **Refresh Schema Cache**
   - Kembali ke aplikasi Next.js Anda
   - Restart development server:
     ```bash
     # Stop server (Ctrl+C)
     # Start again
     npm run dev
     ```

---

### Opsi 2: Manual via Supabase Dashboard

1. **Buka Table Editor**
   - Login ke Supabase Dashboard
   - Klik "Table Editor" di sidebar
   - Pilih tabel `comments`

2. **Tambah Kolom `username`**
   - Klik tombol "+" atau "Add Column"
   - Name: `username`
   - Type: `text`
   - Default value: `'User'`
   - Is Nullable: ❌ (unchecked)
   - Klik "Save"

3. **Tambah Kolom `avatar_url`**
   - Klik tombol "+" atau "Add Column"
   - Name: `avatar_url`
   - Type: `text`
   - Default value: (kosongkan)
   - Is Nullable: ✅ (checked)
   - Klik "Save"

4. **Refresh Schema**
   - Restart development server

---

### Opsi 3: Drop & Recreate Table (⚠️ Data akan hilang!)

Jika Anda tidak punya data penting di tabel `comments`:

1. **Buka SQL Editor di Supabase**

2. **Drop Table**
   ```sql
   DROP TABLE IF EXISTS public.comments CASCADE;
   ```

3. **Recreate Table**
   ```sql
   CREATE TABLE IF NOT EXISTS public.comments (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_id UUID NOT NULL,
     username TEXT NOT NULL,
     avatar_url TEXT,
     manhwa_slug TEXT NOT NULL,
     chapter_id TEXT,
     comment_text TEXT NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Create indexes
   CREATE INDEX IF NOT EXISTS idx_comments_manhwa_slug ON public.comments(manhwa_slug);
   CREATE INDEX IF NOT EXISTS idx_comments_chapter_id ON public.comments(chapter_id);
   CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);
   CREATE INDEX IF NOT EXISTS idx_comments_created_at ON public.comments(created_at DESC);

   -- Enable RLS
   ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

   -- Policies
   CREATE POLICY "Anyone can read comments"
     ON public.comments FOR SELECT USING (true);

   CREATE POLICY "Authenticated users can create comments"
     ON public.comments FOR INSERT
     TO authenticated
     WITH CHECK (auth.uid() = user_id);

   CREATE POLICY "Users can update own comments"
     ON public.comments FOR UPDATE
     TO authenticated
     USING (auth.uid() = user_id);

   CREATE POLICY "Users can delete own comments"
     ON public.comments FOR DELETE
     TO authenticated
     USING (auth.uid() = user_id);
   ```

4. **Run Script**

---

## 🧪 Testing

Setelah fix, test dengan:

1. **Login ke website**
2. **Buka halaman manhwa**
3. **Scroll ke section komentar**
4. **Tulis komentar**
5. **Klik "Kirim"**

Jika berhasil:
- ✅ Komentar muncul langsung
- ✅ Username tampil
- ✅ Avatar tampil (jika ada)
- ✅ Tidak ada error di console

---

## 🔍 Verifikasi Schema

Untuk memastikan schema sudah benar, jalankan di SQL Editor:

```sql
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'comments'
ORDER BY ordinal_position;
```

Hasilnya harus menampilkan:
- ✅ `id` - uuid
- ✅ `user_id` - uuid
- ✅ `username` - text (NOT NULL)
- ✅ `avatar_url` - text (NULLABLE)
- ✅ `manhwa_slug` - text
- ✅ `chapter_id` - text
- ✅ `comment_text` - text
- ✅ `created_at` - timestamp
- ✅ `updated_at` - timestamp

---

## 📊 Schema Lengkap

Struktur tabel `comments` yang benar:

```sql
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  username TEXT NOT NULL,           -- ✅ Kolom ini harus ada
  avatar_url TEXT,                  -- ✅ Kolom ini harus ada
  manhwa_slug TEXT NOT NULL,
  chapter_id TEXT,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 🎯 Kenapa Error Ini Terjadi?

1. **Tabel dibuat sebelum schema diupdate**
   - Schema SQL di `supabase-schema.sql` sudah benar
   - Tapi tabel di database belum diupdate

2. **Migration tidak dijalankan**
   - Perubahan schema tidak otomatis apply
   - Harus manual run SQL script

3. **Cache issue**
   - Supabase cache schema lama
   - Perlu refresh dengan restart

---

## 💡 Tips

1. **Selalu backup data** sebelum modify schema
2. **Test di development** dulu sebelum production
3. **Gunakan migrations** untuk track schema changes
4. **Document schema changes** di version control

---

## 🆘 Troubleshooting

### Error masih muncul setelah fix?

1. **Clear browser cache**
   ```
   Ctrl+Shift+Delete → Clear cache
   ```

2. **Restart dev server**
   ```bash
   # Stop (Ctrl+C)
   npm run dev
   ```

3. **Check Supabase logs**
   - Dashboard → Logs → API Logs
   - Cari error terkait comments

4. **Verify RLS policies**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'comments';
   ```

### Komentar tidak muncul?

1. **Check RLS policies** - Pastikan policy "Anyone can read comments" aktif
2. **Check user authentication** - Pastikan user sudah login
3. **Check console errors** - Buka DevTools → Console

### Username tidak tampil?

1. **Check user metadata**
   ```typescript
   console.log(user.user_metadata)
   ```

2. **Update user profile** di halaman Profile
3. **Logout & login** lagi

---

## ✅ Checklist

- [ ] Run `fix-comments-table.sql` di Supabase SQL Editor
- [ ] Verify schema dengan query di atas
- [ ] Restart development server
- [ ] Clear browser cache
- [ ] Test comment functionality
- [ ] Check username tampil
- [ ] Check avatar tampil (jika ada)
- [ ] Test delete comment
- [ ] Check RLS policies

---

**Setelah mengikuti panduan ini, fitur komentar akan berfungsi dengan baik!** 🎉

Jika masih ada masalah, check console browser untuk error details.
