import { ref, computed } from 'vue';
import api from '@/api';

// 🔒 Singleton-состояние: одно на всё приложение
const cart = ref([]);
const bouquetIds = ref([]);
const selectedPackaging = ref({});
let isSyncing = false;
let isInitialized = false; // 🆕 Флаг, чтобы не перезаписывать корзину дважды

export function useCart() {
  const isAuthenticated = computed(() => !!localStorage.getItem('token'));
  const getCartCount = computed(() => cart.value.reduce((sum, i) => sum + (i.qty || 0), 0));

  // 🔧 Функция для проверки и установки типа у всех товаров в корзине
  const ensureItemTypes = () => {
    let changed = false;
    cart.value = cart.value.map(item => {
      if (!item.type) {
        item.type = 'flower';
        changed = true;
      }
      return item;
    });
    
    if (changed) {
      console.log('✅ Добавлены типы товарам в корзине:', cart.value);
      localStorage.setItem('cart', JSON.stringify(cart.value));
    }
    
    return changed;
  };

  const loadFromServer = async () => {
    // 🆕 Если уже инициализировали и корзина не пустая - не перезаписываем
    if (isInitialized && cart.value.length > 0) {
      console.log('📦 Корзина уже загружена, пропускаем загрузку с сервера');
      return;
    }
    
    if (isAuthenticated.value) {
      try {
        console.log('🔄 Загрузка корзины с сервера...');
        const { data } = await api.get('/cart');
        
        // 🆕 Проверяем, есть ли данные
        if (data && data.items && data.items.length > 0) {
          cart.value = data.items;
          bouquetIds.value = data.bouquet_ids || [1];
          selectedPackaging.value = data.packaging || {};
          
          // ✅ Добавляем проверку типов
          ensureItemTypes();
          
          console.log('✅ Корзина загружена с сервера:', cart.value.length, 'товаров');
        } else {
          // 🆕 Если на сервере пусто, но в localStorage есть - загружаем оттуда
          loadFromLocal();
        }
        
        // Очищаем гостевое хранилище
        localStorage.removeItem('cart');
        localStorage.removeItem('cart_bouquet_ids');
        localStorage.removeItem('cart_packaging');
      } catch (error) {
        console.warn('⚠️ Ошибка загрузки с сервера, загружаем из localStorage:', error);
        loadFromLocal();
      }
    } else {
      loadFromLocal();
    }
    
    isInitialized = true;
  };

  const loadFromLocal = () => {
    console.log('📂 Загрузка корзины из localStorage...');
    
    try {
      const savedCart = localStorage.getItem('cart');
      const savedBouquetIds = localStorage.getItem('cart_bouquet_ids');
      const savedPackaging = localStorage.getItem('cart_packaging');
      
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        if (Array.isArray(parsedCart) && parsedCart.length > 0) {
          cart.value = parsedCart;
          console.log('✅ Загружено из localStorage:', cart.value.length, 'товаров');
        } else {
          cart.value = [];
          console.log('📦 В localStorage пустая корзина');
        }
      } else {
        cart.value = [];
        console.log('📦 В localStorage нет корзины');
      }
      
      bouquetIds.value = savedBouquetIds ? JSON.parse(savedBouquetIds) : [1];
      selectedPackaging.value = savedPackaging ? JSON.parse(savedPackaging) : {};
      
      // ✅ Добавляем проверку типов
      ensureItemTypes();
      
      // 🆕 Если bouquetIds пустой - ставим [1]
      if (!bouquetIds.value || bouquetIds.value.length === 0) {
        bouquetIds.value = [1];
      }
      
    } catch (error) {
      console.error('❌ Ошибка загрузки из localStorage:', error);
      cart.value = [];
      bouquetIds.value = [1];
      selectedPackaging.value = {};
    }
  };

  const saveLocal = async () => {
    console.log('💾 Сохранение корзины в localStorage:', cart.value.length, 'товаров');
    
    // 1. Мгновенно сохраняем в localStorage для реактивности UI
    localStorage.setItem('cart', JSON.stringify(cart.value));
    localStorage.setItem('cart_bouquet_ids', JSON.stringify(bouquetIds.value));
    localStorage.setItem('cart_packaging', JSON.stringify(selectedPackaging.value));

    if (!isAuthenticated.value || isSyncing) return;
    
    // 2. Синхронизация с БД
    isSyncing = true;
    try {
      await new Promise(r => setTimeout(r, 300));
      const { data } = await api.post('/cart/sync', {
        items: cart.value,
        bouquet_ids: bouquetIds.value,
        packaging: selectedPackaging.value
      });
      cart.value = data.items || cart.value;
      bouquetIds.value = data.bouquet_ids || bouquetIds.value;
      selectedPackaging.value = data.packaging || selectedPackaging.value;
      console.log('✅ Корзина синхронизирована с сервером');
    } catch (e) {
      console.warn('⚠️ Cart sync failed:', e);
    } finally {
      isSyncing = false;
    }
  };

  const mergeGuestToServer = async () => {
    if (!isAuthenticated.value) return;
    loadFromLocal();
    await saveLocal();
  };

  // 🆕 Функция для принудительной очистки корзины
  const clearCart = () => {
    cart.value = [];
    bouquetIds.value = [1];
    selectedPackaging.value = {};
    localStorage.removeItem('cart');
    localStorage.removeItem('cart_bouquet_ids');
    localStorage.removeItem('cart_packaging');
    console.log('🗑️ Корзина очищена');
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
    ensureItemTypes,
    clearCart
  };
}
