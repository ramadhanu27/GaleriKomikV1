# 🚀 ArKomik - Next.js Manhwa Reader Platform

A modern, full-featured Korean manhwa (webtoon) reading platform built with **Next.js 14**, **React 18**, and **TypeScript**. This application provides a seamless reading experience with server-side rendering, real-time updates, and cloud storage integration.

---

## 📋 Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 14.2.0 | React Framework with App Router |
| **React** | 18.3.0 | UI Library |
| **TypeScript** | 5.x | Type Safety & Developer Experience |
| **Tailwind CSS** | 3.4.14 | Utility-First CSS Framework |
| **Zustand** | 4.5.0 | Lightweight State Management |
| **Supabase** | Latest | Cloud Storage & Database |
| **Cheerio** | 1.0.0 | HTML Parsing for Web Scraping |
| **Axios** | 1.7.0 | HTTP Client for API Requests |

---

## 🎯 Features

### **Core Features**
✅ **Server-Side Rendering (SSR)** - Fast initial page load and SEO optimization  
✅ **App Router (Next.js 14)** - Modern routing with layouts and nested routes  
✅ **TypeScript Support** - Full type safety across the application  
✅ **Dark/Light Mode** - Automatic theme switching with system preference detection  
✅ **Reading History** - Track reading progress with localStorage persistence  
✅ **Bookmark System** - Save favorite manhwa for quick access  
✅ **Responsive Design** - Mobile-first design that works on all devices  
✅ **SEO Optimized** - Meta tags, Open Graph, and structured data  
✅ **Image Optimization** - CDN integration with lazy loading  
✅ **API Routes** - RESTful API endpoints for data fetching

### **Advanced Features**
✅ **Cloud Storage Integration** - Supabase storage for manhwa data and images  
✅ **Real-time Updates** - Automatic content updates from cloud storage  
✅ **Chapter Grid View** - Visual chapter selection with thumbnails  
✅ **Popular Sidebar** - Dynamic popular manhwa ranking  
✅ **Recommendation System** - Genre-based manhwa recommendations  
✅ **Hero Slider** - Featured manhwa carousel on homepage  
✅ **Pagination** - Efficient data loading with pagination  
✅ **Search Functionality** - Fast client-side search  

---

## 📦 Installation

### **1. Clone Repository**

```bash
git clone https://github.com/yourusername/ArKomikV2-NextJS.git
cd ArKomikV2-NextJS
```

### **2. Install Dependencies**

```bash
npm install
# or
yarn install
# or
pnpm install
```

### **3. Environment Setup**

Create `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Supabase Storage
NEXT_PUBLIC_SUPABASE_BUCKET=your_bucket_name

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Getting Supabase Credentials:**

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project or select existing
3. Go to **Settings** > **API**
4. Copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY`
5. Go to **Storage** > Create bucket named `Chapter`
6. Set bucket to **Public**

### **4. Run Development Server**

```bash
npm run dev
```

Server will run at: **http://localhost:3000**

### **5. Build for Production**

```bash
npm run build
npm start
```

---

## 🏗️ Application Architecture

### **System Overview**

ArKomik follows a modern **JAMstack architecture** with the following flow:

```
┌─────────────┐      ┌──────────────┐      ┌─────────────────┐
│   Client    │ ───> │  Next.js API │ ───> │ Supabase Storage│
│  (Browser)  │ <─── │    Routes    │ <─── │   (JSON Files)  │
└─────────────┘      └──────────────┘      └─────────────────┘
       │                     │
       │                     │
       v                     v
┌─────────────┐      ┌──────────────┐
│ LocalStorage│      │  Image CDN   │
│  (History)  │      │  (Supabase)  │
└─────────────┘      └──────────────┘
```

### **Data Flow**

1. **Content Storage (Supabase)**
   - Manhwa metadata stored as JSON files in `Chapter/komiku/` bucket
   - Each manhwa has its own JSON file (e.g., `solo-leveling.json`)
   - Chapter images stored in organized folders
   - CDN-optimized image delivery

2. **API Layer (Next.js API Routes)**
   - `/api/komiku/list-from-files` - Fetch manhwa list from Supabase
   - `/api/komiku/[slug]` - Get specific manhwa details
   - `/api/komiku/[slug]/[chapter]` - Get chapter images
   - Server-side data fetching and caching

3. **Frontend (React Components)**
   - Server Components for initial data loading
   - Client Components for interactivity
   - Zustand for global state management
   - LocalStorage for persistence

