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

    <!-- 🆕 КРАСИВОЕ МОДАЛЬНОЕ ОКНО ЗАМЕНЫ -->
    <transition name="modal-fade">
      <div v-if="showReplacementModal" class="modal-overlay" @click.self="showReplacementModal = false">
        <div class="replacement-modal">
          <div class="modal-header">
            <div class="modal-header-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <div class="modal-header-text">
              <h3>Внимание!</h3>
              <p>Некоторые товары отсутствуют в нужном количестве</p>
            </div>
            <button @click="showReplacementModal = false" class="btn-close-modal">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div class="modal-body">
            <div v-for="(s, idx) in shortages" :key="s.flower_id" class="shortage-card">
              <div class="shortage-card-header">
                <div class="shortage-number">{{ idx + 1 }}</div>
                <div class="shortage-stock">
                  <span class="stock-label">В наличии:</span>
                  <span class="stock-value" :class="{ 'low-stock': s.available < 5 }">{{ s.available }} шт.</span>
                </div>
              </div>

              <div class="shortage-product">
                <img :src="s.image || '/images/placeholder.jpg'" class="product-image-modal" alt="">
                <div class="product-info-modal">
                  <h4>{{ s.name }}</h4>
                  <div class="product-quantity">
                    <span class="requested">Запрошено: {{ s.requested }} шт.</span>
                    <span class="missing">Не хватает: {{ s.missing }} шт.</span>
                  </div>
                </div>
              </div>

              <div class="replacement-section">
                <p class="replacement-title">✨ Выберите вариант замены</p>
                <div class="replacement-options-grid">
                  <button v-for="opt in s.suggestions" :key="opt.id"
                          @click="applyReplacement(s.flower_id, opt.id, 'replace')"
                          class="replacement-option replace-option">
                    <span class="option-icon">🔄</span>
                    <div class="option-details">
                      <span class="option-name">{{ opt.nazvanie }}</span>
                      <span class="option-price">{{ formatPrice(opt.price) }}</span>
                    </div>
                  </button>
                  
                  <button @click="applyReplacement(s.flower_id, null, 'reduce')"
                          class="replacement-option reduce-option">
                    <span class="option-icon">📉</span>
                    <div class="option-details">
                      <span class="option-name">Оставить {{ s.available }} шт.</span>
                      <span class="option-hint">уменьшить количество</span>
                    </div>
                  </button>
                  
                  <button @click="applyReplacement(s.flower_id, null, 'remove')"
                          class="replacement-option remove-option">
                    <span class="option-icon">🗑</span>
                    <div class="option-details">
                      <span class="option-name">Убрать из заказа</span>
                      <span class="option-hint">полностью удалить</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button @click="showReplacementModal = false" class="btn-cancel">Продолжить оформление</button>
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

const buildPackagesPayload = () => bouquetIds.value.map(bid => {
  const items = cart.value.filter(i => i.bouquet_id === bid);
  if (items.length === 0) return null;
  return {
    packaging: selectedPackaging.value[bid] || 'none',
    packaging_price: getPackagingPrice(bid),
    items: items.map(item => ({
      id: item.id,
      qty: item.qty,
      price: item.price
    }))
  };
}).filter(Boolean);

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
/* ===== ОСНОВНЫЕ СТИЛИ ===== */
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

.bouquet-switcher { display: flex; align-items: center; gap: 8px; margin-bottom: 5px; }
.bouquet-switcher label { font-size: 0.85rem; color: var(--text-muted); }
.form-select-small { padding: 6px 8px; border: 1px solid #ddd; border-radius: 6px; background: #fff; font-size: 0.9rem; }
.packaging-price { color: var(--text-muted); font-size: 0.9rem; margin-top: 5px; }

:root {
  --primary: #481C69;
  --primary-light: #f3f0f7;
  --accent: #D0C4C8;
  --bg-light: #f9f9f9;
  --text-main: #1f2937;
  --text-muted: #6b7280;
  --border: #e5e7eb;
  --danger: #ef4444;
  --warning: #f59e0b;
  --success: #10b981;
}

.cart-page {
  padding: 60px 40px;
  min-height: 100vh;
  font-family: 'Inter', sans-serif;
  max-width: 1400px;
  margin: 0 auto;
}
.container { max-width: 100%; }
.page-title { font-size: 2.5rem; margin-bottom: 40px; color: var(--text-main); }

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

.cart-content { display: flex; gap: 50px; align-items: flex-start; }
.bouquets-list { flex: 1; min-width: 0; }
.bouquet-group { margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px dashed var(--border); }
.bouquet-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
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

.cart-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid #eee;
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
}
.item-text h4 { margin: 0 0 5px; font-size: 1.1rem; }
.item-price { margin: 0; color: var(--text-muted); font-size: 0.9rem; }
.item-controls { display: flex; align-items: center; gap: 20px; }
.qty-control { display: flex; align-items: center; background: #f5f5f5; border-radius: 6px; }
.qty-control button {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  cursor: pointer;
}
.qty-value { width: 40px; text-align: center; font-weight: 600; }
.item-total { font-weight: 700; font-size: 1.1rem; min-width: 80px; text-align: right; }
.btn-remove { background: none; border: none; cursor: pointer; color: #ccc; font-size: 1.2rem; }
.btn-remove:hover { color: var(--danger); }

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

.summary-section {
  flex: 0 0 400px;
  background: var(--bg-light);
  padding: 30px;
  border-radius: 12px;
  border: 1px solid var(--border);
  position: sticky;
  top: 100px;
}
.summary-section h3 { margin-top: 0; margin-bottom: 25px; font-size: 1.3rem; }
.summary-row { display: flex; justify-content: space-between; margin-bottom: 12px; color: var(--text-muted); }
.summary-row.total {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 2px solid var(--border);
  color: var(--text-main);
  font-weight: 700;
  font-size: 1.3rem;
}
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
}

/* ===== КРАСИВОЕ МОДАЛЬНОЕ ОКНО ===== */
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
}

