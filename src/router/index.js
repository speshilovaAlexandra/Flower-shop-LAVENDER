import { createRouter, createWebHistory } from 'vue-router'
import CatalogView from '../views/CatalogView.vue'
import ProductView from '../views/ProductView.vue'
import CartView from '../views/CartView.vue'
import LoginView from '../views/LoginView.vue'
import RegInView from '../views/RegInView.vue'
import Profile from '../views/Profile.vue'
import AdminFlowers from '../views/admin/AdminFlowers.vue'
import AdminOrders from '../views/admin/AdminOrders.vue'
import NotFound from '../views/NotFound.vue'
import HomeView from '../views/HomeView.vue';
import ConstructorView from '../views/ConstructorView.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // { path: '/', name: 'catalog', component: CatalogView },
    { path: '/product/:id', name: 'product', component: ProductView, props: true },
    { path: '/cart', name: 'cart', component: CartView, meta: { requiresAuth: true } },
    { path: '/login', name: 'login', component: LoginView },
    { path: '/register', name: 'register', component: RegInView },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFound },
    { path: '/profile', name: 'profile', component: Profile, meta: { requiresAuth: true } },
    { path: '/admin/flowers', name: 'admin.flowers', component: AdminFlowers, meta: { requiresAuth: true, requiresAdmin: true }},
    {path: '/', name: 'home',component: HomeView},
    {path: '/catalog',name: 'catalog',component: CatalogView},
    {path: '/constructor', name: 'constructor', component: ConstructorView, meta: { requiresAuth: true } },
    { path: '/admin/orders', name: 'admin.orders', component: AdminOrders,meta: { requiresAuth: true, requiresAdmin: true }},
  ]
})

router.beforeEach((to, from) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const isAuthenticated = !!token;
  const isAdmin = user?.role === 'admin';

  if (to.meta.requiresAuth && !isAuthenticated) {
    return '/login';
  }
  if (to.meta.requiresAdmin && !isAdmin) {
    alert('Доступ запрещен. Требуется роль администратора.');
    return '/';
  }
  if ((to.name === 'login' || to.name === 'register') && isAuthenticated) {
    return '/';
  }
  return true;
});
export default router
