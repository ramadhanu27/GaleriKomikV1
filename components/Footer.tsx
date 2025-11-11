'use client'

import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gradient-to-b from-slate-900 to-slate-950 border-t border-slate-800 mt-20">
      <div className="container-custom py-12">
        {/* A-Z List */}
        <div className="mb-6">
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