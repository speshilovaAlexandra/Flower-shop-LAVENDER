// import { defineStore } from 'pinia';

// export const useCartStore = defineStore('cart', {
//   state: () => ({
//     items: JSON.parse(localStorage.getItem('cart')) || [],
//   }),
//   actions: {
//     addToCart(flower) {
//       const exists = this.items.find(i => i.id === flower.id);
//       if (exists) {
//         exists.qty++;
//       } else {
//         this.items.push({ ...flower, qty: 1 });
//       }
//       localStorage.setItem('cart', JSON.stringify(this.items));
//     },
//     clearCart() {
//       this.items = [];
//       localStorage.removeItem('cart');
//     }
//   }
// });