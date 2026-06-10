export const PLACEHOLDER = '/images/placeholder.jpg'

const BACKEND_URL = 'https://lavender-flower.ru'

export function getImageUrl(imagePath) { 
  console.log('Оригинальный путь:', imagePath)
  if (!imagePath) return PLACEHOLDER
    // Если уже полный URL
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath
  console.log('Итоговый URL:', result)
     return result
  }
  
  // Убираем лишние слеши в начале
  let cleanPath = imagePath.replace(/^\/+/, '')
  
  // Просто имя файла (без папок)
  if (!cleanPath.includes('/')) {
    // Картинки лежат в storage/app/public/flowers/
    return `${BACKEND_URL}/storage/app/public/flowers/${cleanPath}`
  }
  
  // Если путь уже содержит папки, просто добавляем домен
  return `${BACKEND_URL}/${cleanPath}`
}

export function handleImageError(event) {
  const img = event?.target
  if (!img || img.src?.includes(PLACEHOLDER)) return
  img.onerror = null
  img.src = PLACEHOLDER
}
