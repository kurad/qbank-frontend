<template>
  <div class="teacher-layout d-flex flex-column min-vh-100">
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
      <div class="container-fluid">
        <span class="navbar-brand fw-bold">LearnBridge</span>
        <div class="d-flex align-items-center">
          <div class="text-white me-3 d-none d-sm-block">
            <i class="bi bi-person-circle me-1"></i>
            <span>Teacher</span>
          </div>
          <button 
            @click="logout" 
            class="btn btn-outline-light btn-sm"
            title="Logout"
          >
            <i class="bi bi-box-arrow-right"></i>
            <span class="d-none d-sm-inline ms-1">Logout</span>
          </button>
        </div>
      </div>
    </nav>
    <div class="flex-grow-1 d-flex" style="background:#f8f9fa;">
      <aside class="bg-white border-end shadow-sm d-flex flex-column" style="width: 220px; min-height:100%;">
        <ul class="nav flex-column py-4 px-3 gap-2">
          <li class="nav-item">
            <router-link :to="{name: 'teacherDashboard'}" :active-class="active" class="nav-link fw-semibold rounded-pill px-3 py-2">Dashboard</router-link>
          </li>
          <li class="nav-item">
            <router-link to="/questions" class="nav-link fw-semibold rounded-pill px-3 py-2">Questions</router-link>
          </li>
          
          <li class="nav-item">
            <router-link to="/assessment-list" class="nav-link fw-semibold rounded-pill px-3 py-2">Assessments</router-link>
          </li>
          <!-- <li class="nav-item">
            <a href="#" class="nav-link fw-semibold rounded-pill px-3 py-2">Settings</a>
          </li> -->
        </ul>
      </aside>
      <main class="flex-grow-1 p-4">
        <div class="container-fluid">
          <router-view/>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.teacher-layout {
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
.btn-outline-light:hover {
  background-color: rgba(255, 255, 255, 0.2);
  border-color: #fff;
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

<script>
import axios from 'axios';


export default {
  name: 'TeacherLayout',
  methods: {
    async logout() {
      try {
        // Clear the authentication token
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_role');
        
        // Remove the authorization header from axios
        delete axios.defaults.headers.common['Authorization'];
        
        // Show success message
        alert('You have been successfully logged out');
        
        // Redirect to login page
        this.$router.push('/login');
      } catch (error) {
        console.error('Logout error:', error);
        alert('An error occurred during logout');
      }
    }
  }
}
</script>
