<template>
 <div class="profile-page">
   <div class="container">
     <h1 class="page-title">Личный кабинет</h1>
     <div class="dashboard-grid">
       <aside class="user-card">
         <div class="avatar-placeholder">{{ auth.user?.name?.charAt(0).toUpperCase() }}</div>
         <h2 class="user-name">{{ auth.user?.name }}</h2>
         <p class="user-email">{{ auth.user?.email }}</p>
         <div class="user-stats"><div class="stat-item"><span class="stat-value">{{ orders.length }}</span><span class="stat-label">Заказов</span></div></div>
       </aside>
       <main class="orders-section">
         <div class="section-header"><h2>История заказов</h2></div>
         <div v-if="loading" class="state-container"><div class="spinner"></div><p>Загрузка...</p></div>
         <div v-else-if="orders.length === 0" class="state-container empty-state"><div class="icon-empty">📦</div><h3>Пока нет заказов</h3><router-link to="/" class="btn-browse">В каталог</router-link></div>
         <div v-else class="orders-list">
           <div v-for="order in orders" :key="order.id" class="order-card">
             <div class="order-header">
               <div class="order-meta"><span class="order-id">Заказ №{{ order.id }}</span><span class="order-date">{{ formatDate(order.created_at) }}</span></div>
               <span class="status-badge" :class="getStatusClass(order.status)">{{ translateStatus(order.status) }}</span>
             </div>
             <div class="pickup-info">📍 {{ order.pickup_location || 'Не указана' }}</div>
             
             <!-- 🆕 Отображение сборок -->
             <div class="order-packages">
               <div v-for="(pkg, idx) in getPackages(order)" :key="idx" class="pkg-block">
                 <div class="pkg-title">Сборка {{ idx + 1 }} | {{ getPackagingLabel(pkg.packaging) }}</div>
                 <div v-for="item in pkg.items" :key="item.id" class="order-item-row">
                   <div class="item-info">
                     <span class="item-name">{{ getFlowerName(order, item.id) }}</span>
                     <span class="item-qty">{{ item.qty }} шт.</span>
                   </div>
                   <div class="item-price">{{ formatPrice(getFlowerPrice(order, item.id)) }}</div>
                 </div>
               </div>
             </div>

             <div class="order-footer"><span class="total-label">Итого:</span><span class="total-price">{{ formatPrice(order.total_price) }}</span></div>
           </div>
         </div>
       </main>
     </div>
   </div>
 </div>
</template>
<script setup>
import { onMounted, ref } from 'vue';
import api from '@/api';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const orders = ref([]);
const loading = ref(true);

const packagingMap = { 'none': 'Без упаковки', 'craft': 'Крафт-бумага', 'film': 'Пленка', 'box': 'Шляпная коробка' };
const getPackagingLabel = (v) => packagingMap[v] || v || 'Без упаковки';

const getPackages = (order) => {
  if (order.packages?.length) return order.packages;
  return [{ packaging: 'Не указана', items: order.flowers?.map(f => ({ id: f.id, qty: f.pivot.quantity })) || [] }];
};

const getFlowerName = (order, id) => order.flowers?.find(f => f.id == id)?.nazvanie || 'Цветок';
const getFlowerPrice = (order, id) => order.flowers?.find(f => f.id == id)?.pivot?.price_at_purchase || 0;

