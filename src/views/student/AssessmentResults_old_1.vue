<template>
  <div class="container py-4">
    <div class="card shadow-lg border-0 mt-2"
         style="border-radius: 1.5em; background: linear-gradient(120deg, #f0f4ff 0%, #e0e7ff 100%);">
      <div class="card-body">

        <!-- Header -->
        <div class="d-flex justify-content-between align-items-center mb-4"
             style="background: linear-gradient(90deg, #6366f1 0%, #60a5fa 100%);
                    padding: 1.5rem; border-radius: 1em;">
          <button class="btn btn-outline-light btn-sm" @click="$router.go(-1)">
            <i class="bi bi-arrow-left"></i> Back
          </button>
          <h2 class="fw-bold text-white text-uppercase">Assessment Results</h2>
        </div>

        <!-- Loading / Error -->
        <div v-if="loading" class="text-center py-5">
          <div class="spinner-border text-primary"></div>
          <p class="text-primary mt-2">Loading results...</p>
        </div>

        <div v-else-if="error" class="alert alert-danger text-center">
          {{ error }}
        </div>

        <!-- Results -->
        <div v-else>
          <!-- Summary -->
          <div class="mb-4 p-3 text-white"
               style="background: linear-gradient(90deg, #6366f1 0%, #60a5fa 100%);
                      border-radius: 1em;">
            <h4 class="fw-bold">{{ results.assessment_title }}</h4>
            <div class="row">
              <div class="col-md-4"><strong>Type:</strong> {{ results.assessment_type }}</div>
              <div class="col-md-4"><strong>Score:</strong> {{ results.score }} / {{ results.max_score }}</div>
              <div class="col-md-4"><strong>Percentage:</strong> {{ results.percentage.toFixed(2) }}%</div>
            </div>
          </div>

          <!-- Questions -->
          <div v-for="(question, index) in results.questions" :key="index" class="mb-4">
            <div class="card shadow-sm border-0">
              <div class="card-body">

                <!-- Question -->
                <div class="mb-2 fw-bold" v-html="renderMath(question.question_text)"></div>
                <span class="badge bg-light text-dark mb-2">
                  {{ formatQuestionType(question.question_type) }}
                </span>

                <!-- Student Answer -->
                <div class="mt-3">
                  <span class="badge bg-secondary mb-1">Your Answer</span>
                  <div
                    class="answer-box"
                    :class="{ collapsed: !question.showFullAnswer }"
                    v-html="renderMath(question.student_answer || 'No Answer')"
                  ></div>

                  <button
                    v-if="isLongText(question.student_answer)"
                    class="btn btn-link btn-sm"
                    @click="question.showFullAnswer = !question.showFullAnswer">
                    {{ question.showFullAnswer ? 'Show less' : 'Show more' }}
                  </button>
                </div>

                <!-- Confidence (short answer only) -->
                <div v-if="question.question_type === 'short_answer' && !question.is_correct" class="mt-3">
                  <span class="badge bg-info mb-1">Confidence</span>
                  <div class="btn-group btn-group-sm d-flex flex-wrap">
                    <button
                      v-for="level in confidenceLevels"
                      :key="level.value"
                      class="btn"
                      :class="question.confidence_score === level.value
                        ? 'btn-primary'
                        : 'btn-outline-primary'"
                      disabled>
                      {{ level.label }}
                    </button>
                  </div>
                </div>

                <!-- Points -->
                <div class="mt-2">
                  <span class="badge bg-warning">
                    Points: {{ question.points_earned }} / {{ question.max_points }}
                  </span>
                </div>

                <!-- Explanation -->
                <div v-if="question.explanation" class="mt-3">
                  <span class="badge bg-info mb-1">Explanation</span>
                  <div
                    class="answer-box"
                    :class="{ collapsed: !question.showFullExplanation }">
                    {{ question.explanation }}
                  </div>

                  <button
                    v-if="isLongText(question.explanation)"
                    class="btn btn-link btn-sm"
                    @click="question.showFullExplanation = !question.showFullExplanation">
                    {{ question.showFullExplanation ? 'Show less' : 'Show more' }}
                  </button>
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
      confidenceLevels: [
        { value: 0, label: 'Wrong' },
        { value: 1, label: 'Partially correct' },
        { value: 2, label: 'Closely correct' },
        { value: 3, label: 'Correct' }
      ]
    };
  },
  mounted() {
    this.fetchResults();
  },
  methods: {
    async fetchResults() {
      try {
        const token = localStorage.getItem('auth_token');
        const res = await axios.get(`/student/assessment-results/${this.$route.params.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        res.data.questions.forEach(q => {
          q.showFullAnswer = false;
          q.showFullExplanation = false;
        });

        this.results = res.data;
      } catch (e) {
        this.error = 'Failed to load results';
      } finally {
        this.loading = false;
      }
    },

    isLongText(text) {
      return text && text.length > 250;
    },

    renderMath(text) {
      if (!text) return '';
      return text
        .replace(/\$\$([^$]+)\$\$/g, (_, m) =>
          katex.renderToString(m, { displayMode: true, throwOnError: false })
        )
        .replace(/\$(.+?)\$/g, (_, m) =>
          katex.renderToString(m, { throwOnError: false })
        );
    },

    formatQuestionType(type) {
      return type.replace('_', ' ').toUpperCase();
    }
  }
};
</script>

<style scoped>
.answer-box {
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 0.6em;
  padding: 0.75rem;
  white-space: pre-wrap;
  word-break: break-word;
  transition: max-height 0.3s ease;
}

.answer-box.collapsed {
  max-height: 120px;
  overflow: hidden;
}

.btn-link {
  text-decoration: none;
}
</style>
