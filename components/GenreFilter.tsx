'use client'

import { useState } from 'react'

interface GenreFilterProps {
  onFilterChange: (genres: string[]) => void
}

const POPULAR_GENRES = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy',
  'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Slice of Life',
  'Sports', 'Supernatural', 'Thriller', 'Tragedy'
]

export default function GenreFilter({ onFilterChange }: GenreFilterProps) {
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [isOpen, setIsOpen] = useState(false)

  const toggleGenre = (genre: string) => {
    let newGenres: string[]
    
    if (selectedGenres.includes(genre)) {
      newGenres = selectedGenres.filter(g => g !== genre)
    } else {
      newGenres = [...selectedGenres, genre]
    }
    
    setSelectedGenres(newGenres)
    onFilterChange(newGenres)
  }

  const clearFilters = () => {
    setSelectedGenres([])
    onFilterChange([])
  }

  return (
    <div className="relative">
      {/* Filter Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-white rounded-lg transition-all border border-slate-600"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        Filter by Genre
        {selectedGenres.length > 0 && (
          <span className="px-2 py-0.5 bg-primary-600 text-white text-xs rounded-full">
            {selectedGenres.length}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          ></div>

          {/* Dropdown Content */}
          <div className="absolute top-full left-0 mt-2 w-80 bg-slate-800 rounded-lg border border-slate-700 shadow-xl z-50 p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Select Genres</h3>
              {selectedGenres.length > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-primary-400 hover:text-primary-300"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Genre Grid */}
            <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto">
              {POPULAR_GENRES.map(genre => (
                <button
                  key={genre}
                  onClick={() => toggleGenre(genre)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedGenres.includes(genre)
                      ? 'bg-primary-600 text-white'
                      : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>

            {/* Selected Count */}
            <div className="mt-4 pt-4 border-t border-slate-700">
              <p className="text-sm text-slate-400">
                {selectedGenres.length === 0 
                  ? 'No genres selected' 
                  : `${selectedGenres.length} genre${selectedGenres.length > 1 ? 's' : ''} selected`
                }
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
