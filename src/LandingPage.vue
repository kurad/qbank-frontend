<template>
  <div>

    <!-- Hero Section -->
    <section class="bg-primary text-white text-center py-5">
      <div class="container">
        <h1 class="display-4 fw-bold mb-3">Welcome to LearnBridge</h1>
        <p class="lead mb-4">A smart Question Bank platform for Teachers and Students.</p>
        <button @click="goToApp" class="btn btn-light btn-lg">Get Started</button>
      </div>
    </section>

    <!-- Features Section -->
    <section class="py-5 bg-light">
      <div class="container">
        <h2 class="text-center mb-5">Features</h2>
        <div class="row g-4">
          <div class="col-md-4">
            <div class="card h-100 shadow-sm text-center">
              <div class="card-body">
                <i class="bi bi-journal-text display-4 text-primary mb-3"></i>
                <h5 class="card-title">For Teachers</h5>
                <p class="card-text">Create, organize, and manage questions by subject and topic. Build quizzes, exams, and assignments instantly.</p>
              </div>
            </div>
          </div>

          <div class="col-md-4">
            <div class="card h-100 shadow-sm text-center">
              <div class="card-body">
                <i class="bi bi-person-badge display-4 text-primary mb-3"></i>
                <h5 class="card-title">For Students</h5>
                <p class="card-text">Practice questions, revise topics, and get instant feedback on your performance to prepare for exams.</p>
              </div>
            </div>
          </div>

          <div class="col-md-4">
            <div class="card h-100 shadow-sm text-center">
              <div class="card-body">
                <i class="bi bi-bar-chart-line display-4 text-primary mb-3"></i>
                <h5 class="card-title">Analytics</h5>
                <p class="card-text">Track progress with reports and insights highlighting strengths and areas needing improvement.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Screenshots Carousel -->
    <section class="py-5">
      <div class="container text-center">
        <h2 class="mb-5">App Screenshots</h2>
        <div id="screenshotCarousel" class="carousel slide carousel-dark" data-bs-ride="carousel">
          <div class="carousel-inner">
            <div
              class="carousel-item"
              :class="{active: idx === 0}"
              v-for="(shot, idx) in screenshots"
              :key="idx"
            >
              <img :src="shot" class="d-block mx-auto rounded shadow" style="max-height: 500px; object-fit: contain;" alt="Screenshot">
            </div>
          </div>
          <button class="carousel-control-prev" type="button" data-bs-target="#screenshotCarousel" data-bs-slide="prev">
            <span class="carousel-control-prev-icon"></span>
            <span class="visually-hidden">Previous</span>
          </button>
          <button class="carousel-control-next" type="button" data-bs-target="#screenshotCarousel" data-bs-slide="next">
            <span class="carousel-control-next-icon"></span>
            <span class="visually-hidden">Next</span>
          </button>
          <div class="carousel-indicators mt-3">
            <button v-for="(shot, i) in screenshots" :key="i"
              type="button"
              data-bs-target="#screenshotCarousel"
              :data-bs-slide-to="i"
              :class="{active: i === 0}"
              aria-current="true"
              :aria-label="'Slide ' + (i+1)">
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- About Section -->
    <section class="py-5 bg-light">
      <div class="container text-center">
        <h2 class="mb-4">Why LearnBridge?</h2>
        <p class="lead mx-auto" style="max-width: 800px;">
          LearnBridge bridges the gap between teaching and learning by providing an interactive platform where teachers and students collaborate for better outcomes in exams and continuous assessment.
        </p>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="py-5 bg-primary text-white text-center">
      <div class="container">
        <h2 class="mb-3">Start Your Journey Today</h2>
        <button @click="goToApp" class="btn btn-light btn-lg">Get Started</button>
      </div>
    </section>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const goToApp = () => router.push('/login');

// Screenshots for carousel
const screenshots = ref([
  '/screenshots/dashboard.png',
  '/screenshots/question-list.png',
  '/screenshots/assessment-creation.png',
//   '/screenshots/student-practice.png'
]);

// Auto-play logic for carousel
onMounted(() => {
  const carouselEl = document.querySelector('#screenshotCarousel');
  const carousel = new bootstrap.Carousel(carouselEl, {
    interval: 7000,
    ride: 'carousel',
    pause: 'hover',
    wrap: true
  });
});
</script>

<style scoped>
h2, h5 {
  font-weight: 600;
}
.card-text {
  font-size: 0.95rem;
}
</style>
