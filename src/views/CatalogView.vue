<template>
 <div class="catalog-page">
 <div class="container">
 <header class="catalog-header">
 <div class="header-content">
 <h1 class="page-title">Каталог букетов</h1>
 </div>
 <div class="filters">
   <input v-model="filters.search" placeholder="Поиск по названию..." class="filter-input" @keyup.enter="applyFilters" />
   <input v-model.number="filters.minPrice" type="number" placeholder="Цена от" class="filter-input num" min="0" />
   <input v-model.number="filters.maxPrice" type="number" placeholder="Цена до" class="filter-input num" min="0" />
   <select v-model="filters.sort" class="filter-input select">
     <option value="id-desc">По умолчанию</option>
     <option value="price-asc">Сначала дешёвые</option>
     <option value="price-desc">Сначала дорогие</option>
     <option value="quantity-desc">Больше всего в наличии</option>
   </select>
   <button @click="applyFilters" class="filter-btn active">Найти</button>
 </div>
 </header>

 <div v-if="loading" class="state-container"><div class="spinner"></div><p>Загрузка коллекции...</p></div>
 <div v-else-if="error" class="state-container error-state"><span class="icon-error">⚠️</span><p>{{ error }}</p><button @click="onMounted" class="btn-retry">Попробовать снова</button></div>
 <div v-else-if="flowers.length === 0" class="state-container"><span class="icon-empty">🌸</span><p>Товары пока не найдены</p></div>
 <div v-else class="product-grid">
   <div v-for="flower in flowers" :key="flower.id" class="product-card">
     <div class="card-image-wrapper">
       <picture>
         <!-- 🆕 Заглушка -->
         <div v-if="!imageLoaded[flower.id]" class="image-placeholder">
           <svg class="placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
             <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
             <circle cx="8.5" cy="8.5" r="1.5"></circle>
             <polyline points="21 15 16 10 5 21"></polyline>
           </svg>
         </div>
         <!-- 🆕 Основная картинка -->
         <img 
           :src="getImageUrl(flower.image_url || flower.img)"
           :alt="flower.nazvanie"
           class="card-img"
           :class="{ loaded: imageLoaded[flower.id] }"
           loading="lazy"
           @load="onImageLoad(flower.id)"
           @error="(e) => { handleImageError(e); onImageError(flower.id); }"
           @click="$router.push('/product/' + flower.id)"
         >
       </picture>
     </div>
     <div class="card-details">
       <h3 class="product-name">{{ flower.nazvanie }}</h3>
       <div class="product-footer">
         <span class="product-price">{{ formatPrice(flower.price) }}</span>
         <button class="btn-text-cart" @click="addToCart(flower)">В корзину</button>
       </div>
     </div>
   </div>
 </div>
 </div>
</div>
</template>
<script setup>
import { ref, onMounted } from 'vue';
import api from '@/api';
import { useAuthStore } from '@/stores/auth';
import { useToastStore } from '@/stores/toast';

import { useCart } from '@/composables/useCart';
import { getImageUrl, handleImageError } from '@/utils/image';
const flowers = ref([]);
const loading = ref(true);
const error = ref(null);
const imageLoaded = ref({}); // 🆕 Отслеживаем загрузку картинок
const authStore = useAuthStore();
const toast = useToastStore();
const filters = ref({ search: '', minPrice: '', maxPrice: '', sort: 'id-desc' });

//const getBaseUrl = () => api.defaults.baseURL.replace('https://lavender-flower.ru', '');

// // 🆕 Универсальный метод получения URL
// const getImageUrl = (flower) => {
//   if (!flower) return '/images/placeholder.jpg';
  
//   // Если уже полная ссылка
//   if (flower.image_url && (flower.image_url.startsWith('http://') || flower.image_url.startsWith('https://'))) {
//     return flower.image_url;
//   }
  
//   // Если путь к изображению
//   if (flower.img) {
//     const clean = flower.img.replace(/^\//, '');
//     return `${getBaseUrl()}/storage/${clean}`;
//   }
  
//   // Если есть image_url из модели
//   if (flower.image_url) {
//     return flower.image_url;
//   }
  
//   return '/images/placeholder.jpg';
// };

// 🆕 Обработка успешной загрузки
const onImageLoad = (id) => {
  imageLoaded.value[id] = true;
};