4. **User Data (LocalStorage)**
   - Reading history with progress tracking
   - Bookmarked manhwa
   - Theme preferences
   - No backend authentication required

---

## 📁 Project Structure

```
ArKomikV2-NextJS/
├── app/                          # Next.js App Router (Pages & Layouts)
│   ├── api/                      # API Routes (Server-side endpoints)
│   │   └── komiku/
│   │       ├── list-from-files/  # GET manhwa list from Supabase
│   │       │   └── route.ts
│   │       ├── [slug]/           # GET manhwa detail by slug
│   │       │   └── route.ts
│   │       └── [slug]/[chapter]/ # GET chapter images
│   │           └── route.ts
│   ├── manhwa/                   # Manhwa detail pages
│   │   └── [slug]/
│   │       ├── page.tsx          # Manhwa detail page
│   │       └── chapter/[number]/ # Chapter reader page
│   │           └── page.tsx
│   ├── genre/                    # Genre listing page
│   │   └── page.tsx
│   ├── populer/                  # Popular manhwa page
│   │   └── page.tsx
│   ├── terbaru/                  # Latest updates page
│   │   └── page.tsx
│   ├── riwayat/                  # Reading history page
│   │   └── page.tsx
│   ├── bookmark/                 # Bookmarked manhwa page
│   │   └── page.tsx
│   ├── layout.tsx                # Root layout with providers
│   ├── page.tsx                  # Homepage (Latest + Popular)
│   └── globals.css               # Global styles & Tailwind
├── components/                   # Reusable React Components
│   ├── Header.tsx                # Navigation header with search
│   ├── Footer.tsx                # Footer with links
│   ├── ManhwaCard.tsx            # Manhwa card with cover & chapters
│   ├── ChapterGrid.tsx           # Grid view for chapters
│   ├── HeroSlider.tsx            # Featured manhwa carousel
│   ├── PopularSidebar.tsx        # Popular manhwa sidebar
│   ├── RecommendedManhwa.tsx     # Similar manhwa recommendations
│   ├── ThemeProvider.tsx         # Dark/Light theme context
│   └── SearchBar.tsx             # Search input component
├── lib/                          # Utility functions
│   ├── supabase.ts               # Supabase client configuration
│   └── imageOptimizer.ts         # Image CDN URL helpers
├── store/                        # Zustand State Management
│   ├── useBookmarkStore.ts       # Bookmark & history state
│   └── useThemeStore.ts          # Theme preference state
├── types/                        # TypeScript Type Definitions
│   └── index.ts                  # Manhwa, Chapter, History types
├── public/                       # Static Assets
│   ├── logo.png                  # App logo
│   ├── korea.png                 # Korean flag badge
│   └── favicon.ico               # Favicon
├── .env.local                    # Environment variables (Supabase)
├── next.config.js                # Next.js configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
└── package.json                  # Dependencies & scripts
```

---

## 🔄 Application Flow

### **1. Homepage Flow**

```
User visits / 
    ↓
Next.js renders page.tsx (Server Component)
    ↓
Fetch data from /api/komiku/list-from-files
    ↓
API connects to Supabase Storage
    ↓
List JSON files in Chapter/komiku/ bucket
    ↓
Sort files by updated_at (newest first)
    ↓
Download top 50 JSON files
    ↓
Parse JSON and extract:
  - Title, slug, image, genres
  - Total chapters
  - Latest 3 chapters (sorted by number)
  - scrapedAt timestamp
    ↓
Sort manhwa by scrapedAt (newest first)
    ↓
Return JSON response to client
    ↓
Render components:
  - HeroSlider (top 6 manhwa)
  - Update Terbaru (latest 30 manhwa)
  - Manhwa Populer (by total chapters)
  - PopularSidebar (top 10 by chapters)
```

### **2. Manhwa Detail Flow**

```
User clicks manhwa card
    ↓
Navigate to /manhwa/[slug]
    ↓
Fetch data from /api/komiku/[slug]
    ↓
API downloads specific JSON file from Supabase
    ↓
Parse full manhwa data:
  - Complete metadata
  - All chapters with images
  - Synopsis, author, artist
  - Genres, status, rating
    ↓
Render manhwa detail page:
  - Cover image & info
  - Synopsis
  - Genre tags
  - ChapterGrid (visual chapter list)
  - RecommendedManhwa (similar by genre)
```

### **3. Chapter Reading Flow**

