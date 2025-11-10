'use client'

import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gradient-to-b from-slate-900 to-slate-950 border-t border-slate-800 mt-20">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Logo & Description */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="relative w-10 h-10 rounded-lg overflow-hidden ring-2 ring-primary-500/50">
                <Image src="/logo-new.jpg" alt="Galeri Komik" fill className="object-contain" />
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">Galeri Komik</span>
                <p className="text-xs text-slate-400">Baca Komik Gratis</p>
              </div>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              Platform terbaik untuk membaca komik bahasa Indonesia.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-3 text-sm">Tautan Cepat</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-slate-400 hover:text-primary-400 transition-colors text-sm">
                  Beranda
                </Link>
              </li>
              <li>
                <Link href="/bookmark" className="text-slate-400 hover:text-primary-400 transition-colors text-sm">
                  Bookmark
                </Link>
              </li>
              <li>
                <Link href="/pencarian" className="text-slate-400 hover:text-primary-400 transition-colors text-sm">
                  Pencarian
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-semibold mb-3 text-sm">Informasi</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/tentang" className="text-slate-400 hover:text-primary-400 transition-colors text-sm">
                  Tentang Kami
                </Link>
              </li>
              <li>
                <Link href="/kebijakan-privasi" className="text-slate-400 hover:text-primary-400 transition-colors text-sm">
                  Kebijakan Privasi
                </Link>
              </li>
              <li>
                <Link href="/kontak" className="text-slate-400 hover:text-primary-400 transition-colors text-sm">
                  Kontak
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* A-Z List */}
        <div className="border-t border-slate-800 pt-6 mb-6">
          <h3 className="text-white font-semibold mb-3 text-sm text-center">A-Z LIST</h3>
          
          {/* Alphabet Navigation */}
          <div className="flex flex-wrap gap-1.5 mb-4 justify-center">
            {['#', '0-9', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'].map((letter) => (
              <Link
                key={letter}
                href={`/pencarian?q=${letter === '#' ? 'special' : letter === '0-9' ? 'number' : letter.toLowerCase()}`}
                className="w-8 h-8 bg-slate-800 hover:bg-primary-600 rounded flex items-center justify-center transition-colors text-slate-400 hover:text-white font-medium text-xs"
                title={`Browse ${letter}`}
              >
                {letter}
              </Link>
            ))}
          </div>

          {/* Disclaimer */}
          <p className="text-slate-500 text-xs leading-relaxed text-center">
            All comics are previews only. For the original version, please buy the comic if available in your city.
          </p>
        </div>

        {/* Copyright */}
        <div className="border-t border-slate-800 pt-6 text-center">
          <p className="text-slate-400 text-sm">
            © {currentYear} <span className="text-primary-400 font-semibold">Galeri Komik</span>. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}