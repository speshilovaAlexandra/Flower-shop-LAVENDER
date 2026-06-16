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

    <!-- 🌸 КРАСИВОЕ МОДАЛЬНОЕ ОКНО В СТИЛЕ LAVENDER -->
    <transition name="modal-fade">
      <div v-if="showReplacementModal" class="modal-overlay" @click.self="showReplacementModal = false">
        <div class="replacement-modal">
          <div class="modal-decoration"></div>
          
          <div class="modal-header">
            <div class="modal-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 8v4M12 16h.01"/>
              </svg>
            </div>
            <div class="header-text">
              <h3>Требуется внимание</h3>
              <p>Некоторые позиции отсутствуют в нужном количестве</p>
            </div>
            <button @click="showReplacementModal = false" class="close-modal">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div class="modal-body">
            <div v-for="(s, idx) in shortages" :key="s.flower_id" class="shortage-item">
              <div class="shortage-badge">{{ idx + 1 }}</div>
              
              <div class="shortage-content">
                <div class="product-row">
                  
                  <div class="product-details">
                    <h4>{{ s.name }}</h4>
                    <div class="stock-info">
                      <span class="stock-label">В наличии:</span>
                      <span class="stock-value" :class="{ 'stock-low': s.available < 5 }">{{ s.available }} шт.</span>
                      <span class="requested-label">Запрошено:</span>
                      <span class="requested-value">{{ s.requested }} шт.</span>
                    </div>
                    <div class="missing-badge">
                      <span>Не хватает {{ s.missing }} шт.</span>
                    </div>
                  </div>
                </div>

                <div class="replacement-title">
                  <span class="title-icon">✨</span>
                  <span>Выберите вариант замены</span>
                </div>

                <div class="replacement-grid">
                  <button v-for="opt in s.suggestions" :key="opt.id"
                          @click="applyReplacement(s.flower_id, opt.id, 'replace')"
                          class="replacement-card replace-card">
                    <span class="card-icon">🔄</span>
                    <div class="card-info">
                      <span class="card-name">{{ opt.nazvanie }}</span>
                      <span class="card-price">{{ formatPrice(opt.price) }}</span>
                    </div>
                    <span class="card-arrow">→</span>
                  </button>
                  
                  <button @click="applyReplacement(s.flower_id, null, 'reduce')"
                          class="replacement-card reduce-card">
                    <span class="card-icon">📉</span>
                    <div class="card-info">
                      <span class="card-name">Уменьшить количество</span>
                      <span class="card-hint">до {{ s.available }} шт.</span>
                    </div>
                    <span class="card-arrow">→</span>
                  </button>
                  
                  <button @click="applyReplacement(s.flower_id, null, 'remove')"
                          class="replacement-card remove-card">
                    <span class="card-icon">🗑</span>
                    <div class="card-info">
                      <span class="card-name">Удалить из заказа</span>
                      <span class="card-hint">полностью</span>
                    </div>
                    <span class="card-arrow">→</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button @click="showReplacementModal = false" class="btn-continue">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span>Продолжить оформление</span>
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/api';
import { useToastStore } from '@/stores/toast';
import { useCart } from '@/composables/useCart';

const router = useRouter();
const toast = useToastStore();

// ===== ИСПОЛЬЗУЕМ useCart ДЛЯ УПРАВЛЕНИЯ СОСТОЯНИЕМ =====
const { 
  cart, 
  bouquetIds, 
  selectedPackaging, 
  saveCart, 
  loadFromServer,
  isAuthenticated 
} = useCart();

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

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====
const getItemsForBouquet = (bid) => {
  return cart.value.filter(i => i.bouquet_id === bid);
};

const getPackagingPrice = (bid) => {
  return packagingOptions.find(p => p.value === (selectedPackaging.value[bid] || 'none'))?.price || 0;
};

// ===== ВЫЧИСЛЯЕМЫЕ СВОЙСТВА =====
const totalItemsCount = computed(() => {
  return cart.value.reduce((acc, i) => acc + i.qty, 0);
});

const totalGoodsPrice = computed(() => {
  return cart.value.reduce((sum, i) => sum + (i.price * i.qty), 0);
});

const totalPackagingPrice = computed(() => {
  return bouquetIds.value.reduce((sum, id) => sum + getPackagingPrice(id), 0);
});

