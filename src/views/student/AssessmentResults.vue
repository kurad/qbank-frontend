<template>
  <div class="container py-4">
    <div class="card shadow-lg border-0 mt-2" style="border-radius: 1.5em; background: linear-gradient(120deg, #f0f4ff 0%, #e0e7ff 100%);">
      <div class="card-body" style="border-radius: 1.5em;">
        <div class="d-flex justify-content-between align-items-center mb-4" style="background: linear-gradient(90deg, #6366f1 0%, #60a5fa 100%); padding: 1.5rem; border-radius: 1em; box-shadow: 0 2px 12px rgba(60,72,88,0.07);">
          <button class="btn btn-outline-light btn-sm me-3" @click="$router.go(-1)"><i class="bi bi-arrow-left"></i> Back</button>
          <h2 class="card-title text-center fw-bold" style="color: #ffffff;font-size: 2.2em; letter-spacing: 1px; margin-bottom: 1.5rem; font-family: 'Poppins', sans-serif; text-transform: uppercase; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">
  Assessment Results
</h2>
        </div>
        <div v-if="loading" class="d-flex flex-column align-items-center justify-content-center py-5">
          <div class="spinner-border text-primary mb-3" role="status"></div>
          <div class="text-primary">Loading results...</div>
        </div>
        <div v-else-if="error" class="alert alert-danger py-2 text-center">{{ error }}</div>
        <div v-else-if="results">
          <div class="mb-4 pb-3 border-bottom" style="background: linear-gradient(90deg, #6366f1 0%, #60a5fa 100%); padding: 1.5rem; border-radius: 1em; box-shadow: 0 2px 12px rgba(60,72,88,0.07);">
            <h3 class="h4 mb-2 text-white fw-bold"><i class="bi bi-journal-check me-2"></i>{{ results.assessment_title }}</h3>
            <div class="row mb-2 text-white">
              <div class="col-md-4 mb-1"><strong>Type:</strong> <span class="badge bg-light text-primary fw-semibold">{{ results.assessment_type }}</span></div>
              <div class="col-md-4 mb-1"><strong>Score:</strong> <span class="badge bg-success fw-semibold"><i class="bi bi-star-fill me-1"></i>{{ results.score }} / {{ results.max_score }}</span></div>
              <div class="col-md-4 mb-1"><strong>Percentage:</strong> <span class="badge bg-info text-dark fw-semibold"><i class="bi bi-percent me-1"></i>{{ results.percentage.toFixed(2) }}%</span></div>
            </div>
            <div class="row mb-2 text-white">
              <div class="col-md-6 mb-1"><strong>Completed At:</strong> <span class="badge bg-light text-primary fw-semibold">{{ formatDate(results.completed_at) }}</span></div>
              <!-- <div class="col-md-6 mb-1"><strong>Time Taken:</strong> <span class="badge bg-secondary fw-semibold"><i class="bi bi-clock me-1"></i>{{ results.time_taken }} minutes</span></div> -->
            </div>
          </div>
          <div class="mb-3">
            <h3 class="h5 mb-3 text-primary fw-bold"><i class="bi bi-list-check me-2"></i>Questions Review</h3>
            <div v-for="(question, index) in results.questions" :key="index" class="mb-4">
              <div class="card border-0 shadow-sm" style="border-radius: 1em; background: #f9fafb;">
                <div class="card-body">
                  <div class="d-flex align-items-center mb-2">
                    <span class="badge bg-primary me-2" style="font-size: 1.1em;">Q{{ index + 1 }}</span>
                    <span class="fw-bold" style="font-size: 1.1em; color: #374151;" v-html="renderMath(question.question_text)"></span>
                  </div>
                  <div class="mb-2">
                    <span class="badge bg-light text-dark me-2">{{ formatQuestionType(question.question_type) }}</span>
                    <!-- <span class="badge bg-secondary me-2">Your Answer: <strong>{{ getAnswerText(question) }}</strong></span> -->
                    <span class="badge bg-success me-2">Your Answer: <strong v-html="renderMath(`$${question.correct_answer}$`)"></strong></span>
                    <span v-if="question.is_correct" class="badge bg-success"><i class="bi bi-check-circle me-1"></i>Correct</span>
                    <span v-else class="badge bg-danger"><i class="bi bi-x-circle me-1"></i>Incorrect</span>
                  </div>
                  <div class="mb-2">
                    <span class="badge bg-warning me-2">Points: <strong>{{ question.points_earned }} / {{ question.max_points }}</strong></span>
                  </div>
                  <div v-if="question.explanation" class="alert alert-info mt-2 mb-0 py-2 px-3" style="border-radius: 0.7em;">
                    <strong><i class="bi bi-info-circle me-1"></i>Explanation:</strong>
                    <span>{{ question.explanation }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import katex from 'katex';
import 'katex/dist/katex.min.css';
export default {
  name: 'AssessmentResults',
  data() {
    return {
      results: null,
      loading: true,
      error: null,
    };
  },
  mounted() {
    this.fetchResults();
  },
  methods: {
    async fetchResults() {
      const assessmentId = this.$route.params.id;
      try {
        const token = localStorage.getItem('auth_token');
        const response = await axios.get(`/student/assessment-results/${assessmentId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        this.results = response.data;
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to load results.';
      } finally {
        this.loading = false;
      }
    },
    renderMath(text) {
      if (!text) return '';

      // Replace display math $$...$$
      text = text.replace(/\$\$([^$]+)\$\$/g, (_, math) => {
        try { return katex.renderToString(math, { displayMode: true, throwOnError: false }); }
        catch (e) { console.error(e); return math; }
      });

      // Replace inline math $...$
      text = text.replace(/\$(.+?)\$/g, (_, math) => {
        try { return katex.renderToString(math, { displayMode: false, throwOnError: false }); }
        catch (e) { console.error(e); return math; }
      });

      return text;
    },
    formatDate(dateString) {
      return new Date(dateString).toLocaleString();
    },
    formatQuestionType(type) {
      return type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ');
    },
  },
};
</script>

<style scoped>
.card {
  max-width: 900px;
  margin: 0 auto;
}
.card-title {
  font-weight: 700;
}
.badge {
  font-size: 1em;
}
</style>