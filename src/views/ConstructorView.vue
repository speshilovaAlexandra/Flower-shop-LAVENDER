<template>
 <div class="constructor-page">
   <h1>Конструктор букета</h1>
   <p class="subtitle">Соберите свою уникальную композицию</p>

   <div class="mode-switcher">
     <button :class="{ active: mode === 'manual' }" @click="mode = 'manual'">Ручной сбор</button>
     <button :class="{ active: mode === 'auto' }" @click="mode = 'auto'">Автоподбор по бюджету</button>
   </div>

   <!-- РУЧНОЙ СБОР -->
   <div v-if="mode === 'manual'" class="manual-container">
     <div class="catalog-grid">
       <div v-for="flower in flowers" :key="flower.id" class="flower-card" @click="addToBouquet(flower)">
         <div class="flower-img">
          <img :src="flower.flower_image_url || flower.image_url || '/images/placeholder.jpg'" :alt="flower.nazvanie">
        </div>
         <div class="flower-info">
           <h3>{{ flower.nazvanie }}</h3>
           <div class="price-block">
             <div class="price">{{ formatPrice(flower.price_per_stem) }}</div>
             <span class="price-hint">за 1 цветок</span>
           </div>
           <button class="btn-add-small">+ Добавить</button>
         </div>
       </div>
     </div>

     <div class="bouquet-summary">
       <div class="sticky-card">
         <h2>Ваш букет</h2>
         <div v-if="manualItems.length === 0" class="empty-bouquet">
           <p>Добавьте цветы из каталога</p>
         </div>
         <div v-else class="items-list">
           <div v-for="(item, index) in manualItems" :key="item.id" class="bouquet-item">
             <span>{{ item.nazvanie }}</span>
             <div class="item-controls">
               <button class="qty-btn" @click="changeQty('manual', index, -1)">−</button>
               <span class="qty-value">{{ item.qty }} шт.</span>
               <button class="qty-btn" @click="changeQty('manual', index, 1)">+</button>
             </div>
             <div class="item-actions">
               <span class="item-price">{{ formatPrice(item.price_per_stem * item.qty) }}</span>
               <button class="btn-remove" @click="removeItem('manual', index)">✕</button>
             </div>
           </div>
         </div>

         <div class="total-block" v-if="manualItems.length > 0">
           <div class="row total">
             <span>Итого:</span>
             <span>{{ formatPrice(manualTotal) }}</span>
           </div>
           <button class="btn-order" @click="orderManualBouquet">Оформить заказ</button>
         </div>
       </div>
     </div>
   </div>

   <!-- АВТОПОДБОР -->
   <div v-if="mode === 'auto'" class="auto-container">
     <div class="budget-card">
       <h2>Укажите бюджет</h2>
       <p>Мы подберем лучший набор цветов на эту сумму</p>
       <div class="budget-inputs">
         <input type="number" v-model.number="budgetInput" placeholder="Например: 3000" min="100">
         <button @click="generateAutoBouquet" :disabled="loading || !budgetInput">
          {{ loading ? 'Подбираем...' : 'Подобрать букет' }}
         </button>
       </div>
     </div>

     <div v-if="autoItems.length > 0" class="auto-result">
       <div class="success-header">
         <h3>Готово! Мы собрали идеальный букет:</h3>
         <p>Примерная сумма: {{ formatPrice(autoTotal) }}</p>
       </div>

       <div class="flowers-grid">
         <div v-for="(item, index) in autoItems" :key="item.id" class="flower-card static">
           <div class="flower-img">
            <img :src="item.flower_image_url || item.image_url || '/images/placeholder.jpg'" :alt="item.nazvanie">           
          </div>
           <div class="flower-info">
             <h3>{{ item.nazvanie }}</h3>
             <div class="price">{{ formatPrice(item.price_per_stem) }}</div>
             <span class="price-hint">за 1 цветок</span>
           </div>
           <div class="auto-controls">
             <button class="qty-btn" @click="changeQty('auto', index, -1)">−</button>
             <span class="qty-value">{{ item.qty }} шт.</span>
             <button class="qty-btn" @click="changeQty('auto', index, 1)">+</button>
           </div>
         </div>
       </div>

       <div class="total-row">
         <div class="total-info">
           <span>Сумма заказа:</span>
           <strong>{{ formatPrice(autoTotal) }}</strong>
         </div>
         <button class="btn-order" @click="orderAutoBouquet">Заказать этот букет</button>
       </div>
     </div>
   </div>
 </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '@/api';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useToastStore } from '@/stores/toast';

