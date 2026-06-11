<template>
  <div class="admin-page">
    <div class="container">
      <header class="admin-header">
        <div class="header-title">
          <h1>Управление заказами</h1>
          <p>Просмотр и обработка заказов клиентов</p>
        </div>
        <select v-model="statusFilter" class="form-select">
          <option value="">Все статусы</option>
          <option value="pending">Ожидает</option>
          <option value="confirmed">Подтвержден</option>
          <option value="completed">Завершен</option>
          <option value="canceled">Отменен</option>
        </select>
      </header>

      <div class="card">
        <div v-if="loading" class="state-container">
          <div class="flower-loader">
            <div class="petal"></div>
            <div class="petal"></div>
            <div class="petal"></div>
            <div class="petal"></div>
            <div class="petal"></div>
            <div class="center"></div>
          </div>
          <p class="loader-text">Загрузка заказов...</p>
        </div>

        <div v-else-if="filteredOrders.length === 0" class="state-container empty-state">
          <span class="icon-empty">📦</span>
          <h3>Заказов не найдено</h3>
        </div>

        <div v-else class="table-responsive">
          <table class="admin-table">
            <thead>
              <tr>
                <th style="width:60px">ID</th>
                <th>Клиент</th>
                <th>Телефон</th> <!-- 🆕 Новая колонка -->
                <th>Сумма</th>
                <th>Статус</th>
                <th>Дата</th>
                <th class="text-right">Действия</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="order in filteredOrders" :key="order.id">
                <td class="font-mono">#{{ order.id }}</td>
                <td>
                  <div class="cell-main">{{ order.user?.name || 'Неизвестно' }}</div>
                  <div class="cell-sub">{{ order.user?.email || '—' }}</div>
                </td>
                <td>
                  <!-- 🆕 Отображение телефона с иконкой и возможностью клика -->
                  <div v-if="order.phone" class="phone-cell">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.574 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                    <a :href="`tel:${order.phone}`" class="phone-link">{{ formatPhone(order.phone) }}</a>
                  </div>
                  <div v-else class="phone-cell empty">—</div>
                </td>
                <td><span class="price-tag">{{ formatPrice(order.total_price) }}</span></td>
                <td>
                  <select v-model="order.status" @change="updateStatus(order)" :class="'status-select status-' + order.status">
                    <option value="pending">Ожидает</option>
                    <option value="confirmed">Подтвержден</option>
                    <option value="completed">Завершен</option>
                    <option value="canceled">Отменен</option>
                  </select>
                 </td>
                <td class="text-muted">{{ formatDate(order.created_at) }}</td>
                <td class="text-right">
                  <button @click="viewDetails(order)" class="btn-icon btn-view">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                    <span>Просмотр</span>
                  </button>
                </td>
              </table>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 🆕 Модальное окно деталей с телефоном -->
    <transition name="modal-fade">
      <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
        <div class="modal-container">
          <div class="modal-header">
            <div class="modal-header-content">
              <div class="order-badge">Заказ №{{ selectedOrder?.id }}</div>
              <div class="order-date-full">{{ formatDate(selectedOrder?.created_at) }}</div>
            </div>
            <button @click="showModal = false" class="btn-close-modal">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div class="modal-body">
            <div class="info-grid">
              <div class="info-block">
                <label>Клиент</label>
                <div class="info-value">{{ selectedOrder?.user?.name || 'Неизвестно' }}</div>
              </div>
              <div class="info-block">
                <label>Email</label>
                <div class="info-value">{{ selectedOrder?.user?.email || '—' }}</div>
              </div>
              <!-- 🆕 Блок телефона в модальном окне -->
              <div class="info-block">
                <label>📞 Телефон</label>
                <div class="info-value">
                  <a v-if="selectedOrder?.phone" :href="`tel:${selectedOrder.phone}`" class="phone-link-large">
                    {{ formatPhone(selectedOrder?.phone) }}
                  </a>
                  <span v-else class="text-muted">—</span>
                </div>
              </div>
              <div class="info-block">
                <label>Статус</label>
                <div class="info-value">
                  <span :class="'badge status-' + selectedOrder?.status">{{ getStatusText(selectedOrder?.status) }}</span>
                </div>
              </div>
              <div class="info-block">
                <label>Точка выдачи</label>
                <div class="info-value">{{ selectedOrder?.pickup_location || 'Не указана' }}</div>
              </div>
              <div class="info-block full-width">
                <label>Итого</label>
                <div class="info-value price-large">{{ formatPrice(selectedOrder?.total_price) }}</div>
              </div>
            </div>

            <!-- 🆕 Быстрые действия с телефоном -->
            <div v-if="selectedOrder?.phone" class="quick-actions">
              <a :href="`tel:${selectedOrder.phone}`" class="quick-action-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.574 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                Позвонить
              </a>
              <a :href="`https://wa.me/${selectedOrder.phone.replace(/[^0-9]/g, '')}`" target="_blank" class="quick-action-btn whatsapp">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                </svg>
                WhatsApp
              </a>
            </div>

            <div class="packages-section">
              <h4>Состав заказа</h4>
              <div v-for="(pkg, idx) in orderPackages" :key="idx" class="package-block">
                <div class="package-header">
                  <span>Сборка {{ idx + 1 }}</span>
                  <span class="badge-packaging">{{ getPackagingLabel(pkg.packaging) }}</span>
                </div>
                <div class="items-list">
                  <div v-for="item in pkg.items" :key="item.id" class="item-row">
                    <div class="item-img">
                      <img :src="getImageUrl(getFlowerImg(item.id))" alt="" @error="handleImageError">
                    </div>
                    <div class="item-info">
                      <div class="item-name">{{ getFlowerName(item.id) }}</div>
                      <div class="item-meta">{{ item.qty }} шт. × {{ formatPrice(getFlowerPrice(item.id)) }}</div>
                    </div>
                    <div class="item-total">{{ formatPrice(item.qty * getFlowerPrice(item.id)) }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button @click="showModal = false" class="btn-secondary-modal">Закрыть</button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue';
import api from '@/api';
import { useToastStore } from '@/stores/toast';
import { getImageUrl, handleImageError } from '@/utils/image';

const orders = ref([]);
const loading = ref(true);
const showModal = ref(false);
const selectedOrder = ref(null);
const statusFilter = ref('');
const toast = useToastStore();

const filteredOrders = computed(() => statusFilter.value ? orders.value.filter(o => o.status === statusFilter.value) : orders.value);

const orderPackages = computed(() => {
  if (!selectedOrder.value) return [];
  const raw = selectedOrder.value.packages;
  if (raw?.length > 0) return raw;
  return [{ packaging: 'Не указана', items: selectedOrder.value.flowers?.map(f => ({ id: f.id, qty: f.pivot?.quantity })) || [] }];
});

// 🆕 Функция форматирования телефона
const formatPhone = (phone) => {
  if (!phone) return '—';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `+7 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7, 9)}-${cleaned.slice(9, 11)}`;
  }
  return phone;
};

