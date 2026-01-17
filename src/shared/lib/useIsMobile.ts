import { useEffect, useState } from 'react'

const MOBILE_MEDIA_QUERY = 768

export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < MOBILE_MEDIA_QUERY)

  useEffect(() => {
    const mediaQueryList = window.matchMedia(`(max-width: ${String(MOBILE_MEDIA_QUERY - 1)}px)`)

    const handleChange = () => {
      setIsMobile(window.innerWidth < MOBILE_MEDIA_QUERY)
    }

    mediaQueryList.addEventListener('change', handleChange)

    return () => {
      mediaQueryList.removeEventListener('change', handleChange)
    }
  }, [])

  return isMobile
}
