<template>
  <div class="d-flex justify-content-center align-items-center vh-100">
    <p>Processing login…</p>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'AuthCallback',
  mounted() {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const role = params.get('role');
    const userParam = params.get('user');

    if (token) {
      // Store token
      localStorage.setItem('auth_token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      let user = null;
      if (userParam) {
        try {
          // Try to parse JSON-like string
          user = JSON.parse(decodeURIComponent(userParam));
        } catch (e) {
          console.warn('Failed to parse user param; ignoring');
        }
      }

      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      }

      // Redirect by role
      switch (role) {
        case 'teacher':
          this.$router.replace({ name: 'teacherDashboard' });
          break;
        case 'student':
          this.$router.replace({ name: 'studentDashboard' });
          break;
        case 'admin':
          this.$router.replace({ name: 'adminDashboard' });
          break;
        default:
          this.$router.replace('/');
      }
    } else {
      // No token — fallback to login
      this.$router.replace({ name: 'Login', query: { error: 'login_failed' } });
    }
  },
};
</script>