// 🆕 Обработка ошибки загрузки
const onImageError = (id) => {
  imageLoaded.value[id] = true; // Показываем заглушку
};

const fetchFlowers = async () => {
  try { 
    loading.value = true;
    const params = new URLSearchParams();
    if (filters.value.search) params.append('search', filters.value.search);
    if (filters.value.minPrice) params.append('min_price', filters.value.minPrice);
    if (filters.value.maxPrice) params.append('max_price', filters.value.maxPrice);
    const [sort, order] = filters.value.sort.split('-');
    params.append('sort', sort); 
    params.append('order', order);
    const res = await api.get(`/flowers?${params.toString()}`);
    flowers.value = Array.isArray(res.data) ? res.data : [];
    // Сбрасываем статусы загрузки
    imageLoaded.value = {};
  } catch (e) { 
    error.value = 'Не удалось загрузить товары'; 
    toast.error(error.value);
    console.error(e); 
  } finally { 
    loading.value = false; 
  }
};

const applyFilters = () => fetchFlowers();
const formatPrice = (price) => new Intl.NumberFormat('ru-RU').format(price) + ' ₽';

// ... внутри setup ...
const { cart, bouquetIds, saveLocal } = useCart();

const addToCart = (flower) => {
  // ✅ Проверка авторизации
  if (!authStore.isAuthenticated) {
    toast.warning('Войдите в аккаунт, чтобы добавить товар в корзину');
    router.push('/login');
    return;
  }
  
  const activeId = bouquetIds.value.length > 0 ? bouquetIds.value[bouquetIds.value.length - 1] : 1;
  const existing = cart.value.find(i => i.id === flower.id && i.bouquet_id === activeId);
  if (existing) {
    existing.qty++;
  } else {
    cart.value.push({ ...flower, qty: 1, bouquet_id: activeId });
  }
  saveLocal();
  toast.success('Товар добавлен в корзину');
};

onMounted(fetchFlowers);

const seo = {
  title: 'Каталог цветов — купить букеты недорого в Перми | LAVENDER',
  description: 'Большой выбор свежих цветов и букетов в Перми. Розы, тюльпаны, хризантемы и другие цветы с доставкой. Низкие цены, акции и скидки!'
};
</script>
<style scoped>
:root {
  --primary: #481C69;
  --primary-light: #6d3a96;
  --bg-body: #f9fafb;
  --bg-card: #fff;
  --text-main: #1f2937;
  --text-muted: #6b7280;
  --border: #e5e7eb;
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  --radius: 12px;
}

.catalog-page {
  background-color: var(--bg-body);
  min-height: 100vh;
  width: 100%;
  max-width: 1920px;
  margin: 0 auto;
  padding: 60px 40px;
  font-family: 'Inter', system-ui, sans-serif;
  box-sizing: border-box;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.catalog-header {
  text-align: center;
  margin-bottom: 60px;
  display: flex;
  justify-content: center;
  flex-direction: column;
  align-items: center;
}

.page-title {
  font-size: 3rem;
  color: var(--primary);
  margin: 0 0 15px;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.filters { 
  display: flex; 
  justify-content: center; 
  gap: 12px; 
  flex-wrap: wrap; 
  margin-bottom: 40px; 
}

.filter-input { 
  padding: 10px 14px; 
  border: 1px solid var(--border); 
  border-radius: 8px; 
  font-size: 0.95rem; 
  outline: none; 
  transition: border 0.2s; 
}

.filter-input:focus { 
  border-color: var(--primary); 
  box-shadow: 0 0 0 3px rgba(72,28,105, 0.1); 
}

.filter-input.num { width: 110px; }
.filter-input.select { min-width: 160px; }

.filter-btn { 
  background: var(--primary); 
  color: white; 
  border: none; 
  padding: 10px 20px; 
  border-radius: 8px; 
  cursor: pointer; 
  font-weight: 600; 
}

.filter-btn.active {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
  box-shadow: 0 4px 10px rgba(72, 28, 105, 0.3);
}

.product-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 40px;
  align-items: stretch;
  justify-content: center;
}

.product-card {
  width: calc(25% - 30px);
  min-width: 240px;
  max-width: 280px;
  background: var(--bg-card);
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(0, 0, 0, 0.03);
  cursor: pointer;
}

.product-card:hover {
  transform: translateY(-8px);
  box-shadow: var(--shadow-lg);
}

.card-image-wrapper {
  position: relative;
  width: 100%;
  padding-top: 100%;
  background: #f3f4f6;
  overflow: hidden;
}

.image-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
  transition: opacity 0.3s ease;
}

