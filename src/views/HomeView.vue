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
            <img :src="flower.image_url || '/images/placeholder.jpg'" :alt="flower.nazvanie" loading="lazy">
          </div>
          <h3>{{ flower.nazvanie }}</h3>
          <p class="price">{{ formatPrice(flower.price) }}</p>
        </div>
      </div>
      <router-link to="/catalog" class="btn-secondary">Смотреть все цветы</router-link>
    </section>

    <!-- Additional Products Section -->
    <!-- <section class="section">
      <h2>Дополнения к букету</h2>
      <div class="products-grid">
        <div v-for="product in additionalProducts" :key="product.id" class="product-card">
          <div class="product-image">
        <img :src="product.image_url || '/images/placeholder.jpg'" :alt="product.name" loading="lazy">
            <span class="category-badge">{{ getCategoryName(product.category) }}</span>
          </div>
          <h3>{{ product.name }}</h3>
          <p class="price">{{ formatPrice(product.price) }}</p>
          <button class="btn-add" @click.stop="addToCart(product)">В корзину</button>
        </div>
      </div>
    </section> -->
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '@/api';
import { useAuthStore } from '@/stores/auth';

const flowers = ref([]);
const additionalProducts = ref([]);
const authStore = useAuthStore();

const formatPrice = (price) => new Intl.NumberFormat('ru-RU').format(price) + ' ₽';

const getCategoryName = (category) => {
  const names = {
    cake: 'Тортик',
    card: 'Открытка',
    toy: 'Игрушка',
    chocolate: 'Шоколад'
  };
  return names[category] || category;
};

const addToCart = (product) => {
  if (!authStore.isAuthenticated) {
    alert('Войдите, чтобы добавить в корзину');
    return;
  }
  let cart = JSON.parse(localStorage.getItem('cart') || '[]');
  const item = cart.find(i => i.id === product.id && i.type === 'additional');
  if (item) {
    item.qty++;
  } else {
    cart.push({ 
      id: product.id, 
      name: product.name, 
      price: product.price, 
      qty: 1, 
      type: 'additional' 
    });
  }
  localStorage.setItem('cart', JSON.stringify(cart));
  alert('Добавлено в корзину!');
};

onMounted(async () => {
  try {
    const { data } = await api.get('/home');
    flowers.value = data.flowers;
    additionalProducts.value = data.additional_products;
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
  position: relative;
  height: 300px;
  overflow: hidden;
  background: #f3f4f6;
}
.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.category-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  background: #481C69;
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
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
.btn-add {
  width: calc(100% - 32px);
  margin: 0 16px 20px;
  padding: 12px;
  background: #481C69;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-add:hover { background: #361550; }
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
@media (max-width: 768px) {
  .hero h1 { font-size: 2.5rem; }
  .hero p { font-size: 1.1rem; }
  .section h2 { font-size: 1.8rem; }
  .products-grid { grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); }
}
</style>