const router = useRouter();
const authStore = useAuthStore();
const toast = useToastStore();

const mode = ref('manual');
const flowers = ref([]);

// Состояние ручного сбора
const manualItems = ref([]);
const manualTotal = computed(() => manualItems.value.reduce((sum, i) => sum + (i.price_per_stem * i.qty), 0));

// Состояние автоподбора
const budgetInput = ref(null);
const autoItems = ref([]);
const autoTotal = computed(() => autoItems.value.reduce((sum, i) => sum + (i.price_per_stem * i.qty), 0));
const loading = ref(false);

// Управление количеством
const changeQty = (type, index, delta) => {
  const list = type === 'manual' ? manualItems.value : autoItems.value;
  if (!list[index]) return;
  if (list[index].qty + delta < 1) return;
  list[index].qty += delta;
};

const removeItem = (type, index) => {
  if (type === 'manual') manualItems.value.splice(index, 1);
  else autoItems.value.splice(index, 1);
};

const addToBouquet = (flower) => {
  const existing = manualItems.value.find(item => item.id === flower.id);
  if (existing) existing.qty++;
  else manualItems.value.push({ ...flower, qty: 1 });
  toast.success(`${flower.nazvanie} добавлен в букет`);
};

const generateAutoBouquet = async () => {
  if (!budgetInput.value || budgetInput.value < 100) {
    toast.warning('Минимальная сумма для автоподбора — 100 ₽');
    return;
  }
  loading.value = true;
  autoItems.value = [];
  try {
    const { data } = await api.post('/constructor/suggest', { budget: Number(budgetInput.value) });
    autoItems.value = data.bouquet || [];
    toast.success(`Подобрано на ${data.total_price} ₽`);
  } catch (e) {
    console.error('Auto suggest error:', e);
    toast.error(e.response?.data?.message || 'Ошибка подбора');
  } finally {
    loading.value = false;
  }
};

// 🆕 ДИНАМИЧЕСКАЯ ЛОГИКА ID И КОРЗИНЫ
const getBouquetIds = () => JSON.parse(localStorage.getItem('cart_bouquet_ids') || '[]');
const getNextBouquetId = () => {
  const ids = getBouquetIds();
  return ids.length > 0 ? Math.max(...ids) + 1 : 1;
};

import { useCart } from '@/composables/useCart';
// ... внутри setup ...
const { cart, bouquetIds, selectedPackaging, saveLocal, isAuthenticated } = useCart();

const saveToCart = (items, sourceType) => {
  if (!isAuthenticated.value) return router.push('/login');
  if (items.length === 0) return toast.warning('Букет пуст');

  const newId = bouquetIds.value.length > 0 ? Math.max(...bouquetIds.value) + 1 : 1;
  bouquetIds.value.push(newId);
  selectedPackaging.value[newId] = 'none';

  const mapped = items.map(item => ({
    id: item.id, nazvanie: item.nazvanie,
    price: item.price_per_stem, qty: item.qty,
    type: 'constructor', source: sourceType, bouquet_id: newId
  }));

  mapped.forEach(newItem => {
    const existing = cart.value.find(i => i.id === newItem.id && i.bouquet_id === newItem.bouquet_id);
    if (existing) existing.qty += newItem.qty;
    else cart.value.push(newItem);
  });

  saveLocal();
  toast.success(`${sourceType === 'constructor_manual' ? 'Ручной' : 'Авто'} букет добавлен в Сборку №${newId}`);

  if (sourceType === 'constructor_manual') manualItems.value = [];
  else autoItems.value = [];
};
const orderManualBouquet = () => saveToCart(manualItems.value, 'constructor_manual');
const orderAutoBouquet = () => saveToCart(autoItems.value, 'constructor_auto');

const formatPrice = (price) => new Intl.NumberFormat('ru-RU').format(price) + ' ₽';

