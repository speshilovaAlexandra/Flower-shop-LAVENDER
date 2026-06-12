// src/utils/image.js

// 🔧 Константа с прямым URL до папки storage на Beget
// Замените на ваш реальный адрес
// ПРАВИЛЬНО — ведём на Beget
const STORAGE_URL = 'https://lavender-flower.ru';

// НЕПРАВИЛЬНО — ведём на Vercel (там файлов нет)
// const STORAGE_URL = 'https://flower-shop-lavender.vercel.app/storage';

export const getImageUrl = (path) => {
  if (!path) return '/images/placeholder.jpg';
  
  // Если уже полная ссылка
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // Убираем возможные префиксы
  let cleanPath = path;
  
  // Убираем /storage/ если уже есть
  if (cleanPath.startsWith('/storage/')) {
    cleanPath = cleanPath.replace('/storage/', '');
  }
  // Убираем storage/ без слэша
  if (cleanPath.startsWith('storage/')) {
    cleanPath = cleanPath.replace('storage/', '');
  }
  // Убираем flowers/ если есть (но оно нужно, так что оставляем структуру)
  
  // Убираем лишние слэши в начале
  cleanPath = cleanPath.replace(/^\/+/, '');
  
  // Возвращаем полный URL
  return `${STORAGE_URL}/${cleanPath}`;
};

export const handleImageError = (e) => {
  e.target.src = '/images/placeholder.jpg';
};
