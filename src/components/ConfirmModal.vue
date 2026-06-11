<!-- components/ConfirmModal.vue -->
<template>
  <transition name="modal-fade">
    <div v-if="visible" class="confirm-overlay" @click.self="cancel">
      <div class="confirm-modal">
        <div class="confirm-icon" :class="type">
          <svg v-if="type === 'danger'" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <svg v-else width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <h3>{{ title }}</h3>
        <p>{{ message }}</p>
        <div class="confirm-actions">
          <button class="btn-confirm-cancel" @click="cancel">{{ cancelText }}</button>
          <button class="btn-confirm-ok" :class="type" @click="confirm">{{ confirmText }}</button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref } from 'vue';

const visible = ref(false);
let resolvePromise = null;

const show = (options) => {
  title.value = options.title || 'Подтверждение';
  message.value = options.message || 'Вы уверены?';
  confirmText.value = options.confirmText || 'Да';
  cancelText.value = options.cancelText || 'Отмена';
  type.value = options.type || 'warning';
  visible.value = true;
  
  return new Promise((resolve) => {
    resolvePromise = resolve;
  });
};

const confirm = () => {
  visible.value = false;
  if (resolvePromise) resolvePromise(true);
};

const cancel = () => {
  visible.value = false;
  if (resolvePromise) resolvePromise(false);
};

defineExpose({ show });
</script>

<style scoped>
.confirm-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1100;
  animation: fadeIn 0.2s ease;
}

.confirm-modal {
  background: white;
  border-radius: 20px;
  padding: 28px;
  max-width: 400px;
  width: 90%;
  text-align: center;
  animation: slideUp 0.3s ease;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.confirm-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.confirm-icon.danger {
  background: #fee2e2;
  color: #dc2626;
}

.confirm-icon.warning {
  background: #fef3c7;
  color: #f59e0b;
}

.confirm-icon.success {
  background: #d1fae5;
  color: #10b981;
}

.confirm-modal h3 {
  margin: 0 0 12px;
  font-size: 1.3rem;
  color: #1f2937;
}

.confirm-modal p {
  margin: 0 0 24px;
  color: #6b7280;
  line-height: 1.5;
}

.confirm-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.btn-confirm-cancel,
.btn-confirm-ok {
  padding: 10px 24px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-confirm-cancel {
  background: #f3f4f6;
  color: #6b7280;
}

.btn-confirm-cancel:hover {
  background: #e5e7eb;
}

.btn-confirm-ok {
  background: #481C69;
  color: white;
}

.btn-confirm-ok.danger {
  background: #dc2626;
}

.btn-confirm-ok.danger:hover {
  background: #b91c1c;
}

.btn-confirm-ok.warning {
  background: #f59e0b;
}

.btn-confirm-ok:hover {
  transform: translateY(-1px);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@media (max-width: 480px) {
  .confirm-modal {
    padding: 20px;
    width: 85%;
  }
  
  .confirm-icon {
    width: 48px;
    height: 48px;
  }
  
  .confirm-icon svg {
    width: 24px;
    height: 24px;
  }
  
  .confirm-modal h3 {
    font-size: 1.1rem;
  }
  
  .confirm-modal p {
    font-size: 0.85rem;
  }
  
  .btn-confirm-cancel,
  .btn-confirm-ok {
    padding: 8px 18px;
    font-size: 0.85rem;
  }
}
</style>
