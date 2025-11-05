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
    default: 'Galeri Komik - Baca Komik Bahasa Indonesia',
    template: '%s | Galeri Komik'
  },
  description: 'Platform terbaik untuk membaca komik bahasa Indonesia. Koleksi lengkap dengan update terbaru setiap hari. Baca gratis dengan kualitas HD.',
  keywords: ['komik', 'manga', 'manhwa', 'webtoon', 'bahasa indonesia', 'baca online', 'komik indo', 'manga online', 'baca gratis'],
  authors: [{ name: 'Galeri Komik' }],
  creator: 'Galeri Komik',
  publisher: 'Galeri Komik',
  category: 'Entertainment',
  classification: 'Comics & Manga',
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
      { url: '/logo-new.jpg', sizes: 'any', type: 'image/jpeg' },
      { url: '/icon.png', type: 'image/png', sizes: '32x32' },
    ],
    shortcut: '/logo-new.jpg',
    apple: [
      { url: '/logo-new.jpg', sizes: '180x180', type: 'image/jpeg' },
    ],
  },
  manifest: '/manifest.json',
  openGraph: {
    title: 'Galeri Komik - Baca Komik Bahasa Indonesia',
    description: 'Platform terbaik untuk membaca komik bahasa Indonesia. Koleksi lengkap dengan update terbaru setiap hari.',
    url: 'https://www.galerikomik.cyou',
    siteName: 'Galeri Komik',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Galeri Komik - Baca Komik Bahasa Indonesia',
      },
    ],
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Galeri Komik - Baca Komik Bahasa Indonesia',
    description: 'Platform terbaik untuk membaca komik bahasa Indonesia. Koleksi lengkap dengan update terbaru setiap hari.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: 'https://www.galerikomik.cyou',
  },
  verification: {
    google: 'your-google-verification-code',
  },
  other: {
    'msapplication-TileColor': '#1a1a2e',
    'msapplication-config': '/browserconfig.xml',
    'apple-mobile-web-app-title': 'Galeri Komik',
    'application-name': 'Galeri Komik',
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'format-detection': 'telephone=no',
    'theme-color': '#1a1a2e',
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
        
        {/* Security: Hide sensitive data from DevTools */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Hide sensitive cookies
                  const originalCookieDescriptor = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie');
                  if (originalCookieDescriptor) {
                    const originalGetter = originalCookieDescriptor.get;
                    Object.defineProperty(document, 'cookie', {
                      get: function() {
                        if (!originalGetter) return '';
                        const cookies = originalGetter.call(document);
                        return cookies.split('; ').filter(function(cookie) {
                          const name = cookie.split('=')[0];
                          return !name.includes('arkomik-aut') && !name.includes('sb-') && 
                                 !name.includes('auth-token') && !name.includes('access-token');
                        }).join('; ');
                      },
                      set: originalCookieDescriptor.set,
                      configurable: true
                    });
                  }
                  
                  // Hide sensitive localStorage keys
                  const sensitivePatterns = ['arkomik-auth', 'sb-', 'supabase', 'auth-token', 'access-token', 'refresh-token'];
                  const originalGetItem = Storage.prototype.getItem;
                  const originalKey = Storage.prototype.key;
                  
                  function isSensitive(key) {
                    return sensitivePatterns.some(function(p) { return key.includes(p); });
                  }
                  
                  Storage.prototype.getItem = function(key) {
                    const value = originalGetItem.call(this, key);
                    if (isSensitive(key)) {
                      const stack = new Error().stack || '';
                      if (stack.includes('devtools') || stack.includes('console')) {
                        return null;
                      }
                    }
                    return value;
                  };
                  
                  Storage.prototype.key = function(index) {
                    let currentIndex = 0;
                    let actualIndex = 0;
                    while (actualIndex < localStorage.length) {
                      const key = originalKey.call(this, actualIndex);
                      if (key && !isSensitive(key)) {
                        if (currentIndex === index) return key;
                        currentIndex++;
                      }
                      actualIndex++;
                    }
                    return null;
                  };
                  
                  console.log('🔒 Security protection enabled');
                } catch (e) {
                  console.error('Security init failed:', e);
                }
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
