<template>
  <div class="container">
    <div class="row justify-content-center">
      <div class="col-md-6 col-lg-5">
        <div class="card shadow-sm mt-5">
          <div class="card-header bg-primary text-white text-center py-3">
            <h3 class="mb-0">Login Portal</h3>
            <p class="mb-0">Sign in to access your dashboard</p>
          </div>

          <div class="card-body p-4">
            <form @submit.prevent="login">
              <!-- Email -->
              <div class="mb-3">
                <label for="email" class="form-label">Email address</label>
                <div class="input-group">
                  <span class="input-group-text">
                    <i class="bi bi-envelope"></i>
                  </span>
                  <input 
                    v-model="email" 
                    type="email" 
                    class="form-control" 
                    id="email" 
                    placeholder="Enter your email" 
                    required 
                  />
                </div>
              </div>
              
              <!-- Password -->
              <div class="mb-4">
                <label for="password" class="form-label">Password</label>
                <div class="input-group">
                  <span class="input-group-text">
                    <i class="bi bi-lock"></i>
                  </span>
                  <input 
                    v-model="password" 
                    type="password" 
                    class="form-control" 
                    id="password" 
                    placeholder="Enter your password" 
                    required 
                  />
                </div>
                <div class="form-text text-end">
                  <a href="#" class="text-decoration-none">Forgot password?</a>
                </div>
              </div>

              <!-- Normal Login Button -->
              <div class="d-grid gap-2 mb-3">
                <button 
                  type="submit" 
                  class="btn btn-primary btn-lg" 
                  :disabled="loading"
                >
                  <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status"></span>
                  {{ loading ? 'Signing in...' : 'Sign In' }}
                </button>
              </div>

              <!-- Google Login -->
              <!-- <div class="text-center my-3">
                <p class="text-muted mb-2">Teachers can also sign in with</p>
                <button type="button" class="btn btn-google w-100" @click="handleGoogleLogin">
                  <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google" width="20" class="me-2"/>
                  Sign in with Google
                </button>
              </div> -->

              <!-- Messages -->
              <div v-if="message" class="alert mt-3 mb-0" :class="{'alert-success': success, 'alert-danger': !success}">
                <i :class="success ? 'bi bi-check-circle' : 'bi bi-exclamation-triangle'" class="me-2"></i>
                {{ message }}
              </div>
            </form>
          </div>

          <div class="card-footer text-center py-3">
            <p class="mb-0">
              Don't have an account? 
              <router-link to="/register" class="text-primary text-decoration-none fw-semibold">Sign Up</router-link>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'StudentLogin',
  data() {
    return {
      email: '',
      password: '',
      message: '',
      success: false,
      loading: false,
    };
  },
  methods: {
    async login() {
      this.loading = true;
      this.message = '';
      try {
        const res = await axios.post('/login', {
          email: this.email,
          password: this.password,
        });

        if (res.data?.token) {
          localStorage.setItem('auth_token', res.data.token);
          localStorage.setItem('user_role', res.data.user_role);
          axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
        }

        this.success = true;
        this.message = 'Login successful!';

        this.redirectByRole(res.data?.user_role || localStorage.getItem('user_role'));
      } catch (err) {
        this.success = false;
        this.message = err.response?.data?.message || 'Login failed.', err;
      } finally {
        this.loading = false;
      }
    },

    handleGoogleLogin() {
      const callbackUrl = window.location.origin + '/auth/callback';
      window.location.href = `http://localhost:8000/auth/google?redirect=${encodeURIComponent(callbackUrl)}`;
    },

    redirectByRole(user_role) {
      if (user_role === 'teacher') {
        this.$router.push({ name: 'teacherDashboard' });
      } else if (user_role === 'student') {
        this.$router.push({ name: 'studentDashboard' });
      } else if (user_role === 'admin') {
        this.$router.push({ name: 'AdminDashboard' });
      } else {
        this.$router.push('/');
      }
    }
  }
};
</script>


<style scoped>
.card {
  border: none;
  border-radius: 10px;
  overflow: hidden;
}

.card-header {
  border-bottom: none;
  background: linear-gradient(135deg, #4e73df 0%, #224abe 100%);
}

.card-header h3 {
  font-weight: 600;
  letter-spacing: 0.5px;
}

.card-header p {
  opacity: 0.9;
  font-size: 0.95rem;
}

.input-group-text {
  background-color: #f8f9fc;
  border-right: none;
}

.form-control:focus {
  border-color: #bac8f3;
  box-shadow: 0 0 0 0.25rem rgba(78, 115, 223, 0.25);
}

.btn-primary {
  background-color: #4e73df;
  border: none;
  padding: 0.65rem 1.5rem;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  background-color: #2e59d9;
  transform: translateY(-1px);
}

.btn-google {
  background-color: #fff;
  border: 1px solid #ddd;
  font-weight: 500;
  padding: 0.6rem;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.btn-google:hover {
  background-color: #f7f7f7;
}

.alert {
  border: none;
  font-size: 0.9rem;
}

.alert-success {
  background-color: #d1e7dd;
  color: #0f5132;
}

.alert-danger {
  background-color: #f8d7da;
  color: #842029;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.card {
  animation: fadeIn 0.5s ease-out;
}

@media (max-width: 576px) {
  .card {
    margin-top: 2rem !important;
  }
  
  .card-header h3 {
    font-size: 1.5rem;
  }
}
</style>