const packagingMap = { 'none': 'Без упаковки', 'craft': 'Крафт-бумага', 'film': 'Прозрачная пленка', 'box': 'Шляпная коробка' };
const getPackagingLabel = (v) => packagingMap[v] || v || 'Без упаковки';
const getFlowerDetails = (id) => selectedOrder.value?.flowers?.find(f => f.id == id);
const getFlowerName = (id) => getFlowerDetails(id)?.nazvanie || 'Товар удален';
const getFlowerPrice = (id) => getFlowerDetails(id)?.pivot?.price_at_purchase || 0;
const getFlowerImg = (id) => getFlowerDetails(id)?.flower_image_url || getFlowerDetails(id)?.image_url;
const formatPrice = (p) => p ? new Intl.NumberFormat('ru-RU').format(p) + ' ₽' : '0 ₽';
const formatDate = (d) => d ? new Date(d).toLocaleString('ru-RU', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '-';
const getStatusText = (s) => ({ pending:'Ожидает', confirmed:'Подтвержден', completed:'Завершен', canceled:'Отменен' }[s] || s);

onMounted(async () => {
  try { 
    const { data } = await api.get('/admin/orders'); 
    orders.value = data;
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  catch (e) { toast.error('Ошибка загрузки'); }
  finally { loading.value = false; }
});

const updateStatus = async (order) => {
  try { 
    await api.patch(`/admin/orders/${order.id}/status`, { status: order.status }); 
    toast.success('Статус обновлён'); 
  }
  catch (e) { 
    toast.error('Ошибка обновления'); 
  }
};

const viewDetails = (order) => { 
  selectedOrder.value = order; 
  showModal.value = true; 
};
</script>

<style scoped>
/* Добавляем стили для телефонной колонки */
.phone-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
}

.phone-cell svg {
  flex-shrink: 0;
  color: #10b981;
}

.phone-link {
  color: #1f2937;
  text-decoration: none;
  transition: color 0.2s;
}

.phone-link:hover {
  color: #10b981;
  text-decoration: underline;
}

.phone-cell.empty {
  color: #9ca3af;
}

/* 🆕 Быстрые действия в модальном окне */
.quick-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  padding: 16px;
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border-radius: 12px;
}

.quick-action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  color: #1f2937;
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 0.2s;
}

.quick-action-btn:hover {
  background: #10b981;
  border-color: #10b981;
  color: white;
}

.quick-action-btn.whatsapp:hover {
  background: #25D366;
  border-color: #25D366;
}

.quick-action-btn svg {
  width: 16px;
  height: 16px;
}

