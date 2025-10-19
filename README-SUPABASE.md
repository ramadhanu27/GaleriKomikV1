# Supabase Setup Guide

## Environment Variables

Buat file `.env.local` di root project dengan konfigurasi berikut:

```env
SUPABASE_URL=https://huhhzvaiqskhldhxexcu.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1aGh6dmFpcXNraGxkaHhleGN1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDY5NDQxOCwiZXhwIjoyMDc2MjcwNDE4fQ.OdYbHT0jY2oWkKGufOnJb0uiZDAX-jO9kWMHx02uW94
SUPABASE_BUCKET=komiku-data
```

## Supabase Storage Structure

Upload file-file berikut ke Supabase Storage bucket `komiku-data`:

```
komiku-data/
├── komiku-list.json
└── Chapter/
    └── komiku/
        ├── 99-wooden-stick.json
        ├── absolute-sword-sense.json
        ├── eleceed.json
        └── ... (semua file chapter lainnya)
```

## API Endpoints

### 1. Get Manhwa List
```
GET /api/komiku/list
Query Parameters:
  - page: number (default: 1)
  - limit: number (default: 20)
  - search: string (optional)
  - genre: string (optional)
```

### 2. Get Manhwa Detail
```
GET /api/komiku/[slug]
```

### 3. Get Manhwa Chapters
```
GET /api/komiku/[slug]/chapters
Query Parameters:
  - page: number (default: 1)
  - limit: number (default: 50)
```

### 4. Get Chapter Detail
```
GET /api/komiku/[slug]/chapter/[chapterId]
```

## Upload Files ke Supabase

1. Login ke Supabase Dashboard: https://app.supabase.com
2. Pilih project Anda
3. Buka menu **Storage**
4. Pilih bucket `komiku-data`
5. Upload file `komiku-list.json` ke root bucket
6. Buat folder `Chapter/komiku/`
7. Upload semua file chapter JSON ke folder tersebut

## Install Dependencies

```bash
npm install
```

Ini akan menginstall `@supabase/supabase-js` yang sudah ditambahkan ke package.json.

## Run Development Server

```bash
npm run dev
```

Server akan berjalan di http://localhost:3000
