<template>
 <div class="admin-page">
   <div class="container">
     <!-- Header -->
     <header class="admin-header">
       <div class="header-title">
         <h1>Управление каталогом</h1>
         <p>Список всех товаров и управление запасами</p>
       </div>
       <button @click="openNew" class="btn-primary">
         <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"> <line x1="12" y1="5" x2="12" y2="19"></line> <line x1="5" y1="12" x2="19" y2="12"></line> </svg>
        Добавить товар
       </button>
       <div class="csv-import-card">
          <h4>📦 Быстрый импорт из CSV</h4>
          <p class="hint">Формат: <code>Название, Цена, Количество, Описание</code></p>
          
          <input type="file" ref="csvInput" accept=".csv" @change="handleCsvSelect" class="csv-input">
          
          <button @click="uploadCsv" :disabled="!selectedCsv || uploading" class="btn-secondary">
            {{ uploading ? 'Загрузка...' : 'Загрузить файл' }}
          </button>

          <div v-if="importResult" class="import-result">
            <p>✅ Добавлено: <strong>{{ importResult.created }}</strong> | Обновлено: <strong>{{ importResult.updated }}</strong></p>
            <div v-if="importResult.errors.length > 0" class="errors">
              <p>⚠️ Ошибки:</p>
              <ul><li v-for="(err, i) in importResult.errors" :key="i">{{ err }}</li></ul>
            </div>
          </div>
        </div>
     </header>

     <!-- Table Card -->
     <div class="card table-card">
       <div class="table-responsive">
         <table class="admin-table">
           <thead>
             <tr>
               <th style="width: 80px;">Фото</th>
               <th>Название</th>
               <th>Описание</th>
               <th>Цена</th>
               <th>Остаток</th>
               <th class="text-right">Действия</th>
             </tr>
           </thead>
           <tbody>
             <tr v-for="flower in flowers" :key="flower.id">
               <td>
                 <div class="img-thumb">
                   <img :src="flower.image_url || '/images/placeholder.jpg'" :alt="flower.nazvanie">
                 </div>
               </td>
               <td>
                 <div class="cell-main">{{ flower.nazvanie }}</div>
                 <div class="cell-sub">ID: {{ flower.id }}</div>
               </td>
               <td>
                 <span class="text-truncate" :title="flower.opisanie">{{ flower.opisanie || '—' }}</span>
               </td>
               <td>
                 <span class="price-tag">{{ flower.price }} ₽</span>
               </td>
               <td>
                 <span :class="['stock-badge', flower.quantity < 5 ? 'low' : 'ok']">
                  {{ flower.quantity }} шт.
                 </span>
               </td>
               <td class="text-right">
                 <div class="action-buttons">
                   <button @click="openEdit(flower)" class="btn-icon btn-edit" title="Редактировать">
                     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"> <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path> <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path> </svg>
                   </button>
                   <button @click="deleteItem(flower.id)" class="btn-icon btn-delete" title="Удалить">
                     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"> <polyline points="3 6 5 6 21 6"></polyline> <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path> </svg>
                   </button>
                 </div>
               </td>
             </tr>
             <tr v-if="flowers.length === 0">
               <td colspan="6" class="empty-state">Товары не найдены</td>
             </tr>
           </tbody>
         </table>
       </div>
     </div>
   </div>

   <!-- Modal -->
   <transition name="modal-fade">
     <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
       <div class="modal-container">
         <div class="modal-header">
           <h3>{{ editingId ? 'Редактировать товар' : 'Новый товар' }}</h3>
           <button @click="showModal = false" class="btn-close">
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"> <line x1="18" y1="6" x2="6" y2="18"></line> <line x1="6" y1="6" x2="18" y2="18"></line> </svg>
           </button>
         </div>
        
         <form @submit.prevent="save" class="modal-body">
           <div class="form-grid">
             <div class="form-group full-width">
               <label>Название товара</label>
               <input v-model="form.nazvanie" type="text" placeholder="Например: Букет 'Нежность'" required>
             </div>

             <div class="form-group">
               <label>Цена (₽)</label>
               <input v-model="form.price" type="number" min="0" placeholder="0" required>
             </div>

             <div class="form-group">
               <label>Остаток (шт.)</label>
               <input v-model.number="form.quantity" type="number" min="0" placeholder="0" required>
             </div>

             <div class="form-group full-width">
               <label>Описание</label>
               <textarea v-model="form.opisanie" rows="4" placeholder="Подробное описание букета..."></textarea>
             </div>

             <!-- 🖼️ Основное фото (Каталог) -->
             <div class="form-group full-width">
               <label>Изображение букета (для каталога) *</label>
               <div class="file-upload-wrapper">
                 <input type="file" @change="handleFileUpload" accept="image/*" id="fileInput">
                 <label for="fileInput" class="file-label">
                   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"> <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path> <polyline points="17 8 12 3 7 8"></polyline> <line x1="12" y1="3" x2="12" y2="15"></line> </svg>
                   <span>{{ form.img ? form.img.name : 'Выберите файл или перетащите сюда' }}</span>
                 </label>
               </div>
               <div v-if="editingId && !form.img" class="current-img-hint">
                 Текущее изображение сохранится, если не загрузить новое.
               </div>
             </div>

             <!-- 🌸 Новое фото (Конструктор) -->
             <div class="form-group full-width">
               <label>Фото цветка (для конструктора)</label>
               <div class="file-upload-wrapper">
                 <input type="file" @change="handleFlowerFileUpload" accept="image/*" id="flowerFileInput">
                 <label for="flowerFileInput" class="file-label">
                   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"> <circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4M12 8h.01"></path> </svg>
                   <span>{{ form.flower_img ? form.flower_img.name : 'Загрузите фото одного цветка (опционально)' }}</span>
                 </label>
               </div>
               <div v-if="editingId && currentFlowerImg && !form.flower_img" class="current-img-hint">
                 Текущее фото цветка: <img :src="currentFlowerImg" alt="" class="hint-thumb">
               </div>
             </div>
           </div>

           <div class="modal-footer">
             <button type="button" @click="showModal = false" class="btn-secondary">Отмена</button>
             <button type="submit" class="btn-primary" :disabled="saving">
              {{ saving ? 'Сохранение...' : 'Сохранить' }}
             </button>
           </div>
         </form>
       </div>
     </div>
   </transition>
 </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '@/api';
