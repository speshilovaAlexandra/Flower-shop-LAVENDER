<template>
<!-- php artisan storage:link
php artisan config:clear
php artisan cache:clear
php artisan route:clear -->

<!-- rmdir public\storage
php artisan storage:link -->

  <div id="app">
       <!-- Header -->
    <header class="site-header" :class="{ 'scrolled': isScrolled }">
      <div class="container header-content">
        <!-- Logo -->
        <router-link to="/" class="logo-wrapper">
          <span class="logo-icon"></span>
          <span class="logo-text">LAVENDER</span>
        </router-link>

        <!-- Navigation -->
        <nav class="main-nav">
          <!-- <router-link to="/catalog" class="nav-link" active-class="active">
            Каталог
          </router-link> -->

          <template v-if="isAuthenticated">
            <router-link to="/profile" class="nav-link nav-profile">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              <span>{{ userName }}</span>
            </router-link>

            <router-link to="/cart" class="nav-link nav-cart">
              <div class="cart-icon-wrapper">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                <span v-if="cartCount > 0" class="cart-badge">{{ cartCount }}</span>
              </div>
            </router-link>
            <router-link to="/constructor" class="nav-link btn-constructor">Собери свой букет</router-link>
            <!-- Admin Dropdown / Group -->
            <template v-if="isAdmin">
              <div class="admin-group">
                <span class="admin-label">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                  Админ
                </span>
                <router-link to="/admin/flowers" class="nav-link admin-link">Товары</router-link>
                <router-link to="/admin/orders" class="nav-link admin-link">Заказы</router-link>
              </div>
            </template>

            <button @click="logout" class="btn-logout" title="Выйти">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            </button>
          </template>

          <template v-else>
            <router-link to="/login" class="nav-link btn-login">Вход</router-link>
            <router-link to="/register" class="nav-link btn-register">Регистрация</router-link>
            <router-link to="/constructor" class="nav-link btn-constructor">Собери свой букет</router-link>
          </template>
        </nav>
      </div>
    </header>
    <main class="content">
      <router-view />
    </main>

    <footer class="site-footer">
        <div class="container">
        <!-- Верхняя часть: Гарантии (Коммерческие факторы) -->
        <div class="guarantees-section">
          <!-- <div class="guarantee-item">
            <div class="text">
              <h4>Быстрая доставка</h4>
              <p>Доставим в течение 2 часов</p>
            </div>
          </div> -->
          <div class="guarantee-item">
            <div class="text">
              <h4>Только свежие цветы</h4>
              <p>Гарантия свежести 7 дней</p>
            </div>
          </div>
          <div class="guarantee-item">
            <div class="text">
              <h4>Безопасная оплата</h4>
              <p>Картой или наличными</p>
            </div>
          </div>
          <div class="guarantee-item">
            <div class="text">
              <h4>Подарок к заказу</h4>
              <p>Открытка в каждом букете</p>
            </div>
          </div>
        </div>

        <div class="footer-divider"></div>

        <!-- Нижняя часть: Контакты и навигация -->
        <div class="footer-content">
          <div class="footer-col">
            <h3 class="logo-text">LAVENDER</h3>
            <p class="description">Ваш любимый цветочный бутик с душой и заботой о каждом клиенте.</p>
            <div class="social-links">
              <a href="#" class="social-icon" title="VK">VK</a>
              <a href="#" class="social-icon" title="Telegram">TG</a>
              <a href="#" class="social-icon" title="WhatsApp">WA</a>
            </div>
          </div>

          <div class="footer-col">
            <h4>Навигация</h4>
            <ul class="footer-links">
              <li><router-link to="/">Каталог</router-link></li>
              <!-- <li><router-link to="/team">О команде</router-link></li> -->
              <li><router-link to="/profile">Личный кабинет</router-link></li>
            </ul>
          </div>

          <div class="footer-col">
            <h4>Контакты</h4>
            <ul class="contact-list">
              <li>
                <a href="tel:+79991234567" class="contact-link">
                  <span class="icon"></span> +7 (999) 123-45-67
                </a>
              </li>
              <li>
                <a href="mailto:info@lavender.ru" class="contact-link">
                  <span class="icon"></span> info@lavender.ru
                </a>
              </li>
              <li>
                <span class="contact-link">
                  <span class="icon"></span> г. Пермь, ул. Цветочная, 15
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div class="footer-bottom">
          <p>&copy; 2026 Flower Boutique. All rights reserved.</p>
        </div>
      </div>
    </footer>
  </div>
  <ToastContainer/>
