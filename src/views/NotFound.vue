<template>
  <div class="not-found-page">
    <div class="container">
      <div class="error-content">
        <div class="error-code">404</div>
        <h1 class="error-title">Страница не найдена</h1>
        <p class="error-message">
          Похоже, вы заблудились в нашем цветочном саду. 
          Такой страницы не существует или она была перемещена.
        </p>
        <div class="error-actions">
          <router-link to="/" class="btn-primary">
            Вернуться на главную
          </router-link>
        </div>
        <div class="error-illustration">
          <svg width="200" height="200" viewBox="0 0 200 200" fill="none">
            <circle cx="100" cy="100" r="80" fill="#f3f0f7"/>
            <path d="M60 100 L80 120 L140 60" stroke="#481C69" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="100" cy="100" r="90" stroke="#481C69" stroke-width="4" stroke-dasharray="10 10" opacity="0.3"/>
          </svg>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { onMounted } from 'vue';

// Выносим SEO-данные в отдельный объект для чистоты кода
const seo = {
  title: 'Страница не найдена — 404 | LAVENDER',
  description: 'К сожалению, такая страница не найдена'
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

<style scoped>:root{--primary:#481C69;--primary-hover:#361550;--text-main:#1f2937;--text-muted:#6b7280;--bg-page:#f9fafb;--bg-card:#fff;--border:#e5e7eb}.not-found-page{background-color:var(--bg-page);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:60px 20px;font-family:'Inter',system-ui,sans-serif;width:100%;max-width:1920px;margin:0 auto;box-sizing:border-box}.container{max-width:600px;width:100%}.error-content{text-align:center;background:var(--bg-card);padding:60px 40px;border-radius:24px;box-shadow:0 20px 25px -5px rgba(0,0,0,0.1);border:1px solid var(--border);transition:transform 0.3s ease,box-shadow 0.3s ease}.error-content:hover{transform:translateY(-4px);box-shadow:0 25px 30px -5px rgba(0,0,0,0.15)}.error-code{font-size:6rem;font-weight:900;color:var(--primary);line-height:1;margin-bottom:20px;text-shadow:4px 4px 0 rgba(72,28,105,0.1);letter-spacing:-0.02em}.error-title{font-size:2rem;color:var(--text-main);margin:0 0 16px;font-weight:800;line-height:1.2}.error-message{color:var(--text-muted);font-size:1.1rem;line-height:1.6;margin:0 0 40px}.error-actions{display:flex;gap:16px;justify-content:center;flex-wrap:wrap;margin-bottom:40px}.btn-primary,.btn-secondary{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:14px 28px;border-radius:12px;font-weight:600;text-decoration:none;transition:all 0.2s ease;font-size:1rem;cursor:pointer;border:none}.btn-primary{background:var(--primary);color:white}.btn-primary:hover{background:#c86df3;transform:translateY(-2px);box-shadow:0 4px 12px rgba(72,28,105,0.3)}.btn-primary:active{transform:translateY(0)}.btn-secondary{background:white;color:var(--text-main);border:1px solid var(--border)}.btn-secondary:hover{background:#f9fafb;border-color:var(--primary);color:var(--primary);transform:translateY(-2px)}.btn-secondary:active{transform:translateY(0)}.error-illustration{opacity:0.5;max-width:100%;height:auto}@media (max-width:991px){.not-found-page{padding:50px 20px}.error-content{padding:50px 35px}.error-code{font-size:5rem}.error-title{font-size:1.75rem}.error-message{font-size:1rem}}@media (max-width:767px){.not-found-page{padding:40px 20px;align-items:flex-start;padding-top:60px}.error-content{padding:40px 30px;border-radius:20px}.error-code{font-size:4rem;margin-bottom:15px}.error-title{font-size:1.5rem;margin-bottom:12px}.error-message{font-size:0.95rem;margin-bottom:30px}.error-actions{gap:12px;margin-bottom:30px}.btn-primary,.btn-secondary{padding:12px 24px;font-size:0.95rem}}@media (max-width:479px){.not-found-page{padding:30px 15px;align-items:center;padding-top:40px;padding-bottom:40px}.error-content{padding:30px 20px;border-radius:16px;box-shadow:0 10px 20px -5px rgba(0,0,0,0.1)}.error-code{font-size:3.5rem;margin-bottom:12px;text-shadow:2px 2px 0 rgba(72,28,105,0.1)}.error-title{font-size:1.3rem;margin-bottom:10px}.error-message{font-size:0.9rem;line-height:1.5;margin-bottom:25px}.error-actions{flex-direction:column;gap:10px;margin-bottom:25px}.btn-primary,.btn-secondary{width:100%;padding:14px 20px;font-size:0.9rem;border-radius:10px}.error-illustration{opacity:0.4;max-width:80%}}</style>
