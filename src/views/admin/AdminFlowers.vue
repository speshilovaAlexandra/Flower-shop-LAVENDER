<template>
  <div class="admin-page">
    <div class="container">
      <!-- Header -->
      <header class="admin-header">
        <div class="header-title">
          <h1>Управление каталогом</h1>
          <p>Список всех товаров и управление запасами</p>
        </div>
        <div class="header-actions">
          <button @click="openNew" class="btn-primary">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Добавить товар
          </button>
        </div>
      </header>

      <!-- 🆕 КРАСИВЫЙ CSV-ИМПОРТ -->
      <div class="csv-import-card">
        <div class="csv-header">
          <div class="csv-icon-wrapper">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="12" y1="18" x2="12" y2="12"/>
              <line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
          </div>
          <div class="csv-title-section">
            <h4>📦 Быстрый импорт из CSV</h4>
            <p class="hint">Формат: <code>Название, Цена, Количество, Описание</code></p>
          </div>
        </div>

        <div class="csv-upload-area" :class="{ 'has-file': selectedCsv, 'dragover': isDragOver }"
             @dragover.prevent="isDragOver = true"
             @dragleave.prevent="isDragOver = false"
             @drop.prevent="handleDrop">
          <input type="file" ref="csvInput" accept=".csv" @change="handleCsvSelect" class="csv-input-hidden">
          
          <div v-if="!selectedCsv" class="upload-prompt">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <p>Перетащите CSV-файл сюда или <span class="browse-link">выберите файл</span></p>
            <span class="file-hint">Поддерживаются файлы .csv</span>
          </div>

          <div v-else class="file-selected">
            <div class="file-info">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              <div class="file-details">
                <strong>{{ selectedCsv.name }}</strong>
                <span>{{ formatFileSize(selectedCsv.size) }}</span>
              </div>
              <button @click="clearSelectedFile" class="btn-clear-file" title="Удалить файл">✕</button>
            </div>
          </div>
        </div>

        <div class="csv-actions">
          <button @click="uploadCsv" :disabled="!selectedCsv || uploading" class="btn-upload" :class="{ 'uploading': uploading }">
            <svg v-if="!uploading" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="16 16 12 12 8 16"/>
              <line x1="12" y1="12" x2="12" y2="21"/>
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <div v-else class="upload-spinner"></div>
            <span>{{ uploading ? 'Загрузка...' : 'Загрузить файл' }}</span>
          </button>
          
          <a href="/sample-import.csv" download class="btn-sample">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="8 17 12 21 16 17"/>
              <line x1="12" y1="12" x2="12" y2="21"/>
              <path d="M20.88 18.09A9 9 0 0 0 12 3a9 9 0 0 0-8.88 7.09"/>
            </svg>
            Скачать пример
          </a>
        </div>

        <!-- 🆕 КРАСИВЫЙ РЕЗУЛЬТАТ ИМПОРТА -->
        <transition name="slide-down">
          <div v-if="importResult" class="import-result" :class="{ 'success': !importResult.errors.length, 'warning': importResult.errors.length }">
            <div class="result-header">
              <div class="result-icon" :class="{ 'success': !importResult.errors.length, 'warning': importResult.errors.length }">
                <svg v-if="!importResult.errors.length" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              <div class="result-stats">
                <span class="stat-badge success-badge">✅ Добавлено: {{ importResult.created }}</span>
                <span class="stat-badge info-badge">🔄 Обновлено: {{ importResult.updated }}</span>
              </div>
              <button @click="importResult = null" class="btn-close-result">✕</button>
            </div>
            
            <div v-if="importResult.errors.length > 0" class="errors-list">
              <p class="errors-title">⚠️ Ошибки при импорте:</p>
              <div class="errors-scroll">
                <ul>
                  <li v-for="(err, i) in importResult.errors" :key="i">
                    <span class="error-dot"></span>
                    {{ err }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </transition>
      </div>

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
                    <img :src="getImageUrl(flower.image_url || flower.img)" :alt="flower.nazvanie" @error="handleImageError">
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
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    <button @click="deleteItem(flower.id)" class="btn-icon btn-delete" title="Удалить">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
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
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
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

              <div class="form-group full-width">
                <label>Изображение букета (для каталога) *</label>
                <div class="file-upload-wrapper">
                  <input type="file" @change="handleFileUpload" accept="image/*" id="fileInput">
                  <label for="fileInput" class="file-label">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    <span>{{ form.img ? form.img.name : 'Выберите файл или перетащите сюда' }}</span>
                  </label>
                </div>
                <div v-if="editingId && !form.img" class="current-img-hint">
                  Текущее изображение сохранится, если не загрузить новое.
                </div>
              </div>

              <div class="form-group full-width">
                <label>Фото цветка (для конструктора)</label>
                <div class="file-upload-wrapper">
                  <input type="file" @change="handleFlowerFileUpload" accept="image/*" id="flowerFileInput">
                  <label for="flowerFileInput" class="file-label">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M12 16v-4M12 8h.01"/>
                    </svg>
                    <span>{{ form.flower_img ? form.flower_img.name : 'Загрузите фото одного цветка (опционально)' }}</span>
                  </label>
                </div>
                <div v-if="editingId && currentFlowerImg && !form.flower_img" class="current-img-hint">
                  Текущее фото цветка: <img :src="getImageUrl(currentFlowerImg)" alt="" class="hint-thumb" @error="handleImageError">
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
import { getImageUrl, handleImageError } from '@/utils/image';
import ConfirmModal from '@/components/ConfirmModal.vue';

const confirmModal = ref(null);
const selectedCsv = ref(null);
const uploading = ref(false);
const importResult = ref(null);
const isDragOver = ref(false);

const handleCsvSelect = (e) => {
  selectedCsv.value = e.target.files[0];
  importResult.value = null;
};

const handleDrop = (e) => {
  isDragOver.value = false;
  const file = e.dataTransfer.files[0];
  if (file && file.type === 'text/csv') {
    selectedCsv.value = file;
    importResult.value = null;
  } else {
    toast.error('Пожалуйста, загрузите файл в формате CSV');
  }
};

const clearSelectedFile = () => {
  selectedCsv.value = null;
  if (csvInput.value) csvInput.value.value = '';
};

const formatFileSize = (bytes) => {
  if (!bytes) return '';
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
};

const uploadCsv = async () => {
  if (!selectedCsv.value) return;
  uploading.value = true;
  
  const formData = new FormData();
  formData.append('csv_file', selectedCsv.value);

  try {
    const { data } = await api.post('/admin/flowers/import-csv', formData);
    importResult.value = data;
    load();
    setTimeout(() => {
      clearSelectedFile();
    }, 3000);
  } catch (e) {
    toast.error('Ошибка загрузки: ' + (e.response?.data?.message || 'Неизвестная ошибка'));
  } finally {
    uploading.value = false;
  }
};

const flowers = ref([]);
const showModal = ref(false);
const editingId = ref(null);
const saving = ref(false);
const currentFlowerImg = ref(null);

const form = ref({ 
  nazvanie: '', 
  price: '', 
  quantity: 0, 
  opisanie: '', 
  img: null,
  flower_img: null
});

const toast = useToastStore();
const csvInput = ref(null);

const load = async () => { 
  try {
    const res = await api.get('/flowers');
    flowers.value = res.data; 
  } catch (e) {
    toast.error('Ошибка загрузки каталога');
  }
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
  fd.append('quantity', form.value.quantity || 0);
  fd.append('opisanie', form.value.opisanie || '');

  if (form.value.img instanceof File) {
    fd.append('img', form.value.img);
  }

  if (form.value.flower_img instanceof File) {
    fd.append('flower_img', form.value.flower_img);
  }

  try {
    if (editingId.value) {
      fd.append('_method', 'PUT');
      await api.post(`/admin/flowers/${editingId.value}`, fd);
      toast.success('Товар успешно обновлён');
    } else {
      await api.post('/admin/flowers', fd);
      toast.success('Товар добавлен в каталог');
    }
    showModal.value = false;
    load();
  } catch (e) {
    if (e.response?.data?.errors) {
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
  currentFlowerImg.value = flower.flower_image_url;
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
  const confirmed = await confirmModal.value.show({
    title: 'Удаление товара',
    message: 'Вы уверены, что хотите удалить этот товар? Это действие нельзя отменить.',
    confirmText: 'Да, удалить',
    cancelText: 'Отмена',
    type: 'danger'
  });
  
  if (!confirmed) return;
  
  try {
    await api.delete(`/admin/flowers/${id}`);
    toast.success('Товар успешно удалён');
    load();
  } catch (e) {
    toast.error('Ошибка при удалении товара');
  }
};

onMounted(load);
</script>

<style scoped>
/* ===== КРАСИВЫЙ CSV-ИМПОРТ ===== */
.csv-import-card {
  margin-bottom: 30px;
  background: linear-gradient(135deg, #ffffff 0%, #fefcf7 100%);
  border: 2px solid #e5e7eb;
  border-radius: 20px;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.csv-import-card:hover {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  border-color: #d1d5db;
}

.csv-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px 28px;
  background: linear-gradient(135deg, #f3f0f7 0%, #e9ddf5 100%);
  border-bottom: 1px solid #e5e7eb;
}

.csv-icon-wrapper {
  width: 56px;
  height: 56px;
  background: white;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.csv-title-section h4 {
  margin: 0 0 4px;
  font-size: 1.2rem;
  font-weight: 700;
  color: #1f2937;
}

.csv-title-section .hint {
  margin: 0;
  font-size: 0.85rem;
  color: #6b7280;
}

.csv-title-section .hint code {
  background: rgba(72, 28, 105, 0.1);
  padding: 2px 6px;
  border-radius: 6px;
  font-size: 0.8rem;
  color: var(--primary);
  font-weight: 600;
}

.csv-upload-area {
  margin: 20px 28px;
  border: 2px dashed #d1d5db;
  border-radius: 16px;
  background: #fafbfc;
  transition: all 0.3s ease;
  cursor: pointer;
  min-height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.csv-upload-area.dragover {
  border-color: var(--primary);
  background: #f3f0f7;
  transform: scale(0.98);
}

.csv-upload-area.has-file {
  border-color: #10b981;
  background: #ecfdf5;
}

.upload-prompt {
  text-align: center;
  padding: 40px;
}

.upload-prompt svg {
  color: #9ca3af;
  margin-bottom: 16px;
}

.upload-prompt p {
  margin: 0 0 8px;
  color: #6b7280;
  font-size: 0.95rem;
}

.browse-link {
  color: var(--primary);
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
}

.file-hint {
  font-size: 0.8rem;
  color: #9ca3af;
}

.file-selected {
  width: 100%;
  padding: 30px;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 16px;
  background: white;
  padding: 16px 20px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.file-info svg {
  color: #10b981;
  flex-shrink: 0;
}

.file-details {
  flex: 1;
}

.file-details strong {
  display: block;
  font-size: 0.95rem;
  color: #1f2937;
  margin-bottom: 4px;
}

.file-details span {
  font-size: 0.75rem;
  color: #6b7280;
}

.btn-clear-file {
  background: #fee2e2;
  border: none;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  cursor: pointer;
  color: #dc2626;
  font-size: 0.8rem;
  transition: all 0.2s;
}

.btn-clear-file:hover {
  background: #dc2626;
  color: white;
}

.csv-actions {
  display: flex;
  gap: 12px;
  padding: 0 28px 24px 28px;
}

.btn-upload {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 12px 24px;
  background: linear-gradient(135deg, var(--primary) 0%, #6d3a96 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px -1px rgba(72, 28, 105, 0.2);
}

.btn-upload:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(72, 28, 105, 0.3);
}

.btn-upload:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-upload.uploading {
  background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%);
}

.upload-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.btn-sample {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  color: #6b7280;
  font-size: 0.9rem;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s;
}

.btn-sample:hover {
  background: #f9fafb;
  border-color: var(--primary);
  color: var(--primary);
}

/* Результат импорта */
.import-result {
  margin: 0 28px 24px 28px;
  border-radius: 16px;
  overflow: hidden;
  animation: slideDown 0.4s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.slide-down-enter-active {
  animation: slideDown 0.4s ease-out;
}

.slide-down-leave-active {
  animation: slideDown 0.3s ease-in reverse;
}

.import-result.success {
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
}

.import-result.warning {
  background: #fef3c7;
  border: 1px solid #fde68a;
}

.result-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  position: relative;
}

.result-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.result-icon.success {
  background: #10b981;
  color: white;
}

.result-icon.warning {
  background: #f59e0b;
  color: white;
}

.result-stats {
  flex: 1;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.stat-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
}

.success-badge {
  background: #d1fae5;
  color: #065f46;
}

.info-badge {
  background: #dbeafe;
  color: #1e40af;
}

.btn-close-result {
  background: rgba(0, 0, 0, 0.05);
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s;
}

.btn-close-result:hover {
  background: rgba(0, 0, 0, 0.1);
  transform: rotate(90deg);
}

.errors-list {
  border-top: 1px solid #fde68a;
  padding: 16px 20px;
}

.errors-title {
  margin: 0 0 12px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #92400e;
}

.errors-scroll {
  max-height: 150px;
  overflow-y: auto;
}

.errors-list ul {
  margin: 0;
  padding-left: 20px;
}

.errors-list li {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  font-size: 0.8rem;
  color: #92400e;
}

.error-dot {
  width: 6px;
  height: 6px;
  background: #f59e0b;
  border-radius: 50%;
  display: inline-block;
}

/* ===== ОСТАЛЬНЫЕ СТИЛИ ===== */
.hint-thumb {
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: 4px;
  vertical-align: middle;
  margin-left: 8px;
  border: 1px solid var(--border);
}

:root {
  --primary: #481C69;
  --primary-hover: #361550;
  --danger: #ef4444;
  --success: #10b981;
  --warning: #f59e0b;
  --bg-page: #f3f4f6;
  --bg-card: #ffffff;
  --text-main: #1f2937;
  --text-muted: #6b7280;
  --border: #e5e7eb;
}

.admin-page {
  background-color: var(--bg-page);
  min-height: 100vh;
  padding: 30px 20px;
  font-family: 'Inter', system-ui, sans-serif;
  color: var(--text-main);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  flex-wrap: wrap;
  gap: 20px;
}

.header-title h1 {
  font-size: 1.8rem;
  font-weight: 800;
  margin: 0 0 5px;
  color: var(--text-main);
}

.header-title p {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.95rem;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background-color: var(--primary);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 6px -1px rgba(72, 28, 105, 0.2);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 10px -2px rgba(72, 28, 105, 0.3);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.card {
  background: var(--bg-card);
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  border: 1px solid var(--border);
}

.table-responsive {
  overflow-x: auto;
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.admin-table th {
  background: #f9fafb;
  padding: 16px;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  font-weight: 600;
  border-bottom: 1px solid var(--border);
}

.admin-table td {
  padding: 16px;
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
}

.admin-table tr:last-child td {
  border-bottom: none;
}

.admin-table tr:hover {
  background-color: #f9fafb;
}

.img-thumb {
  width: 50px;
  height: 50px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--border);
  background: #f3f4f6;
}

.img-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cell-main {
  font-weight: 600;
  color: var(--text-main);
}

.cell-sub {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-top: 4px;
}

.text-truncate {
  display: block;
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.price-tag {
  font-weight: 700;
  color: var(--primary);
  font-size: 1.05rem;
}

.stock-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
}

.stock-badge.ok {
  background: #d1fae5;
  color: #065f46;
}

.stock-badge.low {
  background: #fee2e2;
  color: #b91c1c;
}

.text-right {
  text-align: right;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: var(--text-muted);
  font-style: italic;
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.btn-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  color: white;
}

.btn-edit {
  background: #eff6ff;
  color: #2563eb;
}

.btn-edit:hover {
  background: #2563eb;
  color: white;
}

.btn-delete {
  background: #fef2f2;
  color: #dc2626;
}

.btn-delete:hover {
  background: #dc2626;
  color: white;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
}

.modal-container {
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  animation: modal-slide-up 0.3s ease-out;
}

@keyframes modal-slide-up {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border);
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: var(--text-main);
}

.btn-close {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
}

.btn-close:hover {
  background: #f3f4f6;
  color: var(--text-main);
}

.modal-body {
  padding: 24px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-main);
}

.form-group input,
.form-group textarea {
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 10px;
  font-size: 1rem;
  font-family: inherit;
  transition: border-color 0.2s;
  outline: none;
}

.form-group input:focus,
.form-group textarea:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(72, 28, 105, 0.1);
}

.file-upload-wrapper {
  position: relative;
}

.file-upload-wrapper input[type="file"] {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.file-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  border: 2px dashed var(--border);
  border-radius: 12px;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
  gap: 8px;
}

.file-label:hover {
  border-color: var(--primary);
  background: #f3f0f7;
  color: var(--primary);
}

.current-img-hint {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-top: 6px;
  font-style: italic;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--border);
}

.btn-secondary {
  background: white;
  border: 1px solid var(--border);
  color: var(--text-main);
  padding: 10px 20px;
  border-radius: 10px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #f9fafb;
  border-color: #d1d5db;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

/* Адаптив */
@media (max-width: 768px) {
  .admin-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .btn-primary {
    width: 100%;
    justify-content: center;
  }
  
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .csv-header {
    flex-direction: column;
    text-align: center;
    padding: 20px;
  }
  
  .csv-upload-area {
    margin: 16px 20px;
  }
  
  .csv-actions {
    flex-direction: column;
    padding: 0 20px 20px 20px;
  }
  
  .import-result {
    margin: 0 20px 20px 20px;
  }
  
  .result-header {
    flex-wrap: wrap;
  }
}

@media (max-width: 480px) {
  .admin-page {
    padding: 20px 12px;
  }
  
  .csv-title-section h4 {
    font-size: 1rem;
  }
  
  .upload-prompt {
    padding: 25px;
  }
  
  .upload-prompt svg {
    width: 36px;
    height: 36px;
  }
  
  .file-selected {
    padding: 20px;
  }
  
  .file-info {
    padding: 12px 16px;
  }
  
  .result-stats {
    flex-direction: column;
    gap: 8px;
  }
  
  .stat-badge {
    text-align: center;
  }
}

@media (max-width: 390px) {
  .csv-header {
    padding: 16px;
  }
  
  .csv-icon-wrapper {
    width: 48px;
    height: 48px;
  }
  
  .csv-icon-wrapper svg {
    width: 24px;
    height: 24px;
  }
  
  .csv-title-section h4 {
    font-size: 0.95rem;
  }
  
  .csv-title-section .hint {
    font-size: 0.75rem;
  }
  
  .csv-upload-area {
    margin: 12px 16px;
    min-height: 140px;
  }
  
  .upload-prompt p {
    font-size: 0.85rem;
  }
  
  .file-hint {
    font-size: 0.7rem;
  }
  
  .file-details strong {
    font-size: 0.85rem;
  }
  
  .btn-upload, .btn-sample {
    padding: 10px 16px;
    font-size: 0.85rem;
  }
  
  .result-header {
    padding: 12px 16px;
    gap: 10px;
  }
  
  .result-icon {
    width: 32px;
    height: 32px;
  }
  
  .result-icon svg {
    width: 18px;
    height: 18px;
  }
  
  .stat-badge {
    font-size: 0.75rem;
    padding: 4px 8px;
  }
  
  .errors-list {
    padding: 12px 16px;
  }
  
  .errors-list li {
    font-size: 0.7rem;
  }
}
</style>