</template>

<script setup>
import ToastContainer from '@/components/ToastContainer.vue';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useCart } from '@/composables/useCart';

const router = useRouter();
const user = ref(null);
const { getCartCount, loadFromServer } = useCart();

onMounted(async () => {
  const storedUser = localStorage.getItem('user');
  if (storedUser) user.value = JSON.parse(storedUser);
  // ✅ Загружаем корзину при старте (с сервера если авторизован, иначе из localStorage)
  await loadFromServer();
});

const isAuthenticated = computed(() => !!localStorage.getItem('token'));
const isAdmin = computed(() => user.value?.role === 'admin');
const userName = computed(() => user.value?.name || 'User');
const cartCount = getCartCount; // ✅ Реактивный бейдж, обновляется автоматически

const logout = () => {
  // ✅ Полная очистка сессии и корзины
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('cart');
  localStorage.removeItem('cart_bouquet_ids');
  localStorage.removeItem('cart_packaging');
  localStorage.removeItem('active_catalog_bouquet_id');

  user.value = null;
  // ✅ Гарантированное обновление шапки и сброс состояния приложения
  window.location.href = '/';
};
</script>

<style>
/* ========================================= */
/* 1. GLOBAL VARIABLES & RESET               */
/* ========================================= */
:root {
  --primary: #481C69;
  --primary-light: #f3f0f7;
  --text-main: #1f2937;
  --text-muted: #6b7280;
  --bg-body: #f9fafb;
  --white: #ffffff;
  --border: #e5e7eb;
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  background-color: var(--bg-body);
  color: var(--text-main);
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

#app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  /* Убрал align-items: center, чтобы футер и хедер были на всю ширину */
  align-items: stretch; 
}

/* Container */
.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 20px;
  width: 100%;
}

/* ========================================= */
/* 2. HEADER & NAVIGATION                    */
/* ========================================= */
.site-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid transparent;
  transition: all 0.3s ease;
  padding: 15px 0;
  width: 100%; /* ИСПРАВЛЕНО: было 1750px */
}

.site-header.scrolled {
  background: rgba(255, 255, 255, 0.95);
  border-bottom-color: var(--border);
  box-shadow: var(--shadow-sm);
  padding: 10px 0;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap; /* Позволяет перенос на очень узких экранах */
  gap: 15px;
}

/* Logo */
.logo-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: var(--primary);
  font-weight: 800;
  font-size: 1.5rem;
  letter-spacing: -0.02em;
  transition: opacity 0.2s;
  flex-shrink: 0; /* Лого не сжимается */
}

.logo-wrapper:hover {
  opacity: 0.8;
}

.logo-icon {
  font-size: 1.8rem;
}

/* Navigation */
.main-nav {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap; /* Разрешаем перенос ссылок */
  justify-content: flex-end;
}

.nav-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  text-decoration: none;
  color: var(--text-main);
  font-weight: 500;
  font-size: 0.95rem;
  padding: 8px 14px;
  border-radius: 8px;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.nav-link:hover {
  background-color: var(--primary-light);
  color: var(--primary);
}

.nav-link.active {
  background-color: var(--primary);
  color: var(--white);
}

.nav-link.active:hover {
  background-color: var(--primary);
  opacity: 0.9;
}

.nav-link.admin { 
  color: var(--primary); 
  border: 1px solid #80243d;
}

.btn-logout { 
  background: none; 
  border: none; 
  cursor: pointer; 
  color: var(--text-main); 
  font-weight: 500;
  padding: 8px 12px;
  font-family: inherit;
  font-size: 0.95rem;
}

/* ========================================= */
/* 3. FOOTER (FLEXBOX)                       */
/* ========================================= */
.site-footer { 
  border-top: 1px solid var(--border);
  padding: 60px 0 20px;
  font-family: 'Inter', system-ui, sans-serif;
  margin-top: auto;
  width: 100%; /* ИСПРАВЛЕНО: было 1750px */
  background: var(--white);
}

/* Guarantees Section */
.guarantees-section {
  display: flex; /* БЫЛО: grid */
  flex-wrap: wrap;
  gap: 30px;
  margin-bottom: 40px;
  justify-content: space-between;
}

.guarantee-item {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  /* Адаптивная ширина для флексов */
  flex: 1 1 200px; 
  max-width: 350px;
}

.icon-box {
  font-size: 2rem;
  background: var(--primary-light);
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  flex-shrink: 0;
  color: var(--primary);
}

