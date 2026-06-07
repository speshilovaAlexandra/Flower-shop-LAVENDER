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
          <!-- 🔄 Цикл по явно управляемым ID сборок -->
          <div v-for="bid in bouquetIds" :key="bid" class="bouquet-group">
            <div class="bouquet-header">
              <div class="bouquet-title">🌸 Букет №{{ bid }}</div>
              <button v-if="bid > 1" class="btn-remove-bouquet" @click="removeBouquetGroup(bid)" title="Удалить сборку">🗑</button>
            </div>

            <div class="bouquet-items">
              <div v-for="item in getItemsForBouquet(bid)" :key="`${item.id}-${item.bouquet_id}`" class="cart-item">
                <div class="item-details">
                  <div class="item-image-placeholder"><span>{{ item.nazvanie?.charAt(0) || '?' }}</span></div>
                  <div class="item-text">
                    <h4 class="item-name">{{ item.nazvanie || 'Цветок' }}</h4>
                    <p class="item-price">{{ formatPrice(item.price) }} / шт.</p>
                  </div>
                </div>

                <div class="item-controls">
                  <!-- 🆕 Селектор перемещения между сборками -->
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
          <div class="summary-row"><span>Товаров: {{ totalItemsCount }} шт.</span><span>{{ totalGoodsPrice }} ₽</span></div>
          <div class="summary-row"><span>Упаковка:</span><span>{{ totalPackagingPrice }} ₽</span></div>
          <div class="summary-row total"><span>Итого к оплате:</span><span>{{ grandTotal }} ₽</span></div>

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
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
              {{ error }}
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- 🆕 Модальное окно замены -->
    <transition name="modal-fade">
      <div v-if="showReplacementModal" class="modal-overlay" @click.self="showReplacementModal = false">
        <div class="replacement-modal">
          <div class="modal-header">
            <h3>⚠️ Не все товары в наличии</h3>
            <button @click="showReplacementModal = false" class="btn-close">✕</button>
          </div>
          <div class="modal-body">
            <div v-for="s in shortages" :key="s.flower_id" class="shortage-block">
              <div class="shortage-item">
                <img :src="s.image || '/images/placeholder.jpg'" class="item-thumb" alt="">
                <div>
                  <h4>{{ s.name }}</h4>
                  <p>Запрошено: {{ s.requested }} шт. | В наличии: <strong>{{ s.available }} шт.</strong></p>
                </div>
              </div>
              
              <div class="replacement-options">
                <p class="option-title">Чем заменить недостающие {{ s.missing }} шт.?</p>
                <div class="suggestion-grid">
                  <button v-for="opt in s.suggestions" :key="opt.id" 
                          @click="applyReplacement(s.flower_id, opt.id, 'replace')" 
                          class="btn-suggest">
                    🔄 {{ opt.nazvanie }} ({{ opt.price }} ₽)
                  </button>
                  <button @click="applyReplacement(s.flower_id, null, 'reduce')" class="btn-reduce">
                    📉 Оставить только {{ s.available }} шт.
                  </button>
                  <button @click="applyReplacement(s.flower_id, null, 'remove')" class="btn-remove-item">
                    🗑 Убрать из заказа
                  </button>
                </div>
              </div>
            </div>
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
const pickupPoints = ['г. Пермь, ул. Ленина, 15 (Центр)', 'г. Пермь, ул. Сибирская, 42 (Закамск)', 'г. Пермь, ул. Космонавтов, 110 (Индустриальный)'];

const getItemsForBouquet = (bid) => cart.value.filter(i => i.bouquet_id === bid);
const getPackagingPrice = (bid) => packagingOptions.find(p => p.value === (selectedPackaging.value[bid] || 'none'))?.price || 0;
const totalItemsCount = computed(() => cart.value.reduce((acc, i) => acc + i.qty, 0));
const totalGoodsPrice = computed(() => cart.value.reduce((sum, i) => sum + (i.price * i.qty), 0));
const totalPackagingPrice = computed(() => bouquetIds.value.reduce((sum, id) => sum + getPackagingPrice(id), 0));
const grandTotal = computed(() => totalGoodsPrice.value + totalPackagingPrice.value);
const formatPrice = (price) => new Intl.NumberFormat('ru-RU').format(price) + ' ₽';

