<template>
  <div class="student-layout d-flex flex-column min-vh-100">
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
      <div class="container-fluid">
        <a class="navbar-brand fw-bold" href="#">LearnBridge</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav me-auto">
            <li class="nav-item">
              <a class="nav-link" href="#">Home</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="#">Practice</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="#">Profile</a>
            </li>
          </ul>
          <div class="navbar-nav ms-auto">
            <span class="nav-item nav-link d-flex align-items-center">
              <span class="me-2">👤</span> Student
            </span>
            <button class="btn btn-outline-light ms-3" @click="logout" style="font-weight:600;">
              <i class="bi bi-box-arrow-right me-1"></i>Logout
            </button>
          </div>
        </div>
      </div>
    </nav>

    <div class="flex-grow-1 d-flex" style="background:#f8f9fa;">
      <aside class="bg-white border-end shadow-sm d-flex flex-column" style="width: 220px; min-height:100%;">
        <ul class="nav flex-column py-4 px-3 gap-2">
          <li class="nav-item">
            <router-link to="/student-dashboard" :active-class="active" class="nav-link fw-semibold rounded-pill px-3 py-2">Dashboard</router-link>
          </li>
           <li class="nav-item">
            <router-link to="/start-practice" :active-class="active" class="nav-link fw-semibold rounded-pill px-3 py-2">Practice</router-link>
          </li>
          <li class="nav-item">
            <router-link to="/student/practice-list" :active-class="active" class="nav-link fw-semibold rounded-pill px-3 py-2">My Assessments</router-link>
          </li>
          <li class="nav-item">
            <a href="#" class="nav-link fw-semibold rounded-pill px-3 py-2">Settings</a>
          </li>
        </ul>
      </aside>
      <main class="flex-grow-1 p-4">
        <div class="container-fluid">
          <router-view />
        </div>
      </main>
    </div>
  </div>
</template>

<script>

import axios from 'axios';

export default {
  name: 'StudentLayout',
  methods: {
    async logout() {
      const token = localStorage.getItem('auth_token');
      try {
        await axios.post('/logout', {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (e) {
        // Ignore errors, proceed to clear token
      }
      localStorage.removeItem('auth_token');
      this.$router.push({ name: 'login' });
    }
  }
};
</script>

<style scoped>
.student-layout {
  background-color: #f8f9fa;
}
.navbar {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.10);
}
aside {
  box-shadow: 2px 0 8px rgba(0,0,0,0.07);
}
.nav-link.active {
  background-color: #e9ecef !important;
  color: #6366f1 !important;
}
.nav-link {
  transition: background 0.2s, color 0.2s;
}
.nav-link:hover {
  background-color: #f1f5fb !important;
  color: #6366f1 !important;
}
@media (max-width: 992px) {
  aside {
    width: 100% !important;
    border-right: none !important;
    border-bottom: 1px solid #dee2e6;
  }
  .flex-grow-1.d-flex {
    flex-direction: column;
  }
}
</style>