.text h4 {
  margin: 0 0 5px;
  font-size: 1rem;
  color: var(--text-main);
  font-weight: 700;
}

.text p {
  margin: 0;
  font-size: 0.9rem;
  color: var(--text-muted);
}

.footer-divider {
  height: 1px;
  background: var(--border);
  margin: 40px 0;
}

/* Footer Content */
.footer-content {
  display: flex; /* БЫЛО: grid */
  flex-wrap: wrap;
  gap: 40px;
  margin-bottom: 40px;
  justify-content: space-between;
}

/* Колонки футера */
.footer-col {
  flex: 1 1 300px; /* Базовая ширина 300px, могут сжиматься */
  display: flex;
  flex-direction: column;
}

/* Первая колонка чуть шире на десктопе */
.footer-col:first-child {
  flex: 1.5 1 300px;
}

.logo-text {
  font-size: 1.5rem;
  font-weight: 900;
  color: var(--primary);
  margin: 0 0 15px;
  letter-spacing: 0.05em;
}

.description {
  color: var(--text-muted);
  font-size: 0.95rem;
  line-height: 1.6;
  margin-bottom: 20px;
}

.social-links {
  display: flex;
  gap: 10px;
}

.social-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--primary-light);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary);
  text-decoration: none;
  font-weight: 700;
  font-size: 0.8rem;
  transition: all 0.2s;
}

.social-icon:hover {
  background: var(--primary);
  color: white;
}

h4 {
  margin: 0 0 20px;
  font-size: 1.1rem;
  color: var(--text-main);
  font-weight: 700;
}

.footer-links, .contact-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.footer-links a {
  color: var(--text-muted);
  text-decoration: none;
  transition: color 0.2s;
}

.footer-links a:hover {
  color: var(--primary);
}

.contact-link {
  color: var(--text-muted);
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: color 0.2s;
}

.contact-link:hover {
  color: var(--primary);
}

.icon {
  font-size: 1.2rem;
}

.footer-bottom {
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid var(--border);
  color: var(--text-muted);
  font-size: 0.9rem;
}

/* ========================================= */
/* 4. ADAPTIVE BREAKPOINTS                   */
/* ========================================= */

/* 2. Планшет - 991px и меньше */
@media (max-width: 991px) {
  .container {
    max-width: 100%;
    padding: 0 30px;
  }

  .site-header {
    padding: 10px 0;
  }

  .logo-wrapper {
    font-size: 1.3rem;
  }

  .guarantee-item {
    flex: 1 1 45%; /* 2 в ряд */
  }
  
  .footer-col {
    flex: 1 1 45%; /* 2 колонки в ряд */
  }
}

/* 3. Мобильный телефон в горизонтальном режиме - 767px и меньше */
@media (max-width: 767px) {
  .container {
    padding: 0 20px;
  }

  .header-content {
    justify-content: center; /* Центрируем на мобильных */
    flex-direction: column;
    gap: 15px;
  }

  .logo-wrapper {
    margin-bottom: 5px;
  }

  .main-nav {
    justify-content: center;
    gap: 5px;
  }

  .nav-link {
    padding: 6px 10px;
    font-size: 0.9rem;
  }

  .guarantees-section {
    gap: 20px;
  }

  .guarantee-item {
    flex: 1 1 100%; /* 1 в ряд на узких экранах */
    max-width: 100%;
  }

  .footer-content {
    gap: 30px;
  }

  .footer-col {
    flex: 1 1 100%; /* Все колонки друг под другом */
  }
}

/* 4. Мобильный телефон в портретном режиме - 479px и меньше */
@media (max-width: 479px) {
  .site-header {
    padding: 10px 0;
  }

  .logo-wrapper {
    font-size: 1.2rem;
  }
  
  .logo-icon {
    font-size: 1.5rem;
  }

  .main-nav {
    /* Горизонтальный скролл для меню на очень узких экранах */
    overflow-x: auto;
    width: 100%;
    justify-content: flex-start;
    padding-bottom: 5px;
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .main-nav::-webkit-scrollbar {
    display: none;
  }

  .nav-link {
    white-space: nowrap;
    flex-shrink: 0;
  }

  .site-footer {
    padding: 40px 0 20px;
  }

  .logo-text {
    font-size: 1.3rem;
  }

  .description {
    font-size: 0.85rem;
  }

  h4 {
    font-size: 1rem;
    margin-bottom: 15px;
  }

  .footer-links, .contact-list {
    gap: 10px;
  }

  .footer-bottom {
    font-size: 0.8rem;
  }
}
</style>