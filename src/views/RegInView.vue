<template>
  <div class="auth-page">
    <div class="auth-card">
      <!-- Header -->
      <div class="auth-header">
        <h2 class="title">Создать аккаунт</h2>
        <p class="subtitle">Присоединяйтесь к нашему цветочному бутику!</p>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleRegister" class="auth-form">
        <!-- Name Field -->
        <div class="form-group">
          <label for="name" class="form-label">Ваше имя</label>
          <div class="input-wrapper">
            <svg class="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            <input 
              id="name"
              v-model.trim="form.name" 
              type="text" 
              placeholder="Иван Иванов" 
              required 
              class="form-input"
            />
          </div>
        </div>

        <!-- Email Field -->
        <div class="form-group">
          <label for="email" class="form-label">Email</label>
          <div class="input-wrapper">
            <svg class="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
            <input 
              id="email"
              v-model.trim="form.email" 
              type="email" 
              placeholder="example@mail.com" 
              required 
              class="form-input"
            />
          </div>
        </div>

        <!-- Password Field -->
        <div class="form-group">
          <label for="password" class="form-label">Пароль</label>
          <div class="input-wrapper">
            <svg class="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            <input 
              id="password"
              v-model="form.password" 
              type="password" 
              placeholder="••••••••" 
              required 
              class="form-input"
            />
          </div>
        </div>

        <!-- Confirm Password Field -->
        <div class="form-group">
          <label for="password_confirmation" class="form-label">Подтвердите пароль</label>
          <div class="input-wrapper">
            <svg class="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            <input 
              id="password_confirmation"
              v-model="form.password_confirmation" 
              type="password" 
              placeholder="••••••••" 
              required 
              class="form-input"
            />
          </div>
        </div>

        <!-- Error Message -->
        <transition name="fade">
          <div v-if="error" class="error-message">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            {{ error }}
          </div>
        </transition>

        <button type="submit" class="btn-submit" :disabled="loading">
          <span v-if="loading" class="loader"></span>
          <span v-else>Зарегистрироваться</span>
        </button>
      </form>

      <!-- Footer -->
      <div class="auth-footer">
        <p>Уже есть аккаунт? <router-link to="/login">Войти</router-link></p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { onMounted } from 'vue';
const router = useRouter();
const authStore = useAuthStore();
const form = ref({ name: '', email: '', password: '', password_confirmation: '' });
const error = ref('');
const loading = ref(false);

const handleRegister = async () => {
  error.value = '';
  if (form.value.password !== form.value.password_confirmation) {
    error.value = 'Пароли не совпадают';
    return;
  }
  loading.value = true;
  try {
    await authStore.register(form.value.name, form.value.email, form.value.password, form.value.password_confirmation);
    window.location.href = '/';
  } catch (e) {
    const errors = e.response?.data?.errors;
    if (errors) {
      error.value = Object.values(errors).flat().join(' ');
    } else {
      error.value = e.response?.data?.message || 'Ошибка регистрации';
    }
  } finally {
    loading.value = false;
  }
};
// Выносим SEO-данные в отдельный объект для чистоты кода
const seo = {
  title: 'Регистрация нового пользователя | LAVENDER',
  description: 'Зарегистрируйтесь в магазине цветов LAVENDER.'
};

onMounted(() => {
  // Устанавливаем заголовок вкладки
  document.title = seo.title;
  
  // Находим или создаем мета-тег description
  let metaDescription = document.querySelector('meta[name="description"]');
  
  if (!metaDescription) {
    metaDescription = document.createElement('meta');
    metaDescription.name = 'description';
    document.head.appendChild(metaDescription);
  }
  
  // Обновляем контент
  metaDescription.content = seo.description;
});

</script>

