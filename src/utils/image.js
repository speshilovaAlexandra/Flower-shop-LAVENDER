export const PLACEHOLDER = '/images/placeholder.svg'

// Прямой URL бэкенда (без прокси через Vercel)
const BACKEND_URL = 'http://speshisq.beget.tech'

export function getImageUrl(imagePath) {
  if (!imagePath) return PLACEHOLDER

  // Если уже полный URL (включая http:// и https://)
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath
  }

  // Очищаем путь от лишних слешей в начале
  let cleanPath = imagePath.replace(/^\//, '')
  
  // Если путь уже содержит полную структуру storage/app/public/flowers/
  if (cleanPath.includes('storage/app/public/flowers/')) {
    return `${BACKEND_URL}/${cleanPath}`
  }
  
  // Если путь начинается с storage/ (но без app/public)
  if (cleanPath.startsWith('storage/')) {
    // Заменяем storage/ на storage/app/public/
    cleanPath = cleanPath.replace('storage/', 'storage/app/public/')
    return `${BACKEND_URL}/${cleanPath}`
  }
  
  // Если путь начинается с flowers/ или просто имя файла
  if (cleanPath.startsWith('flowers/') || !cleanPath.includes('/')) {
    return `${BACKEND_URL}/storage/app/public/${cleanPath}`
  }
  
  // Для любых других относительных путей
  return `${BACKEND_URL}/storage/app/public/flowers/${cleanPath}`
}

export function handleImageError(event) {
  const img = event?.target
  if (!img || img.src.endsWith(PLACEHOLDER)) return
  img.onerror = null
  img.src = PLACEHOLDER
}
