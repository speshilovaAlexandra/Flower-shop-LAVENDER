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
    cart, bouquetIds, selectedPackaging, isAuthenticated, getCartCount,
    loadFromServer, loadFromLocal, saveLocal, mergeGuestToServer
  };
}
