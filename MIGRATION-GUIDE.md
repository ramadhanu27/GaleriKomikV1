# 🔄 Migration Guide: Nuxt 3 → Next.js 14

Panduan lengkap migrasi dari **Nuxt 3 (Vue)** ke **Next.js 14 (React)**.

---

## 📊 Overview

| Aspect | Nuxt 3 | Next.js 14 |
|--------|--------|------------|
| **Framework** | Vue 3 | React 18 |
| **Language** | JavaScript/TypeScript | TypeScript |
| **Routing** | `pages/` directory | `app/` directory (App Router) |
| **State** | Pinia | Zustand |
| **Components** | `.vue` | `.tsx` |
| **Styling** | Tailwind CSS | Tailwind CSS |
| **Server** | Nitro | Node.js |
| **API** | `server/api/` | `app/api/` |

---

## 🚀 Quick Start

### **1. Install Dependencies**

```bash
cd ArKomikV2-NextJS
npm install
```

### **2. Run Development**

```bash
npm run dev
```

**Open:** http://localhost:3001

---

## 📁 File Structure Comparison

### **Nuxt 3 Structure:**
```
ArKomikV2/
├── pages/
│   ├── index.vue
│   ├── manhwa/[slug].vue
│   └── baca/[slug]/[chapter].vue
├── components/
│   ├── Header.vue
│   └── ManhwaCard.vue
├── composables/
│   └── useManhwa.ts
├── stores/
│   └── bookmark.ts (Pinia)
└── server/
    └── api/
        └── manhwa.ts
```

### **Next.js 14 Structure:**
```
ArKomikV2-NextJS/
├── app/
│   ├── page.tsx
│   ├── manhwa/[slug]/page.tsx
│   ├── baca/[slug]/[chapter]/page.tsx
│   └── api/
│       └── manhwa/route.ts
├── components/
│   ├── Header.tsx
│   └── ManhwaCard.tsx
├── store/
│   └── useBookmarkStore.ts (Zustand)
└── types/
    └── index.ts
```

---

## 🔄 Component Migration

### **Vue Component → React Component**

#### **Nuxt 3 (Vue):**
```vue
<template>
  <div class="card">
    <h1>{{ title }}</h1>
    <button @click="handleClick">Click</button>
  </div>
</template>

<script setup lang="ts">
const title = ref('Hello')

const handleClick = () => {
  title.value = 'Clicked!'
}
</script>
```

#### **Next.js (React):**
```tsx
'use client'

import { useState } from 'react'

export default function Component() {
  const [title, setTitle] = useState('Hello')

  const handleClick = () => {
    setTitle('Clicked!')
  }

  return (
    <div className="card">
      <h1>{title}</h1>
      <button onClick={handleClick}>Click</button>
    </div>
  )
}
```

---

## 🎯 Key Differences

### **1. Template Syntax**

| Vue | React |
|-----|-------|
| `<template>` | JSX in return |
| `{{ variable }}` | `{variable}` |
| `v-if="condition"` | `{condition && <div>}` |
| `v-for="item in items"` | `{items.map(item => )}` |
| `@click="handler"` | `onClick={handler}` |
| `:class="classes"` | `className={classes}` |

### **2. Reactivity**

| Vue | React |
|-----|-------|
| `ref()` | `useState()` |
| `computed()` | `useMemo()` |
| `watch()` | `useEffect()` |
| `onMounted()` | `useEffect(() => {}, [])` |

### **3. Props**

#### **Vue:**
```vue
<script setup lang="ts">
defineProps<{
  title: string
  count: number
}>()
</script>
```

#### **React:**
```tsx
interface Props {
  title: string
  count: number
}

export default function Component({ title, count }: Props) {
  // ...
}
```

### **4. Events**

#### **Vue:**
```vue
<script setup>
const emit = defineEmits<{
  update: [value: string]
}>()

emit('update', 'new value')
</script>
```

#### **React:**
```tsx
interface Props {
  onUpdate: (value: string) => void
}

export default function Component({ onUpdate }: Props) {
  onUpdate('new value')
}
```

---

## 🗂️ State Management

### **Pinia (Nuxt) → Zustand (Next.js)**

#### **Pinia Store:**
```typescript
// stores/bookmark.ts
import { defineStore } from 'pinia'

export const useBookmarkStore = defineStore('bookmark', {
  state: () => ({
    bookmarks: []
  }),
  
  getters: {
    getBookmarks: (state) => state.bookmarks
  },
  
  actions: {
    addBookmark(item) {
      this.bookmarks.push(item)
    }
  }
})
```

#### **Zustand Store:**
```typescript
// store/useBookmarkStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useBookmarkStore = create(
  persist(
    (set, get) => ({
      bookmarks: [],
      
      addBookmark: (item) => {
        set({ bookmarks: [...get().bookmarks, item] })
      },
      
      getBookmarks: () => get().bookmarks
    }),
    { name: 'arkomik-storage' }
  )
)
```

