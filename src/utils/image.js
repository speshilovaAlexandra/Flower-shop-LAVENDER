const PLACEHOLDER = '/images/placeholder.svg'

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
