<template>
  <div class="cart-page">
    <div class="container">
      <h1 class="page-title">Ваша корзина</h1>

      <div v-if="bouquetIds.length === 0" class="empty-state">
        <div class="empty-icon">🛒</div>
        <h3>Корзина пуста</h3>
        <p>Похоже, вы еще ничего не добавили.</p>
        <button class="btn-browse" @click="router.push('/')">Перейти в каталог</button>
      </div>

      <div v-else class="cart-content">
        <div class="bouquets-list">
          <div v-for="bid in bouquetIds" :key="bid" class="bouquet-group">
            <div class="bouquet-header">
              <div class="bouquet-title">🌸 Букет №{{ bid }}</div>
              <button v-if="bid > 1" class="btn-remove-bouquet" @click="removeBouquetGroup(bid)" title="Удалить сборку">🗑</button>
            </div>

            <div class="bouquet-items">
              <div v-for="item in getItemsForBouquet(bid)" :key="`${item.id}-${item.bouquet_id}`" class="cart-item">
                <div class="item-details">
                  <div class="item-image-placeholder">
                    <span>{{ item.nazvanie?.charAt(0) || '?' }}</span>
                  </div>
                  <div class="item-text">
                    <h4 class="item-name">{{ item.nazvanie || 'Цветок' }}</h4>
                    <p class="item-price">{{ formatPrice(item.price) }} / шт.</p>
                  </div>
                </div>

                <div class="item-controls">
                  <div class="bouquet-switcher">
                    <label>Сборка:</label>
                    <select v-model="item.bouquet_id" class="form-select-small" @change="saveCart">
                      <option v-for="id in bouquetIds" :key="id" :value="id">Букет №{{ id }}</option>
                    </select>
                  </div>

                  <div class="qty-control">
                    <button @click="changeQty(item, -1)" :disabled="item.qty <= 1">−</button>
                    <input
                      type="number"
                      v-model.number="item.qty"
                      min="1"
                      max="999"
                      class="qty-input"
                      @change="onQtyChange(item)"
                      @keydown.enter.prevent="onQtyChange(item)"
                    >
                    <button @click="changeQty(item, 1)">+</button>
                  </div>

                  <div class="item-actions">
                    <div class="item-total">{{ (item.price * item.qty).toFixed(0) }} ₽</div>
                    <button class="btn-remove" @click="removeItem(item)" title="Удалить">✕</button>
                  </div>
                </div>
              </div>
            </div>

            <div class="bouquet-options">
              <label>Упаковка для Букета №{{ bid }}:</label>
              <select v-model="selectedPackaging[bid]" class="form-select-small" @change="saveCart">
                <option v-for="pack in packagingOptions" :key="pack.value" :value="pack.value">
                  {{ pack.label }} {{ pack.price > 0 ? `(+${pack.price} ₽)` : '' }}
                </option>
              </select>
              <div class="packaging-price">Стоимость упаковки: {{ getPackagingPrice(bid) }} ₽</div>
            </div>
          </div>

          <button class="btn-add-bouquet" @click="addNewBouquetGroup">
            + Добавить еще один букет (сборку)
          </button>
        </div>

        <div class="summary-section">
          <h3>Оформление заказа</h3>
          <div class="summary-row"> <span>Товаров: {{ totalItemsCount }} шт.</span> <span>{{ totalGoodsPrice }} ₽</span> </div>
          <div class="summary-row"> <span>Упаковка:</span> <span>{{ totalPackagingPrice }} ₽</span> </div>
          <div class="summary-row total"> <span>Итого к оплате:</span> <span>{{ grandTotal }} ₽</span> </div>

          <div class="pickup-section">
            <label>Точка самовывоза</label>
            <select v-model="pickupLocation" class="form-select">
              <option disabled value="">Выберите магазин</option>
              <option v-for="p in pickupPoints" :key="p" :value="p">{{ p }}</option>
            </select>
          </div>

          <div class="checkout-area">
            <button class="btn-checkout" @click="sendOrder" :disabled="loading || !pickupLocation">
              <span v-if="loading">Обработка...</span>
              <span v-else>Оформить заказ</span>
            </button>
            <div v-if="error" class="error-msg">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 8v4m0 4h.01"/>
              </svg>
              {{ error }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 🆕 КРАСИВАЯ ПЛАШКА ДЛЯ ЗАМЕНЫ ТОВАРОВ -->
    <transition name="modal-fade">
      <div v-if="showReplacementModal" class="modal-overlay" @click.self="showReplacementModal = false">
        <div class="replacement-modal">
          <div class="modal-header">
            <div class="modal-header-content">
              <div class="modal-icon">⚠️</div>
              <div>
                <h3>Требуется замена товаров</h3>
                <p class="modal-subtitle">Некоторые позиции отсутствуют в нужном количестве</p>
              </div>
            </div>
            <button @click="showReplacementModal = false" class="btn-close">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          
          <div class="modal-body">
            <div v-for="s in shortages" :key="s.flower_id" class="shortage-block">
              <div class="shortage-item">
                <div class="shortage-image-wrapper">
                  <img :src="s.image || '/images/placeholder.jpg'" class="item-thumb" alt="">
                  <span class="stock-badge" :class="s.available === 0 ? 'out-of-stock' : 'low-stock'">
                    {{ s.available > 0 ? 'Осталось ' + s.available + ' шт.' : 'Нет в наличии' }}
                  </span>
                </div>
                <div class="shortage-info">
                  <h4 class="shortage-name">{{ s.name }}</h4>
                  <div class="shortage-details">
                    <span class="detail-item requested">
                      <span class="detail-label">Запрошено:</span>
                      <strong>{{ s.requested }} шт.</strong>
                    </span>
                    <span class="detail-item available">
                      <span class="detail-label">Доступно:</span>
                      <strong :class="s.available < s.requested ? 'text-danger' : 'text-success'">
                        {{ s.available }} шт.
                      </strong>
                    </span>
                    <span class="detail-item missing">
                      <span class="detail-label">Не хватает:</span>
                      <strong class="text-danger">{{ s.missing }} шт.</strong>
                    </span>
                  </div>
                </div>
              </div>

              <div class="replacement-options">
                <p class="option-title">💡 Варианты решения:</p>
                <div class="suggestion-grid">
                  <button 
                    v-for="opt in s.suggestions" 
                    :key="opt.id"
                    @click="applyReplacement(s.flower_id, opt.id, 'replace')"
                    class="btn-suggest"
                  >
                    <span class="suggest-icon">🔄</span>
                    <span class="suggest-name">{{ opt.nazvanie }}</span>
                    <span class="suggest-price">{{ opt.price }} ₽</span>
                  </button>
                  <button 
                    @click="applyReplacement(s.flower_id, null, 'reduce')" 
                    class="btn-reduce"
                    :disabled="s.available === 0"
                  >
                    <span class="suggest-icon">📉</span>
                    <span class="suggest-name">Оставить {{ s.available }} шт.</span>
                  </button>
                  <button 
                    @click="applyReplacement(s.flower_id, null, 'remove')" 
                    class="btn-remove-item"
                  >
                    <span class="suggest-icon">🗑</span>
                    <span class="suggest-name">Убрать из заказа</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button @click="showReplacementModal = false" class="btn-secondary">
              <span>Продолжить позже</span>
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/api';
import { useToastStore } from '@/stores/toast';
import { useCart } from '@/composables/useCart';

const router = useRouter();
const toast = useToastStore();
const { cart, bouquetIds, selectedPackaging, saveLocal, loadFromServer } = useCart();

const showReplacementModal = ref(false);
const shortages = ref([]);
const pickupLocation = ref('');
const loading = ref(false);
const error = ref('');

const packagingOptions = [
  { label: 'Без упаковки', value: 'none', price: 0 },
  { label: 'Крафт-бумага', value: 'craft', price: 150 },
  { label: 'Прозрачная пленка', value: 'film', price: 200 },
  { label: 'Шляпная коробка', value: 'box', price: 500 }
];

const pickupPoints = [
  'г. Пермь, ул. Ленина, 15 (Центр)',
  'г. Пермь, ул. Сибирская, 42 (Закамск)',
  'г. Пермь, ул. Космонавтов, 110 (Индустриальный)'
];

const getItemsForBouquet = (bid) => cart.value.filter(i => i.bouquet_id === bid);
const getPackagingPrice = (bid) => packagingOptions.find(p => p.value === (selectedPackaging.value[bid] || 'none'))?.price || 0;

const totalItemsCount = computed(() => cart.value.reduce((acc, i) => acc + i.qty, 0));
const totalGoodsPrice = computed(() => cart.value.reduce((sum, i) => sum + (i.price * i.qty), 0));
const totalPackagingPrice = computed(() => bouquetIds.value.reduce((sum, id) => sum + getPackagingPrice(id), 0));
const grandTotal = computed(() => totalGoodsPrice.value + totalPackagingPrice.value);

const formatPrice = (price) => new Intl.NumberFormat('ru-RU').format(price) + ' ₽';

const changeQty = (item, delta) => {
  item.qty = Math.max(1, item.qty + delta);
  saveLocal();
};

const removeItem = (item) => {
  cart.value = cart.value.filter(i => i !== item);
  saveLocal();
};

const onQtyChange = (item) => {
  let val = parseInt(item.qty);
  if (isNaN(val) || val < 1) val = 1;
  if (val > 999) val = 999;
  item.qty = val;
  saveLocal();
};

const addNewBouquetGroup = () => {
  const newId = bouquetIds.value.length > 0 ? Math.max(...bouquetIds.value) + 1 : 1;
  bouquetIds.value.push(newId);
  selectedPackaging.value[newId] = 'none';
  saveLocal();
  toast.success(`Создана сборка №${newId}`);
};

const removeBouquetGroup = (bid) => {
  if (confirm(`Удалить Букет №${bid}?`)) {
    bouquetIds.value = bouquetIds.value.filter(id => id !== bid);
    cart.value = cart.value.filter(i => i.bouquet_id !== bid);
    delete selectedPackaging.value[bid];
    saveLocal();
  }
};

const buildPackagesPayload = () => {
  const packages = [];
  
  for (const bid of bouquetIds.value) {
    const items = cart.value.filter(i => i.bouquet_id === bid);
    if (items.length === 0) continue;
    
    const hasConstructor = items.some(item => item.type === 'constructor');
    const packageType = hasConstructor ? 'constructor' : 'flower';
    
    packages.push({
      packaging: selectedPackaging.value[bid] || 'none',
      packaging_price: getPackagingPrice(bid),
      type: packageType,
      items: items.map(item => ({
        id: item.id,
        qty: item.qty,
        price: item.price
      }))
    });
  }
  
  return packages;
};

const sendOrder = async () => {
  if (!pickupLocation.value) return error.value = 'Выберите точку самовывоза';
  loading.value = true;
  error.value = '';
  try {
    await api.post('/cart/validate', { packages: buildPackagesPayload() });
    await api.post('/orders', {
      pickup_location: pickupLocation.value,
      packages: buildPackagesPayload()
    });
    cart.value = [];
    bouquetIds.value = [1];
    selectedPackaging.value = {};
    pickupLocation.value = '';
    saveLocal();
    router.push('/profile');
    toast.success('Заказ успешно оформлен!');
  } catch (e) {
    if (e.response?.data?.status === 'shortage') {
      shortages.value = e.response.data.shortages;
      shortages.value.forEach(s => {
        const cartItem = cart.value.find(i => i.id === s.flower_id);
        if (cartItem) cartItem.available = s.available;
      });
      showReplacementModal.value = true;
      return;
    }
    if (e.response?.data?.errors) error.value = Object.values(e.response.data.errors).flat().join('\n');
    else error.value = e.response?.data?.error || e.response?.data?.message || 'Ошибка сервера';
    toast.error(error.value);
  } finally {
    loading.value = false;
  }
};

const applyReplacement = (originalId, newId, mode) => {
  const idx = cart.value.findIndex(i => i.id === originalId);
  if (idx === -1) return;
  const item = cart.value[idx];

  if (mode === 'replace') {
    const shortage = shortages.value.find(s => s.flower_id === originalId);
    const suggestion = shortage?.suggestions?.find(opt => opt.id === newId);
    if (suggestion) {
      item.id = suggestion.id;
      item.nazvanie = suggestion.nazvanie;
      item.price = suggestion.price;
      item.image = suggestion.image_url || suggestion.img;
      toast.success(`Заменено на ${suggestion.nazvanie}`);
    }
  } else if (mode === 'reduce') {
    const shortage = shortages.value.find(s => s.flower_id === originalId);
    if (shortage) {
      item.qty = Math.min(item.qty, shortage.available);
      toast.info(`Количество уменьшено до ${item.qty} шт.`);
    }
  } else if (mode === 'remove') {
    cart.value.splice(idx, 1);
    toast.info('Товар удалён из заказа');
  }
  saveLocal();
  showReplacementModal.value = false;
};

onMounted(() => {
  loadFromServer();
});
</script>

<style scoped>
/* ========================================= */
/* БАЗОВЫЕ СТИЛИ */
/* ========================================= */
.cart-page, .summary-section, .bouquet-group, .cart-item, .item-controls, .summary-row {
  box-sizing: border-box;
}

.cart-page {
  padding: 60px 40px;
  min-height: 100vh;
  font-family: 'Inter', sans-serif;
  max-width: 1400px;
  margin: 0 auto;
  overflow-x: hidden;
}

.container { max-width: 100%; }
.page-title { font-size: 2.5rem; margin-bottom: 40px; color: var(--text-main); }

/* ========================================= */
/* СЕТКА КОРЗИНЫ И ПЛАШКИ ОФОРМЛЕНИЯ */
/* ========================================= */
.cart-content { 
  display: flex; 
  gap: 50px; 
  align-items: flex-start; 
  flex-wrap: wrap;
}

.bouquets-list { 
  flex: 1 1 600px;
  min-width: 0; 
}

.summary-section {
  flex: 0 0 400px;
  background: var(--bg-light);
  padding: 30px;
  border-radius: 12px;
  border: 1px solid var(--border);
  position: sticky;
  top: 100px;
  word-wrap: break-word;
  overflow-wrap: break-word;
  max-width: 100%;
}

.summary-row { 
  display: flex; 
  justify-content: space-between; 
  align-items: center;
  margin-bottom: 12px; 
  color: var(--text-muted); 
  gap: 15px;
  flex-wrap: wrap;
}

.summary-row.total {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 2px solid var(--border);
  color: var(--text-main);
  font-weight: 700;
  font-size: 1.3rem;
  gap: 15px;
  flex-wrap: wrap;
}

/* ========================================= */
/* ТОВАРЫ В КОРЗИНЕ */
/* ========================================= */
.cart-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid #eee;
  flex-wrap: wrap;
  gap: 15px;
}

