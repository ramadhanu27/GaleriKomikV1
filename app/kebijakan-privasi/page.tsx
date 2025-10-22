export default function KebijakanPrivasiPage() {
  return (
    <div className="py-8">
      <div className="container-custom max-w-4xl">
        {/* Header */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 mb-8 border border-slate-700/50">
          <h1 className="text-4xl font-bold text-white mb-3 flex items-center gap-3">
            <svg className="w-10 h-10 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Kebijakan Privasi
          </h1>
          <p className="text-slate-300">
            Terakhir diperbarui: 22 Oktober 2025
          </p>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Pendahuluan */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl p-6 border border-slate-700/50">
            <h2 className="text-2xl font-bold text-white mb-4">Pendahuluan</h2>
            <p className="text-slate-300 leading-relaxed">
              Arkomik menghargai privasi Anda dan berkomitmen untuk melindungi data pribadi Anda. 
              Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi 
              informasi Anda saat menggunakan layanan kami.
            </p>
          </div>

          {/* Informasi yang Dikumpulkan */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl p-6 border border-slate-700/50">
            <h2 className="text-2xl font-bold text-white mb-4">Informasi yang Kami Kumpulkan</h2>
            <div className="space-y-4 text-slate-300">
              <div>
                <h3 className="font-bold text-white mb-2">1. Informasi yang Anda Berikan</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Data bookmark dan preferensi membaca</li>
                  <li>Riwayat pencarian dan aktivitas browsing</li>
                  <li>Feedback dan komunikasi dengan kami</li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-white mb-2">2. Informasi yang Dikumpulkan Otomatis</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Alamat IP dan lokasi geografis</li>
                  <li>Jenis perangkat dan browser yang digunakan</li>
                  <li>Halaman yang dikunjungi dan waktu akses</li>
                  <li>Cookie dan teknologi pelacakan serupa</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Penggunaan Informasi */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl p-6 border border-slate-700/50">
            <h2 className="text-2xl font-bold text-white mb-4">Penggunaan Informasi</h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              Kami menggunakan informasi yang dikumpulkan untuk:
            </p>
            <ul className="space-y-2 text-slate-300">
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-primary-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Menyediakan dan meningkatkan layanan kami
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-primary-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Personalisasi pengalaman pengguna
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-primary-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Menganalisis penggunaan dan tren
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-primary-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Mengirim notifikasi tentang update dan fitur baru
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-primary-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Mencegah penyalahgunaan dan aktivitas ilegal
              </li>
            </ul>
          </div>

          {/* Cookies */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl p-6 border border-slate-700/50">
            <h2 className="text-2xl font-bold text-white mb-4">Cookies dan Teknologi Pelacakan</h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              Kami menggunakan cookies dan teknologi serupa untuk:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4 text-slate-300">
              <li>Mengingat preferensi dan pengaturan Anda</li>
              <li>Menyimpan bookmark dan riwayat baca</li>
              <li>Menganalisis traffic dan penggunaan website</li>
              <li>Meningkatkan keamanan dan performa</li>
            </ul>
            <p className="text-slate-300 leading-relaxed mt-4">
              Anda dapat mengatur browser Anda untuk menolak cookies, namun beberapa fitur mungkin tidak berfungsi dengan baik.
            </p>
          </div>

          {/* Keamanan Data */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl p-6 border border-slate-700/50">
            <h2 className="text-2xl font-bold text-white mb-4">Keamanan Data</h2>
            <p className="text-slate-300 leading-relaxed">
              Kami menerapkan langkah-langkah keamanan teknis dan organisasi yang sesuai untuk melindungi 
              data pribadi Anda dari akses, penggunaan, atau pengungkapan yang tidak sah. Namun, tidak ada 
              metode transmisi melalui internet yang 100% aman, dan kami tidak dapat menjamin keamanan absolut.
            </p>
          </div>

          {/* Hak Pengguna */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl p-6 border border-slate-700/50">
            <h2 className="text-2xl font-bold text-white mb-4">Hak Anda</h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              Anda memiliki hak untuk:
            </p>
            <ul className="space-y-2 text-slate-300">
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-primary-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Mengakses dan memperbarui data pribadi Anda
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-primary-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Menghapus data yang kami simpan
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-primary-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Menolak penggunaan data untuk tujuan tertentu
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-primary-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Mengajukan keluhan kepada otoritas perlindungan data
              </li>
            </ul>
          </div>

          {/* Perubahan Kebijakan */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl p-6 border border-slate-700/50">
            <h2 className="text-2xl font-bold text-white mb-4">Perubahan Kebijakan</h2>
            <p className="text-slate-300 leading-relaxed">
              Kami dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu. Perubahan akan diposting di 
              halaman ini dengan tanggal "Terakhir diperbarui" yang baru. Kami mendorong Anda untuk meninjau 
              kebijakan ini secara berkala.
            </p>
          </div>

          {/* Kontak */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-6 text-center">
            <h2 className="text-2xl font-bold text-white mb-2">
              Pertanyaan tentang Privasi?
            </h2>
            <p className="text-primary-100 mb-4">
              Jika Anda memiliki pertanyaan tentang kebijakan privasi kami, silakan hubungi kami
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
