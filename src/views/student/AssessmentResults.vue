<template>
  <div class="container py-4">
    <div class="card shadow-lg border-0 mt-2" style="border-radius: 1.5em; background: linear-gradient(120deg, #f0f4ff 0%, #e0e7ff 100%);">
      <div class="card-body" style="border-radius: 1.5em;">
        <!-- Header -->
        <div class="d-flex justify-content-between align-items-center mb-4"
             style="background: linear-gradient(90deg, #6366f1 0%, #60a5fa 100%);
                    padding: 1.5rem;
                    border-radius: 1em;
                    box-shadow: 0 2px 12px rgba(60,72,88,0.07);">
          <button class="btn btn-outline-light btn-sm me-3" @click="$router.go(-1)">
            <i class="bi bi-arrow-left"></i> Back
          </button>
          <h2 class="card-title text-center fw-bold" style="color: #ffffff;font-size: 2.2em; letter-spacing: 1px; margin-bottom: 1.5rem; font-family: 'Poppins', sans-serif; text-transform: uppercase; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">
            Assessment Results
          </h2>
        </div>

        <!-- Loading / Error -->
        <div v-if="loading" class="d-flex flex-column align-items-center justify-content-center py-5">
          <div class="spinner-border text-primary mb-3" role="status"></div>
          <div class="text-primary">Loading results...</div>
        </div>
        <div v-else-if="error" class="alert alert-danger py-2 text-center">{{ error }}</div>

        <!-- Results -->
        <div v-else-if="results">
          <!-- Summary -->
          <div class="mb-4 pb-3 border-bottom"
               style="background: linear-gradient(90deg, #6366f1 0%, #60a5fa 100%);
                      padding: 1.5rem; border-radius: 1em; box-shadow: 0 2px 12px rgba(60,72,88,0.07);">
            <h3 class="h4 mb-2 text-white fw-bold">
              <i class="bi bi-journal-check me-2"></i>{{ results.assessment_title }}
            </h3>
            <div class="row mb-2 text-white">
              <div class="col-md-4 mb-1"><strong>Type:</strong> <span class="badge bg-light text-primary fw-semibold">{{ results.assessment_type }}</span></div>
              <div class="col-md-4 mb-1"><strong>Score:</strong> <span class="badge bg-success fw-semibold"><i class="bi bi-star-fill me-1"></i>{{ results.score }} / {{ results.max_score }}</span></div>
              <div class="col-md-4 mb-1"><strong>Percentage:</strong> <span class="badge bg-info text-dark fw-semibold"><i class="bi bi-percent me-1"></i>{{ results.percentage.toFixed(2) }}%</span></div>
            </div>
            <div class="row mb-2 text-white">
              <div class="col-md-6 mb-1"><strong>Completed At:</strong> <span class="badge bg-light text-primary fw-semibold">{{ formatDate(results.completed_at) }}</span></div>
            </div>
          </div>

          <!-- Questions -->
          <div class="mb-3">
            <h3 class="h5 mb-3 text-primary fw-bold"><i class="bi bi-list-check me-2"></i>Questions Review</h3>

            <div v-for="(question, index) in results.questions" :key="index" class="mb-4">
              <div class="card border-0 shadow-sm" style="border-radius: 1em; background: #f9fafb;">
                <div class="card-body">
                  <div class="d-flex align-items-center mb-2">
                    <span class="badge bg-primary me-2" style="font-size: 1.1em;">Q{{ index + 1 }}</span>
                    <span class="fw-bold" style="font-size: 1.1em; color: #374151;" v-html="renderMath(question.question_text)"></span>
                  </div>

                  <!-- Question Type & Answer -->
                  <div class="mb-2">
                    <span class="badge bg-light text-dark me-2">{{ formatQuestionType(question.question_type) }}</span>

                    <!-- Matching -->
                    <template v-if="question.question_type === 'matching'">
                      <div class="d-flex gap-3 mt-2">
                        <div v-for="(left, i) in question.options.left" :key="'left-'+i" style="flex: 1;">
                          <div class="mb-1 p-2 rounded bg-gray-100">{{ left }}</div>
                        </div>
                        <div v-for="(right, i) in question.options.right" :key="'right-'+i" style="flex: 1;">
                          <div class="mb-1 p-2 rounded" :style="matchingStyle(i, question)">{{ right }}</div>
                        </div>
                      </div>
                    </template>

                    <!-- Other question types -->
                    <template v-else>
                      <!-- Short Answer - Display in formatted boxes -->
                      <template v-if="question.question_type === 'short_answer'">
                        <div class="mt-3">
                          <div class="mb-3">
                            <strong class="d-block mb-2 text-secondary">
                              <i class="bi bi-pencil-square me-1"></i>Your Answer:
                            </strong>
                            <div class="answer-box" :class="question.is_correct ? 'border-success' : 'border-danger'">
                              <!-- Check if student answer is an image -->
                              <template v-if="isImageUrl(question.student_answer)">
                                <img :src="question.student_answer"
                                     alt="Student Answer"
                                     class="answer-image"
                                     @error="handleImageError($event, 'student')" />
                              </template>
                              <template v-else>
                                <span v-html="question.student_answer ? renderMath(question.student_answer) : 'No Answer'"></span>
                              </template>
                            </div>
                          </div>
                          <div class="mb-2" v-if="question.correct_answer">
                            <strong class="d-block mb-2 text-success">
                              <i class="bi bi-check-circle me-1"></i>Correct Answer:
                            </strong>
                            <div class="answer-box border-success bg-light">
                              <!-- Check if correct answer is an image -->
                              <template v-if="isImageUrl(question.correct_answer)">
                                <img :src="question.correct_answer"
                                     alt="Correct Answer"
                                     class="answer-image"
                                     @error="handleImageError($event, 'correct')" />
                              </template>
                              <template v-else>
                                <span v-html="renderMath(question.correct_answer)"></span>
                              </template>
                            </div>
                          </div>
                        </div>
                      </template>
                      <!-- Other question types - Display in badges -->
                      <template v-else>
                        <span class="badge me-2" :class="question.is_correct ? 'bg-success' : 'bg-danger'">
                          Your Answer:
                          <strong v-html="question.student_answer ? renderMath(`$${question.student_answer}$`) : 'No Answer' "></strong>
                        </span>
                      </template>
                      <!-- Show confidence selector for short_answer question -->
                       <div v-if="question.question_type === 'short_answer' && !question.is_correct">
                        <div class="d-flex align-items-center mb-2 mt-2">
                          <span class="me-2 fw-semibold">Confidence in your answer:</span>
                          <div class="btn-group btn-group-sm">
                            <button v-for="level in confidenceLevels" :key="level.value"
                               class="btn"
                               :class="{
                                'btn-outline-primary': question.confidence_score !== level.value ?
                                'btn-primary': question.confidence_score === level.value,
                                'disabled': question.is_correct !== null
                               }"
                               @click="updateConfidence(question, level.value, index)"
                               :disabled="question.is_correct !== null"
                               >
                               {{ level.label }}
                              </button>
                          </div>
                        </div>
                        <small class="text-muted" v-if="question.is_correct === null">Select how confident you were in your answer</small>
                        <small class="text-success" v-else>
                          <i class="bi bi-check-circle-fill"></i> Graded
                        </small>
                       </div>
                      <span v-else-if="question.is_correct" class="badge bg-success">
                        <i class="bi bi-check-circle me-1"></i>Correct</span>
                      <span v-else class="badge bg-danger">
                        <i class="bi bi-x-circle me-1"></i>Incorrect</span>
                    </template>
                  </div>

                  <!-- Points -->
                  <div class="mb-2">
                    <span class="badge bg-warning me-2">Points: <strong>{{ question.points_earned }} / {{ question.max_points }}</strong></span>
                  </div>

                  <!-- Explanation -->
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
      confidenceLevels: [
        {value: 0, label: 'I was wrong'},
        {value: 1, label: 'I was partially correct'},
        {value: 3, label: 'I was mostly correct'},
        {value: 4, label: 'I was correct'},
      ]
    };
  },
  mounted() {
    this.fetchResults();
  },
  computed: {
    currentPercentage() {
      if(!this.results) return 0;
      return (this.results.score / this.results.max_score) * 100;
    }
  },
  methods: {
    async fetchResults() {
      const assessmentId = this.$route.params.id;
      try {
        const token = localStorage.getItem('auth_token');
        const response = await axios.get(`/student/assessment-results/${assessmentId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Handle matching questions
        response.data.questions.forEach(q => {
          if (q.question_type === 'matching') {
            const studentAns = JSON.parse(q.student_answer || '[]');
            const correctAns = JSON.parse(q.correct_answer || '[]');

            const left = [];
            const right = [];
            studentAns.forEach((item, i) => {
              left.push(item);
              const pair = correctAns.find(p => p.left_index === i);
              right.push(pair ? studentAns[pair.right_index] : '');
            });

            q.options = { left, right };
            q.student_answer_parsed = studentAns;
            q.correct_answer_parsed = correctAns;
          }
        });

        this.results = response.data;
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to load results.';
      } finally {
        this.loading = false;
      }
    },
    async updateConfidence(question, confidenceScore, index) {
      try {
        const token = localStorage.getItem('auth_token');
        const studentAssessmentId = this.studentAssessmentId || this.$route.params.id;

        if (!studentAssessmentId) {
      throw new Error('Student assessment ID is missing');
    }
        const response = await axios.post('/assessments/update-short-answer-confidence', {
          student_assessment_id: studentAssessmentId,
          question_id: question.id || question.question_id,
          confidence_score: confidenceScore
        },
      {
        headers: { Authorization: `Bearer ${token}`}
      });
      // Update the question with new confidence and points
      question.confidence_score = confidenceScore;
      question.points_earned = response.data.points_earned;
      question.is_correct = response.data.is_correct;


      // Update the total score in the results
      this.results.score = response.data.total_score;
      this.results.max_score = response.data.max_score;
      this.$forceUpdate();
      if(this.$toast){
              this.$toast.success('Points updated successfully!');

      }else {
        alert('Points updated successfully!');
      }
      } catch (error) {
        console.error('Error updating points', error);
    const errorMessage = error.response?.data?.message || 'Failed to update confidence level.';
    if (this.$toast) {
      this.$toast.error(errorMessage);
    } else {
      alert('Error: ' + errorMessage);
    }
        }
    },

    renderMath(text) {
      if (!text) return '';
      // Display math $$...$$
      text = text.replace(/\$\$([^$]+)\$\$/g, (_, math) => {
        try { return katex.renderToString(math, { displayMode: true, throwOnError: false }); }
        catch (e) { console.error(e); return math; }
      });
      // Inline math $...$
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

    matchingStyle(index, question) {
      const correctPair = question.correct_answer_parsed.find(p => p.left_index === index);
      const isCorrect = correctPair && correctPair.right_index === index;
      return `background: ${isCorrect ? '#d1fae5' : '#fee2e2'}; padding: 0.5rem; border-radius: 0.3rem;`;
    },

    isImageUrl(text) {
      if (!text || typeof text !== 'string') return false;
      // Check if it's a URL pointing to an image
      const imageExtensions = /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i;
      const isUrl = text.startsWith('http://') || text.startsWith('https://') || text.startsWith('/');
      return isUrl && (imageExtensions.test(text) || text.includes('/uploads/') || text.includes('/images/'));
    },

    handleImageError(event, type) {
      console.error(`Failed to load ${type} answer image:`, event.target.src);
      event.target.style.display = 'none';
      const errorMsg = document.createElement('div');
      errorMsg.className = 'text-danger';
      errorMsg.innerHTML = '<i class="bi bi-exclamation-triangle me-1"></i>Image failed to load';
      event.target.parentNode.appendChild(errorMsg);
    }
  }
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
.answer-box {
  background: #f8fafc;
  border: 2px solid #e5e7eb;
  border-radius: 0.6em;
  padding: 1rem;
  font-size: 0.95em;
  color: #374151;
  white-space: pre-wrap;   /* preserves new lines */
  word-wrap: break-word;
  overflow-wrap: break-word;
  line-height: 1.6;
  min-height: 50px;
  max-width: 100%;
}

.answer-box.border-success {
  border-color: #10b981;
  background: #f0fdf4;
}

.answer-box.border-danger {
  border-color: #ef4444;
  background: #fef2f2;
}

.answer-box.bg-light {
  background: #f9fafb;
}

.answer-image {
  max-width: 100%;
  height: auto;
  max-height: 500px;
  border-radius: 0.5em;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;
  display: block;
  margin: 0 auto;
  object-fit: contain;
}

.answer-image:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.btn-link {
  text-decoration: none;
  font-weight: 500;
}

</style>
