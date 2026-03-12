import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue';
import ThreadList  from './views/ThreadList.vue';
import ThreadView  from './views/ThreadView.vue';
import CatalogView from './views/CatalogView.vue';
import AdminView   from './views/AdminView.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/',           component: ThreadList  },
    { path: '/catalog',    component: CatalogView },
    { path: '/thread/:id', component: ThreadView  },
    { path: '/admin',      component: AdminView   },
  ],
});

createApp(App).use(router).mount('#app');
