<template>
  <div class="container py-4" v-if="assessment">
    <div class="card shadow-lg mb-4 rounded-4 overflow-hidden">
      <!-- Header -->
      <div class="card-header bg-primary text-white text-center text-md-start py-3 px-4">
        <h2 class="fw-bold mb-2">{{ assessment.title }}</h2>
        <div class="d-flex flex-wrap gap-2 justify-content-center justify-content-md-start">
          <span class="badge bg-info text-dark">Topic: {{ topicName }}</span>
          <span class="badge bg-secondary">Subject: {{ assessment.subject?.name || 'N/A' }}</span>
          <span class="badge bg-success">Questions: {{ questions.length }}</span>
        </div>
      </div>

      <!-- Body -->
      <div class="card-body bg-light">
        <!-- Loading -->
        <div v-if="loading" class="text-center py-5">
          <div class="spinner-border text-primary mb-3" role="status"></div>
          <p class="text-primary fw-semibold">Loading questions...</p>
        </div>

        <!-- Questions -->
        <div v-else-if="questions.length">
          <!-- Progress -->
          <div class="d-flex justify-content-between align-items-center mb-3">
            <span class="fw-semibold text-primary">
              Question {{ currentIndex + 1 }} of {{ questions.length }}
            </span>
            <div class="progress w-50" style="height: 10px;">
              <div
                class="progress-bar bg-primary"
                role="progressbar"
                :style="{ width: ((currentIndex + 1) / questions.length * 100) + '%' }"
              ></div>
            </div>
          </div>

          <!-- Question Text -->
          <div
            class="question-text mb-3 p-3 rounded shadow-sm"
            v-html="renderMath(questions[currentIndex].question_text, questions[currentIndex].is_math)"
          ></div>

          <!-- Options / Answers -->
          <div class="options-list mb-3">
            <!-- Multiple Choice -->
            <div
              v-if="questions[currentIndex].question_type === 'multiple_choice'"
              v-for="(option, i) in questions[currentIndex].options"
              :key="i"
              class="mb-2"
            >
              <input
                class="visually-hidden"
                type="radio"
                :id="'opt-' + currentIndex + '-' + i"
                :name="'option-' + currentIndex"
                :value="option.text"
                v-model="answers[currentIndex]"
              />
              <label
                class="option-item p-2 bg-white rounded-3 shadow-sm d-flex align-items-start gap-3"
                :class="{ active: answers[currentIndex] === option.text }"
                :for="'opt-' + currentIndex + '-' + i"
              >
                <span class="option-letter">{{ String.fromCharCode(65 + i) }}</span>
                <span class="option-content" v-html="renderMath(option.text, questions[currentIndex].is_math)"></span>
              </label>
            </div>

            <!-- True/False -->
            <div
              v-else-if="questions[currentIndex].question_type === 'true_false'"
              class="d-flex flex-column gap-2"
            >
              <div
                v-for="(opt, i) in ['True', 'False']"
                :key="i"
                class="mb-2"
              >
                <input
                  class="visually-hidden"
                  type="radio"
                  :id="'tf-' + currentIndex + '-' + i"
                  :name="'tf-' + currentIndex"
                  :value="opt"
                  v-model="answers[currentIndex]"
                />
                <label
                  class="option-item p-2 bg-white rounded-3 shadow-sm d-flex align-items-center gap-3 fw-semibold"
                  :class="{ active: answers[currentIndex] === opt }"
                  :for="'tf-' + currentIndex + '-' + i"
                >
                  <span class="option-letter">{{ opt.charAt(0) }}</span>
                  <span class="option-content">{{ opt }}</span>
                </label>
              </div>
            </div>

            <!-- Short Answer -->
            <div
              v-else-if="questions[currentIndex].question_type === 'short_answer'"
              class="mt-3"
            >
              <textarea
                v-model="answers[currentIndex]"
                class="form-control shadow-sm"
                rows="3"
                placeholder="Type your answer here..."
              ></textarea>
            </div>

            <!-- Matching -->
            <div
              v-else-if="questions[currentIndex].question_type === 'matching'"
              class="mt-3"
            >
              <div
                v-for="(pair, i) in questions[currentIndex].options.left"
                :key="i"
                class="d-flex align-items-center justify-content-between gap-2 mb-2 p-2 bg-white rounded-3 shadow-sm"
              >
                <span class="fw-semibold">{{ pair }}</span>
                <select
                  class="form-select w-50"
                  v-model="answers[currentIndex][i]"
                >
                  <option value="">Select match</option>
                  <option
                    v-for="(rightOpt, j) in questions[currentIndex].options.right"
                    :key="j"
                    :value="rightOpt"
                  >
                    {{ rightOpt }}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <!-- Navigation Buttons -->
          <div class="d-flex flex-wrap justify-content-end gap-2 mt-3">
            <button
              class="btn btn-outline-secondary fw-bold"
              @click="prevQuestion"
              :disabled="currentIndex === 0"
            >
              <i class="bi bi-arrow-left-circle me-2"></i>Previous
            </button>
            <button
              class="btn btn-outline-primary fw-bold"
              @click="nextQuestion"
              :disabled="currentIndex === questions.length - 1"
            >
              Next<i class="bi bi-arrow-right-circle ms-2"></i>
            </button>
            <button
              v-if="currentIndex === questions.length - 1"
              class="btn btn-success fw-bold"
              @click.prevent="submitAnswers"
              :disabled="submitting"
            >
              <i class="bi bi-send-check me-2"></i>{{ submitting ? 'Submitting...' : 'Submit' }}
            </button>
          </div>
        </div>

        <!-- No Questions -->
        <div v-else class="text-center py-5 text-muted lead">
          No questions found for this assessment.
        </div>

        <!-- Message -->
        <div v-if="message" class="mt-4 text-center fw-bold" :class="submitSuccess ? 'text-success' : 'text-danger'">
          {{ message }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import katex from "katex";
import "katex/dist/katex.min.css";

export default {
  name: "PracticeSession",
  data() {
    return {
      assessment: null,
      questions: [],
      answers: [],
      currentIndex: 0,
      message: "",
      submitSuccess: false,
      submitting: false,
      loading: true,
      topic: null,
      studentAssessmentId: null,
    };
  },
  computed: {
    topicName() {
      return this.topic?.topic_name || this.assessment?.topic_name || "N/A";
    },
  },
  async created() {
    const token = localStorage.getItem("auth_token");
    const id = this.$route.params.id;
    this.loading = true;
    try {
      const res = await axios.get(`/assessments/${id}/details`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      this.assessment = res.data.assessment || {};
      this.topic = res.data.topic || {};
      this.studentAssessmentId = this.assessment.student_assessment_id || null;
      const questions = Array.isArray(this.assessment.questions)
        ? this.assessment.questions
        : [];

      this.questions = questions.map((q) => {
        const qObj = q.question || {};
        const qId = qObj.id || q.question_id || q.id || null;
        const isMath = !!qObj.is_math;
        let options = qObj.options;
        if (typeof options === "string") {
          try {
            options = JSON.parse(options);
          } catch {
            options = [];
          }
        }

        if (qObj.question_type === "matching" && options.left && options.right) {
          return {
            id: qId,
            question_id: q.question_id || qId,
            question_text: qObj.question,
            question_type: "matching",
            is_math: isMath,
            options,
          };
        }

        if (qObj.question_type === "short_answer") {
          return {
            id: qId,
            question_id: q.question_id || qId,
            question_text: qObj.question,
            question_type: "short_answer",
            is_math: isMath,
            options: [],
          };
        }

        if (qObj.question_type === "true_false") {
          return {
            id: qId,
            question_id: q.question_id || qId,
            question_text: qObj.question,
            question_type: "true_false",
            is_math: isMath,
            options: [{ text: "True" }, { text: "False" }],
          };
        }

        return {
          id: qId,
          question_id: q.question_id || qId,
          question_text: qObj.question,
          question_type: "multiple_choice",
          is_math: isMath,
          options: Array.isArray(options)
            ? options.map((opt) => ({ text: opt }))
            : [],
        };
      });

      this.answers = this.questions.map((q) =>
        q.question_type === "matching"
          ? Array((q.options && q.options.left && q.options.left.length) || 0).fill("")
          : null
      );
    } catch (err) {
      this.message = err.response?.data?.message || "Failed to load assessment.";
    } finally {
      this.loading = false;
    }
  },
  methods: {
    prevQuestion() {
      if (this.currentIndex > 0) this.currentIndex--;
    },
    nextQuestion() {
      if (this.currentIndex < this.questions.length - 1) this.currentIndex++;
    },
    renderMath(text, isMath = false) {
      if (!text) return "";
      let processed = String(text);

      // First, handle explicit LaTeX delimiters if present
      const hasBlock = /\$\$([^$]+)\$\$/g.test(processed);
      const hasInline = /\$(.+?)\$/g.test(processed);

      if (hasBlock || hasInline) {
        processed = processed.replace(/\$\$([^$]+)\$\$/g, (_, math) => {
          return `<div class="katex-display">${katex.renderToString(math, {
            displayMode: true,
            throwOnError: false,
          })}</div>`;
        });

        processed = processed.replace(/\$(.+?)\$/g, (_, math) => {
          return `<span class="katex-inline">${katex.renderToString(math, {
            displayMode: false,
            throwOnError: false,
          })}</span>`;
        });

        return processed;
      }

      // If no $ delimiters but question/option is marked as math, render whole string as inline math
      if (isMath) {
        try {
          return `<span class="katex-inline">${katex.renderToString(processed, {
            displayMode: false,
            throwOnError: false,
          })}</span>`;
        } catch (e) {
          // Fallback to plain text on KaTeX error
          return processed;
        }
      }

      // Non-math text, return as-is
      return processed;
    },
    async submitAnswers() {
      this.submitting = true;
      this.message = "";
      const token = localStorage.getItem("auth_token");

      try {
        if(!this.studentAssessmentId){
          this.submitSuccess = false;
          this.message = "Student assessment ID is missing. Cannot submit.";
          return;
        }
        // Build answers array
        const answersPayload = this.questions.map((q, idx) => {
          const userAnswer = this.answers[idx];
          const type = q.question_type;

          // Normalize per type
          if (type === "matching") {
            const leftLen = (q.options && q.options.left && q.options.left.length) || 0;
            let arr = Array.isArray(userAnswer) ? userAnswer.slice(0, leftLen) : [];
            while (arr.length < leftLen) arr.push("");
            return {
              question_id: q.question_id || q.id,
              answer: arr,
            };
          }

          if (type === "true_false") {
            let val = userAnswer != null ? String(userAnswer).toLowerCase() : "";
            if (val !== "true" && val !== "false") val = "";
            return { question_id: q.question_id || q.id, answer: val };
          }

          if (type === "short_answer") {
            const val = userAnswer != null ? String(userAnswer).trim() : "";
            return { question_id: q.question_id || q.id, answer: val };
          }

          // multiple_choice or others default to string
          const val = userAnswer != null ? String(userAnswer) : "";
          return { question_id: q.question_id || q.id, answer: val };
        });
        const payload = {
          student_assessment_id: this.studentAssessmentId,
          answers: answersPayload
        }
        await axios.post(
          "/assessments/submit-answers", payload,
          { headers: { Authorization: `Bearer ${token}` } 
        });

        this.submitSuccess = true;
        this.message = "Answers submitted successfully!";
        setTimeout(() => {
          this.$router.push({
            name: "StudentPracticeList",
            query: { success: "Practice submitted successfully!" },
          });
        }, 1200);
      } catch (err) {
        this.submitSuccess = false;
        this.message =
          err.response?.data?.message || "Submission failed. Try again.";
      } finally {
        this.submitting = false;
      }
    },
  },
};
</script>

<style scoped>
.question-text {
  background: linear-gradient(90deg, #e0e7ff, #f0f4ff);
  color: #22223b;
  font-weight: 500;
  font-size: 1.1em;
}
.form-check-input {
  accent-color: #6366f1;
  cursor: pointer;
}
.form-check-label {
  cursor: pointer;
}
select,
textarea {
  border-radius: 0.6rem;
}
/* Polished option items */
.option-item {
  border: 1px solid #e5e7eb;
  transition: background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
  width: 100%;
}
.option-item:hover {
  background-color: #f8fafc;
  border-color: #d1d5db;
}
.option-item.active {
  border-color: #6366f1;
  box-shadow: 0 0 0 0.2rem rgba(99, 102, 241, 0.15);
  background-color: #eef2ff;
}
.option-letter {
  flex: 0 0 auto;
  width: 32px;
  height: 32px;
  border-radius: 9999px;
  background-color: #eef2ff;
  color: #4338ca;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  border: 1px solid #c7d2fe;
}
.option-item.active .option-letter {
  background-color: #c7d2fe;
  color: #1d4ed8;
  border-color: #818cf8;
}
.option-content {
  line-height: 1.4;
}

/* Matching rows polish */
.options-list select.form-select {
  min-width: 220px;
}
</style>