.item-details { display: flex; align-items: center; gap: 15px; }
.item-image-placeholder {
  width: 60px;
  height: 60px;
  background: var(--accent);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: #fff;
  font-size: 1.2rem;
  flex-shrink: 0;
}
.item-text h4 { margin: 0 0 5px; font-size: 1.1rem; word-break: break-word; }
.item-price { margin: 0; color: var(--text-muted); font-size: 0.9rem; }

.item-controls { 
  display: flex; 
  align-items: center; 
  gap: 20px; 
  flex-wrap: wrap;
}

.qty-control { display: flex; align-items: center; background: #f5f5f5; border-radius: 6px; }
.qty-control button {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  cursor: pointer;
}

.qty-input {
  width: 50px;
  text-align: center;
  font-weight: 600;
  font-size: 1rem;
  border: none;
  background: transparent;
  outline: none;
}
.qty-input::-webkit-outer-spin-button,
.qty-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.qty-input:focus {
  background: #f3f4f6;
  border-radius: 4px;
}

.item-actions { display: flex; align-items: center; gap: 15px; }

.item-total { 
  font-weight: 700; 
  font-size: 1.1rem; 
  min-width: 80px; 
  text-align: right; 
  white-space: nowrap;
}

.btn-remove { background: none; border: none; cursor: pointer; color: #ccc; font-size: 1.2rem; }
.btn-remove:hover { color: var(--danger); }

/* ========================================= */
/* УПАКОВКА И ПЕРЕКЛЮЧАТЕЛЬ СБОРОК */
/* ========================================= */
.bouquet-options {
  margin-top: 15px;
  padding: 15px;
  background: #fafafa;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
}
.bouquet-options label { font-weight: 600; font-size: 0.9rem; }
.form-select-small { padding: 6px 8px; border: 1px solid #ddd; border-radius: 6px; background: #fff; font-size: 0.9rem; }
.packaging-price { color: var(--text-muted); font-size: 0.9rem; margin-left: auto; }

.bouquet-switcher { display: flex; align-items: center; gap: 8px; margin-bottom: 5px; }
.bouquet-switcher label { font-size: 0.85rem; color: var(--text-muted); }

/* ========================================= */
/* ОФОРМЛЕНИЕ ЗАКАЗА */
/* ========================================= */
.pickup-section { margin: 25px 0; }
.pickup-section label { display: block; font-weight: 600; margin-bottom: 8px; font-size: 0.9rem; }
.form-select { width: 100%; padding: 12px; border: 1px solid var(--border); border-radius: 8px; }

.btn-checkout {
  width: 100%;
  padding: 16px;
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
}
.btn-checkout:disabled { background: #ccc; cursor: not-allowed; }

.error-msg {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--danger);
  background: #fee2e2;
  padding: 12px;
  border-radius: 8px;
  font-size: 0.9rem;
  margin-top: 15px;
  word-break: break-word;
}

/* ========================================= */
/* ПУСТОЕ СОСТОЯНИЕ */
/* ========================================= */
.empty-state {
  text-align: center;
  padding: 100px 20px;
  background: var(--bg-light);
  border-radius: 12px;
  border: 1px dashed var(--border);
}
.empty-icon { font-size: 5rem; margin-bottom: 25px; }
.btn-browse {
  padding: 14px 32px;
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.bouquet-group { margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px dashed var(--border); }
.bouquet-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; gap: 15px; flex-wrap: wrap;}
.bouquet-title { font-size: 1.4rem; font-weight: 700; color: var(--text-main); }
.btn-remove-bouquet { background: none; border: none; font-size: 1.2rem; cursor: pointer; color: #999; }
.btn-remove-bouquet:hover { color: var(--danger); }

.btn-add-bouquet {
  width: 100%;
  padding: 15px;
  background: #fff;
  border: 2px dashed var(--border);
  color: var(--text-muted);
  font-weight: 600;
  cursor: pointer;
  border-radius: 8px;
  transition: 0.2s;
}
.btn-add-bouquet:hover { border-color: var(--primary); color: var(--primary); }

/* ========================================= */
/* 🆕 КРАСИВАЯ ПЛАШКА ДЛЯ ЗАМЕНЫ ТОВАРОВ */
/* ========================================= */

/* Модальное окно */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
  animation: modalFadeIn 0.3s ease-out;
}

@keyframes modalFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.replacement-modal {
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 680px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  animation: modalSlideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes modalSlideUp {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Шапка модалки */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 24px 28px;
  border-bottom: 1px solid #f3f4f6;
  background: #fafbfc;
  border-radius: 20px 20px 0 0;
}

.modal-header-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.modal-icon {
  font-size: 2.5rem;
  line-height: 1;
}

.modal-header h3 {
  margin: 0 0 4px;
  font-size: 1.3rem;
  color: #1f2937;
  font-weight: 700;
}

.modal-subtitle {
  margin: 0;
  font-size: 0.9rem;
  color: #6b7280;
}

.btn-close {
  background: #f3f4f6;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  cursor: pointer;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.btn-close:hover {
  background: #fee2e2;
  color: #ef4444;
  transform: rotate(90deg);
}

/* Тело модалки */
.modal-body {
  padding: 24px 28px;
  overflow-y: auto;
  flex: 1;
}

/* Блок с недостачей */
.shortage-block {
  background: #f9fafb;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
  border: 1px solid #e5e7eb;
  transition: all 0.2s;
}

.shortage-block:last-child {
  margin-bottom: 0;
}

.shortage-item {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.shortage-image-wrapper {
  position: relative;
  flex-shrink: 0;
}

.item-thumb {
  width: 72px;
  height: 72px;
  object-fit: cover;
  border-radius: 12px;
  border: 2px solid #e5e7eb;
  background: #fff;
}

.stock-badge {
  position: absolute;
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.6rem;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 700;
  white-space: nowrap;
  background: #f3f4f6;
  color: #6b7280;
  border: 1px solid #e5e7eb;
}

.stock-badge.low-stock {
  background: #fef3c7;
  color: #92400e;
  border-color: #f59e0b;
}

.stock-badge.out-of-stock {
  background: #fee2e2;
  color: #991b1b;
  border-color: #ef4444;
}

.shortage-info {
  flex: 1;
  min-width: 0;
}

.shortage-name {
  margin: 0 0 8px;
  font-size: 1.05rem;
  font-weight: 600;
  color: #1f2937;
}

.shortage-details {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.85rem;
  background: white;
  padding: 2px 10px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.detail-label {
  color: #6b7280;
}

.detail-item strong {
  font-weight: 600;
}

.text-danger {
  color: #dc2626;
}

.text-success {
  color: #16a34a;
}

/* Варианты решения */
.replacement-options {
  margin-top: 4px;
}

.option-title {
  font-size: 0.85rem;
  color: #6b7280;
  margin: 0 0 10px;
  font-weight: 500;
}

.suggestion-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.btn-suggest,
.btn-reduce,
.btn-remove-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  background: white;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
  font-family: inherit;
  color: #1f2937;
}

.btn-suggest {
  background: #f3f0f7;
  border-color: #d4c4e0;
}

.btn-suggest:hover {
  background: #e8dff0;
  border-color: #481C69;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(72, 28, 105, 0.15);
}

.btn-suggest .suggest-price {
  color: #481C69;
  font-weight: 600;
  font-size: 0.8rem;
}

.btn-suggest .suggest-name {
  font-weight: 500;
}

.btn-reduce {
  background: #fef3c7;
  border-color: #fde68a;
}

.btn-reduce:hover:not(:disabled) {
  background: #fde68a;
  border-color: #f59e0b;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2);
}

.btn-reduce:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-remove-item {
  background: #fee2e2;
  border-color: #fca5a5;
}

.btn-remove-item:hover {
  background: #fca5a5;
  border-color: #ef4444;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
}

.suggest-icon {
  font-size: 1rem;
}

/* Футер модалки */
.modal-footer {
  padding: 16px 28px;
  border-top: 1px solid #f3f4f6;
  display: flex;
  justify-content: flex-end;
  background: #fafbfc;
  border-radius: 0 0 20px 20px;
}

.btn-secondary {
  background: white;
  border: 1px solid #e5e7eb;
  color: #6b7280;
  padding: 10px 24px;
  border-radius: 10px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.btn-secondary:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
}

/* ========================================= */
/* ПЕРЕМЕННЫЕ */
/* ========================================= */
:root {
  --primary: #1a1a1a;
  --accent: #D0C4C8;
  --bg-light: #f9f9f9;
  --text-main: #333;
  --text-muted: #666;
  --border: #e5e5e5;
  --danger: #ef4444;
}

/* ========================================= */
/* АДАПТИВ */
/* ========================================= */

@media (max-width: 1100px) {
  .cart-content {
    flex-direction: column;
  }
  .summary-section {
    width: 100%;
    flex: 1 1 auto;
    position: static;
  }
  .bouquets-list {
    flex: 1 1 auto;
    width: 100%;
  }
}

@media (max-width: 768px) {
  .cart-page { padding: 40px 20px; }
  .page-title { font-size: 2rem; }
  .cart-content { gap: 30px; }
  .item-controls { gap: 15px; }
  
  .replacement-modal {
    max-width: 100%;
    border-radius: 16px;
  }
  
  .shortage-item {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .shortage-details {
    gap: 8px;
  }
  
  .suggestion-grid {
    flex-direction: column;
  }
  
  .btn-suggest,
  .btn-reduce,
  .btn-remove-item {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 576px) {
  .cart-page { padding: 30px 15px; }
  .page-title { font-size: 1.6rem; margin-bottom: 25px; }
  .summary-section { padding: 20px; }
  .summary-row.total { font-size: 1.1rem; }
  .item-details { gap: 10px; }
  .item-image-placeholder { width: 50px; height: 50px; font-size: 1rem; }
  .item-text h4 { font-size: 1rem; }
  
  .modal-header {
    padding: 18px 20px;
  }
  
  .modal-header h3 {
    font-size: 1.1rem;
  }
  
  .modal-body {
    padding: 18px 20px;
  }
  
  .shortage-block {
    padding: 16px;
  }
  
  .item-thumb {
    width: 60px;
    height: 60px;
  }
}

@media (max-width: 480px) {
  .modal-header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .modal-icon {
    font-size: 2rem;
  }
  
  .shortage-details {
    flex-direction: column;
    gap: 4px;
  }
  
  .detail-item {
    justify-content: space-between;
    width: 100%;
  }
}

@media (max-width: 368px) {
  .cart-page {
    padding: 20px 10px;
  }

  .page-title {
    font-size: 1.4rem;
    margin-bottom: 20px;
  }

  .cart-content {
    gap: 20px;
  }

  .summary-section {
    padding: 15px;
  }
  .summary-section h3 {
    font-size: 1.1rem;
    margin-bottom: 15px;
  }
  .summary-row {
    font-size: 0.9rem;
    margin-bottom: 8px;
    gap: 10px;
  }
  .summary-row.total {
    font-size: 1.1rem;
    margin-top: 15px;
    padding-top: 15px;
  }

  .cart-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
    padding: 12px 0;
  }

  .item-details {
    width: 100%;
    gap: 10px;
  }

  .item-image-placeholder {
    width: 45px;
    height: 45px;
    font-size: 1rem;
    flex-shrink: 0;
  }

  .item-text h4 {
    font-size: 0.95rem;
    line-height: 1.2;
  }
  
  .item-price {
    font-size: 0.8rem;
  }

  .item-controls {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .bouquet-switcher {
    width: 100%;
    justify-content: space-between;
  }
  .bouquet-switcher select {
    flex: 1;
    margin-left: 10px;
  }

  .qty-control {
    width: 100%;
    justify-content: center;
  }
  .qty-control button {
    width: 40px;
    height: 40px;
    font-size: 1.2rem;
  }
  .qty-input {
    flex: 1;
    font-size: 1.1rem;
  }

  .item-actions {
    width: 100%;
    justify-content: space-between;
    align-items: center;
  }
  
  .item-total {
    font-size: 1rem;
    min-width: auto;
  }

  .btn-remove {
    font-size: 1.3rem;
    padding: 5px;
  }

  .bouquet-options {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
    padding: 12px;
  }
  .bouquet-options label {
    font-size: 0.85rem;
  }
  .bouquet-options select {
    width: 100%;
  }
  .packaging-price {
    margin-left: 0;
    width: 100%;
    text-align: right;
    font-size: 0.85rem;
  }

  .bouquet-title {
    font-size: 1.1rem;
  }

  .btn-add-bouquet {
    padding: 12px;
    font-size: 0.85rem;
  }

  .pickup-section label {
    font-size: 0.85rem;
  }
  
  .form-select {
    padding: 10px;
    font-size: 0.9rem;
  }

  .btn-checkout {
    padding: 14px;
    font-size: 1rem;
  }

  /* Модалка на очень маленьких экранах */
  .replacement-modal {
    max-height: 95vh;
    border-radius: 16px;
  }
  .modal-header {
    padding: 14px 16px;
  }
  .modal-header h3 {
    font-size: 1rem;
  }
  .modal-body {
    padding: 14px 16px;
  }
  .shortage-block {
    padding: 12px;
    border-radius: 12px;
  }
  .item-thumb {
    width: 50px;
    height: 50px;
  }
  .shortage-name {
    font-size: 0.95rem;
  }
  .suggestion-grid {
    flex-direction: column;
    gap: 6px;
  }
  .btn-suggest, .btn-reduce, .btn-remove-item {
    width: 100%;
    text-align: center;
    padding: 8px 12px;
    font-size: 0.8rem;
    justify-content: center;
  }
  .modal-footer {
    padding: 12px 16px;
  }
}
</style>
