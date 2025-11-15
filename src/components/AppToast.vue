<template>
  <div v-if="message" class="position-fixed bottom-0 end-0 p-3" style="z-index: 1100">
    <div class="toast show" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="toast-header" :class="type === 'error' ? 'bg-danger text-white' : 'bg-success text-white'">
        <strong class="me-auto">{{ type === 'error' ? 'Error' : 'Success' }}</strong>
        <button type="button" class="btn-close btn-close-white" @click="$emit('close')" aria-label="Close"></button>
      </div>
      <div class="toast-body">
        {{ message }}
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AppToast',
  props: {
    message: {
      type: String,
      default: ''
    },
    type: {
      type: String,
      default: 'success',
      validator: (value) => ['success', 'error'].includes(value)
    },
    timeout: {
      type: Number,
      default: 5000
    }
  },
  watch: {
    message(newVal) {
      if (newVal) {
        this.setupAutoClose();
      }
    }
  },
  methods: {
    setupAutoClose() {
      if (this.timeout > 0) {
        setTimeout(() => {
          this.$emit('close');
        }, this.timeout);
      }
    }
  }
};
</script>

<style scoped>
.toast {
  min-width: 300px;
}
</style>