const grandTotal = computed(() => {
  return totalGoodsPrice.value + totalPackagingPrice.value;
});

const formatPrice = (price) => {
  if (!price && price !== 0) return '0 ₽';
  return new Intl.NumberFormat('ru-RU').format(Math.round(price)) + ' ₽';
};

// ===== СОХРАНЕНИЕ ВСЕХ ДАННЫХ =====
const saveFullState = () => {
  // Сохраняем через useCart
  saveCart();
  
  // Дополнительно сохраняем в localStorage для надежности
  try {
    localStorage.setItem('cart_items', JSON.stringify(cart.value));
    localStorage.setItem('cart_bouquet_ids', JSON.stringify(bouquetIds.value));
    localStorage.setItem('cart_packaging', JSON.stringify(selectedPackaging.value));
  } catch (e) {
    console.warn('Ошибка сохранения в localStorage:', e);
  }
};

const loadFullState = () => {
  // Пытаемся загрузить из localStorage
  try {
    const savedItems = localStorage.getItem('cart_items');
    const savedIds = localStorage.getItem('cart_bouquet_ids');
    const savedPackaging = localStorage.getItem('cart_packaging');
    
    if (savedItems) {
      const parsed = JSON.parse(savedItems);
      if (Array.isArray(parsed) && parsed.length > 0) {
        cart.value = parsed;
      }
    }
    
    if (savedIds) {
      const parsed = JSON.parse(savedIds);
      if (Array.isArray(parsed) && parsed.length > 0) {
        bouquetIds.value = parsed;
      } else if (cart.value.length > 0) {
        // Если есть товары, но нет ID - создаем ID
        const uniqueIds = [...new Set(cart.value.map(i => i.bouquet_id))];
        bouquetIds.value = uniqueIds.length > 0 ? uniqueIds : [1];
      }
    } else if (cart.value.length > 0) {
      // Если нет ID, но есть товары - создаем
      const uniqueIds = [...new Set(cart.value.map(i => i.bouquet_id))];
      bouquetIds.value = uniqueIds.length > 0 ? uniqueIds : [1];
    }
    
    if (savedPackaging) {
      const parsed = JSON.parse(savedPackaging);
      if (typeof parsed === 'object' && parsed !== null) {
        selectedPackaging.value = parsed;
      }
    }
  } catch (e) {
    console.warn('Ошибка загрузки из localStorage:', e);
  }
  
  // Если корзина пуста, но есть ID - очищаем ID
  if (cart.value.length === 0 && bouquetIds.value.length > 0) {
    bouquetIds.value = [1];
  }
  
  // Если есть товары, но нет ID - создаем
  if (cart.value.length > 0 && bouquetIds.value.length === 0) {
    const uniqueIds = [...new Set(cart.value.map(i => i.bouquet_id))];
    bouquetIds.value = uniqueIds.length > 0 ? uniqueIds : [1];
  }
  
  // Очищаем неиспользуемые ID
  cleanupBouquetIds();
};

// Очистка неиспользуемых ID
const cleanupBouquetIds = () => {
  if (cart.value.length === 0) {
    bouquetIds.value = [1];
    return;
  }
  
  const usedIds = new Set(cart.value.map(i => i.bouquet_id));
  // Фильтруем только те ID, которые есть в корзине
  const validIds = bouquetIds.value.filter(id => usedIds.has(id));
  
  // Если все ID невалидны - создаем новый
  if (validIds.length === 0) {
    const firstBouquetId = cart.value[0]?.bouquet_id || 1;
    bouquetIds.value = [firstBouquetId];
    // Обновляем все товары на новый ID
    cart.value.forEach(item => {
      item.bouquet_id = firstBouquetId;
    });
  } else {
    bouquetIds.value = validIds;
  }
  
  // Удаляем пустые записи упаковки
  const usedIdsSet = new Set(bouquetIds.value);
  Object.keys(selectedPackaging.value).forEach(key => {
    if (!usedIdsSet.has(Number(key))) {
      delete selectedPackaging.value[key];
    }
  });
};

// ===== ОСНОВНЫЕ ФУНКЦИИ =====
const changeQty = (item, delta) => {
  const newQty = item.qty + delta;
  if (newQty < 1) return;
  item.qty = newQty;
  saveFullState();
};

