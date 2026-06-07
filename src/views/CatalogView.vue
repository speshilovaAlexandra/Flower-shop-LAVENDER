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
           :src="getImageUrl(flower)" 
           :alt="flower.nazvanie"
           class="card-img"
           :class="{ loaded: imageLoaded[flower.id] }"
           loading="lazy"
           @load="onImageLoad(flower.id)"
           @error="onImageError(flower.id)"
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
const flowers = ref([]);
const loading = ref(true);
const error = ref(null);
const imageLoaded = ref({}); // 🆕 Отслеживаем загрузку картинок
const authStore = useAuthStore();
const toast = useToastStore();
const filters = ref({ search: '', minPrice: '', maxPrice: '', sort: 'id-desc' });

const getBaseUrl = () => api.defaults.baseURL.replace('/api', '');

// 🆕 Универсальный метод получения URL
const getImageUrl = (flower) => {
  if (!flower) return '/images/placeholder.jpg';
  
  // Если уже полная ссылка
  if (flower.image_url && (flower.image_url.startsWith('http://') || flower.image_url.startsWith('https://'))) {
    return flower.image_url;
  }
  
  // Если путь к изображению
  if (flower.img) {
    const clean = flower.img.replace(/^\//, '');
    return `${getBaseUrl()}/storage/${clean}`;
  }
  
  // Если есть image_url из модели
  if (flower.image_url) {
    return flower.image_url;
  }
  
  return '/images/placeholder.jpg';
};

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
/* 🆕 Стили для заглушки */
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

/* Остальные ваши стили остаются без изменений */
:root {
  --primary: #481C69;
  --primary-light: #6d3a96;
  --bg-body: #f9fafb;
  --bg-card: #fff;
  --text-main: #1f2937;
  --text-muted: #6b7280;
  --border: #e5e7eb;
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
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
  margin: -20px;
  gap: 40px;
  align-items: center;
  justify-content: center;
  flex-direction: row;
}

.product-card {
  margin: 20px;
  width: calc(25% - 40px);
  background: var(--bg-card);
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(0, 0, 0, 0.03);
  height: 370px;
  width: 260px;
}

.product-card:hover {
  transform: translateY(-8px);
  box-shadow: var(--shadow-lg);
}

.card-image-wrapper {
  object-fit: cover;
  position: relative;
  width: 300px;
  height: 300px;
  padding-top: 100%;
  background: #f3f4f6;
  overflow: hidden;
}

.card-details {
  padding: 24px;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.product-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-main);
  margin: 0 0 16px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-footer {
  margin-top: auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.product-price {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary);
}

.btn-text-cart {
  background: none;
  border: 1px solid var(--border);
  color: var(--text-main);
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  padding: 8px 16px;
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

@media (max-width: 991px) {
  .catalog-page { padding: 40px 30px; }
  .page-title { font-size: 2.5rem; }
  .product-grid { gap: 30px; margin: -15px; }
  .product-card { width: calc(33.333% - 30px); flex: 1 0 240px; margin: 15px; }
}

@media (max-width: 767px) {
  .catalog-page { padding: 30px 20px; }
  .page-title { font-size: 2rem; }
  .product-grid { gap: 15px; margin: -10px; }
  .product-card { width: calc(50% - 20px); flex: 1 0 45%; margin: 10px; }
}

@media (max-width: 479px) {
  .catalog-page { padding: 20px 15px; }
  .page-title { font-size: 1.75rem; }
  .filters { justify-content: center; overflow-x: auto; width: 100%; padding-bottom: 10px; -ms-overflow-style: none; scrollbar-width: none; }
  .filters::-webkit-scrollbar { display: none; }
  .filter-btn { white-space: nowrap; flex-shrink: 0; }
  .product-grid { display: flex; gap: 20px; margin: -10px; height: 100%; width: 100%; flex-direction: row; align-items: center; align-content: center; flex-wrap: wrap; }
  .product-card { width: calc(50% - 20px); margin: 10px; }
  .product-footer { display: flex; flex-direction: column; align-items: center; }
}
</style>