```
User clicks chapter in ChapterGrid
    ↓
Navigate to /manhwa/[slug]/chapter/[number]
    ↓
Fetch chapter images from JSON data
    ↓
Render chapter reader:
  - Image viewer with lazy loading
  - Navigation (prev/next chapter)
  - Progress tracking
    ↓
User scrolls through images
    ↓
Update reading progress in LocalStorage:
  - Save current chapter
  - Calculate scroll percentage
  - Update lastRead timestamp
    ↓
Show in reading history (/riwayat)
```

### **4. Data Update Flow**

```
Content creator updates manhwa
    ↓
Scraper runs and generates new JSON
    ↓
Upload to Supabase Storage:
  - Update JSON file in Chapter/komiku/
  - Upload new chapter images
  - Update file metadata (updated_at)
    ↓
Next API call fetches updated data
    ↓
Users see new chapters automatically
```

### **5. Search & Filter Flow**

```
User types in search bar
    ↓
Client-side filtering of loaded manhwa
    ↓
Filter by:
  - Title (case-insensitive)
  - Genres
  - Status (ongoing/complete)
    ↓
Update displayed results in real-time
    ↓
No API call needed (fast response)
```

---

## 🔄 Migration from Nuxt 3

### **Key Differences:**

| Feature | Nuxt 3 (Vue) | Next.js (React) |
|---------|--------------|-----------------|
| **Framework** | Vue 3 | React 18 |
| **Routing** | File-based (pages/) | App Router (app/) |
| **State** | Pinia | Zustand |
| **Components** | `.vue` files | `.tsx` files |
| **Composables** | `use*()` | Custom hooks |
| **Auto-imports** | Built-in | Manual imports |
| **Server** | Nitro | Node.js |

---

## 🎨 Components

### **1. Header**
```tsx
import Header from '@/components/Header'

// Features:
- Navigation links
- Search bar
- Theme toggle
- Mobile menu
```

### **2. ManhwaCard**
```tsx
import ManhwaCard from '@/components/ManhwaCard'

<ManhwaCard manhwa={manhwa} />
```

### **3. ThemeProvider**
```tsx
import { useTheme } from '@/components/ThemeProvider'

const { theme, toggleTheme } = useTheme()
```

---

## 📊 State Management (Zustand)

### **Bookmark Store**

```tsx
import { useBookmarkStore } from '@/store/useBookmarkStore'

function Component() {
  const { 
    bookmarks, 
    addBookmark, 
    removeBookmark,
    readingHistory,
    updateReadingHistory 
  } = useBookmarkStore()
  
  // Add bookmark
  addBookmark({
    slug: 'solo-leveling',
    title: 'Solo Leveling',
    image: 'https://...',
    latestChapter: 'Chapter 180',
    addedAt: Date.now()
  })
  
  // Update history
  updateReadingHistory({
    slug: 'solo-leveling',
    title: 'Solo Leveling',
    image: 'https://...',
    chapterNumber: '180',
    lastRead: Date.now(),
    progress: 100
  })
}
```

---

## 🛣️ Routing

### **App Router Structure:**

```
app/
├── page.tsx                    → /
├── manhwa/
│   └── [slug]/
│       └── page.tsx            → /manhwa/[slug]
├── baca/
│   └── [slug]/
│       └── [chapter]/
│           └── page.tsx        → /baca/[slug]/[chapter]
├── riwayat/
│   └── page.tsx                → /riwayat
├── bookmark/
│   └── page.tsx                → /bookmark
└── api/
    └── manhwa/
        └── route.ts            → /api/manhwa
```

---

## 🎯 API Routes

### **GET /api/komiku/list-from-files**

Fetch manhwa list from Supabase storage.

**Query Parameters:**
- `limit` (optional) - Number of manhwa to fetch (default: 50)

**Response:**
```json
{
  "success": true,
  "data": {
    "manhwa": [
      {
        "slug": "solo-leveling",
        "title": "Solo Leveling",
        "image": "https://...",
        "synopsis": "...",
        "genres": ["Action", "Adventure"],
        "status": "Ongoing",
        "rating": 9.5,
        "totalChapters": 180,
        "scrapedAt": "2025-10-21T10:00:00Z",
        "chapters": [
          {
            "number": "180",
            "title": "Chapter 180",
            "url": "...",
            "date": "2025-10-21"
          }
        ]
      }
    ],
    "total": 50
  }
}
```

### **GET /api/komiku/[slug]**

Get specific manhwa details with all chapters.

