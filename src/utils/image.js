export const PLACEHOLDER = '/images/placeholder.svg'

// Прямой URL бэкенда (без прокси через Vercel)
const BACKEND_URL = 'http://speshisq.beget.tech'

export function getImageUrl(imagePath) {
  if (!imagePath) return PLACEHOLDER

  // Если уже полный URL
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath
  }

  // Убираем лишние префиксы, если они есть
  let cleanPath = imagePath
    
  // Если путь начинается с /storage/app/public/ - убираем лишнюю часть
  if (cleanPath.includes('/storage/app/public/')) {
    cleanPath = cleanPath.replace('/storage/app/public/', '/storage/')
  }
  
  // Если путь начинается с app/public/ - исправляем
  if (cleanPath.startsWith('app/public/')) {
    cleanPath = cleanPath.replace('app/public/', 'storage/')
  }
  
  // Если путь начинается с /storage/ - оставляем как есть
  if (cleanPath.startsWith('/storage/')) {
    return `${BACKEND_URL}${cleanPath}`
  }

  // Для относительных путей (просто название файла)
  return `${BACKEND_URL}/storage/flowers/${cleanPath.replace(/^\//, '')}`
}

export function handleImageError(event) {
  const img = event?.target
  if (!img || img.src.endsWith(PLACEHOLDER)) return
  img.onerror = null
  img.src = PLACEHOLDER
}