import { useToastStore } from '@/stores/toast';
// 📦 Состояние для CSV
const selectedCsv = ref(null);
const uploading = ref(false);
const importResult = ref(null);

const handleCsvSelect = (e) => {
  selectedCsv.value = e.target.files[0];
  importResult.value = null;
};

const uploadCsv = async () => {
  if (!selectedCsv.value) return;
  uploading.value = true;
  
  const formData = new FormData();
  formData.append('csv_file', selectedCsv.value);

  try {
    const { data } = await api.post('/admin/flowers/import-csv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    importResult.value = data;
    load(); // Обновляем таблицу товаров
  } catch (e) {
    toast.error('Ошибка загрузки: ' + (e.response?.data?.message || 'Неизвестная ошибка'));
  } finally {
    uploading.value = false;
  }
};
const flowers = ref([]);
const showModal = ref(false);
const editingId = ref(null); // ✅ Исправлено (было editi ngId)
const saving = ref(false);
const currentFlowerImg = ref(null); // 🆕 Для предпросмотра текущего фото

const form = ref({ 
  nazvanie: '', 
  price: '', 
  quantity: 0, 
  opisanie: '', 
  img: null,
  flower_img: null // 🆕
});

const toast = useToastStore();

const load = async () => { 
  try {
    const res = await api.get('/flowers');
    flowers.value = res.data; 
  } catch (e) {
    toast.error('Ошибка загрузки каталога');
  }
  
  // ✅ Исправлено (было document.ti tle)
  document.title = 'Управление товарами — Админ панель | LAVENDER';
};

const handleFileUpload = (e) => {
  const file = e.target.files[0];
  if (file) {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Неверный тип файла. Допустимые: JPG, PNG, GIF, WEBP');
      e.target.value = '';
      form.value.img = null;
      return;
    }
    form.value.img = file;
  }
};

// 🆕 Обработчик для второго фото
const handleFlowerFileUpload = (e) => {
  const file = e.target.files[0];
  if (file) {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Неверный тип файла');
      e.target.value = '';
      form.value.flower_img = null;
      return;
    }
    form.value.flower_img = file;
  }
};

