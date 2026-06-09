export const PLACEHOLDER = '/images/placeholder.svg'

// Прямой URL бэкенда (без прокси через Vercel)
const BACKEND_URL = 'http://speshisq.beget.tech'

export function getImageUrl(imagePath) {
  if (!imagePath) return PLACEHOLDER

  // Если уже полный URL
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return `${BACKEND_URL}/storage/app/flowers/${cleanPath.replace(/^\//, '')}`
  }

  // Убираем лишние префиксы, если они есть
  let cleanPath = `${BACKEND_URL}/storage/app/flowers/${cleanPath.replace(/^\//, '')}`
 
  // Для относительных путей (просто название файла)
  return `${BACKEND_URL}/storage/app/flowers/${cleanPath.replace(/^\//, '')}`
}

export function handleImageError(event) {
  const img = event?.target
  if (!img || img.src.endsWith(PLACEHOLDER)) return
  img.onerror = null
  img.src = PLACEHOLDER
}