const changeQty = (item, delta) => { item.qty = Math.max(1, item.qty + delta); saveLocal(); };
const removeItem = (item) => { cart.value = cart.value.filter(i => i !== item); saveLocal(); };
const onQtyChange = (item) => {
  let val = parseInt(item.qty);
  // Защита от пустых/отрицательных/слишком больших значений
  if (isNaN(val) || val < 1) val = 1;
  if (val > 999) val = 999;
  
  item.qty = val;
  saveLocal(); // Мгновенно сохраняет в localStorage + debounce-синк с БД
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
    items: items.map(item => ({ id: item.id, qty: item.qty }))
  };
}).filter(Boolean);

const sendOrder = async () => {
  if (!pickupLocation.value) return error.value = 'Выберите точку самовывоза';
  loading.value = true; error.value = '';
  try {
    await api.post('/cart/validate', { packages: buildPackagesPayload() });
    await api.post('/orders', { pickup_location: pickupLocation.value, packages: buildPackagesPayload() });
    
    cart.value = []; bouquetIds.value = [1]; selectedPackaging.value = {}; 
    pickupLocation.value = ''; saveLocal(); 
    router.push('/profile'); toast.success('Заказ успешно оформлен!');
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
  } finally { loading.value = false; }
};

const applyReplacement = (originalId, newId, mode) => {
  const idx = cart.value.findIndex(i => i.id === originalId);
  if (idx === -1) return;
  const item = cart.value[idx];
  if (mode === 'replace') {
    const shortage = shortages.value.find(s => s.flower_id === originalId);
    const suggestion = shortage?.suggestions?.find(opt => opt.id === newId);
    if (suggestion) {
      item.id = suggestion.id; item.nazvanie = suggestion.nazvanie;
      item.price = suggestion.price; item.image = suggestion.image_url || suggestion.img;
      toast.success(`Заменено на ${suggestion.nazvanie}`);
    }
  } else if (mode === 'reduce') {
    const shortage = shortages.value.find(s => s.flower_id === originalId);
    if (shortage) { item.qty = Math.min(item.qty, shortage.available); toast.info(`Количество уменьшено до ${item.qty} шт.`); }
  } else if (mode === 'remove') {
    cart.value.splice(idx, 1); toast.info('Товар удалён из заказа');
  }
  saveLocal();
  showReplacementModal.value = false;
};

onMounted(() => {
  loadFromServer(); // ✅ Загрузка из сервера или localStorage
});
// onMounted(() => {
//   // ✅ Состояние уже загружено в App.vue и шарится через useCart().
//   // Повторный вызов loadFromServer() вызывал race condition и перезаписывал корзину.
  
