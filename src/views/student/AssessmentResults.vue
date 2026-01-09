<template>
  <div class="container py-4">
    <div class="card shadow-lg border-0 mt-2 main-card">
      <div class="card-body">

        <!-- Header -->
        <div class="header-bar">
          <button class="btn btn-outline-light btn-sm" @click="$router.go(-1)">
            <i class="bi bi-arrow-left"></i> Back
          </button>
          <h2 class="header-title">Assessment Results</h2>
        </div>

        <!-- Loading / Error -->
        <div v-if="loading" class="text-center py-5">
          <div class="spinner-border text-primary mb-3"></div>
          <div>Loading results...</div>
        </div>

        <div v-else-if="error" class="alert alert-danger text-center">
          {{ error }}
        </div>

        <!-- Results -->
        <div v-else-if="results">

          <!-- Summary -->
          <div class="summary-card">
            <h4 class="text-white fw-bold mb-2">
              <i class="bi bi-journal-check me-2"></i>{{ results.assessment_title }}
            </h4>
            <div class="row text-white">
              <div class="col-md-4">
                <strong>Type: </strong>
                <span class="badge bg-light text-primary">{{ results.assessment_type.charAt(0).toUpperCase() + results.assessment_type.slice(1) }}</span>
              </div>
              <div class="col-md-4">
                <strong>Score: </strong>
                <span class="badge bg-success">{{ results.score }} / {{ results.max_score }}</span>
              </div>
              <div class="col-md-4">
                <strong>Percentage: </strong>
                <span class="badge bg-info text-dark">
                  {{ results.percentage.toFixed(2) }}%
                </span>
              </div>
            </div>
          </div>

          <!-- Questions -->
          <h5 class="mt-4 mb-3 text-primary fw-bold">
            <i class="bi bi-list-check me-2"></i>Questions Review
          </h5>

          <div
            v-for="(question, index) in results.questions"
            :key="question.id"
            class="mb-4"
          >
            <div class="card border-0 shadow-sm question-card">
              <div class="card-body">

                <!-- Question -->
                <div class="mb-2">
                  <span class="badge bg-primary me-2">Q{{ index + 1 }}</span>
                  <span class="fw-bold" v-html="renderMath(question.question_text)"></span>
                </div>

                <span class="badge bg-light text-dark mb-2">
                  {{ formatQuestionType(question.question_type) }}
                </span>

                <!-- MATCHING -->
                <template v-if="question.question_type === 'matching'">
                  <div class="mt-2">
                    <div
                      v-for="(item, mi) in question.matchingDisplay"
                      :key="mi"
                      class="d-flex justify-content-between align-items-center p-2 mb-2 rounded"
                      :class="item.is_correct ? 'bg-success text-white' : 'bg-danger text-white'"
                    >
                      <div class="flex-fill">
                        <strong>{{ item.left_text }}</strong>
                      </div>
                      <div class="mx-3">→</div>
                      <div class="flex-fill text-end">
                        <div>Your: <span class="fw-semibold">{{ item.student_right_text || 'No match' }}</span></div>
                        <div v-if="item.correct_right_text" class="small">Correct: {{ item.correct_right_text }}</div>
                      </div>
                    </div>
                  </div>
                  
                </template>

                <!-- MULTIPLE CHOICE -->
                <template v-else-if="question.question_type === 'mcq'">
                  <div class="mt-2">
                    <div
                      v-for="(opt, oi) in question.options"
                      :key="oi"
                      class="p-2 mb-2 bg-lightblue rounded option-row d-flex align-items-center"
                      :class="{
                        'selected': (typeof opt === 'string' ? opt : opt.text).toLowerCase() === String(question.student_answer).toLowerCase(),
                        'correct': (typeof opt === 'string' ? opt : opt.text).toLowerCase() === String(question.correct_answer).toLowerCase()
                      }"
                    >
                      <span class="option-letter me-3">{{ String.fromCharCode(65 + oi) }}</span>
                      <div class="flex-fill">
                        <template v-if="typeof opt === 'object' && (opt.image || opt.image_url)">
                          <img :src="opt.image_url || opt.image" class="option-image mb-1" />
                        </template>
                        <div v-html="renderMath(typeof opt === 'string' ? opt : (opt.text || ''))"></div>
                      </div>
                      <div v-if="(typeof opt === 'string' ? opt : opt.text).toLowerCase() === String(question.correct_answer).toLowerCase()" class="ms-3">
                        <span class="badge bg-success">Correct</span>
                      </div>
                      <div v-else-if="(typeof opt === 'string' ? opt : opt.text).toLowerCase() === String(question.student_answer).toLowerCase()" class="ms-3">
                        <span class="badge bg-danger">Your answer</span>
                      </div>
                    </div>
                  </div>
                </template>

                <!-- TRUE/FALSE -->
                <template v-else-if="question.question_type === 'true_false'">
                  <div class="mt-2">
                    <div
                      v-for="(opt, oi) in [{text: 'True'}, {text: 'False'}]"
                      :key="oi"
                      class="p-2 mb-2 bg-white rounded option-row d-flex align-items-center"
                      :class="{
                        'selected': String(opt.text).toLowerCase() === String(question.student_answer).toLowerCase(),
                        'correct': String(opt.text).toLowerCase() === String(question.correct_answer).toLowerCase()
                      }"
                    >
                      <span class="option-letter me-3">{{ opt.text.charAt(0) }}</span>
                      <div class="flex-fill">{{ opt.text }}</div>
                      <div v-if="String(opt.text).toLowerCase() === String(question.correct_answer).toLowerCase()" class="ms-3">
                        <span class="badge bg-success">Correct</span>
                      </div>
                      <div v-else-if="String(opt.text).toLowerCase() === String(question.student_answer).toLowerCase()" class="ms-3">
                        <span class="badge bg-info">Your answer</span>
                      </div>
                    </div>
                  </div>
                </template>

                <!-- SHORT ANSWER -->
                <template v-else-if="question.question_type === 'short_answer'">
                  <div class="mt-3">

                    <!-- Student Answer -->
                    <strong>Your Answer:</strong>
                    <div
                      class="answer-box"
                      :class="{
                        'border-success': question._auto_marked || question.confidence_score === 3,
                        'border-danger': question.confidence_score === 0
                      }"
                    >
                      <template v-if="isImageUrl(question.student_answer)">
                        <img :src="question.student_answer" class="answer-image" />
                      </template>
                      <template v-else>
                        <span v-html="question.student_answer || 'No Answer'"></span>
                      </template>
                    </div>

                    <!-- Correct Answer -->
                    <div v-if="question.correct_answer || question.correct_answer_image" class="mt-3">
                      <strong class="text-success">Correct Answer:</strong>
                      <div class="answer-box border-success bg-light">
                        <template v-if="question.correct_answer_image">
                          <img :src="question.correct_answer_image" class="answer-image" />
                        </template>
                        <template v-else>
                          <span v-html="question.correct_answer"></span>
                        </template>
                      </div>
                    </div>

                    <!-- Auto-marked -->
                    <div v-if="question._auto_marked" class="mt-2">
                      <span class="badge bg-success">
                        <i class="bi bi-check-circle me-1"></i>Correct (Auto-marked)
                      </span>
                    </div>

                    <!-- Confidence Selector (practice only) -->
                    <div
                      v-else-if="question.confidence_score === null && results.assessment_type === 'practice'"
                      class="mt-3"
                    >
                      <strong class="me-2">Confidence:</strong>
                      <div class="btn-group btn-group-sm">
                        <button
                          v-for="level in confidenceLevels"
                          :key="level.value"
                          class="btn btn-outline-primary"
                          @click="updateConfidence(question, level.value)"
                        >
                          {{ level.label }}
                        </button>
                      </div>
                      <small class="text-muted d-block mt-1">
                        Select how confident you were
                      </small>
                    </div>

                    <!-- Awarded -->
                    <div v-if="question.confidence_score !== null" class="mt-2">
                      <span class="badge bg-info">
                        Awarded: {{ question.points_earned }} / {{ question.max_points }}
                      </span>
                      <span class="badge bg-secondary ms-2">Self-graded</span>
                    </div>

                  </div>
                </template>

                <!-- OTHER TYPES -->
                <template v-else>
                  <span
                    class="badge"
                    :class="question.is_correct ? 'bg-success' : 'bg-danger'"
                  >
                    Your Answer: {{ question.student_answer || 'No Answer' }}
                  </span>
                </template>

                <!-- Points -->
                <div class="mt-2">
                  <span class="badge bg-warning">
                    Points: {{ question.points_earned }} / {{ question.max_points }}
                  </span>
                </div>

                <!-- Explanation -->
                <div v-if="question.explanation" class="alert alert-info mt-3 py-2">
                  <strong>Explanation:</strong> {{ question.explanation }}
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
        { value: 0, label: 'I was wrong' },
        { value: 1, label: 'Partially correct' },
        { value: 2, label: 'Mostly correct' },
        { value: 3, label: 'Completely correct' }
      ]
    };
  },

  mounted() {
    this.fetchResults();
  },

  methods: {
    async fetchResults() {
      try {
        const res = await axios.get(
          `/student/assessment-results/${this.$route.params.id}`,
          { headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` } }
        );

        this.results = res.data;

        // Ensure top-level score uses API value (some APIs return `score` or `total_score`)
        this.results.score = res.data.score ?? res.data.total_score ?? this.results.score;

        // If API returns a separate `student_answers` collection, merge it into the
        // corresponding question objects so UI shows persisted confidence/points.
        if (Array.isArray(this.results.student_answers) && Array.isArray(this.results.questions)) {
          const saMap = {};
          this.results.student_answers.forEach(sa => {
            if (sa.question_id !== undefined) saMap[sa.question_id] = sa;
          });
          this.results.questions.forEach(q => {
            const sa = saMap[q.id] || saMap[q.question_id] || null;
            if (sa) {
              q.points_earned = sa.points_earned ?? q.points_earned ?? 0;
              q.confidence_score = sa.confidence_score ?? sa.confidence ?? q.confidence_score ?? null;
              q.max_points = sa.max_points ?? sa.marks ?? q.max_points ?? q.marks ?? 0;
              q.student_assessment_id = sa.student_assessment_id ?? q.student_assessment_id;
              if (sa.answer_text !== undefined) q.student_answer = sa.answer_text;
            }
          });
        }

        // Normalize per-question student-answer fields. Some backends return a nested
        // student_answer object while others put fields at the question root. Merge
        // any nested `student_answer` object into the question so the template can
        // consistently read `points_earned`, `confidence_score`, `max_points`, etc.
        this.results.questions.forEach(q => {
          // If backend returned a JSON string for student_answer, attempt to parse it
          let saObj = null;
          if (q.student_answer && typeof q.student_answer === 'string') {
            const s = q.student_answer.trim();
            if ((s.startsWith('{') && s.endsWith('}')) || (s.startsWith('[') && s.endsWith(']'))) {
              try {
                saObj = JSON.parse(s);
              } catch (e) {
                saObj = null;
              }
            }
          } else if (q.student_answer && typeof q.student_answer === 'object') {
            saObj = q.student_answer;
          }

          if (saObj) {
            q.points_earned = saObj.points_earned ?? q.points_earned ?? 0;
            q.confidence_score = saObj.confidence_score ?? saObj.confidence ?? q.confidence_score ?? null;
            q.max_points = saObj.max_points ?? saObj.marks ?? q.max_points ?? 0;
            q.student_assessment_id = saObj.student_assessment_id ?? q.student_assessment_id;
            if (saObj.answer_text !== undefined) q.student_answer = saObj.answer_text;
          }

          // fallback: if max_points still missing, try question-level field
          q.max_points = q.max_points ?? q.marks ?? q.points_possible ?? 0;

          if (q.question_type === 'matching') {
            // Normalize stored student/correct answers which may be strings or objects
            const parseMaybe = (v) => {
              if (!v) return null;
              if (typeof v === 'object') return v;
              try {
                return JSON.parse(v);
              } catch (e) {
                return null;
              }
            };

            const studentObj = parseMaybe(q.student_answer) || {};
            const correctObj = parseMaybe(q.correct_answer) || {};

            // Prefer the question's options for left/right display text when available
            const leftItems = (q.options && Array.isArray(q.options.left) && q.options.left.length)
              ? q.options.left
              : (studentObj.raw || correctObj.raw || []);

            const rightPool = (q.options && Array.isArray(q.options.right) && q.options.right.length)
              ? q.options.right
              : (correctObj.raw || studentObj.raw || []);

            // studentObj/ correctObj might be an array of pairs directly, or an object { pairs: [...], raw: [...] }
            const studentPairs = Array.isArray(studentObj)
              ? studentObj
              : (Array.isArray(studentObj.pairs) ? studentObj.pairs : (Array.isArray(q.student_answer_parsed) ? q.student_answer_parsed : []));

            const correctPairs = Array.isArray(correctObj)
              ? correctObj
              : (Array.isArray(correctObj.pairs) ? correctObj.pairs : (Array.isArray(q.correct_answer_parsed) ? q.correct_answer_parsed : []));

            // Build a display-friendly array per-left item
            q.matchingDisplay = leftItems.map((leftText, idx) => {
              const sp = studentPairs.find(p => p.left_index === idx) || { right_index: null };
              const cp = correctPairs.find(p => p.left_index === idx) || { right_index: null };
              return {
                left_text: leftText,
                student_right_index: sp.right_index,
                correct_right_index: cp.right_index,
                student_right_text: sp.right_index != null ? (rightPool[sp.right_index] ?? null) : null,
                correct_right_text: cp.right_index != null ? (rightPool[cp.right_index] ?? null) : null,
                is_correct: sp.right_index != null && cp.right_index === sp.right_index
              };
            });

            // Ensure fallback options exist for templates that read q.options
            q.options = q.options || {};
            q.options.left = leftItems;
            q.options.right = rightPool;
          }
        });

        // If backend returned an inconsistent top-level score (stale), compute
        // a client-side total from the question list so the UI reflects persisted
        // per-question `points_earned` values.
        try {
          const computedScore = this.results.questions.reduce((sum, q) => {
            return sum + (parseFloat(q.points_earned) || 0);
          }, 0);

          // compute max score from top-level or per-question values
          const computedMax = (parseFloat(this.results.max_score) || 0) || this.results.questions.reduce((sum, q) => sum + (parseFloat(q.max_points) || 0), 0);

          // If different, prefer the computed values (backend may be stale)
          if (Math.abs(computedScore - (Number(this.results.score) || 0)) > 0.0001) {
            this.results.score = Number(computedScore);
            this.results.max_score = Number(computedMax || this.results.max_score || 0);
            this.results.percentage = this.results.max_score ? (this.results.score / this.results.max_score) * 100 : 0;
          }
        } catch (e) {
          // ignore computation errors and keep server values
        }

        this.autoMarkShortAnswers();
      } catch {
        this.error = 'Failed to load results.';
      } finally {
        this.loading = false;
      }
    },

    autoMarkShortAnswers() {
  if (!this.results || !this.results.questions) return;

  this.results.questions.forEach(async question => {
    if (question.question_type !== 'short_answer') return;

    // Always initialize explicitly
    question._auto_marked = false;

    // Only auto-mark if correct answer exists
    if (
      question.correct_answer &&
      this.isExactMatch(question)
    ) {
      question._auto_marked = true;
      // Auto-save full marks using backend's max mapping (3 == full)
      await this.updateConfidence(question, 3, true);
    }
  });
},


 isExactMatch(question) {
  if (question.question_type !== 'short_answer') return false;
  if (
    !question.student_answer ||
    !question.correct_answer
  ) {
    return false;
  }

  return (
    question.student_answer.trim().toLowerCase() ===
    question.correct_answer.trim().toLowerCase()
  );
},


    async updateConfidence(question, confidence, skipConfirm = false) {
      if (!skipConfirm && confidence === 4 && !confirm('Are you sure you deserve full marks?')) return;

      const res = await axios.post(
        '/assessments/update-short-answer-confidence',
        {
          student_assessment_id: question.student_assessment_id,
          question_id: question.question_id,
          confidence_score: confidence
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` } }
      );

      question.confidence_score = confidence;
      question.points_earned = res.data.points_earned;
      this.results.score = res.data.total_score;
    },

    renderMath(text) {
      if (!text) return '';
      return text.replace(/\$(.+?)\$/g, (_, m) =>
        katex.renderToString(m, { throwOnError: false })
      );
    },

    formatQuestionType(type) {
      return type.replace('_', ' ').toUpperCase();
    },

    

    isImageUrl(v) {
      return typeof v === 'string' && /\.(png|jpg|jpeg|gif|webp)$/i.test(v);
    }
  }
};
</script>

<style scoped>
.main-card { border-radius: 1.5em; background: #f9fafb; max-width: 900px; margin: auto; }
.header-bar { display:flex; justify-content:space-between; align-items:center;
  background:linear-gradient(90deg,#6366f1,#60a5fa); padding:1.2rem; border-radius:1em; }
.header-title { color:#fff; font-weight:700; margin:0; }
.summary-card { background:linear-gradient(90deg,#6366f1,#60a5fa);
  padding:1.2rem; border-radius:1em; margin-bottom:1.5rem; }
.question-card { border-radius:1em; background:#fff; }
.answer-box { border:2px solid #e5e7eb; border-radius:.6em; padding:1rem; background:#f8fafc; }
.border-success { border-color:#10b981; background:#f0fdf4; }
.border-danger { border-color:#ef4444; background:#fef2f2; }
.answer-image { max-width:100%; border-radius:.5em; }
.option-image { max-width:140px; display:block; border-radius:.4em; }
.option-row { border:1px solid #e7e7ef; }
.option-row.selected { background: #f0f9ff; border-color:#c7e9ff; }
.option-row.correct { background: #f0fdf4; border-color:#bbf7d0; }
</style>
