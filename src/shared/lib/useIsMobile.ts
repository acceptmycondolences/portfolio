import { useSyncExternalStore } from 'react'

const MOBILE_MEDIA_QUERY = '(width < 48rem)'

export function useIsMobile() {
  return useSyncExternalStore(subscribe, getSnapshot)
}

function getSnapshot() {
  return window.matchMedia(MOBILE_MEDIA_QUERY).matches
}

function subscribe(onStoreChange: () => void) {
  const mediaQueryList = window.matchMedia(MOBILE_MEDIA_QUERY)

  mediaQueryList.addEventListener('change', onStoreChange)

  return () => {
    mediaQueryList.removeEventListener('change', onStoreChange)
  }
}