const removeItem = (item) => {
  cart.value = cart.value.filter(i => i !== item);
  // Удаляем пустые букеты
  cleanupBouquetIds();
  saveFullState();
  toast.info('Товар удалён из корзины');
};

const onQtyChange = (item) => {
  let val = parseInt(item.qty);
  if (isNaN(val) || val < 1) val = 1;
  if (val > 999) val = 999;
  item.qty = val;
  saveFullState();
};

const addNewBouquetGroup = () => {
  const newId = bouquetIds.value.length > 0 ? Math.max(...bouquetIds.value) + 1 : 1;
  bouquetIds.value.push(newId);
  selectedPackaging.value[newId] = 'none';
  saveFullState();
  toast.success(`Создана сборка №${newId}`);
};

const removeBouquetGroup = (bid) => {
  if (confirm(`Удалить Букет №${bid}?`)) {
    bouquetIds.value = bouquetIds.value.filter(id => id !== bid);
    cart.value = cart.value.filter(i => i.bouquet_id !== bid);
    delete selectedPackaging.value[bid];
    saveFullState();
    toast.success(`Сборка №${bid} удалена`);
  }
};

const buildPackagesPayload = () => {
  return bouquetIds.value.map(bid => {
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
};

const sendOrder = async () => {
  if (!pickupLocation.value) {
    error.value = 'Выберите точку самовывоза';
    return;
  }
  
  loading.value = true;
  error.value = '';
  
  try {
    await api.post('/cart/validate', { packages: buildPackagesPayload() });
    await api.post('/orders', {
      pickup_location: pickupLocation.value,
      packages: buildPackagesPayload()
    });
    
    // Очищаем корзину после успешного заказа
    cart.value = [];
    bouquetIds.value = [1];
    selectedPackaging.value = {};
    pickupLocation.value = '';
    saveFullState();
    
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
    if (e.response?.data?.errors) {
      error.value = Object.values(e.response.data.errors).flat().join('\n');
    } else {
      error.value = e.response?.data?.error || e.response?.data?.message || 'Ошибка сервера';
    }
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
  
  saveFullState();
  showReplacementModal.value = false;
};

// ===== WATCH ДЛЯ АВТОСОХРАНЕНИЯ =====
watch([cart, bouquetIds, selectedPackaging], () => {
  saveFullState();
}, { deep: true });

// ===== MOUNTED =====
onMounted(async () => {
  // Сначала загружаем из localStorage
  loadFullState();
  
  // Затем синхронизируем с сервером (если авторизован)
  if (isAuthenticated) {
    await loadFromServer();
    // После загрузки с сервера - пересохраняем локально
    saveFullState();
  }
  
  // Финальная очистка
  cleanupBouquetIds();
});
</script>

<style scoped>
/* ===== ОСНОВНЫЕ СТИЛИ КОРЗИНЫ ===== */
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
  --primary-dark: #361550;
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
  justify-content: center;
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
.item-total { font-weight: 700; font-size: 1.1rem; min-width: 80px;  }
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

/* ===== 🌸 КРАСИВОЕ МОДАЛЬНОЕ ОКНО LAVENDER ===== */
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
  position: relative;
  background: white;
  border-radius: 32px;
  width: 100%;
  max-width: 680px;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px -12px rgba(72, 28, 105, 0.3);
  animation: modalSlideIn 0.4s cubic-bezier(0.21, 1.11, 0.35, 1);
}

@keyframes modalSlideIn {
  from {
    transform: translateY(30px) scale(0.96);
    opacity: 0;
  }
  to {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

.modal-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--primary), #9b59b6, var(--primary));
  border-radius: 32px 32px 0 0;
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 28px 28px 20px 28px;
  border-bottom: 2px solid var(--primary-light);
}

.modal-icon {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, var(--primary), #7c3aed);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 8px 20px rgba(72, 28, 105, 0.3);
}

.header-text {
  flex: 1;
}

.header-text h3 {
  margin: 0 0 4px;
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--text-main);
}

.header-text p {
  margin: 0;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.close-modal {
  width: 36px;
  height: 36px;
  background: var(--primary-light);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s;
  color: var(--primary);
}

.close-modal:hover {
  background: var(--primary);
  color: white;
  transform: rotate(90deg);
}

.modal-body {
  padding: 20px 28px;
  max-height: 55vh;
  overflow-y: auto;
}

.shortage-item {
  display: flex;
  gap: 16px;
  background: white;
  border: 1px solid var(--border);
  border-radius: 20px;
  margin-bottom: 20px;
  overflow: hidden;
  transition: all 0.25s;
}

.shortage-item:hover {
  border-color: var(--primary-light);
  box-shadow: 0 4px 12px rgba(72, 28, 105, 0.1);
}

.shortage-badge {
  width: 36px;
  background: linear-gradient(135deg, var(--primary), #7c3aed);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.1rem;
}

.shortage-content {
  flex: 1;
  padding: 16px 16px 16px 0;
}

.product-row {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.product-image {
  width: 70px;
  height: 70px;
  border-radius: 16px;
  overflow: hidden;
  background: var(--primary-light);
  flex-shrink: 0;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-details {
  flex: 1;
}

.product-details h4 {
  margin: 0 0 8px;
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-main);
}

.stock-info {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 0.8rem;
  margin-bottom: 8px;
}

.stock-label {
  color: var(--text-muted);
}

.stock-value {
  font-weight: 600;
  color: var(--success);
}

.stock-value.stock-low {
  color: var(--danger);
}

.requested-label {
  color: var(--text-muted);
}

.requested-value {
  font-weight: 600;
  color: var(--text-main);
}

.missing-badge {
  display: inline-flex;
  background: #fee2e2;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--danger);
}

.replacement-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 16px 0 12px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-muted);
}

.title-icon {
  font-size: 1rem;
}

.replacement-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.replacement-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 16px;
  background: white;
  border: 1px solid var(--border);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.25s;
  width: 100%;
  text-align: left;
}

.replacement-card:hover {
  transform: translateX(6px);
}

.card-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
}

