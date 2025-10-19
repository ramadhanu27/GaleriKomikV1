'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const GENRES = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Romance',
  'Shounen', 'Seinen', 'Shoujo', 'Isekai', 'Martial Arts', 'Magic',
  'School life', 'Slice of Life', 'Supernatural', 'Historical',
  'Sci-fi', 'Horror', 'Mystery', 'Psychological', 'Tragedy',
  'Harem', 'Ecchi', 'Mature', 'Reincarnation', 'Cooking', 'Sports'
]

export default function GenrePage() {
  return (
    <div className="py-8">
      <div className="container-custom">
        <section className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            🎭 Genre Manhwa
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Pilih genre favoritmu untuk menemukan manhwa yang sesuai
          </p>
        </section>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {GENRES.map((genre) => (
            <Link
              key={genre}
              href={`/genre/${genre.toLowerCase().replace(/ /g, '-')}`}
              className="card p-6 text-center hover:scale-105 hover:shadow-xl transition-all group"
            >
              <h3 className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                {genre}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Lihat manhwa →
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
