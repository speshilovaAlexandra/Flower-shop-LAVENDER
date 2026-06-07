import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useToastStore = defineStore('toast', () => {
  const toasts = ref([]);
  let id = 0;

  const add = (message, type = 'info', duration = 20000) => {
    const toastId = ++id;
    
    const toast = { 
      id: toastId, 
      message, 
      type, 
      duration,
      createdAt: Date.now()
    };
    
    toasts.value.push(toast);
    setTimeout(() => {
      const idx = toasts.value.findIndex(t => t.id === toastId);
      if (idx !== -1) {
        toasts.value.splice(idx, 1); 
      }
    }, duration);
  };

  const remove = (toastId) => {
    const idx = toasts.value.findIndex(t => t.id === toastId);
    if (idx !== -1) {
      toasts.value.splice(idx, 1);
    }
  };

  return {
    toasts,
    remove,
    success: (msg, dur) => add(msg, 'success', dur),
    error:   (msg, dur) => add(msg, 'error',   dur),
    warning: (msg, dur) => add(msg, 'warning', dur),
    info:    (msg, dur) => add(msg, 'info',    dur)
  };
});