.card-info {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.card-name {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text-main);
}

.card-price {
  font-weight: 700;
  font-size: 0.85rem;
  color: var(--primary);
}

.card-hint {
  font-size: 0.7rem;
  color: var(--text-muted);
}

.card-arrow {
  color: var(--primary);
  font-size: 1.1rem;
  opacity: 0;
  transition: opacity 0.25s, transform 0.25s;
}

.replacement-card:hover .card-arrow {
  opacity: 1;
  transform: translateX(4px);
}

.replace-card:hover {
  background: var(--primary-light);
  border-color: var(--primary);
}

.reduce-card:hover {
  background: #fef3c7;
  border-color: #f59e0b;
}

.reduce-card:hover .card-name {
  color: #d97706;
}

.remove-card:hover {
  background: #fee2e2;
  border-color: var(--danger);
}

.remove-card:hover .card-name {
  color: var(--danger);
}

.modal-footer {
  padding: 20px 28px;
  border-top: 1px solid var(--border);
  background: var(--bg-light);
  border-radius: 0 0 32px 32px;
}

.btn-continue {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, var(--primary), #7c3aed);
  color: white;
  border: none;
  border-radius: 16px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.25s;
}

.btn-continue:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(72, 28, 105, 0.3);
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

/* ===== АДАПТИВ ===== */
@media (max-width: 1200px) {
  .cart-page {
    padding: 40px 20px;
  }
}

