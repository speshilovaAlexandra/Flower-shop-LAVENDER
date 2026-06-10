export const PLACEHOLDER = '/images/placeholder.jpg'

export function getImageUrl(imagePath) {
  if (!imagePath) return PLACEHOLDER
  
  // Извлекаем имя файла из любого пути
  let filename = imagePath.split('/').pop()
  
  // Убираем параметры запроса, если есть
  filename = filename.split('?')[0]
  
  // Проверяем, что это действительно имя файла (с расширением)
  if (!filename.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
    return PLACEHOLDER
  }
  
  // Формируем правильный URL через API маршрут
  return `/api/storage/flowers/${filename}`
}

export function handleImageError(event) {
  const img = event?.target
  if (!img || img.src?.includes(PLACEHOLDER)) return
  img.onerror = null
  img.src = PLACEHOLDER
}
