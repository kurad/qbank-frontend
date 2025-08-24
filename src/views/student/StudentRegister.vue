<template>
  <div class="container">
    <div class="row justify-content-center">
      <div class="col-md-8 col-lg-6">
        <div class="card shadow-sm mt-5">
          <div class="card-header bg-primary text-white text-center py-3">
            <h3 class="mb-0">Create an Account</h3>
            <p class="mb-0">Join our learning community</p>
          </div>

          <div class="card-body p-4">
            <form @submit.prevent="register">

              <!-- Name -->
              <div class="mb-3">
                <label class="form-label">Name</label>
                <input
                  v-model="formData.name"
                  type="text"
                  class="form-control"
                  :class="{'is-invalid': formErrors.name}"
                  placeholder="Full name"
                  required
                />
                <div class="invalid-feedback">{{ formErrors.name }}</div>
              </div>

              <!-- Email -->
              <div class="mb-3">
                <label class="form-label">Email address</label>
                <input
                  v-model="formData.email"
                  type="email"
                  class="form-control"
                  :class="{'is-invalid': formErrors.email}"
                  placeholder="Enter your email"
                  required
                />
                <div class="invalid-feedback">{{ formErrors.email }}</div>
              </div>

              <!-- Password -->
              <div class="mb-3">
                <label class="form-label">Password</label>
                <input
                  v-model="formData.password"
                  type="password"
                  class="form-control"
                  :class="{'is-invalid': formErrors.password}"
                  placeholder="Create a password"
                  required
                />
                <div class="form-text">Password must be at least 8 characters long</div>
                <div class="invalid-feedback">{{ formErrors.password }}</div>
              </div>

              <!-- Confirm Password -->
              <!-- <div class="mb-4">
                <label class="form-label">Confirm Password</label>
                <input
                  v-model="formData.confirmPassword"
                  type="password"
                  class="form-control"
                  :class="{'is-invalid': formErrors.confirmPassword}"
                  placeholder="Confirm your password"
                  required
                />
                <div class="invalid-feedback">{{ formErrors.confirmPassword }}</div>
              </div> -->

              <!-- Role -->
              <div class="mb-4">
                <label class="form-label">I am a</label>
                <div class="d-flex gap-3">
                  <div class="form-check">
                    <input 
                      v-model="formData.role" 
                      class="form-check-input" 
                      type="radio" 
                      name="role" 
                      id="studentRole" 
                      value="student"
                    >
                    <label class="form-check-label" for="studentRole">Student</label>
                  </div>
                  <div class="form-check">
                    <input 
                      v-model="formData.role" 
                      class="form-check-input" 
                      type="radio" 
                      name="role" 
                      id="teacherRole" 
                      value="teacher"
                    >
                    <label class="form-check-label" for="teacherRole">Teacher</label>
                  </div>
                </div>
                <div class="text-danger mt-1">{{ formErrors.role }}</div>
              </div>

              <!-- School Code (for students only) -->
              <div v-if="formData.role === 'student'" class="mb-4">
                <label class="form-label">School Code</label>
                <input
                  v-model="formData.school_code"
                  type="text"
                  class="form-control"
                  :class="{'is-invalid': formErrors.school_code}"
                  placeholder="Enter your school code"
                  required
                />
                <div class="invalid-feedback">{{ formErrors.school_code }}</div>
              </div>

              <!-- Submit Button -->
              <div class="d-grid gap-2 mb-3">
                <button type="submit" class="btn btn-primary btn-lg" :disabled="loading">
                  <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                  {{ loading ? 'Creating Account...' : 'Create Account' }}
                </button>
              </div>

              <!-- Global message -->
              <div v-if="message" class="alert mt-3 mb-0" :class="{'alert-success': success, 'alert-danger': !success}">
                <i :class="success ? 'bi bi-check-circle' : 'bi bi-exclamation-triangle'" class="me-2"></i>
                {{ message }}
              </div>

            </form>
          </div>

          <div class="card-footer text-center py-3">
            <p class="mb-0">
              Already have an account? 
              <router-link to="/login" class="text-primary fw-semibold">Sign In</router-link>
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
  name: 'StudentRegister',
  data() {
    return {
      formData: {
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: '',
        school_code: ''
      },
      formErrors: {},
      message: '',
      success: false,
      loading: false
    };
  },
  methods: {
    validateForm() {
      this.formErrors = {}; // reset errors

      if (!this.formData.name) this.formErrors.name = 'Name is required';
      if (!this.formData.email) this.formErrors.email = 'Email is required';
      if (!this.formData.role) this.formErrors.role = 'Please select a role';
      if (this.formData.password.length < 8) this.formErrors.password = 'Password must be at least 8 characters';
      // if (this.formData.password !== this.formData.confirmPassword) this.formErrors.confirmPassword = 'Passwords do not match';
      if (this.formData.role === 'student' && !this.formData.school_code) this.formErrors.school_code = 'School code is required';

      return Object.keys(this.formErrors).length === 0;
    },

    async register() {
      this.message = '';
      if (!this.validateForm()) return;

      this.loading = true;
      try {
        const userData = {
          name: this.formData.name,
          email: this.formData.email,
          password: this.formData.password,
          role: this.formData.role,
          ...(this.formData.role === 'student' && { school_code: this.formData.school_code })
        };

        const response = await axios.post('/register', userData);

        if (response.data?.token) {
          localStorage.setItem('auth_token', response.data.token);
          localStorage.setItem('user_role', response.data.user_role);
          axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;

          this.success = true;
          this.message = 'Registration successful! Redirecting...';

          setTimeout(() => {
            this.redirectByRole(response.data.user_role);
          }, 1500);
        }
      } catch (error) {
        this.success = false;
        this.message = error.response?.data?.message || 'Registration failed. Please try again.';
      } finally {
        this.loading = false;
      }
    },

    redirectByRole(role) {
      if (role === 'teacher') this.$router.push({ name: 'teacherDashboard' });
      else if (role === 'student') this.$router.push({ name: 'studentDashboard' });
      else if (role === 'admin') this.$router.push({ name: 'AdminDashboard' });
      else this.$router.push('/');
    }
  }
};
</script>

<style scoped>
.is-invalid {
  border-color: #dc3545;
}
</style>
