import { createApp } from 'vue'
import App from './App.vue'
import './registerServiceWorker'
import router from './router'
import store from './store'
import './axios'
import 'mathlive'

import ckeditor from '@mayasabha/ckeditor4-vue3'

import 'bootstrap/dist/css/bootstrap.min.css'
import 'katex/dist/katex.min.css'
import 'bootstrap'

const resizeObserverErr = /ResizeObserver loop completed with undelivered notifications/;
window.addEventListener('error', e => {
  if (resizeObserverErr.test(e.message)) {
    e.stopImmediatePropagation();
  }
});

const app = createApp(App)
  app.use(store)
  app.use(router)
  app.use(ckeditor)
  .mount('#app')