.placeholder-icon {
  width: 48px;
  height: 48px;
  color: #9ca3af;
  opacity: 0.6;
}

.card-img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 0.3s ease, transform 0.5s ease;
  cursor: pointer;
  z-index: 2;
}

.card-img.loaded {
  opacity: 1;
}

.product-card:hover .card-img.loaded {
  transform: scale(1.05);
}

.card-details {
  padding: 20px;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.product-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-main);
  margin: 0 0 12px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 48px;
}

.product-footer {
  margin-top: auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.product-price {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--primary);
}

.btn-text-cart {
  background: none;
  border: 1px solid var(--border);
  color: var(--text-main);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  padding: 8px 14px;
  border-radius: 8px;
  transition: all 0.2s;
}

.btn-text-cart:hover {
  color: var(--primary);
  border-color: var(--primary);
  background: #f3f0f7;
}

.state-container {
  text-align: center;
  padding: 100px 20px;
  color: var(--text-muted);
}

.spinner {
  width: 50px;
  height: 50px;
  border: 5px solid #f3f3f3;
  border-top: 5px solid var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.icon-error,
.icon-empty {
  font-size: 4rem;
  display: block;
  margin-bottom: 20px;
}

.btn-retry {
  margin-top: 20px;
  padding: 12px 30px;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
}

/* ========================================= */
/* АДАПТИВНЫЕ СТИЛИ ДЛЯ ТЕЛЕФОНОВ */
/* ========================================= */

/* Планшеты (до 1024px) */
@media (max-width: 1024px) {
  .product-card {
    width: calc(33.333% - 27px);
    min-width: 220px;
  }
}

/* Планшеты вертикально (до 768px) */
@media (max-width: 768px) {
  .catalog-page {
    padding: 40px 20px;
  }

  .page-title {
    font-size: 2rem;
    margin-bottom: 25px;
  }

  .filters {
    gap: 10px;
    margin-bottom: 30px;
    justify-content: center;
  }

  .filter-input {
    padding: 8px 12px;
    font-size: 0.9rem;
  }

  .filter-input.num {
    width: 95px;
  }

  .filter-input.select {
    min-width: 140px;
  }

  .filter-btn {
    padding: 8px 18px;
  }

  .product-grid {
    gap: 20px;
  }

  .product-card {
    width: calc(50% - 10px);
    min-width: 160px;
    max-width: none;
  }

  .card-details {
    padding: 15px;
  }

  .product-name {
    font-size: 1rem;
    min-height: 42px;
    margin-bottom: 10px;
  }

  .product-price {
    font-size: 1.2rem;
  }

  .btn-text-cart {
    padding: 6px 12px;
    font-size: 0.8rem;
  }
}

/* Мобильные телефоны (до 576px) */
@media (max-width: 576px) {
  .catalog-page {
    padding: 30px 15px;
  }

  .page-title {
    font-size: 1.6rem;
    margin-bottom: 20px;
  }

  .filters {
    flex-wrap: nowrap;
    overflow-x: auto;
    justify-content: flex-start;
    gap: 8px;
    padding-bottom: 12px;
    margin-bottom: 25px;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: thin;
  }

  .filters::-webkit-scrollbar {
    height: 3px;
  }

  .filters::-webkit-scrollbar-track {
    background: var(--border);
    border-radius: 10px;
  }

  .filters::-webkit-scrollbar-thumb {
    background: var(--primary);
    border-radius: 10px;
  }

  .filter-input {
    white-space: nowrap;
    flex-shrink: 0;
    padding: 8px 12px;
    font-size: 0.85rem;
  }

  .filter-input.num {
    width: 85px;
  }

  .filter-input.select {
    min-width: 130px;
  }

  .filter-btn {
    padding: 8px 16px;
    font-size: 0.85rem;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .product-grid {
    gap: 15px;
  }

  .product-card {
    width: calc(50% - 7.5px);
    min-width: 140px;
    border-radius: 10px;
  }

  .card-details {
    padding: 12px;
  }

  .product-name {
    font-size: 0.9rem;
    min-height: 38px;
    margin-bottom: 8px;
    -webkit-line-clamp: 2;
  }

  .product-footer {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .product-price {
    font-size: 1.1rem;
    text-align: center;
  }

  .btn-text-cart {
    width: 100%;
    text-align: center;
    padding: 8px;
    font-size: 0.8rem;
  }
}

/* ========================================= */
/* УЛУЧШЕННЫЙ АДАПТИВ ДЛЯ МАЛЕНЬКИХ ТЕЛЕФОНОВ */
/* ========================================= */

/* Очень маленькие телефоны (до 400px) */
@media (max-width: 400px) {
  .catalog-page {
    padding: 20px 12px;
  }

  .catalog-header {
    margin-bottom: 30px;
  }

  .page-title {
    font-size: 1.4rem;
    margin-bottom: 18px;
    line-height: 1.2;
  }

  /* Фильтры - вертикальная компоновка для удобства */
  .filters {
    flex-direction: column;
    gap: 10px;
    margin-bottom: 20px;
    overflow-x: visible;
    padding-bottom: 0;
  }

  .filter-input {
    width: 100%;
    padding: 12px 14px;
    font-size: 0.9rem;
    min-width: auto;
  }

  .filter-input.num {
    width: 100%;
  }

  .filter-input.select {
    width: 100%;
    min-width: auto;
  }

  .filter-btn {
    width: 100%;
    padding: 12px 20px;
    font-size: 0.9rem;
  }

  /* Сетка товаров - одна колонка для лучшей читаемости */
  .product-grid {
    gap: 16px;
    flex-direction: column;
    align-items: center;
  }

  .product-card {
    width: 100%;
    max-width: 340px;
    min-width: auto;
    border-radius: 12px;
  }

  .card-details {
    padding: 16px;
  }

  .product-name {
    font-size: 1rem;
    min-height: 44px;
    margin-bottom: 12px;
    line-height: 1.4;
  }

  .product-footer {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }

  .product-price {
    font-size: 1.25rem;
    text-align: left;
  }

  .btn-text-cart {
    width: auto;
    padding: 10px 16px;
    font-size: 0.85rem;
    min-height: 44px; /* Минимальный размер для тач-интерфейса */
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .placeholder-icon {
    width: 40px;
    height: 40px;
  }

  /* Улучшенные состояния загрузки */
  .state-container {
    padding: 60px 15px;
  }

  .icon-error,
  .icon-empty {
    font-size: 3rem;
  }

  .btn-retry {
    padding: 12px 24px;
    font-size: 0.95rem;
    min-height: 44px;
  }
}

/* Экстра маленькие телефоны (до 360px) */
@media (max-width: 360px) {
  .catalog-page {
    padding: 15px 10px;
  }

  .page-title {
    font-size: 1.3rem;
    margin-bottom: 15px;
  }

  .filters {
    gap: 8px;
    margin-bottom: 18px;
  }

  .filter-input {
    padding: 10px 12px;
    font-size: 0.85rem;
  }

  .filter-btn {
    padding: 10px 16px;
    font-size: 0.85rem;
  }

  .product-grid {
    gap: 12px;
  }

  .product-card {
    max-width: 100%;
  }

  .card-details {
    padding: 14px;
  }

  .product-name {
    font-size: 0.95rem;
    min-height: 40px;
    margin-bottom: 10px;
  }

  .product-price {
    font-size: 1.15rem;
  }

  .btn-text-cart {
    padding: 9px 14px;
    font-size: 0.8rem;
  }

  .placeholder-icon {
    width: 36px;
    height: 36px;
  }
}

/* Дополнительные улучшения для тач-устройств */
@media (hover: none) and (pointer: coarse) {
  .product-card:hover {
    transform: none; /* Отключаем hover-эффект на тач-устройствах */
  }

  .btn-text-cart {
    min-height: 44px; /* Apple рекомендует минимум 44px для тач-целей */
  }

  .filter-btn,
  .btn-retry {
    min-height: 44px;
  }
}

/* Оптимизация для landscape ориентации на маленьких экранах */
@media (max-height: 500px) and (orientation: landscape) {
  .catalog-page {
    padding: 15px 20px;
  }

  .catalog-header {
    margin-bottom: 20px;
  }

  .page-title {
    font-size: 1.5rem;
    margin-bottom: 10px;
  }

  .state-container {
    padding: 40px 20px;
  }
}
</style>