<style scoped>:root{--primary:#481C69;--bg-page:#f3f4f6;--bg-card:#fff;--text-main:#1f2937;--text-muted:#6b7280;--border:#e5e7eb;--danger:#ef4444;--focus-ring:rgba(72,28,105,0.2)}.auth-page{display:flex;justify-content:center;align-items:center;min-height:100vh;width:100%;max-width:1920px;background-color:var(--bg-page);margin:0 auto;padding:40px 20px;font-family:'Inter',system-ui,sans-serif;box-sizing:border-box}.auth-card{width:100%;max-width:420px;background:var(--bg-card);padding:40px;border-radius:16px;box-shadow:0 10px 25px -5px rgba(0,0,0,0.1),0 8px 10px -6px rgba(0,0,0,0.1);text-align:center;transition:transform 0.3s ease}.auth-header{margin-bottom:30px}.title{font-size:1.75rem;font-weight:700;color:var(--text-main);margin:0 0 8px}.subtitle{color:var(--text-muted);font-size:0.95rem;margin:0}.auth-form{display:flex;flex-direction:column;gap:18px;text-align:left}.form-group{display:flex;flex-direction:column;gap:6px}.form-label{font-size:0.9rem;font-weight:600;color:var(--text-main);margin-left:4px}.input-wrapper{position:relative;display:flex;align-items:center}.input-icon{position:absolute;left:14px;color:var(--text-muted);pointer-events:none;transition:color 0.2s;display:flex;align-items:center;justify-content:center}.form-input{width:100%;padding:14px 14px 14px 48px;border:1px solid var(--border);border-radius:10px;font-size:1rem;color:var(--text-main);background:#fff;transition:all 0.2s ease;outline:none;box-sizing:border-box}.form-input::placeholder{color:#9ca3af}.form-input:focus{border-color:var(--primary);box-shadow:0 0 0 4px var(--focus-ring)}.form-input:focus + .input-icon,.input-wrapper:focus-within .input-icon{color:var(--primary)}.form-input.error{border-color:var(--danger);animation:shake 0.3s ease-in-out}@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}.error-message{display:flex;align-items:center;gap:8px;background:#fee2e2;color:#b91c1c;padding:12px;border-radius:8px;font-size:0.9rem;font-weight:500}.btn-submit{width:100%;padding:16px;background-color:var(--primary);color:white;border:none;border-radius:10px;font-size:1rem;font-weight:600;cursor:pointer;transition:all 0.2s;display:flex;justify-content:center;align-items:center;gap:8px;margin-top:10px}.loader{width:20px;height:20px;border:2px solid rgba(255,255,255,0.3);border-radius:50%;border-top-color:#fff;animation:spin 0.8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}.auth-footer{margin-top:25px;text-align:center;font-size:0.95rem;color:var(--text-muted)}.auth-footer a{color:var(--primary);font-weight:600;text-decoration:none;transition:opacity 0.2s}.auth-footer a:hover{opacity:0.8;text-decoration:underline}.fade-enter-active,.fade-leave-active{transition:opacity 0.3s ease,transform 0.3s ease}.fade-enter-from,.fade-leave-to{opacity:0;transform:translateY(-10px)}@media (max-width:991px){.auth-page{padding:30px 20px}.auth-card{padding:35px;max-width:400px}.title{font-size:1.6rem}}@media (max-width:767px){.auth-page{padding:20px 15px;align-items:flex-start;padding-top:40px}.auth-card{padding:30px 25px;max-width:380px}.title{font-size:1.5rem}.subtitle{font-size:0.9rem}.form-input{padding:12px 12px 12px 44px;font-size:0.95rem}.btn-submit{padding:14px;font-size:0.95rem}}@media (max-width:479px){.auth-page{padding:15px 10px;align-items:center;padding-top:20px;padding-bottom:20px}.auth-card{padding:25px 20px;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.1)}.auth-header{margin-bottom:25px}.title{font-size:1.3rem;margin-bottom:5px}.subtitle{font-size:0.85rem}.form-group{gap:6px}.form-label{font-size:0.85rem}.form-input{padding:12px 12px 12px 40px;font-size:0.9rem;border-radius:8px}.input-icon{left:12px;font-size:0.9rem}.btn-submit{padding:14px;font-size:0.9rem;border-radius:8px}.auth-footer{margin-top:25px;font-size:0.85rem}.auth-footer a{font-size:0.85rem}.error-message{padding:10px;font-size:0.85rem;gap:6px}}</style>
