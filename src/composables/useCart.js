import { ref, computed } from 'vue';
import api from '@/api';

// 🔒 Singleton-состояние: одно на всё приложение
const cart = ref([]);
const bouquetIds = ref([]);
const selectedPackaging = ref({});
let isSyncing = false;

export function useCart() {
  const isAuthenticated = computed(() => !!localStorage.getItem('token'));
  const getCartCount = computed(() => cart.value.reduce((sum, i) => sum + (i.qty || 0), 0));

  // 🔧 Функция для проверки и установки типа у всех товаров в корзине
  const ensureItemTypes = () => {
    let changed = false;
    cart.value = cart.value.map(item => {
      if (!item.type) {
        // Если тип не указан, ставим 'flower' (каталог) по умолчанию
        item.type = 'flower';
        changed = true;
      }
      return item;
    });
    
    if (changed) {
      console.log('✅ Добавлены типы товарам в корзине:', cart.value);
      // Сохраняем в localStorage чтобы не потерять
      localStorage.setItem('cart', JSON.stringify(cart.value));
    }
    
    return changed;
  };

  const loadFromServer = async () => {
    if (isAuthenticated.value) {
      try {
        const { data } = await api.get('/cart');
        // 🛡️ Не перезаписываем, если локальная корзина уже не пуста и новее
        if (cart.value.length === 0 || data.items?.length > 0) {
          cart.value = data.items || [];
          bouquetIds.value = data.bouquet_ids || [];
          selectedPackaging.value = data.packaging || {};
          
          // ✅ Добавляем проверку типов
          ensureItemTypes();
          
          // Очищаем гостевое хранилище
          localStorage.removeItem('cart');
          localStorage.removeItem('cart_bouquet_ids');
          localStorage.removeItem('cart_packaging');
        }
      } catch {
        loadFromLocal();
      }
    } else {
      loadFromLocal();
    }
  };

  const loadFromLocal = () => {
    // Загружаем из localStorage
    const savedCart = localStorage.getItem('cart');
    const savedBouquetIds = localStorage.getItem('cart_bouquet_ids');
    const savedPackaging = localStorage.getItem('cart_packaging');
    
    cart.value = savedCart ? JSON.parse(savedCart) : [];
    bouquetIds.value = savedBouquetIds ? JSON.parse(savedBouquetIds) : [];
    selectedPackaging.value = savedPackaging ? JSON.parse(savedPackaging) : {};
    
    // ✅ Добавляем проверку типов при загрузке из localStorage
    ensureItemTypes();
    
    if (bouquetIds.value.length === 0) bouquetIds.value = [1];
    
    console.log('📦 Загружено из localStorage:', {
      items: cart.value.length,
      bouquetIds: bouquetIds.value,
      packaging: selectedPackaging.value
    });
  };

  const saveLocal = async () => {
    // 1. Мгновенно сохраняем в localStorage для реактивности UI
    localStorage.setItem('cart', JSON.stringify(cart.value));
    localStorage.setItem('cart_bouquet_ids', JSON.stringify(bouquetIds.value));
    localStorage.setItem('cart_packaging', JSON.stringify(selectedPackaging.value));

    if (!isAuthenticated.value || isSyncing) return;
    
    // 2. Синхронизация с БД
    isSyncing = true;
    try {
      // Небольшая задержка для предотвращения спама запросами при быстрых кликах
      await new Promise(r => setTimeout(r, 300));
      const { data } = await api.post('/cart/sync', {
        items: cart.value,
        bouquet_ids: bouquetIds.value,
        packaging: selectedPackaging.value
      });
      // 3. Обновляем состояние ответом сервера (идемпотентно)
      cart.value = data.items || cart.value;
      bouquetIds.value = data.bouquet_ids || bouquetIds.value;
      selectedPackaging.value = data.packaging || selectedPackaging.value;
    } catch (e) {
      console.warn('Cart sync failed:', e);
    } finally {
      isSyncing = false;
    }
  };

  const mergeGuestToServer = async () => {
    if (!isAuthenticated.value) return;
    loadFromLocal();
    await saveLocal();
  };

  return {
    cart, 
    bouquetIds, 
    selectedPackaging, 
    isAuthenticated, 
    getCartCount,
    loadFromServer, 
    loadFromLocal, 
    saveLocal, 
    mergeGuestToServer,
    ensureItemTypes // Экспортируем на случай если понадобится вручную вызвать
  };
}