@media (max-width: 991px) {
  .cart-content {
    flex-direction: column;
    gap: 30px;
  }
  
  .summary-section {
    width: 100%;
    position: static;
    flex: 0 0 auto;
    order: -1;
  }
  
  .bouquet-options {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
  
  .bouquet-switcher {
    flex-wrap: wrap;
  }
}

@media (max-width: 768px) {
  .cart-page {
    padding: 30px 15px;
  }
  
  .page-title {
    font-size: 2rem;
    margin-bottom: 30px;
  }
  
  .cart-item {
    flex-direction: column;
    gap: 15px;
    padding: 15px 0;
    align-items: stretch;
  }
  
  .item-details {
    width: 100%;
  }
  
  .item-controls {
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 12px;
    width: 100%;
  }
  
  .bouquet-switcher {
    width: 100%;
    margin-bottom: 5px;
  }
  
  .bouquet-switcher select {
    flex: 1;
    min-width: 120px;
  }
  
  .qty-control {
    order: 2;
  }
  
  .item-actions {
    display: flex;
    align-items: center;
    gap: 15px;
    order: 3;
    flex: 1;
    justify-content: flex-end;
  }
  
  .item-total {
    min-width: 60px;
  }
  
  .bouquet-header {
    flex-wrap: wrap;
    gap: 10px;
  }
  
  .bouquet-title {
    font-size: 1.1rem;
    flex: 1;
  }
  
  .summary-section {
    padding: 20px;
  }
  
  .summary-row.total {
    font-size: 1.1rem;
  }
  
  .btn-checkout {
    font-size: 1rem;
    padding: 14px;
  }
  
  .bouquet-options label {
    width: 100%;
  }
  
  .bouquet-options select {
    width: 100%;
  }
  
  .packaging-price {
    width: 100%;
    text-align: center;
  }
}

@media (max-width: 480px) {
  .cart-page {
    padding: 20px 10px;
  }
  
  .page-title {
    font-size: 1.5rem;
    margin-bottom: 20px;
  }
  
  .bouquet-group {
    margin-bottom: 25px;
    padding-bottom: 15px;
  }
  
  .bouquet-title {
    font-size: 1rem;
  }
  
  .item-details {
    gap: 10px;
  }
  
  .item-image-placeholder {
    width: 45px;
    height: 45px;
    font-size: 0.9rem;
  }
  
  .item-text h4 {
    font-size: 0.95rem;
    margin-bottom: 3px;
  }
  
  .item-price {
    font-size: 0.8rem;
  }
  
  .item-controls {
    gap: 8px;
  }
  
  .qty-control {
    height: 32px;
  }
  
  .qty-control button {
    width: 28px;
    height: 28px;
    font-size: 0.9rem;
  }
  
  .qty-input {
    width: 40px;
    font-size: 0.9rem;
  }
  
  .item-total {
    font-size: 0.95rem;
    min-width: 50px;
  }
  
  .btn-remove {
    font-size: 1rem;
  }
  
  .btn-add-bouquet {
    padding: 12px;
    font-size: 0.9rem;
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
  }
  
  .summary-row.total {
    font-size: 1rem;
    margin-top: 15px;
    padding-top: 15px;
  }
  
  .pickup-section {
    margin: 15px 0;
  }
  
  .form-select {
    padding: 10px;
    font-size: 0.9rem;
  }
  
  .error-msg {
    font-size: 0.8rem;
    padding: 10px;
  }
  
  /* Адаптив модального окна */
  .replacement-modal {
    max-width: 95%;
    border-radius: 24px;
  }
  
  .modal-header {
    padding: 20px 20px 16px;
    flex-wrap: wrap;
  }
  
  .modal-icon {
    width: 48px;
    height: 48px;
  }
  
  .modal-icon svg {
    width: 24px;
    height: 24px;
  }
  
  .header-text h3 {
    font-size: 1.1rem;
  }
  
  .header-text p {
    font-size: 0.75rem;
  }
  
  .modal-body {
    padding: 16px 20px;
  }
  
  .shortage-item {
    flex-direction: column;
  }
  
  .shortage-badge {
    width: 100%;
    height: 28px;
    font-size: 0.9rem;
  }
  
  .shortage-content {
    padding: 16px;
  }
  
  .product-row {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  
  .product-image {
    width: 80px;
    height: 80px;
  }
  
  .stock-info {
    justify-content: center;
  }
  
  .card-info {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .modal-footer {
    padding: 16px 20px;
  }
  
  .btn-continue {
    padding: 12px;
    font-size: 0.9rem;
  }
}

@media (max-width: 360px) {
  .item-controls {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
  
  .item-actions {
    justify-content: space-between;
    width: 100%;
  }
  
  .qty-control {
    width: 100%;
    justify-content: center;
  }
}

/* Улучшения для touch устройств */
@media (hover: none) and (max-width: 768px) {
  .replacement-card:hover {
    transform: none;
  }
  
  .replacement-card:active {
    transform: scale(0.98);
  }
  
  .btn-checkout:active {
    transform: scale(0.98);
  }
}

@media (max-width: 768px) {
  .modal-body {
    max-height: 60vh;
  }
  
  .shortage-item {
    margin-bottom: 15px;
  }
}

@media print {
  .cart-page {
    padding: 20px;
  }
  
  .btn-checkout,
  .btn-add-bouquet,
  .btn-remove,
  .btn-remove-bouquet,
  .close-modal {
    display: none !important;
  }
}
</style>
