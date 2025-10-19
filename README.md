# 🚀 Arkomik - Next.js Version

Website manhwa bahasa Indonesia menggunakan **Next.js 14**, **React 18**, dan **TypeScript**.

---

## 📋 Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 14.2.0 | React Framework |
| **React** | 18.3.0 | UI Library |
| **TypeScript** | 5.x | Type Safety |
| **Tailwind CSS** | 3.4.14 | Styling |
| **Zustand** | 4.5.0 | State Management |
| **Cheerio** | 1.0.0 | Web Scraping |
| **Axios** | 1.7.0 | HTTP Client |

---

## 🎯 Features

✅ **Server-Side Rendering (SSR)**  
✅ **App Router (Next.js 14)**  
✅ **TypeScript Support**  
✅ **Dark/Light Mode**  
✅ **Reading History**  
✅ **Bookmark System**  
✅ **Responsive Design**  
✅ **SEO Optimized**  
✅ **Image Optimization**  
✅ **API Routes**  

---

## 📦 Installation

### **1. Install Dependencies**

```bash
cd ArKomikV2-NextJS
npm install
```

### **2. Run Development Server**

```bash
npm run dev
```

Server akan berjalan di: **http://localhost:3001**

### **3. Build for Production**

```bash
npm run build
npm start
```

---

## 📁 Project Structure

```
ArKomikV2-NextJS/
├── app/                      # Next.js App Router
│   ├── api/                  # API Routes
│   │   └── manhwa/
│   │       └── route.ts
│   ├── manhwa/               # Manhwa pages
│   ├── riwayat/              # History page
│   ├── bookmark/             # Bookmark page
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Home page
│   └── globals.css           # Global styles
├── components/               # React Components
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── ManhwaCard.tsx
│   ├── ThemeProvider.tsx
│   └── ...
├── store/                    # Zustand stores
│   └── useBookmarkStore.ts
├── types/                    # TypeScript types
│   └── index.ts
├── public/                   # Static files
│   ├── logo.png
│   └── ...
├── next.config.js            # Next.js config
├── tailwind.config.ts        # Tailwind config
├── tsconfig.json             # TypeScript config
└── package.json
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

### **GET /api/manhwa**

Fetch manhwa list from source.

```tsx
const response = await fetch('/api/manhwa')
const data = await response.json()

// Response:
{
  success: true,
  data: {
    manhwa: [...],
    total: 100
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

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### **Build Locally**

```bash
npm run build
npm start
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

### **Port already in use:**

```bash
# Kill process on port 3001
npx kill-port 3001

# Or use different port
npm run dev -- -p 3002
```

### **Image not loading:**

```bash
# Check next.config.js
images: {
  remotePatterns: [...]
}
```

### **Dark mode not working:**

```bash
# Check ThemeProvider in layout.tsx
<html suppressHydrationWarning>
```

---

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Zustand](https://github.com/pmndrs/zustand)
- [TypeScript](https://www.typescriptlang.org)

---

## 🎉 Success!

**Next.js project structure sudah siap!**

```bash
cd ArKomikV2-NextJS
npm install
npm run dev
```

**Open:** http://localhost:3001

---

**Happy Coding! 🚀**
