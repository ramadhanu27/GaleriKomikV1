'use client'

import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-white dark:bg-dark-900 border-t border-gray-200 dark:border-dark-800 mt-20 transition-colors">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo & Description */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="relative w-10 h-10">
                <Image src="/logo.png" alt="Arkomik" fill className="object-contain" />
              </div>
              <span className="text-xl font-bold text-gradient">Arkomik</span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Platform terbaik untuk membaca manhwa bahasa Indonesia. 
              Nikmati koleksi lengkap dengan update terbaru setiap hari.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-gray-900 dark:text-white font-semibold mb-4">Tautan Cepat</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-600 dark:text-gray-400 hover:text-primary-500 transition-colors text-sm">
                  Beranda
                </Link>
              </li>
              <li>
                <Link href="/genre" className="text-gray-600 dark:text-gray-400 hover:text-primary-500 transition-colors text-sm">
                  Genre
                </Link>
              </li>
              <li>
                <Link href="/populer" className="text-gray-600 dark:text-gray-400 hover:text-primary-500 transition-colors text-sm">
                  Populer
                </Link>
              </li>
              <li>
                <Link href="/terbaru" className="text-gray-600 dark:text-gray-400 hover:text-primary-500 transition-colors text-sm">
                  Terbaru
                </Link>
              </li>
              <li>
                <Link href="/bookmark" className="text-gray-600 dark:text-gray-400 hover:text-primary-500 transition-colors text-sm">
                  Bookmark
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-gray-900 dark:text-white font-semibold mb-4">Informasi</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/tentang" className="text-gray-600 dark:text-gray-400 hover:text-primary-500 transition-colors text-sm">
                  Tentang Kami
                </Link>
              </li>
              <li>
                <Link href="/kebijakan-privasi" className="text-gray-600 dark:text-gray-400 hover:text-primary-500 transition-colors text-sm">
                  Kebijakan Privasi
                </Link>
              </li>
              <li>
                <Link href="/kontak" className="text-gray-600 dark:text-gray-400 hover:text-primary-500 transition-colors text-sm">
                  Kontak
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-200 dark:border-dark-800 mt-8 pt-8 text-center transition-colors">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            © {currentYear} Arkomik. Semua Hak Dilindungi.
          </p>
          <p className="text-gray-500 dark:text-gray-500 text-xs mt-2">
            Disclaimer: Semua konten manhwa adalah milik penerbit dan penulis aslinya.
          </p>
        </div>
      </div>
    </footer>
  )
}