---

## 🛣️ Routing

### **File-based Routing**

| Nuxt 3 | Next.js 14 |
|--------|------------|
| `pages/index.vue` | `app/page.tsx` |
| `pages/about.vue` | `app/about/page.tsx` |
| `pages/[slug].vue` | `app/[slug]/page.tsx` |
| `pages/[slug]/[id].vue` | `app/[slug]/[id]/page.tsx` |

### **Navigation**

#### **Nuxt:**
```vue
<NuxtLink to="/about">About</NuxtLink>

<script setup>
const router = useRouter()
router.push('/about')
</script>
```

#### **Next.js:**
```tsx
import Link from 'next/link'
import { useRouter } from 'next/navigation'

<Link href="/about">About</Link>

const router = useRouter()
router.push('/about')
```

---

## 🎨 Styling

### **Tailwind CSS (Same in both)**

```tsx
// Both use same Tailwind classes
<div className="bg-white dark:bg-dark-900 p-4 rounded-lg">
  Content
</div>
```

### **Dynamic Classes**

#### **Vue:**
```vue
<div :class="{ 'active': isActive, 'disabled': isDisabled }">
```

#### **React:**
```tsx
<div className={`${isActive ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}>
```

---

## 🔌 API Routes

### **Nuxt Server API:**
```typescript
// server/api/manhwa.ts
export default defineEventHandler(async (event) => {
  return {
    success: true,
    data: []
  }
})
```

### **Next.js API Route:**
```typescript
// app/api/manhwa/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    success: true,
    data: []
  })
}
```

---

## 📦 Data Fetching

### **Nuxt:**
```vue
<script setup>
const { data } = await useFetch('/api/manhwa')
</script>
```

### **Next.js (Client):**
```tsx
'use client'

const [data, setData] = useState(null)

useEffect(() => {
  fetch('/api/manhwa')
    .then(res => res.json())
    .then(setData)
}, [])
```

### **Next.js (Server):**
```tsx
// Server Component (default)
async function getData() {
  const res = await fetch('https://api.example.com/data')
  return res.json()
}

export default async function Page() {
  const data = await getData()
  return <div>{data.title}</div>
}
```

---

## 🎯 Migration Checklist

### **✅ Completed:**

- [x] Project structure
- [x] Package.json
- [x] Next.js config
- [x] TypeScript config
- [x] Tailwind config
- [x] Global CSS
- [x] Root layout
- [x] Home page
- [x] Header component
- [x] Footer component
- [x] ManhwaCard component
- [x] ThemeProvider
- [x] Zustand store
- [x] API route (manhwa)
- [x] Types definition

### **⏳ To Do:**

- [ ] Manhwa detail page
- [ ] Reader page
- [ ] History page
- [ ] Bookmark page
- [ ] Genre page
- [ ] Search page
- [ ] ReadingHistoryCard component
- [ ] Additional API routes
- [ ] Image optimization
- [ ] SEO meta tags

---

## 🔧 Common Issues

### **1. "use client" Directive**

Next.js App Router uses Server Components by default. Add `'use client'` for:
- useState, useEffect
- Event handlers
- Browser APIs

```tsx
'use client'

import { useState } from 'react'

export default function Component() {
  const [state, setState] = useState(0)
  // ...
}
```

### **2. Image Optimization**

```tsx
import Image from 'next/image'

<Image
  src="/logo.png"
  alt="Logo"
  width={100}
  height={100}
/>
```

### **3. Metadata (SEO)**

```tsx
// app/page.tsx
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Home - Arkomik',
  description: 'Baca manhwa bahasa Indonesia'
}
```

---

## 📚 Learning Resources

### **Next.js:**
- [Next.js Documentation](https://nextjs.org/docs)
- [App Router Guide](https://nextjs.org/docs/app)
- [Data Fetching](https://nextjs.org/docs/app/building-your-application/data-fetching)

### **React:**
- [React Documentation](https://react.dev)
- [Hooks Reference](https://react.dev/reference/react)
- [Thinking in React](https://react.dev/learn/thinking-in-react)

### **TypeScript:**
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app)

---

## 🎉 Summary

### **Benefits of Next.js:**

✅ **Better Performance** - Automatic code splitting  
✅ **SEO Friendly** - Server-side rendering  
✅ **Type Safety** - Full TypeScript support  
✅ **Image Optimization** - Built-in Image component  
✅ **API Routes** - Backend in same project  
✅ **Large Ecosystem** - React community  
✅ **Vercel Deployment** - One-click deploy  

---

**Migration Status:** 🟡 **In Progress** (60% Complete)

**Next Steps:**
1. Create remaining pages
2. Migrate all components
3. Test functionality
4. Deploy to Vercel

---

**Happy Migrating! 🚀**