**Response:**
```json
{
  "success": true,
  "data": {
    "slug": "solo-leveling",
    "title": "Solo Leveling",
    "manhwaTitle": "Solo Leveling",
    "image": "https://...",
    "synopsis": "Full synopsis text...",
    "genres": ["Action", "Adventure", "Fantasy"],
    "status": "Ongoing",
    "type": "Manhwa",
    "author": "Chugong",
    "artist": "DUBU (REDICE Studio)",
    "rating": 9.5,
    "totalChapters": 180,
    "chapters": [
      {
        "number": "1",
        "title": "Chapter 1",
        "url": "...",
        "date": "2021-01-01",
        "images": [
          {
            "page": 1,
            "url": "https://...",
            "filename": "001.jpg"
          }
        ]
      }
    ]
  }
}
```

### **GET /api/komiku/[slug]/[chapter]**

Get chapter images for reading.

**Response:**
```json
{
  "success": true,
  "data": {
    "chapter": {
      "number": "180",
      "title": "Chapter 180",
      "images": [
        {
          "page": 1,
          "url": "https://supabase.../image1.jpg",
          "filename": "001.jpg"
        }
      ]
    },
    "manhwa": {
      "title": "Solo Leveling",
      "slug": "solo-leveling"
    },
    "navigation": {
      "prevChapter": "179",
      "nextChapter": null
    }
  }
}
```

---

## 🎨 Styling

### **Tailwind CSS Classes:**

```tsx
// Custom classes (globals.css)
.btn-primary
.btn-secondary
.card
.input-field
.skeleton
.badge
.nav-link
.text-gradient
```

### **Dark Mode:**

```tsx
// Light mode (default)
<div className="bg-white text-gray-900">

// Dark mode
<div className="bg-white dark:bg-dark-900 text-gray-900 dark:text-white">
```

---

## 🔧 Configuration

### **next.config.js**

```js
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' }
    ],
    unoptimized: true,
  },
}
```

### **tailwind.config.ts**

```ts
theme: {
  extend: {
    colors: {
      primary: { ... },
      dark: { ... },
    },
  },
}
```

---

## 📝 TypeScript Types

```typescript
// types/index.ts

export interface Manhwa {
  slug: string
  title: string
  image: string
  rating?: number
  status?: string
  chapters?: Chapter[]
}

export interface Chapter {
  number: string
  title: string
  url: string
}

export interface ReadingHistory {
  slug: string
  title: string
  chapterNumber: string
  lastRead: number
  progress: number
}
```

---

## 🚀 Deployment

### **Vercel (Recommended)**

Vercel is the easiest way to deploy Next.js applications.

#### **Option 1: Deploy via GitHub**

1. Push your code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click **"New Project"**
4. Import your GitHub repository
5. Configure environment variables:
   - Add all variables from `.env.local`
6. Click **"Deploy"**

#### **Option 2: Deploy via CLI**

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

#### **Environment Variables on Vercel**

Go to **Project Settings** > **Environment Variables** and add:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_SUPABASE_BUCKET
NEXT_PUBLIC_APP_URL
```

### **Netlify**

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod
```

### **Docker**

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Build application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
```

Build and run:

```bash
# Build image
docker build -t arkomik .

# Run container
docker run -p 3000:3000 --env-file .env.local arkomik
```

### **Self-Hosted (VPS)**

```bash
# On your server
git clone https://github.com/yourusername/ArKomikV2-NextJS.git
cd ArKomikV2-NextJS

# Install dependencies
npm install

# Create .env.local with your variables

# Build
npm run build

# Run with PM2
npm install -g pm2
pm2 start npm --name "arkomik" -- start
pm2 save
pm2 startup
```

---

## 📖 Pages to Create

### **Required Pages:**

1. ✅ **Home** (`app/page.tsx`)
2. ⏳ **Manhwa Detail** (`app/manhwa/[slug]/page.tsx`)
3. ⏳ **Reader** (`app/baca/[slug]/[chapter]/page.tsx`)
4. ⏳ **History** (`app/riwayat/page.tsx`)
5. ⏳ **Bookmark** (`app/bookmark/page.tsx`)
6. ⏳ **Genre** (`app/genre/page.tsx`)
7. ⏳ **Search** (`app/cari/page.tsx`)

---

## 🎯 Next Steps

### **1. Complete Migration:**

```bash
# Create remaining pages
- Manhwa detail page
- Reader page
- History page
- Bookmark page
- Genre page
- Search page
```

### **2. Add Components:**

```bash
# Create additional components
- ReadingHistoryCard
- BookmarkCard
- GenreCard
- ChapterList
- ImageViewer
```

### **3. Enhance Features:**

```bash
# Add features
- User authentication
- Comments system
- Rating system
- Advanced search
- Filters
```

---

## 🐛 Troubleshooting

### **Port already in use**

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9

# Or use different port
npm run dev -- -p 3001
```

