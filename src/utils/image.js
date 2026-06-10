export const PLACEHOLDER = '/image/placeholder.jpg'

// Прямой URL бэкенда
const BACKEND_URL = 'https://lavender-flower.ru'

export function getImageUrl(imagePath) {
  if (!imagePath) return PLACEHOLDER

  // Если уже полный URL
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath
  }

  // Очищаем путь от лишних слешей в начале
  let cleanPath = imagePath.replace(/^\//, '')
  
  // Если путь уже содержит полную структуру storage/app/public/flowers/
  if (cleanPath.includes('storage/app/public/flowers/')) {
    return `${BACKEND_URL}/${cleanPath}`
  }
  // ✅ ПРАВИЛЬНО: после php artisan storage:link
return `${BACKEND_URL}/storage/flowers/${cleanPath}`
// или если у вас структура другая:
return `${BACKEND_URL}/storage/${cleanPath}`
  // Формируем правильный URL для Beget
  // Beget ожидает: http://site.ru/storage/app/public/flowers/имя_файла
  // return `${BACKEND_URL}/storage/app/public/flowers/${cleanPath}`
}


export function handleImageError(event) {
  const img = event?.target
  if (!img || img.src.endsWith(PLACEHOLDER)) return
  img.onerror = null
  img.src = PLACEHOLDER
}
