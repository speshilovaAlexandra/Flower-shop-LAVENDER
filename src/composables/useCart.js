// composables/useCart.js
import { ref, computed, watch } from 'vue';
import api from '@/api';
import { useAuthStore } from '@/stores/auth';

export function useCart() {
  const authStore = useAuthStore();
  const isAuthenticated = computed(() => authStore.isAuthenticated);

  // ===== СОСТОЯНИЕ =====
  const cart = ref([]);
  const bouquetIds = ref([1]);
  const selectedPackaging = ref({});
  const loading = ref(false);
  const error = ref(null);

  // ===== КЛЮЧИ ДЛЯ LOCALSTORAGE =====
  const STORAGE_KEYS = {
    CART: 'cart_items',
    BOUQUET_IDS: 'cart_bouquet_ids',
    PACKAGING: 'cart_packaging'
  };

  // ===== ЗАГРУЗКА ИЗ LOCALSTORAGE =====
  const loadFromLocalStorage = () => {
    try {
      const savedCart = localStorage.getItem(STORAGE_KEYS.CART);
      const savedIds = localStorage.getItem(STORAGE_KEYS.BOUQUET_IDS);
      const savedPackaging = localStorage.getItem(STORAGE_KEYS.PACKAGING);

      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed) && parsed.length > 0) {
          cart.value = parsed;
        }
      }

      if (savedIds) {
        const parsed = JSON.parse(savedIds);
        if (Array.isArray(parsed) && parsed.length > 0) {
          bouquetIds.value = parsed;
        }
      } else if (cart.value.length > 0) {
        // Если есть товары, но нет ID - создаем ID
        const uniqueIds = [...new Set(cart.value.map(i => i.bouquet_id))];
        bouquetIds.value = uniqueIds.length > 0 ? uniqueIds : [1];
      }

      if (savedPackaging) {
        const parsed = JSON.parse(savedPackaging);
        if (typeof parsed === 'object' && parsed !== null) {
          selectedPackaging.value = parsed;
        }
      }

      // Если корзина пуста, но есть ID - сбрасываем
      if (cart.value.length === 0 && bouquetIds.value.length > 0) {
        bouquetIds.value = [1];
        selectedPackaging.value = {};
      }

      // Если есть товары, но нет ID - создаем
      if (cart.value.length > 0 && bouquetIds.value.length === 0) {
        const uniqueIds = [...new Set(cart.value.map(i => i.bouquet_id))];
        bouquetIds.value = uniqueIds.length > 0 ? uniqueIds : [1];
      }

      // Очищаем неиспользуемые ID
      cleanupBouquetIds();

      return true;
    } catch (e) {
      console.warn('Ошибка загрузки из localStorage:', e);
      return false;
    }
  };

  // ===== СОХРАНЕНИЕ В LOCALSTORAGE =====
  const saveToLocalStorage = () => {
    try {
      localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart.value));
      localStorage.setItem(STORAGE_KEYS.BOUQUET_IDS, JSON.stringify(bouquetIds.value));
      localStorage.setItem(STORAGE_KEYS.PACKAGING, JSON.stringify(selectedPackaging.value));
      return true;
    } catch (e) {
      console.warn('Ошибка сохранения в localStorage:', e);
      return false;
    }
  };

  // ===== ОЧИСТКА НЕИСПОЛЬЗУЕМЫХ ID =====
  const cleanupBouquetIds = () => {
    if (cart.value.length === 0) {
      bouquetIds.value = [1];
      selectedPackaging.value = {};
      return;
    }

    const usedIds = new Set(cart.value.map(i => i.bouquet_id));
    const validIds = bouquetIds.value.filter(id => usedIds.has(id));

    if (validIds.length === 0) {
      const firstBouquetId = cart.value[0]?.bouquet_id || 1;
      bouquetIds.value = [firstBouquetId];
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

  // ===== ЗАГРУЗКА С СЕРВЕРА =====
  const loadFromServer = async () => {
    if (!isAuthenticated.value) {
      // Если не авторизован - загружаем из localStorage
      loadFromLocalStorage();
      return;
    }

    try {
      loading.value = true;
      const { data } = await api.get('/cart');
      
      if (data) {
        if (data.items && Array.isArray(data.items)) {
          cart.value = data.items;
        }
        if (data.bouquet_ids && Array.isArray(data.bouquet_ids)) {
          bouquetIds.value = data.bouquet_ids;
        }
        if (data.packaging && typeof data.packaging === 'object') {
          selectedPackaging.value = data.packaging;
        }
      }
      
      // Если с сервера пришли пустые данные, но есть локальные - используем локальные
      if (cart.value.length === 0) {
        loadFromLocalStorage();
      } else {
        // Сохраняем в localStorage для синхронизации
        saveToLocalStorage();
      }
      
      cleanupBouquetIds();
    } catch (e) {
      console.warn('Ошибка загрузки корзины с сервера:', e);
      // При ошибке загружаем из localStorage
      loadFromLocalStorage();
    } finally {
      loading.value = false;
    }
  };

  // ===== СОХРАНЕНИЕ НА СЕРВЕР =====
  const saveToServer = async () => {
    if (!isAuthenticated.value) {
      // Если не авторизован - сохраняем только в localStorage
      saveToLocalStorage();
      return;
    }

    try {
      await api.post('/cart/sync', {
        items: cart.value,
        bouquet_ids: bouquetIds.value,
        packaging: selectedPackaging.value
      });
      saveToLocalStorage();
    } catch (e) {
      console.warn('Ошибка синхронизации корзины с сервером:', e);
      // При ошибке сохраняем локально
      saveToLocalStorage();
    }
  };

  // ===== СОХРАНЕНИЕ (ОБЩАЯ ФУНКЦИЯ) =====
  const saveCart = async () => {
    cleanupBouquetIds();
    saveToLocalStorage();
    await saveToServer();
  };

  // ===== ПОЛУЧЕНИЕ КОЛИЧЕСТВА ТОВАРОВ =====
  const getCartCount = computed(() => {
    return cart.value.reduce((sum, item) => sum + (item.qty || 0), 0);
  });

  // ===== ПОЛУЧЕНИЕ ОБЩЕЙ СУММЫ =====
  const getCartTotal = computed(() => {
    return cart.value.reduce((sum, item) => sum + ((item.price || 0) * (item.qty || 0)), 0);
  });

  // ===== ДОБАВЛЕНИЕ В КОРЗИНУ =====
  const addToCart = (product, qty = 1) => {
    const activeId = bouquetIds.value.length > 0 ? bouquetIds.value[bouquetIds.value.length - 1] : 1;
    
    const existing = cart.value.find(i => i.id === product.id && i.bouquet_id === activeId);
    
    if (existing) {
      existing.qty = (existing.qty || 0) + qty;
    } else {
      cart.value.push({
        id: product.id,
        nazvanie: product.nazvanie,
        price: product.price,
        qty: qty,
        image: product.image_url || product.img,
        bouquet_id: activeId,
        type: product.type || 'flower'
      });
    }
    
    saveCart();
  };

  // ===== УДАЛЕНИЕ ИЗ КОРЗИНЫ =====
  const removeFromCart = (item) => {
    cart.value = cart.value.filter(i => i !== item);
    cleanupBouquetIds();
    saveCart();
  };

  // ===== ОЧИСТКА КОРЗИНЫ =====
  const clearCart = () => {
    cart.value = [];
    bouquetIds.value = [1];
    selectedPackaging.value = {};
    saveCart();
  };

  // ===== WATCH ДЛЯ АВТОСОХРАНЕНИЯ =====
  watch([cart, bouquetIds, selectedPackaging], () => {
    // Сохраняем только если есть изменения
    saveToLocalStorage();
  }, { deep: true });

  // ===== ИНИЦИАЛИЗАЦИЯ =====
  const init = async () => {
    loadFromLocalStorage();
    if (isAuthenticated.value) {
      await loadFromServer();
    }
    // Убеждаемся, что данные синхронизированы
    saveToLocalStorage();
  };

  // ===== ВОЗВРАЩАЕМ ВСЕ НУЖНЫЕ ДАННЫЕ И ФУНКЦИИ =====
  return {
    // Состояние
    cart,
    bouquetIds,
    selectedPackaging,
    loading,
    error,
    
    // Вычисляемые
    isAuthenticated,
    getCartCount,
    getCartTotal,
    
    // Основные функции
    loadFromServer,
    saveCart,
    addToCart,
    removeFromCart,
    clearCart,
    init,
    
    // Вспомогательные
    loadFromLocalStorage,
    saveToLocalStorage,
    cleanupBouquetIds
  };
}
