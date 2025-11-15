import { createApp } from 'vue'
import App from './App.vue'
import './registerServiceWorker'
import router from './router'
import store from './store'
import axios from './axios'
import { api } from './axios'
import 'mathlive'


import ckeditor from '@mayasabha/ckeditor4-vue3'

import 'bootstrap/dist/css/bootstrap.min.css'
import * as bootstrap from 'bootstrap/dist/js/bootstrap.bundle.min.js'

window.bootstrap = bootstrap;

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

  // Automatically include stored token in header

  const token = localStorage.getItem('auth_token')
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
  }

// Add toast utility function to the app instance
app.config.globalProperties.$showToast = function(message, type = 'info') {
  const toastContainer = document.getElementById('toast-container') || (() => {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.style.position = 'fixed';
    container.style.top = '20px';
    container.style.right = '20px';
    container.style.zIndex = '1100';
    document.body.appendChild(container);
    return container;
  })();

  const toastId = 'toast-' + Date.now();
  const toast = document.createElement('div');
  toast.id = toastId;
  toast.className = `toast show align-items-center text-white bg-${type} border-0`;
  toast.role = 'alert';
  toast.setAttribute('aria-live', 'assertive');
  toast.setAttribute('aria-atomic', 'true');
  toast.style.minWidth = '250px';
  toast.style.marginBottom = '10px';
  
  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">
        ${message}
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `;
  
  toastContainer.appendChild(toast);
  
  // Auto-remove toast after 5 seconds
  setTimeout(() => {
    const toastElement = document.getElementById(toastId);
    if (toastElement) {
      toastElement.classList.remove('show');
      setTimeout(() => toastElement.remove(), 300);
    }
  }, 5000);
  
  // Close button functionality
  const closeButton = toast.querySelector('[data-bs-dismiss="toast"]');
  closeButton.addEventListener('click', () => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  });
}

// Token Auto refresh
//Refresh token every 50 minutes

const TOKEN_REFRESH_INTERVAL = 50 * 60 * 1000 //50 minutes

setInterval(async () => {
  const token = localStorage.getItem('auth_token')
  if(!token) return;

  try {
    const response = await api.post('refresh-token', {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
    })
    const newToken = response.data.token
    if (newToken) {
      localStorage.setItem('auth_token', newToken)
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
      console.log('Token refreshed successfully')
    }
  } catch(error) {
    console.error('❌ Token refresh failed:', error)
    localStorage.removeItem('auth_token')
    router.push('/login')
  }
}, TOKEN_REFRESH_INTERVAL)
app.mount('#app')