// src/utils/image.js
export function getImageUrl(imagePath) {
  if (!imagePath) return '/images/placeholder.jpg'

  // Если уже относительный путь, начинающийся с /storage/ – оставляем как есть
  if (imagePath.startsWith('/storage/')) return imagePath

  // Если полный URL с доменом – обрезаем до /storage/...
  if (imagePath.includes('speshisq.beget.tech/storage/')) {
    const match = imagePath.match(/\/storage\/.+$/)
    if (match) return match[0]  // возвращаем '/storage/flowers/...'
    return '/images/placeholder.jpg'
  }

  // Если просто имя файла (как хранится в БД) – добавляем /storage/
  if (imagePath && !imagePath.startsWith('http')) {
    return `/storage/${imagePath.replace(/^\//, '')}`
  }

  return '/images/placeholder.jpg'
}