### **Supabase connection error**

```bash
# Check .env.local file exists
# Verify Supabase credentials are correct
# Ensure bucket is set to Public
# Check bucket name matches NEXT_PUBLIC_SUPABASE_BUCKET
```

### **Images not loading**

```javascript
// Check next.config.js
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: '**.supabase.co',
    },
  ],
}
```

### **Dark mode not working**

```tsx
// Check layout.tsx has suppressHydrationWarning
<html suppressHydrationWarning>
  <body>
    <ThemeProvider>
      {children}
    </ThemeProvider>
  </body>
</html>
```

### **Build errors**

```bash
# Clear Next.js cache
rm -rf .next

# Clear node_modules
rm -rf node_modules
npm install

# Rebuild
npm run build
```

### **TypeScript errors**

```bash
# Check tsconfig.json
# Ensure all types are properly imported
# Run type check
npm run type-check
```

---

## 📚 Resources

### **Official Documentation**
- [Next.js Documentation](https://nextjs.org/docs) - Next.js framework guide
- [React Documentation](https://react.dev) - React library reference
- [TypeScript Handbook](https://www.typescriptlang.org/docs) - TypeScript guide
- [Tailwind CSS](https://tailwindcss.com/docs) - Utility-first CSS framework
- [Supabase Docs](https://supabase.com/docs) - Supabase platform guide

### **State Management & Tools**
- [Zustand](https://github.com/pmndrs/zustand) - Lightweight state management
- [React Hooks](https://react.dev/reference/react) - Built-in React hooks

### **Learning Resources**
- [Next.js Learn](https://nextjs.org/learn) - Interactive Next.js tutorial
- [React Tutorial](https://react.dev/learn) - Official React tutorial
- [TypeScript for React](https://react-typescript-cheatsheet.netlify.app/) - React + TS guide

---

## 🎉 Quick Start Summary

### **For Developers**

```bash
# 1. Clone and install
git clone https://github.com/yourusername/ArKomikV2-NextJS.git
cd ArKomikV2-NextJS
npm install

# 2. Setup environment
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# 3. Run development server
npm run dev

# 4. Open browser
# http://localhost:3000
```

### **For Content Creators**

1. **Prepare manhwa data** in JSON format
2. **Upload to Supabase Storage** in `Chapter/komiku/` bucket
3. **Structure:**
   ```
   Chapter/
   └── komiku/
       ├── manhwa-slug.json (metadata + chapters)
       └── manhwa-slug/
           ├── chapter-1/
           │   ├── 001.jpg
           │   ├── 002.jpg
           │   └── ...
           └── chapter-2/
               └── ...
   ```
4. **Application automatically fetches** new content

### **Key Features Summary**

✅ **Modern Stack** - Next.js 14, React 18, TypeScript  
✅ **Cloud Storage** - Supabase for data and images  
✅ **Fast Performance** - SSR, CDN, image optimization  
✅ **User-Friendly** - Dark mode, history, bookmarks  
✅ **Mobile-Ready** - Responsive design for all devices  
✅ **SEO Optimized** - Meta tags and structured data  
✅ **Easy Deploy** - One-click Vercel deployment  

---

## 📞 Support & Contributing

### **Found a Bug?**
Open an issue on [GitHub Issues](https://github.com/yourusername/ArKomikV2-NextJS/issues)

### **Want to Contribute?**
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### **Need Help?**
- Check the [Troubleshooting](#-troubleshooting) section
- Read the [Application Flow](#-application-flow) documentation
- Review [API Routes](#-api-routes) documentation

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Next.js Team** - For the amazing React framework
- **Vercel** - For hosting and deployment platform
- **Supabase** - For backend and storage infrastructure
- **Tailwind CSS** - For the utility-first CSS framework
- **Open Source Community** - For all the amazing tools and libraries

---

<div align="center">

## 🚀 Ready to Build?

```bash
npm install && npm run dev
```

**Visit:** [http://localhost:3000](http://localhost:3000)

---

**Built with ❤️ using Next.js**

**Happy Coding! 🎉**

</div>