//   // Миграционная страховка: если пользователь старый и нет bouquet_ids
//   if (bouquetIds.value.length === 0 && cart.value.length > 0) {
//     bouquetIds.value = [1];
//     saveLocal();
//   }
// });
</script>
<style scoped>
.qty-input {
  width: 50px;
  text-align: center;
  font-weight: 600;
  font-size: 1rem;
  border: none;
  background: transparent;
  outline: none;
  /* Скрываем стрелки браузера для чистого вида */
 /* // -moz-appearance: textfield; */
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
/* ⚠️ Ваши стили остаются без изменений */
.replacement-modal {
  background: white; border-radius: 16px; width: 100%; max-width: 600px; 
  max-height: 85vh; overflow-y: auto; box-shadow: 0 20px 40px rgba(0,0,0,0.2);
  animation: modal-slide-up 0.3s ease-out;
}
.shortage-block { border-bottom: 1px solid #e5e7eb; padding: 16px 0; }
.shortage-item { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.item-thumb { width: 50px; height: 50px; object-fit: cover; border-radius: 8px; }
.option-title { font-size: 0.9rem; color: var(--text-muted); margin-bottom: 8px; }
.suggestion-grid { display: flex; flex-wrap: wrap; gap: 8px; }
.btn-suggest, .btn-reduce, .btn-remove-item {
  padding: 8px 12px; border-radius: 8px; border: 1px solid #e5e7eb; background: #fff;
  cursor: pointer; font-size: 0.85rem; transition: 0.2s;
}
.btn-suggest:hover { background: #f3f0f7; border-color: var(--primary); }
.btn-reduce:hover { background: #fef3c7; border-color: #d97706; }
.btn-remove-item:hover { background: #fee2e2; border-color: #ef4444; }
.bouquet-switcher { display: flex; align-items: center; gap: 8px; margin-bottom: 5px; }
.bouquet-switcher label { font-size: 0.85rem; color: var(--text-muted); }
.form-select-small { padding: 6px 8px; border: 1px solid #ddd; border-radius: 6px; background: #fff; font-size: 0.9rem; }
.packaging-price { color: var(--text-muted); font-size: 0.9rem; margin-top: 5px; }
:root { --primary: #1a1a1a; --accent: #D0C4C8; --bg-light: #f9f9f9; --text-main: #333; --text-muted: #666; --border: #e5e5e5; --danger: #ef4444; }
.cart-page { padding: 60px 40px; min-height: 100vh; font-family: 'Inter', sans-serif; max-width: 1400px; margin: 0 auto; }
.container { max-width: 100%; }
.page-title { font-size: 2.5rem; margin-bottom: 40px; color: var(--text-main); }
.empty-state { text-align: center; padding: 100px 20px; background: var(--bg-light); border-radius: 12px; border: 1px dashed var(--border); }
.empty-icon { font-size: 5rem; margin-bottom: 25px; }
.btn-browse { padding: 14px 32px; background: var(--primary); color: #fff; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; }
.cart-content { display: flex; gap: 50px; align-items: flex-start; }
.bouquets-list { flex: 1; min-width: 0; }
.bouquet-group { margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px dashed var(--border); }
.bouquet-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.bouquet-title { font-size: 1.4rem; font-weight: 700; color: var(--text-main); }
.btn-remove-bouquet { background: none; border: none; font-size: 1.2rem; cursor: pointer; color: #999; }
.btn-remove-bouquet:hover { color: var(--danger); }
.btn-add-bouquet { width: 100%; padding: 15px; background: #fff; border: 2px dashed var(--border); color: var(--text-muted); font-weight: 600; cursor: pointer; border-radius: 8px; transition: 0.2s; }
.btn-add-bouquet:hover { border-color: var(--primary); color: var(--primary); }
.cart-item { display: flex; justify-content: space-between; align-items: center; padding: 15px 0; border-bottom: 1px solid #eee; }
.item-details { display: flex; align-items: center; gap: 15px; }
.item-image-placeholder { width: 60px; height: 60px; background: var(--accent); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #fff; font-size: 1.2rem; }
.item-text h4 { margin: 0 0 5px; font-size: 1.1rem; }
.item-price { margin: 0; color: var(--text-muted); font-size: 0.9rem; }
.item-controls { display: flex; align-items: center; gap: 20px; }
.qty-control { display: flex; align-items: center; background: #f5f5f5; border-radius: 6px; }
.qty-control button { width: 32px; height: 32px; border: none; background: transparent; cursor: pointer; }
.qty-value { width: 40px; text-align: center; font-weight: 600; }
.item-total { font-weight: 700; font-size: 1.1rem; min-width: 80px; text-align: right; }
.btn-remove { background: none; border: none; cursor: pointer; color: #ccc; font-size: 1.2rem; }
.btn-remove:hover { color: var(--danger); }
.bouquet-options { margin-top: 15px; padding: 15px; background: #fafafa; border-radius: 8px; display: flex; align-items: center; gap: 15px; flex-wrap: wrap; }
.bouquet-options label { font-weight: 600; font-size: 0.9rem; }
.form-select-small { padding: 8px; border: 1px solid #ddd; border-radius: 6px; }
.packaging-price { color: var(--text-muted); font-size: 0.9rem; margin-left: auto; }
.summary-section { flex: 0 0 400px; background: var(--bg-light); padding: 30px; border-radius: 12px; border: 1px solid var(--border); position: sticky; top: 100px; }
.summary-section h3 { margin-top: 0; margin-bottom: 25px; font-size: 1.3rem; }
.summary-row { display: flex; justify-content: space-between; margin-bottom: 12px; color: var(--text-muted); }
.summary-row.total { margin-top: 20px; padding-top: 20px; border-top: 2px solid var(--border); color: var(--text-main); font-weight: 700; font-size: 1.3rem; }
.pickup-section { margin: 25px 0; }
.pickup-section label { display: block; font-weight: 600; margin-bottom: 8px; font-size: 0.9rem; }
.form-select { width: 100%; padding: 12px; border: 1px solid var(--border); border-radius: 8px; }
.btn-checkout { width: 100%; padding: 16px; background: var(--primary); color: #fff; border: none; border-radius: 10px; font-size: 1.1rem; font-weight: 600; cursor: pointer; }
.btn-checkout:disabled { background: #ccc; cursor: not-allowed; }
.error-msg { display: flex; align-items: center; gap: 10px; color: var(--danger); background: #fee2e2; padding: 12px; border-radius: 8px; font-size: 0.9rem; margin-top: 15px; }
@media (max-width: 991px) { .cart-content { flex-direction: column; } .summary-section { width: 100%; position: static; } }
</style>