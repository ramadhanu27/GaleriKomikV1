import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { ThemeProvider } from '@/components/ThemeProvider'
import { AuthProvider } from '@/contexts/AuthContext'
import GoogleAnalytics from '@/components/GoogleAnalytics'
import Analytics from '@/components/Analytics'

const inter = Inter({ subsets: ['latin'] })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#1a1a2e' },
  ],
}

export const metadata: Metadata = {
  metadataBase: new URL('https://www.galerikomik.cyou'),
  title: {
    default: 'Arkomik - Baca Manhwa Bahasa Indonesia',
    template: '%s | Arkomik'
  },
  description: 'Platform terbaik untuk membaca manhwa bahasa Indonesia. Koleksi lengkap dengan update terbaru setiap hari. Baca gratis dengan kualitas HD.',
  keywords: ['manhwa', 'komik', 'webtoon', 'bahasa indonesia', 'baca online', 'manhwa indo', 'komik online', 'baca gratis'],
  authors: [{ name: 'Arkomik' }],
  creator: 'Arkomik',
  publisher: 'Arkomik',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png', sizes: '32x32' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/manifest.json',
  openGraph: {
    title: 'Arkomik - Baca Manhwa Bahasa Indonesia',
    description: 'Platform terbaik untuk membaca manhwa bahasa Indonesia. Koleksi lengkap dengan update terbaru setiap hari.',
    url: 'https://www.galerikomik.cyou',
    siteName: 'Arkomik',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Arkomik - Baca Manhwa Bahasa Indonesia',
      },
    ],
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Arkomik - Baca Manhwa Bahasa Indonesia',
    description: 'Platform terbaik untuk membaca manhwa bahasa Indonesia. Koleksi lengkap dengan update terbaru setiap hari.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: 'https://www.galerikomik.cyou',
  },
  verification: {
    google: 'your-google-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://img.komiku.org" />
        <link rel="preconnect" href="https://thumbnail.komiku.org" />
        <link rel="dns-prefetch" href="https://img.komiku.org" />
        <link rel="dns-prefetch" href="https://thumbnail.komiku.org" />
        
        {/* Theme script - prevent flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme') || 'dark';
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID || ''} />
        <ThemeProvider>
          <AuthProvider>
            <Analytics />
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-1">
                {children}
              </main>
              <Footer />
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