const formatDate = (d) => d ? new Date(d).toLocaleDateString('ru-RU', { day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '';
const formatPrice = (p) => p ? new Intl.NumberFormat('ru-RU').format(p) + ' ₽' : '0 ₽';
const translateStatus = (s) => ({ pending:'Ожидает', confirmed:'Подтвержден', completed:'Завершен', canceled:'Отменен' }[s] || s);
const getStatusClass = (s) => `status-${s}`;

onMounted(async () => {
  try { const { data } = await api.get('/orders/history'); orders.value = data; }
  catch (e) { console.error("Ошибка ", e); }
  finally { loading.value = false; }
});
</script>
<style scoped>
/* ⚠️ Ваши стили остаются без изменений. Добавлен только фикс для pkg-block */
.pkg-block { background: #fafafa; border: 1px solid #e5e7eb; border-radius: 10px; margin-bottom: 12px; overflow: hidden; }
.pkg-title { background: #f3f4f6; padding: 8px 15px; font-weight: 600; font-size: 0.95rem; border-bottom: 1px solid #e5e7eb; }
.order-packages { padding: 0 15px 10px; }
.pickup-info { padding: 8px 15px; color: var(--text-muted); font-size: 0.9rem; border-bottom: 1px dashed var(--border); margin-bottom: 10px; }
:root { --primary: #481C69; --primary-light: #f3f0f7; --text-main: #1f2937; --text-muted: #6b7280; --bg-page: #f9fafb; --bg-card: #fff; --border: #e5e7eb; --status-pending-bg: #fef3c7; --status-pending-text: #92400e; --status-completed-bg: #d1fae5; --status-completed-text: #065f46; --status-canceled-bg: #fee2e2; --status-canceled-text: #b91c1c; --status-confirmed-bg: #dbeafe; --status-confirmed-text: #1e40af; }
.profile-page { background-color: var(--bg-page); min-height: 100vh; width: 100%; max-width: 1920px; margin: 0 auto; padding: 60px 20px; font-family: 'Inter', system-ui, sans-serif; box-sizing: border-box; }
.container { max-width: 1100px; margin: 0 auto; width: 100%; }
.page-title { font-size: 2rem; color: var(--text-main); margin-bottom: 30px; font-weight: 800; }
.dashboard-grid { gap: 30px; align-items: flex-start; }
.user-card { background: var(--bg-card); padding: 30px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); text-align: center; height: fit-content; border: 1px solid var(--border); }
.avatar-placeholder { width: 80px; height: 80px; background: linear-gradient(135deg, var(--primary), #7c3aed); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: 700; margin: 0 auto 20px; }
.user-name { font-size: 1.25rem; color: var(--text-main); margin: 0 0 5px; }
.user-email { color: var(--text-muted); font-size: 0.95rem; margin: 0 0 25px; }
.user-stats { display: flex; justify-content: space-around; padding-top: 20px; border-top: 1px solid var(--border); }
.stat-item { display: flex; flex-direction: column; }
.stat-value { font-size: 1.5rem; font-weight: 700; color: var(--primary); }
.stat-label { font-size: 0.85rem; color: var(--text-muted); }
.section-header h2 { font-size: 1.5rem; color: var(--text-main); margin: 0 0 20px; }
.state-container { background: var(--bg-card); padding: 60px 20px; border-radius: 16px; text-align: center; border: 1px dashed var(--border); }
.spinner { width: 30px; height: 30px; border: 3px solid #f3f3f3; border-top: 3px solid var(--primary); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 15px; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
.empty-state .icon-empty { font-size: 3rem; margin-bottom: 15px; display: block; }
.empty-state h3 { margin: 0 0 10px; color: var(--text-main); }
.btn-browse { display: inline-block; padding: 12px 24px; background: var(--primary); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; transition: opacity 0.2s, transform 0.1s; }
.orders-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 24px; align-items: stretch; }
.order-card { display: flex; flex-direction: column; height: 100%; background: var(--bg-card); border-radius: 12px; border: 1px solid var(--border); overflow: hidden; }
.order-header { display: flex; justify-content: space-between; align-items: center; background: #f9fafb; border-bottom: 1px solid var(--border); padding: 16px 20px; flex-wrap: wrap; gap: 10px; }
.order-meta { display: flex; flex-direction: column; }
.order-id { font-weight: 700; color: var(--text-main); font-size: 1rem; }
.order-date { font-size: 0.85rem; color: var(--text-muted); margin-top: 4px; }
.status-badge { display: inline-flex; align-items: center; justify-content: center; padding: 6px 12px; border-radius: 8px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.08); border: 1px solid rgba(0,0,0,0.05); }
.status-pending { background: var(--status-pending-bg); color: var(--status-pending-text); }
.status-confirmed { background: var(--status-confirmed-bg); color: var(--status-confirmed-text); }
.status-completed { background: var(--status-completed-bg); color: var(--status-completed-text); }
.status-canceled { background: var(--status-canceled-bg); color: var(--status-canceled-text); }
.order-item-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 15px; border-bottom: 1px solid #f3f4f6; flex-wrap: wrap; gap: 10px; }
.order-item-row:last-child { border-bottom: none; }
.item-info { display: flex; flex-direction: column; flex: 1; min-width: 0; }
.item-name { font-weight: 500; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.item-qty { font-size: 0.85rem; color: var(--text-muted); }
.item-price { font-weight: 600; color: var(--text-main); white-space: nowrap; flex-shrink: 0; }
.order-footer { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; background: #f9fafb; border-top: 1px solid var(--border); margin-top: auto; gap: 10px; }
.total-label { font-weight: 600; color: var(--text-muted); }
.total-price { font-size: 1.25rem; font-weight: 800; color: var(--primary); }
@media (max-width: 991px) { .profile-page { padding: 50px 20px; } .page-title { font-size: 1.75rem; } .user-card { padding: 25px; } .avatar-placeholder { width: 70px; height: 70px; font-size: 1.75rem; } .section-header h2 { font-size: 1.3rem; } .orders-list { grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); } }
@media (max-width: 767px) { .profile-page { padding: 40px 15px; } .page-title { font-size: 1.5rem; margin-bottom: 25px; } .dashboard-grid { flex-direction: column; gap: 25px; } .user-card { display: flex; flex-direction: row; align-items: center; text-align: left; gap: 20px; padding: 20px; } .avatar-placeholder { margin: 0; width: 60px; height: 60px; font-size: 1.5rem; flex-shrink: 0; } .user-name { font-size: 1.1rem; margin-bottom: 3px; } .user-email { font-size: 0.85rem; margin-bottom: 0; } .user-stats { display: none; } .orders-list { grid-template-columns: 1fr; } .order-header { flex-direction: column; align-items: flex-start; gap: 10px; padding: 12px 15px; } .status-badge { align-self: flex-start; } .order-item-row, .order-footer { padding: 12px 15px; } .total-price { font-size: 1.1rem; } }
@media (max-width: 479px) { .profile-page { padding: 30px 12px; } .page-title { font-size: 1.3rem; margin-bottom: 20px; } .dashboard-grid { gap: 20px; } .user-card { padding: 15px; gap: 12px; flex-direction: column; text-align: center; } .avatar-placeholder { width: 50px; height: 50px; font-size: 1.25rem; } .user-name { font-size: 1rem; } .user-email { font-size: 0.8rem; } .section-header h2 { font-size: 1.2rem; margin-bottom: 15px; } .state-container { padding: 40px 15px; border-radius: 12px; } .spinner { width: 25px; height: 25px; } .empty-state .icon-empty { font-size: 2.5rem; } .empty-state h3 { font-size: 1rem; } .btn-browse { padding: 10px 20px; font-size: 0.9rem; } .order-header { padding: 10px 12px; gap: 8px; } .order-id { font-size: 0.9rem; } .order-date { font-size: 0.75rem; } .status-badge { font-size: 0.7rem; padding: 5px 10px; } .order-item-row, .order-footer { padding: 10px 12px; } .order-item-row { padding: 8px 0; gap: 8px; } .item-name { font-size: 0.9rem; } .item-qty { font-size: 0.75rem; } .item-price { font-size: 0.9rem; } .order-footer { flex-direction: column; align-items: flex-start; gap: 8px; } .total-label { font-size: 0.85rem; } .total-price { font-size: 1.1rem; } }
</style>