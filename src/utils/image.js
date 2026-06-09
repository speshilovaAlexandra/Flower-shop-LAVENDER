export const PLACEHOLDER = '/images/placeholder.svg'

// Прямой URL бэкенда (без прокси через Vercel)
const BACKEND_URL = 'http://speshisq.beget.tech'

export function getImageUrl(imagePath) {
  if (!imagePath) return PLACEHOLDER

  // Если уже полный URL
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath
  }

  // Если путь начинается с /storage/, добавляем бэкенд
  if (imagePath.startsWith('/storage/')) {
    return `${BACKEND_URL}${imagePath}`
  }

  // Относительный путь
  return `${BACKEND_URL}/storage/${imagePath.replace(/^\//, '')}`
}

export function handleImageError(event) {
  const img = event?.target
  if (!img || img.src.endsWith(PLACEHOLDER)) return
  img.onerror = null
  img.src = PLACEHOLDER
}