onMounted(async () => {
  try {
    const { data } = await api.get('/constructor/flowers');
    flowers.value = data;
  } catch (e) {
    console.error('Ошибка загрузки цветов', e);
    toast.error('Не удалось загрузить цветы для конструктора');
  }
});
</script>
<style scoped>
/* ⚠️ Стили остались без изменений */
.qty-btn { width: 28px; height: 28px; border: 1px solid #e5e7eb; background: #fff; border-radius: 6px; cursor: pointer; font-weight: bold; color: #481C69; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
.qty-btn:hover { background: #f3f0f7; }
.qty-value { width: 36px; text-align: center; font-weight: 600; font-size: 0.95rem; }
.bouquet-item { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #f3f4f6; gap: 8px; }
.item-controls { display: flex; align-items: center; gap: 6px; }
.item-actions { display: flex; align-items: center; gap: 12px; }
.auto-controls { display: flex; justify-content: center; align-items: center; gap: 8px; margin-top: 10px; padding-top: 10px; border-top: 1px dashed #e5e7eb; }
@media (max-width: 600px) { .bouquet-item { flex-direction: column; align-items: flex-start; gap: 10px; } .item-actions { width: 100%; justify-content: space-between; } }
.constructor-page { max-width: 1200px; margin: 40px auto; padding: 0 20px; font-family: 'Inter', sans-serif; }
h1 { text-align: center; color: #1f2937; margin-bottom: 10px; }
.subtitle { text-align: center; color: #6b7280; margin-bottom: 40px; }
.mode-switcher { display: flex; justify-content: center; gap: 20px; margin-bottom: 40px; }
.mode-switcher button { padding: 12px 30px; border: 2px solid #e5e7eb; background: white; border-radius: 30px; font-size: 1rem; cursor: pointer; transition: all 0.3s; }
.price-block { display: flex; flex-direction: column; }
.price-hint { font-size: 0.75rem; color: #6b7280; margin-top: 2px; }
.mode-switcher button.active { border-color: #481C69; background: #481C69; color: white; box-shadow: 0 4px 12px rgba(72, 28, 105, 0.2); }
.manual-container { display: flex; gap: 40px; align-items: flex-start; }
.catalog-grid { flex: 2; display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px; }
.bouquet-summary { flex: 1; position: sticky; top: 100px; }
.flower-card { background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05); transition: transform 0.2s; cursor: pointer; }
.flower-card:hover { transform: translateY(-5px); }
.flower-img { height: 180px; background: #f3f4f6; }
.flower-img img { width: 100%; height: 100%; object-fit: cover; }
.flower-info { padding: 15px; }
.flower-info h3 { margin: 0 0 10px; font-size: 1rem; }
.price { color: #481C69; font-weight: 700; margin-bottom: 10px; }
.btn-add-small { width: 100%; padding: 8px; background: #f3f0f7; color: #481C69; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; }
.sticky-card { background: white; padding: 25px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); }
.btn-remove { background: none; border: none; color: #ef4444; cursor: pointer; font-size: 1.2rem; }
.total-block { margin-top: 20px; border-top: 2px solid #e5e7eb; padding-top: 15px; }
.row { display: flex; justify-content: space-between; margin-bottom: 8px; }
.row.total { font-size: 1.2rem; font-weight: 800; color: #481C69; }
.btn-order { width: 100%; padding: 14px; background: #481C69; color: white; border: none; border-radius: 10px; font-size: 1.1rem; font-weight: 600; cursor: pointer; margin-top: 15px; }
.auto-container { max-width: 600px; margin: 0 auto; text-align: center; }
.budget-card { background: white; padding: 30px; border-radius: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); margin-bottom: 30px; }
.budget-inputs { display: flex; gap: 10px; margin-top: 20px; }
.budget-inputs input { flex: 1; padding: 12px; border: 1px solid #e5e7eb; border-radius: 10px; font-size: 1.1rem; }
.budget-inputs button { padding: 0 25px; background: #481C69; color: white; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; }
.success-header { background: #d1fae5; color: #065f46; padding: 15px; border-radius: 12px; margin-bottom: 20px; }
.auto-result .flowers-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 15px; margin-bottom: 20px; }
.total-row { background: #f9fafb; padding: 20px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; font-size: 1.2rem; }
@media (max-width: 900px) { .manual-container { flex-direction: column; } .bouquet-summary { width: 100%; position: static; } }
</style>