.replacement-modal {
  background: white;
  border-radius: 28px;
  width: 100%;
  max-width: 680px;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  animation: modalSlideUp 0.35s cubic-bezier(0.21, 1.11, 0.35, 1);
}

@keyframes modalSlideUp {
  from {
    transform: translateY(30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Хедер модалки */
.modal-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px 28px;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-radius: 28px 28px 0 0;
  position: relative;
}

.modal-header-icon {
  width: 52px;
  height: 52px;
  background: #f59e0b;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.modal-header-text {
  flex: 1;
}

.modal-header-text h3 {
  margin: 0 0 4px;
  font-size: 1.3rem;
  font-weight: 700;
  color: #92400e;
}

.modal-header-text p {
  margin: 0;
  font-size: 0.85rem;
  color: #b45309;
}

.btn-close-modal {
  background: rgba(0, 0, 0, 0.08);
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s;
  color: #92400e;
}

.btn-close-modal:hover {
  background: rgba(0, 0, 0, 0.15);
  transform: rotate(90deg);
}

/* Тело модалки */
.modal-body {
  padding: 24px 28px;
}

/* Карточка товара с недостачей */
.shortage-card {
  background: #f9fafb;
  border-radius: 20px;
  margin-bottom: 24px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  transition: all 0.2s;
}

.shortage-card:hover {
  border-color: #fde68a;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.shortage-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #e5e7eb;
}

.shortage-number {
  width: 28px;
  height: 28px;
  background: var(--primary);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 700;
}

.shortage-stock {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stock-label {
  font-size: 0.75rem;
  color: #6b7280;
}

.stock-value {
  font-weight: 700;
  font-size: 0.85rem;
  color: #10b981;
}

.stock-value.low-stock {
  color: #ef4444;
}

/* Информация о товаре */
.shortage-product {
  display: flex;
  gap: 16px;
  padding: 16px;
  background: white;
  border-bottom: 1px solid #f3f4f6;
}

.product-image-modal {
  width: 64px;
  height: 64px;
  object-fit: cover;
  border-radius: 12px;
  background: #f3f4f6;
}

.product-info-modal {
  flex: 1;
}

.product-info-modal h4 {
  margin: 0 0 8px;
  font-size: 1rem;
  font-weight: 700;
  color: #1f2937;
}

.product-quantity {
  display: flex;
  gap: 16px;
  font-size: 0.8rem;
}

.requested {
  color: #6b7280;
}

.missing {
  color: #ef4444;
  font-weight: 600;
}

/* Секция замены */
.replacement-section {
  padding: 16px;
}

.replacement-title {
  margin: 0 0 12px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #6b7280;
}

.replacement-options-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.replacement-option {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 16px;
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.replacement-option:hover {
  transform: translateX(6px);
}

.option-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
}

.option-details {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.option-name {
  font-weight: 600;
  font-size: 0.9rem;
  color: #1f2937;
}

.option-price {
  font-weight: 700;
  font-size: 0.85rem;
  color: var(--primary);
}

.option-hint {
  font-size: 0.7rem;
  color: #6b7280;
}

.replace-option:hover {
  background: #f3f0f7;
  border-color: var(--primary);
}

.reduce-option:hover {
  background: #fef3c7;
  border-color: #f59e0b;
}

.reduce-option:hover .option-name {
  color: #d97706;
}

.remove-option:hover {
  background: #fee2e2;
  border-color: #ef4444;
}

.remove-option:hover .option-name {
  color: #dc2626;
}

/* Футер модалки */
.modal-footer {
  padding: 20px 28px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  background: #f9fafb;
  border-radius: 0 0 28px 28px;
}

.btn-cancel {
  padding: 10px 28px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.9rem;
  transition: all 0.2s;
  color: #4b5563;
}

.btn-cancel:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
}

/* Анимация появления */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

/* Адаптив */
@media (max-width: 991px) {
  .cart-content { flex-direction: column; }
  .summary-section { width: 100%; position: static; }
}

@media (max-width: 640px) {
  .replacement-modal {
    max-width: 95%;
    border-radius: 20px;
  }
  
  .modal-header {
    padding: 18px 20px;
    flex-wrap: wrap;
  }
  
  .modal-header-icon {
    width: 44px;
    height: 44px;
  }
  
  .modal-header-text h3 {
    font-size: 1.1rem;
  }
  
  .modal-header-text p {
    font-size: 0.75rem;
  }
  
  .modal-body {
    padding: 20px;
  }
  
  .shortage-product {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  
  .product-info-modal h4 {
    text-align: center;
  }
  
  .product-quantity {
    justify-content: center;
  }
  
  .option-details {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .modal-footer {
    padding: 16px 20px;
  }
}

@media (max-width: 480px) {
  .replacement-option {
    padding: 10px 14px;
  }
  
  .option-name {
    font-size: 0.85rem;
  }
  
  .option-price {
    font-size: 0.8rem;
  }
}
</style>
