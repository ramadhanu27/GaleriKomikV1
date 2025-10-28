import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import dynamic from 'next/dynamic'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { ThemeProvider } from '@/components/ThemeProvider'
import Analytics from '@/components/Analytics'

const AuthProvider = dynamic(
  () => import('@/contexts/AuthContext').then(mod => ({ default: mod.AuthProvider })),
  { ssr: false }
)

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
        {/* Google Tag Manager */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-WPB3JZMT');`,
          }}
        />
        {/* End Google Tag Manager */}
        
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://img.komiku.org" />
        <link rel="preconnect" href="https://thumbnail.komiku.org" />
        <link rel="dns-prefetch" href="https://img.komiku.org" />
        <link rel="dns-prefetch" href="https://thumbnail.komiku.org" />
        
        {/* Google Analytics */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-H0ZKH8V6Z8"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-H0ZKH8V6Z8');
            `,
          }}
        />
        
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
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-WPB3JZMT"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}
        
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
