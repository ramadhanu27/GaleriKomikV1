'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

interface SEOHeadProps {
  structuredData?: any
  breadcrumbs?: any
}

export default function SEOHead({ structuredData, breadcrumbs }: SEOHeadProps) {
  const pathname = usePathname()

  useEffect(() => {
    // Add structured data to page
    if (structuredData) {
      const script = document.createElement('script')
      script.type = 'application/ld+json'
      script.text = JSON.stringify(structuredData)
      script.id = 'structured-data'
      
      // Remove old script if exists
      const oldScript = document.getElementById('structured-data')
      if (oldScript) {
        oldScript.remove()
      }
      
      document.head.appendChild(script)

      return () => {
        script.remove()
      }
    }
  }, [structuredData])

  useEffect(() => {
    // Add breadcrumb structured data
    if (breadcrumbs) {
      const script = document.createElement('script')
      script.type = 'application/ld+json'
      script.text = JSON.stringify(breadcrumbs)
      script.id = 'breadcrumb-data'
      
      // Remove old script if exists
      const oldScript = document.getElementById('breadcrumb-data')
      if (oldScript) {
        oldScript.remove()
      }
      
      document.head.appendChild(script)

      return () => {
        script.remove()
      }
    }
  }, [breadcrumbs])

  useEffect(() => {
    // Add organization structured data (only on homepage)
    if (pathname === '/') {
      const orgData = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Arkomik',
        url: 'https://www.galerikomik.cyou',
        logo: 'https://www.galerikomik.cyou/logo.png',
        description: 'Platform terbaik untuk membaca manhwa bahasa Indonesia',
        sameAs: [
          // Add social media links here
        ]
      }

      const script = document.createElement('script')
      script.type = 'application/ld+json'
      script.text = JSON.stringify(orgData)
      script.id = 'organization-data'
      
      document.head.appendChild(script)

      return () => {
        script.remove()
      }
    }
  }, [pathname])

  return null
}
