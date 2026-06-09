export const PLACEHOLDER = '/images/placeholder.svg'

// Прямой URL бэкенда (без прокси через Vercel)
const BACKEND_URL = 'http://speshisq.beget.tech'

export function getImageUrl(imagePath) {
  if (!imagePath) return PLACEHOLDER
  
  return `${BACKEND_URL}/storage/app/public/flowers/${cleanPath.replace(/^\//, '')}`
}

export function handleImageError(event) {
  const img = event?.target
  if (!img || img.src.endsWith(PLACEHOLDER)) return
  img.onerror = null
  img.src = PLACEHOLDER
}
