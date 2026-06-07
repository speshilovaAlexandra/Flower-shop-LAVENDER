<template>
  <Teleport to="body">
    <div class="toast-container">
      <TransitionGroup name="toast" tag="div">
        <div 
          v-for="toast in toasts" 
          :key="toast.id" 
          class="toast" 
          :class="toast.type"
          @click="remove(toast.id)"
          role="alert"
        >
          <div class="toast-content">
            <span class="toast-icon">
              <span v-if="toast.type === 'success'">✓</span>
              <span v-else-if="toast.type === 'error'">✕</span>
              <span v-else-if="toast.type === 'warning'">⚠</span>
              <span v-else>ℹ</span>
            </span>
            <p class="toast-message">{{ toast.message }}</p>
          </div>
          
          <!-- Кнопка × (опционально, дублирует клик по всему тосту) -->
          <button class="toast-close" @click.stop="remove(toast.id)">×</button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { useToastStore } from '@/stores/toast';
const { toasts, remove } = useToastStore();
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: none;
  max-width: 400px;
}

.toast {
  pointer-events: auto; /* ✅ Важно: разрешаем клики */
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px 14px 14px;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 10px 25px -5px rgba(0,0,0,0.15);
  min-height: 56px;
  border-left: 4px solid #6b7280;
  cursor: pointer; /* ✅ Показываем, что можно кликнуть */
  animation: toastSlideIn 0.3s ease;
}

.toast.success { border-left-color: #10b981; }
.toast.error   { border-left-color: #ef4444; }
.toast.warning { border-left-color: #f59e0b; }
.toast.info    { border-left-color: #3b82f6; }

.toast-content {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.toast-icon {
  flex-shrink: 0;
  font-size: 1.2rem;
  line-height: 1;
  margin-top: 2px;
}

.toast-message {
  margin: 0;
  font-size: 0.95rem;
  color: #1f2937;
  line-height: 1.4;
  word-break: break-word;
}

.toast-close {
  flex-shrink: 0;
  background: none;
  border: none;
  cursor: pointer;
  color: #9ca3af;
  font-size: 1.5rem;
  line-height: 1;
  padding: 0 4px;
  margin: -4px -4px -4px 8px;
  border-radius: 4px;
  transition: color 0.2s;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toast-close:hover {
  color: #374151;
  background: #f3f4f6;
}

@keyframes toastSlideIn {
  from { opacity: 0; transform: translateX(40px); }
  to { opacity: 1; transform: translateX(0); }
}

/* Vue TransitionGroup */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(40px);
}

/* Мобилка */
@media (max-width: 640px) {
  .toast-container {
    top: auto;
    bottom: 20px;
    right: 12px;
    left: 12px;
    max-width: none;
  }
}
</style>