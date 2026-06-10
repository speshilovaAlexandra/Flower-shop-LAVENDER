export const PLACEHOLDER = '/images/placeholder.jpg'
const BACKEND_URL = 'https://lavender-flower.ru'

export function getImageUrl(imagePath) {
  if (!imagePath) return PLACEHOLDER
  
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    // Если путь уже полный, но ведет в неверное место — исправляем
    if (imagePath.includes('/storage/flowers/') && !imagePath.includes('/storage/app/public/')) {
      const fileName = imagePath.split('/').pop()
      return `${BACKEND_URL}/storage/app/public/flowers/${fileName}`
    }
    return imagePath
  }
  
  const cleanPath = imagePath.replace(/^\/+/, '')
  const fileName = cleanPath.split('/').pop()
  return `${BACKEND_URL}/storage/app/public/flowers/${fileName}`
}

export function handleImageError(event) {
  const img = event?.target
  if (!img || img.src?.includes(PLACEHOLDER)) return
  img.onerror = null
  img.src = PLACEHOLDER
}