const save = async () => {
  saving.value = true;
  const fd = new FormData();
  fd.append('nazvanie', form.value.nazvanie);
  fd.append('price', form.value.price);
  fd.append('quantity', form.value.quantity || 0); // ✅ Исправлено
  fd.append('opisanie', form.value.opisanie || '');

  if (form.value.img instanceof File) {
    fd.append('img', form.value.img);
  }

  // 🆕 Добавляем фото цветка если оно выбрано
  if (form.value.flower_img instanceof File) {
    fd.append('flower_img', form.value.flower_img);
  }

  try {
    if (editingId.value) {
      // ✅ Исправлено: убран пробел перед PUT
      fd.append('_method', 'PUT');
      await api.post(`/admin/flowers/${editingId.value}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Товар успешно обновлён');
    } else {
      await api.post('/admin/flowers', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Товар добавлен в каталог');
    }
    showModal.value = false;
    load();
  } catch (e) {
    if (e.response?.data?.errors) {
      // ✅ Исправлено: убраны пробелы в m sgs
      const msgs = Object.values(e.response.data.errors).flat().join('\n');
      alert('Ошибки валидации:\n' + msgs);
    } else {
      toast.error('Ошибка сохранения');
    }
  } finally {
    saving.value = false;
  }
};

const openNew = () => {
  editingId.value = null;
  currentFlowerImg.value = null;
  form.value = { nazvanie: '', price: '', quantity: 0, opisanie: '', img: null, flower_img: null };
  showModal.value = true;
};

const openEdit = (flower) => {
  editingId.value = flower.id;
  currentFlowerImg.value = flower.flower_image_url; // 🆕 Запоминаем текущее фото цветка
  form.value = { 
    nazvanie: flower.nazvanie, 
    price: flower.price, 
    quantity: flower.quantity, 
    opisanie: flower.opisanie, 
    img: null,
    flower_img: null 
  };
  showModal.value = true;
};

const deleteItem = async (id) => {
  if (confirm('Вы уверены, что хотите удалить этот товар?')) {
    try {
      await api.delete(`/admin/flowers/${id}`);
      toast.success('Товар удалён');
      load();
    } catch (e) {
      toast.error('Ошибка при удалении');
    }
  }
};

onMounted(load);
</script>

<style scoped>
/* Оставьте ваши стили без изменений, добавьте только этот класс для миниатюры */
.hint-thumb {
  width: 40px; height: 40px; object-fit: cover; border-radius: 4px; vertical-align: middle; margin-left: 8px; border: 1px solid var(--border);
}
.csv-import-card {
  margin-top: 30px;
  padding: 20px;
  background: #f9fafb;
  border: 1px dashed #d1d5db;
  border-radius: 12px;
}
.csv-import-card h4 { margin: 0 0 8px; color: #374151; }
.csv-import-card .hint { margin: 0 0 15px; font-size: 0.85rem; color: #6b7280; }
.csv-import-card .hint code { background: #e5e7eb; padding: 2px 4px; border-radius: 4px; }
.csv-input { margin-bottom: 10px; }
.import-result { margin-top: 15px; padding: 10px; background: #ecfdf5; border-radius: 8px; font-size: 0.9rem; }
.import-result .errors { margin-top: 10px; padding-top: 10px; border-top: 1px solid #d1fae5; color: #b91c1c; }
.import-result ul { padding-left: 20px; margin: 5px 0 0; }
:root { --primary: #481C69; --primary-hover: #361550; --danger: #ef4444; --success: #10b981; --warning: #f59e0b; --bg-page: #f3f4f6; --bg-card: #ffffff; --text-main: #1f2937; --text-muted: #6b7280; --border: #e5e7eb; }
.admin-page { background-color: var(--bg-page); min-height: 100vh; padding: 30px 20px; font-family: 'Inter', system-ui, sans-serif; color: var(--text-main); }
.container { max-width: 1200px; margin: 0 auto; }
.admin-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; flex-wrap: wrap; gap: 20px; }
.header-title h1 { font-size: 1.8rem; font-weight: 800; margin: 0 0 5px; color: var(--text-main); }
.header-title p { margin: 0; color: var(--text-muted); font-size: 0.95rem; }
.btn-primary { display: inline-flex; align-items: center; gap: 8px; background-color: var(--primary); color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 6px -1px rgba(72, 28, 105, 0.2); }
.btn-primary:hover:not(:disabled) { transform: translateY(-1px); }
.btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }
.card { background: var(--bg-card); border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); overflow: hidden; border: 1px solid var(--border); }
.table-responsive { overflow-x: auto; }
.admin-table { width: 100%; border-collapse: collapse; text-align: left; }
.admin-table th { background: #f9fafb; padding: 16px; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); font-weight: 600; border-bottom: 1px solid var(--border); }
.admin-table td { padding: 16px; border-bottom: 1px solid var(--border); vertical-align: middle; }
.admin-table tr:last-child td { border-bottom: none; }
.admin-table tr:hover { background-color: #f9fafb; }
.img-thumb { width: 50px; height: 50px; border-radius: 8px; overflow: hidden; border: 1px solid var(--border); background: #f3f4f6; }
.img-thumb img { width: 100%; height: 100%; object-fit: cover; }
.cell-main { font-weight: 600; color: var(--text-main); }
.cell-sub { font-size: 0.8rem; color: var(--text-muted); margin-top: 4px; }
.text-truncate { display: block; max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-muted); font-size: 0.9rem; }
.price-tag { font-weight: 700; color: var(--primary); font-size: 1.05rem; }
.stock-badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 0.85rem; font-weight: 600; }
.stock-badge.ok { background: #d1fae5; color: #065f46; }
.stock-badge.low { background: #fee2e2; color: #b91c1c; }
.text-right { text-align: right; }
.empty-state { text-align: center; padding: 40px; color: var(--text-muted); font-style: italic; }
.action-buttons { display: flex; justify-content: flex-end; gap: 8px; }
.btn-icon { width: 36px; height: 36px; border-radius: 6px; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; color: white; }
.btn-edit { background: #eff6ff; color: #2563eb; }
.btn-edit:hover { background: #2563eb; color: white; }
.btn-delete { background: #fef2f2; color: #dc2626; }
.btn-delete:hover { background: #dc2626; color: white; }
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.5); backdrop-filter: blur(4px); display: flex; justify-content: center; align-items: center; z-index: 1000; padding: 20px; }
.modal-container { background: white; border-radius: 16px; width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); animation: modal-slide-up 0.3s ease-out; }
@keyframes modal-slide-up { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid var(--border); }
.modal-header h3 { margin: 0; font-size: 1.25rem; color: var(--text-main); }
.btn-close { background: none; border: none; cursor: pointer; color: var(--text-muted); padding: 4px; border-radius: 4px; transition: all 0.2s; }
.btn-close:hover { background: #f3f4f6; color: var(--text-main); }
.modal-body { padding: 24px; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.form-group { display: flex; flex-direction: column; gap: 8px; }
.form-group.full-width { grid-column: 1 / -1; }
.form-group label { font-size: 0.9rem; font-weight: 600; color: var(--text-main); }
.form-group input, .form-group textarea { padding: 10px 12px; border: 1px solid var(--border); border-radius: 8px; font-size: 1rem; font-family: inherit; transition: border-color 0.2s; outline: none; }
.form-group input:focus, .form-group textarea:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(72, 28, 105, 0.1); }
.file-upload-wrapper { position: relative; }
.file-upload-wrapper input[type="file"] { position: absolute; left: 0; top: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }
.file-label { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; border: 2px dashed var(--border); border-radius: 8px; color: var(--text-muted); cursor: pointer; transition: all 0.2s; text-align: center; gap: 8px; }
.file-label:hover { border-color: var(--primary); background: #f3f0f7; color: var(--primary); }
.current-img-hint { font-size: 0.8rem; color: var(--text-muted); margin-top: 6px; font-style: italic; }
.modal-footer { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--border); }
.btn-secondary { background: white; border: 1px solid var(--border); color: var(--text-main); padding: 10px 20px; border-radius: 8px; font-weight: 500; cursor: pointer; transition: all 0.2s; }
.btn-secondary:hover { background: #f9fafb; border-color: #d1d5db; }
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.3s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
@media (max-width: 768px) { .admin-header { flex-direction: column; align-items: flex-start; } .btn-primary { width: 100%; justify-content: center; } .form-grid { grid-template-columns: 1fr; } }
</style>