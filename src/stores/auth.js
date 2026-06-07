import { defineStore } from 'pinia';
import api from '@/api';
import { useCart } from '@/composables/useCart';
export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || null,
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    isAdmin: (state) => state.user?.role === 'admin',
  },

  actions: {
    async login(email, password) {
      const res = await api.post('/login', { email, password });
      this.setAuth(res.data.token, res.data.user);
    },

    async register(name, email, password, password_confirmation) {
      const res = await api.post('/register', { name, email, password, password_confirmation });
      this.setAuth(res.data.token, res.data.user);
    },

    setAuth(token, user) {
      this.token = token;
      this.user = user;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
    },

    logout() {
      this.token = null;
      this.user = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
        async fetchUser() {
        if(!this.token) return;
        try {
            const res = await api.get('/user');
            this.user = res.data;
            localStorage.setItem('user', JSON.stringify(res.data));
        } catch (e) {
            this.logout();
        }
    }
  },
});const { mergeGuestToServer } = useCart();
      await mergeGuestToServer(); 