.phone-link-large {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #10b981;
  text-decoration: none;
  font-weight: 600;
  font-size: 1.1rem;
  transition: all 0.2s;
}

.phone-link-large:hover {
  color: #059669;
  text-decoration: underline;
}

/* Остальные стили из предыдущей версии */
.form-select { padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 8px; background: #fff; font-size: 0.9rem; cursor: pointer; }
.packages-section { margin-top: 20px; }
.package-block { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; margin-bottom: 15px; overflow: hidden; }
.package-header { background: #f3f4f6; padding: 10px 15px; font-weight: 600; display: flex; justify-content: space-between; align-items: center; }
.badge-packaging { background: #dbeafe; color: #1e40af; padding: 3px 8px; border-radius: 12px; font-size: 0.8rem; }
.item-row { display: flex; align-items: center; gap: 12px; padding: 10px 15px; border-bottom: 1px solid #e5e7eb; }
.item-row:last-child { border-bottom: none; }
.full-width { grid-column: 1 / -1; }
:root { --primary: #481C69; --primary-light: #f3f0f7; --text-main: #1f2937; --text-muted: #6b7280; --bg-page: #f3f4f6; --bg-card: #ffffff; --border: #e5e7eb; --status-pending-bg: #fef3c7; --status-pending-text: #92400e; --status-confirmed-bg: #dbeafe; --status-confirmed-text: #1e40af; --status-completed-bg: #d1fae5; --status-completed-text: #065f46; --status-canceled-bg: #fee2e2; --status-canceled-text: #b91c1c; }

.admin-page { background-color: var(--bg-page); min-height: 100vh; padding: 30px 20px; font-family: 'Inter', system-ui, sans-serif; color: var(--text-main); }
.container { max-width: 1200px; margin: 0 auto; }
.admin-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; flex-wrap: wrap; gap: 20px; }
.header-title h1 { font-size: 1.8rem; font-weight: 800; margin: 0 0 5px; color: var(--text-main); }
.header-title p { margin: 0; color: var(--text-muted); font-size: 0.95rem; }
.card { background: var(--bg-card); border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); overflow: hidden; border: 1px solid var(--border); }
.table-responsive { overflow-x: auto; }
.admin-table { width: 100%; border-collapse: collapse; text-align: left; }
.admin-table th { background: #f9fafb; padding: 16px; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); font-weight: 600; border-bottom: 1px solid var(--border); }
.admin-table td { padding: 16px; border-bottom: 1px solid var(--border); vertical-align: middle; }
.admin-table tr:last-child td { border-bottom: none; }
.admin-table tr:hover { background-color: #f9fafb; }
.font-mono { font-family: monospace; color: var(--text-muted); }
.cell-main { font-weight: 600; color: var(--text-main); }
.cell-sub { font-size: 0.8rem; color: var(--text-muted); margin-top: 4px; }
.text-muted { color: var(--text-muted); font-size: 0.9rem; }
.text-right { text-align: right; }
.price-tag { font-weight: 700; color: var(--primary); }
.status-select { padding: 6px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 600; border: 1px solid transparent; cursor: pointer; outline: none; appearance: none; background-repeat: no-repeat; background-position: right 8px center; padding-right: 24px; transition: all 0.2s; }
.status-pending { background-color: var(--status-pending-bg); color: var(--status-pending-text); }
.status-confirmed { background-color: var(--status-confirmed-bg); color: var(--status-confirmed-text); }
.status-completed { background-color: var(--status-completed-bg); color: var(--status-completed-text); }
.status-canceled { background-color: var(--status-canceled-bg); color: var(--status-canceled-text); }
.btn-icon { display: inline-flex; align-items: center; gap: 6px; background: white; border: 1px solid var(--border); color: var(--text-main); padding: 6px 12px; border-radius: 6px; font-size: 0.85rem; font-weight: 500; cursor: pointer; transition: all 0.2s; }
.btn-icon:hover { background: var(--primary); color: white; border-color: var(--primary); }

/* Лоадер */
.state-container { padding: 60px 20px; text-align: center; color: var(--text-muted); }
.flower-loader { position: relative; width: 80px; height: 80px; margin: 0 auto 20px; animation: rotate-flower 8s linear infinite; }
@keyframes rotate-flower { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
.petal { position: absolute; width: 35px; height: 35px; background: linear-gradient(135deg, var(--primary) 0%, #7c3aed 100%); border-radius: 50%; opacity: 0.8; animation: pulse-petal 2s ease-in-out infinite; }
.petal:nth-child(1) { top: 0; left: 50%; transform: translateX(-50%); animation-delay: 0s; }
.petal:nth-child(2) { top: 50%; right: 0; transform: translateY(-50%); animation-delay: 0.2s; }
.petal:nth-child(3) { bottom: 0; left: 50%; transform: translateX(-50%); animation-delay: 0.4s; }
.petal:nth-child(4) { top: 50%; left: 0; transform: translateY(-50%); animation-delay: 0.6s; }
.petal:nth-child(5) { top: 15%; left: 15%; animation-delay: 0.8s; }
.petal:nth-child(6) { bottom: 15%; right: 15%; animation-delay: 1s; }
.center { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 20px; height: 20px; background: #fbbf24; border-radius: 50%; box-shadow: 0 0 10px rgba(251, 191, 36, 0.5); }
@keyframes pulse-petal { 0%, 100% { transform: scale(1); opacity: 0.6; } 50% { transform: scale(1.1); opacity: 1; } }
.loader-text { margin-top: 20px; font-size: 0.9rem; color: var(--text-muted); animation: pulse-text 1.5s ease-in-out infinite; }
@keyframes pulse-text { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
.empty-state .icon-empty { font-size: 3rem; display: block; margin-bottom: 15px; }
.empty-state h3 { margin: 0; font-size: 1.2rem; color: var(--text-muted); }

/* Модальное окно */
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(8px); display: flex; justify-content: center; align-items: center; z-index: 1000; padding: 20px; }
.modal-container { background: white; border-radius: 24px; width: 100%; max-width: 700px; max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); animation: modal-slide-up 0.3s ease-out; }
@keyframes modal-slide-up { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
.modal-header { display: flex; justify-content: space-between; align-items: flex-start; padding: 24px 28px; background: linear-gradient(135deg, #f3f0f7 0%, #e9ddf5 100%); border-radius: 24px 24px 0 0; border-bottom: 1px solid var(--border); }
.modal-header-content { flex: 1; }
.order-badge { font-size: 1.3rem; font-weight: 800; color: var(--primary); margin-bottom: 6px; }
.order-date-full { font-size: 0.85rem; color: var(--text-muted); }
.btn-close-modal { background: rgba(72, 28, 105, 0.1); border: none; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; color: var(--primary); }
.btn-close-modal:hover { background: rgba(72, 28, 105, 0.2); transform: rotate(90deg); }
.modal-body { padding: 28px; overflow-y: auto; flex: 1; }
.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; background: #f9fafb; padding: 20px; border-radius: 16px; }
.info-block label { display: block; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 6px; font-weight: 600; }
.info-value { font-size: 1rem; color: var(--text-main); font-weight: 500; }
.price-large { font-size: 1.25rem; font-weight: 800; color: var(--primary); }
.badge { display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 0.85rem; font-weight: 600; }
.badge.status-pending { background: var(--status-pending-bg); color: var(--status-pending-text); }
.badge.status-confirmed { background: var(--status-confirmed-bg); color: var(--status-confirmed-text); }
.badge.status-completed { background: var(--status-completed-bg); color: var(--status-completed-text); }
.badge.status-canceled { background: var(--status-canceled-bg); color: var(--status-canceled-text); }
.packages-section h4 { font-size: 1.1rem; margin: 0 0 16px; color: var(--text-main); font-weight: 700; }
.items-list { display: flex; flex-direction: column; }
.item-img { width: 50px; height: 50px; border-radius: 8px; overflow: hidden; background: #f3f4f6; flex-shrink: 0; }
.item-img img { width: 100%; height: 100%; object-fit: cover; }
.item-info { flex: 1; }
.item-name { font-weight: 600; color: var(--text-main); margin-bottom: 4px; }
.item-meta { font-size: 0.85rem; color: var(--text-muted); }
.item-total { font-weight: 700; color: var(--text-main); white-space: nowrap; }
.modal-footer { padding: 20px 28px; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; background: #f9fafb; border-radius: 0 0 24px 24px; }
.btn-secondary-modal { background: white; border: 1px solid var(--border); color: var(--text-main); padding: 10px 24px; border-radius: 10px; font-weight: 500; cursor: pointer; transition: all 0.2s; }
.btn-secondary-modal:hover { background: #f3f4f6; border-color: #d1d5db; }
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.3s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }

/* Адаптив */
@media (max-width: 768px) {
  .admin-page { padding: 20px 15px; }
  .admin-header { flex-direction: column; align-items: flex-start; }
  .header-title h1 { font-size: 1.5rem; }
  .admin-table th, .admin-table td { padding: 12px 8px; font-size: 0.85rem; }
  .btn-icon span { display: none; }
  .btn-icon { padding: 8px; }
  .phone-cell { font-size: 0.8rem; }
  .quick-actions { flex-direction: column; }
}

@media (max-width: 480px) {
  .admin-page { padding: 15px 10px; }
  .header-title h1 { font-size: 1.3rem; }
  .admin-table th { font-size: 0.7rem; padding: 10px 6px; }
  .admin-table td { padding: 10px 6px; font-size: 0.8rem; }
  .phone-cell svg { width: 12px; height: 12px; }
}
</style>
