<template>
  <div class="home-page">
    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-content">
        <h1>LAVENDER</h1>
        <p>Цветы, которые говорят о ваших чувствах</p>
        <router-link to="/catalog" class="btn-primary">
          Перейти в каталог
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </router-link>
      </div>
    </section>

    <!-- Flowers Section -->
    <section class="section">
      <h2>Популярные букеты</h2>
      <div class="products-grid">
        <div v-for="flower in flowers" :key="flower.id" class="product-card" @click="$router.push('/product/' + flower.id)">
          <div class="product-image">
            <img :src="getImageUrl(flower.image_url || flower.img)" :alt="flower.nazvanie" loading="lazy" @error="handleImageError">
          </div>
          <h3>{{ flower.nazvanie }}</h3>
          <p class="price">{{ formatPrice(flower.price) }}</p>
        </div>
      </div>
      <router-link to="/catalog" class="btn-secondary">Смотреть все цветы</router-link>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '@/api';
import { getImageUrl, handleImageError } from '@/utils/image';

const flowers = ref([]);

const formatPrice = (price) => new Intl.NumberFormat('ru-RU').format(price) + ' ₽';

onMounted(async () => {
  try {
    const { data } = await api.get('/home');
    flowers.value = data.flowers;
  } catch (e) {
    console.error('Ошибка загрузки главной:', e);
  }
});
</script>

<style scoped>
.home-page { min-height: 100vh; }
.hero {
  background: linear-gradient(135deg, #481C69 0%, #6d3a96 100%);
  color: white;
  padding: 120px 20px;
  text-align: center;
}
.hero h1 { font-size: 4rem; margin: 0 0 20px; font-weight: 800; }
.hero p { font-size: 1.5rem; margin: 0 0 40px; opacity: 0.9; }
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: white;
  color: #481C69;
  padding: 16px 32px;
  border-radius: 12px;
  text-decoration: none;
  font-weight: 600;
  font-size: 1.1rem;
  transition: transform 0.2s;
}
.btn-primary:hover { transform: translateY(-2px); }
.section { padding: 80px 20px; max-width: 1400px; margin: 0 auto; }
.section h2 { font-size: 2.5rem; margin: 0 0 40px; text-align: center; color: #1f2937; }
.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 30px;
  margin-bottom: 40px;
}
.product-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  transition: transform 0.3s, box-shadow 0.3s;
  cursor: pointer;
}
.product-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 25px rgba(0,0,0,0.1);
}
.product-image {
  height: 300px;
  overflow: hidden;
  background: #f3f4f6;
}
.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.product-card h3 {
  margin: 20px 16px 8px;
  font-size: 1.25rem;
  color: #1f2937;
}
.price {
  margin: 0 16px 16px;
  font-size: 1.5rem;
  font-weight: 700;
  color: #481C69;
}
.btn-secondary {
  display: block;
  text-align: center;
  max-width: 300px;
  margin: 0 auto;
  padding: 14px 28px;
  background: transparent;
  color: #481C69;
  border: 2px solid #481C69;
  border-radius: 10px;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.2s;
}
.btn-secondary:hover {
  background: #481C69;
  color: white;
}

/* ===== АДАПТИВ ПОД 390px ===== */
@media (max-width: 768px) {
  .hero { padding: 60px 20px; }
  .hero h1 { font-size: 2.5rem; }
  .hero p { font-size: 1.1rem; margin-bottom: 30px; }
  .btn-primary { padding: 12px 24px; font-size: 1rem; }
  .section { padding: 40px 15px; }
  .section h2 { font-size: 1.8rem; margin-bottom: 25px; }
  .products-grid { gap: 15px; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); }
  .product-image { height: 200px; }
  .product-card h3 { font-size: 0.95rem; margin: 12px 10px 6px; }
  .price { font-size: 1.1rem; margin: 0 10px 12px; }
  .btn-secondary { padding: 10px 20px; font-size: 0.9rem; max-width: 250px; }
}

@media (max-width: 480px) {
  .hero { padding: 50px 15px; }
  .hero h1 { font-size: 2rem; }
  .hero p { font-size: 1rem; margin-bottom: 25px; }
  .btn-primary { padding: 10px 20px; font-size: 0.9rem; }
  .section { padding: 30px 12px; }
  .section h2 { font-size: 1.5rem; margin-bottom: 20px; }
  .products-grid { gap: 12px; grid-template-columns: 1fr 1fr; }
  .product-image { height: 160px; }
  .product-card h3 { font-size: 0.85rem; margin: 10px 8px 5px; }
  .price { font-size: 1rem; margin: 0 8px 10px; }
  .btn-secondary { padding: 8px 16px; font-size: 0.85rem; max-width: 200px; }
}

@media (max-width: 390px) {
  .hero { padding: 40px 12px; }
  .hero h1 { font-size: 1.8rem; }
  .hero p { font-size: 0.9rem; margin-bottom: 20px; }
  .btn-primary { padding: 8px 16px; font-size: 0.85rem; gap: 6px; }
  .section { padding: 25px 10px; }
  .section h2 { font-size: 1.3rem; margin-bottom: 15px; }
  .products-grid { gap: 10px; }
  .product-image { height: 140px; }
  .product-card h3 { font-size: 0.8rem; margin: 8px 6px 4px; line-height: 1.3; }
  .price { font-size: 0.9rem; margin: 0 6px 8px; }
}
</style>
