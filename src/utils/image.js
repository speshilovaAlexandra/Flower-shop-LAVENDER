export const PLACEHOLDER = '/images/placeholder.svg'

export function getImageUrl(imagePath) {
  if (!imagePath) return PLACEHOLDER

  // Полный URL — извлекаем путь /storage/... для прокси/rewrite
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    const match = imagePath.match(/\/storage\/.+$/)
    return match ? match[0] : imagePath
  }

  if (imagePath.startsWith('/storage/')) return imagePath

  // Относительный путь из БД (например flowers/abc.jpg)
  return `/storage/${imagePath.replace(/^\//, '')}`
}

/** Подставляет заглушку, если картинка не загрузилась */
export function handleImageError(event) {
  const img = event?.target
  if (!img || img.src.endsWith(PLACEHOLDER)) return
  img.onerror = null
  img.src = PLACEHOLDER
}
