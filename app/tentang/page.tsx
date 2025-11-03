export default function TentangPage() {
  return (
    <div className="py-8">
      <div className="container-custom max-w-4xl">
        {/* Header */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 mb-8 border border-slate-700/50">
          <h1 className="text-4xl font-bold text-white mb-3 flex items-center gap-3">
            <svg className="w-10 h-10 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Tentang Kami
          </h1>
          <p className="text-slate-300">
            Kenali lebih dekat platform Galeri Komik
          </p>
        </div>

        {/* Important Notice */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* No Ads Notice */}
          <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/50 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-green-400 mb-2">Bebas Iklan</h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Kami menyediakan platform baca komik <span className="font-semibold text-white">tanpa iklan judol dan iklan mengganggu lainnya</span>. 
                  Nikmati pengalaman membaca yang nyaman dan fokus pada cerita.
                </p>
              </div>
            </div>
          </div>

          {/* Copyright Notice */}
          <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/50 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-blue-400 mb-2">Hak Cipta</h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Semua manhwa/manga/manhua yang kami sediakan <span className="font-semibold text-white">adalah milik penerbit dan penulis aslinya</span>. 
                  Kami menghormati hak cipta dan hanya menyediakan akses baca.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Apa itu Arkomik */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl p-6 border border-slate-700/50">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Apa itu Arkomik?
            </h2>
            <p className="text-slate-300 leading-relaxed">
              Arkomik adalah platform online terpercaya untuk membaca manhwa bahasa Indonesia secara gratis. 
              Kami menyediakan koleksi lengkap manhwa dari berbagai genre, mulai dari action, romance, fantasy, 
              hingga slice of life. Dengan update rutin setiap hari, Anda tidak akan ketinggalan chapter terbaru 
              dari manhwa favorit Anda.
            </p>
          </div>

          {/* Misi Kami */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl p-6 border border-slate-700/50">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              Misi Kami
            </h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              Misi kami adalah menyediakan akses mudah dan gratis untuk membaca manhwa berkualitas dalam bahasa Indonesia. 
              Kami percaya bahwa setiap orang berhak menikmati cerita-cerita menarik tanpa hambatan bahasa atau biaya.
            </p>
            <ul className="space-y-2 text-slate-300">
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-primary-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Menyediakan manhwa berkualitas tinggi dengan terjemahan bahasa Indonesia
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-primary-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Update chapter terbaru secara rutin dan tepat waktu
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-primary-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Memberikan pengalaman membaca yang nyaman dan user-friendly
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-primary-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Membangun komunitas pecinta manhwa di Indonesia
              </li>
            </ul>
          </div>

          {/* Fitur Unggulan */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl p-6 border border-slate-700/50">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              Fitur Unggulan
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-700/30 rounded-lg p-4">
                <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Pencarian Canggih
                </h3>
                <p className="text-slate-400 text-sm">
                  Cari manhwa berdasarkan judul, genre, status, dan berbagai filter lainnya
                </p>
              </div>
              <div className="bg-slate-700/30 rounded-lg p-4">
                <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  Bookmark
                </h3>
                <p className="text-slate-400 text-sm">
                  Simpan manhwa favorit Anda dan lanjutkan membaca kapan saja
                </p>
              </div>
              <div className="bg-slate-700/30 rounded-lg p-4">
                <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Mode Gelap
                </h3>
                <p className="text-slate-400 text-sm">
                  Baca dengan nyaman di malam hari dengan mode gelap otomatis
                </p>
              </div>
              <div className="bg-slate-700/30 rounded-lg p-4">
                <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Mobile Friendly
                </h3>
                <p className="text-slate-400 text-sm">
                  Tampilan responsif yang sempurna di semua perangkat
                </p>
              </div>
            </div>
          </div>

          {/* Kontak */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-6 text-center">
            <h2 className="text-2xl font-bold text-white mb-2">
              Ada Pertanyaan?
            </h2>
            <p className="text-primary-100 mb-4">
              Jangan ragu untuk menghubungi kami jika Anda memiliki pertanyaan atau saran
            </p>
            <a href="/kontak" className="inline-block px-6 py-3 bg-white text-primary-600 font-semibold rounded-lg hover:bg-primary-50 transition-all shadow-lg">
              Hubungi Kami
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
