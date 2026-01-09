<template>
  <div class="container py-4" v-if="assessment">
    <div class="card shadow-lg mb-4 rounded-4 overflow-hidden">
      <!-- Header -->
      <div
        class="card-header bg-primary text-white text-center text-md-start py-3 px-4"
      >
        <h2 class="fw-bold mb-2">{{ assessment.title }}</h2>
        <div
          class="d-flex flex-wrap gap-2 justify-content-center justify-content-md-start"
        >
          <span class="badge bg-info text-dark">Topic: {{ topicName }}</span>
          <span class="badge bg-secondary">Subject: {{ subjectName }}</span>
          <span class="badge bg-success"
            >Questions: {{ questions.length }}</span
          >
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
              Page {{ currentPageIndex + 1 }} of {{ pages.length }}
            </span>
            <div class="progress w-50" style="height: 10px">
              <div
                class="progress-bar bg-primary"
                role="progressbar"
                :style="{
                  width: ((currentPageIndex + 1) / pages.length) * 100 + '%',
                }"
              ></div>
            </div>
          </div>

          <div
            v-for="(q, qIndex) in [
              pages[currentPageIndex].parent,
              ...pages[currentPageIndex].subs,
            ]"
            :key="q.id"
            class="mb-4"
          >
            <!-- Question Text -->
            <div class="question-text mb-3 p-3 rounded shadow-sm">
              <span class="question-number fw-bold">
                {{
                  q.is_sub
                    ? String.fromCharCode(97 + (qIndex - 1))
                    : currentPageIndex + 1
                }}.
              </span>
              <span v-html="renderMath(q.question_text, q.is_math)"></span>
            </div>
            <!-- Question Image -->
            <div v-if="q.question_image_url" class="text-center mb-3">
              <img
                :src="q.question_image_url"
                alt="Question Image"
                class="img-fluid rounded-3 shadow-sm"
                style="max-height: 300px"
              />
            </div>

            <!-- Options / Answers -->
            <div class="options-list mb-3">
              <!-- Multiple Choice -->
              <div
                v-if="q.question_type === 'mcq'"
                v-for="(option, i) in q.options"
                :key="i"
                class="mb-2"
              >
                <input
                  class="visually-hidden"
                  type="radio"
                  :id="'opt-' + q.id + '-' + i"
                  :name="'option-' + q.id"
                  :value="option.text"
                  v-model="answers[currentPageIndex][qIndex]"
                />
                <label
                  class="option-item p-2 bg-white rounded-3 shadow-sm d-flex align-items-start gap-3"
                  :class="{
                    active: answers[currentPageIndex][qIndex] === option.text,
                  }"
                  :for="'opt-' + q.id + '-' + i"
                >
                  <span class="option-letter">{{
                    String.fromCharCode(65 + i)
                  }}</span>
                  <span
                    class="option-content"
                    v-html="renderMath(option.text, q.is_math)"
                  ></span>
                  <img
                    v-if="option.image"
                    :src="option.image"
                    alt="Option Image"
                    class="img-fluid ms-2"
                    style="max-height: 100px"
                  />
                </label>
              </div>

              <!-- True/False -->
              <div
                v-else-if="q.question_type === 'true_false'"
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
                    :id="'tf-' + q.id + '-' + i"
                    :name="'tf-' + q.id"
                    :value="opt"
                    v-model="answers[currentPageIndex][qIndex]"
                  />
                  <label
                    class="option-item p-2 bg-white rounded-3 shadow-sm d-flex align-items-center gap-3 fw-semibold"
                    :class="{
                      active: answers[currentPageIndex][qIndex] === opt,
                    }"
                    :for="'tf-' + q.id + '-' + i"
                  >
                    <span class="option-letter">{{ opt.charAt(0) }}</span>
                    <span class="option-content">{{ opt }}</span>
                  </label>
                </div>
              </div>

              <!-- Short Answer -->
              <div v-else-if="q.question_type === 'short_answer'" class="mt-3">
                <textarea
                  v-model="answers[currentPageIndex][qIndex]"
                  class="form-control shadow-sm"
                  rows="3"
                  placeholder="Type your answer here..."
                ></textarea>
              </div>

              <!-- Matching -->
              <div v-else-if="q.question_type === 'matching'" class="mt-3">
                <div
                  v-for="(pair, i) in q.options.left"
                  :key="i"
                  class="d-flex align-items-center justify-content-between gap-2 mb-2 p-2 bg-white rounded-3 shadow-sm"
                >
                  <span class="fw-semibold">{{ pair }}</span>
                  <select
                    class="form-select w-50"
                    v-model="answers[currentPageIndex][qIndex][i]"
                  >
                    <option value="">Select match</option>
                    <option
                      v-for="(rightOpt, j) in q.options.right"
                      :key="j"
                      :value="rightOpt"
                    >
                      {{ rightOpt }}
                    </option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <!-- Navigation Buttons -->
          <div class="d-flex flex-wrap justify-content-end gap-2 mt-3">
            <button
              class="btn btn-outline-secondary fw-bold"
              @click="prevPage"
              :disabled="currentPageIndex === 0"
            >
              <i class="bi bi-arrow-left-circle me-2"></i>Previous
            </button>
            <button
              class="btn btn-outline-primary fw-bold"
              @click="nextPage"
              :disabled="currentPageIndex === pages.length - 1"
            >
              Next<i class="bi bi-arrow-right-circle ms-2"></i>
            </button>
            <button
              v-if="currentPageIndex === pages.length - 1"
              class="btn btn-success fw-bold"
              @click.prevent="submitAnswers"
              :disabled="!allPagesAnswered() || submitting"
            >
              <i class="bi bi-send-check me-2"></i
              >{{ submitting ? "Submitting..." : "Submit" }}
            </button>
          </div>
        </div>

        <!-- No Questions -->
        <div v-else class="text-center py-5 text-muted lead">
          No questions found for this assessment.
        </div>

        <!-- Message -->
        <div
          v-if="message"
          class="mt-4 text-center fw-bold"
          :class="submitSuccess ? 'text-success' : 'text-danger'"
        >
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
  name: "AssessmentSession",
  data() {
    return {
      assessment: null,
      pages: [],
      questions: [],
      answers: [],
      currentPageIndex: 0,
      message: "",
      submitSuccess: false,
      submitting: false,
      loading: true,
      topic: null,
      studentAssessmentId: null,
      subject: null,
    };
  },
  computed: {
    topicName() {
      return this.topic?.topic_name || this.assessment?.topic_name || "N/A";
    },
    subjectName() {
      return this.subject || "N/A";
    },
  },
  async created() {
    const token = localStorage.getItem("auth_token");
    const id = this.$route.params.id;
    this.loading = true;
    try {
      const res = await axios.get(`/assessments/${id}/questions-for-practice`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      this.assessment = res.data.assessment || {};
      console.log("Assessment Data:", this.assessment);
      this.topic = res.data.topic || {};
      this.subject = res.data.subject || null;
      this.studentAssessmentId = this.assessment.student_assessment_id || null;
      const questions = Array.isArray(this.assessment.questions)
        ? this.assessment.questions
        : [];

      this.questions = this.flattenQuestions(questions);
      this.pages = this.groupQuestionsForWizard(questions);

      this.answers = this.pages.map((page) => {
        const questionsOnPage = [page.parent, ...page.subs];
        return questionsOnPage.map((q) =>
          q.question_type === "matching"
            ? Array(
                (q.options && q.options.left && q.options.left.length) || 0
              ).fill("")
            : null
        );
      });
    } catch (err) {
      this.message =
        err.response?.data?.message || "Failed to load assessment.";
    } finally {
      this.loading = false;
    }
  },
  methods: {
    flattenQuestions(rawQuestions) {
      const final = [];
      const addedParents = new Set(); // to track parents already added

      rawQuestions.forEach((q) => {
        const qObj = q.question || {};

        // ----- Handle parent question ----- //
        if (qObj.parent && !addedParents.has(qObj.parent.id)) {
          final.push(
            this.normalizeQuestion(qObj.parent, qObj.parent.id, false)
          );
          addedParents.add(qObj.parent.id);
        }

        // ----- Handle current question ----- //
        // Determine if this is a sub-question
        const isSub = !!qObj.parent;
        const parentId = qObj.parent?.id || null;

        // If the parent has multiple sub-questions, find its index
        let subIndex = 0;
        if (isSub && qObj.parent && Array.isArray(qObj.parent.sub_questions)) {
          subIndex = qObj.parent.sub_questions.findIndex(
            (sq) => sq.id === qObj.id
          );
          if (subIndex < 0) subIndex = 0; // fallback
        }

        final.push(
          this.normalizeQuestion(
            qObj,
            q.question_id || qObj.id,
            isSub,
            parentId
          )
        );
      });

      return final;
    },

    groupQuestionsForWizard(rawQuestions) {
      const pages = [];

      rawQuestions.forEach((aq) => {
        const q = aq.question;
        if (!q) return;

        // ---------- Parent question ----------
        if (!q.parent) {
          pages.push({
            parent: this.normalizeQuestion(q, q.id, false),
            subs: [],
          });
          return;
        }

        // ---------- Sub-question ----------
        const parent = q.parent;

        let page = pages.find((p) => p.parent.id === parent.id);

        if (!page) {
          page = {
            parent: this.normalizeQuestion(parent, parent.id, false),
            subs: [],
          };
          pages.push(page);
        }

        page.subs.push(this.normalizeQuestion(q, q.id, true, parent.id));
      });

      return pages;
    },

    normalizeQuestion(qObj, questionId, isSub = false, parentId = null) {
      const isMath = !!qObj.is_math;
      let options = qObj.options;

      if (typeof options === "string") {
        try {
          options = JSON.parse(options);
        } catch {
          options = [];
        }
      }

      const base = {
        id: questionId,
        question_id: questionId,
        is_sub: isSub,
        parent_id: parentId,
        is_math: isMath,
        question_image_url: qObj.question_image_url || null,
        question_text: qObj.question,
      };

      // ---------- Matching ---------- //
      if (qObj.question_type === "matching" && options.left && options.right) {
        return {
          ...base,
          question_type: "matching",
          options,
        };
      }
      // ---------- Short Answer ---------- //
      if (qObj.question_type === "short_answer") {
        return {
          ...base,
          question_type: "short_answer",
          options: [],
        };
      }
      // ---------- True/False ---------- //
      if (qObj.question_type === "true_false") {
        return {
          ...base,
          question_type: "true_false",
          options: [{ text: "True" }, { text: "False" }],
        };
      }
      // ---------- Multiple Choice (default) ---------- //
      return {
        ...base,
        question_type: "mcq",
        options: Array.isArray(options)
          ? options.map((opt) => {
              if (opt && typeof opt === "object") {
                return {
                  text: opt.text ?? opt.label ?? "",
                  image: opt.image ?? null,
                };
              }
              return { text: String(opt) };
            })
          : [],
      };
    },
    prevPage() {
      if (this.currentPageIndex > 0) this.currentPageIndex--;
    },
    nextPage() {
      if (this.allAnsweredOnPage(this.currentPageIndex)) {
        if (this.currentPageIndex < this.pages.length - 1)
          this.currentPageIndex++;
      } else {
        const hasSubs = this.pages[this.currentPageIndex].subs.length > 0;
        this.message = hasSubs
          ? "Please answer all sub-questions on this page."
          : "Please answer the question on this page.";
        setTimeout(() => {
          this.message = "";
        }, 3000);
      }
    },
    allAnsweredOnPage(pageIndex) {
      const page = this.pages[pageIndex];
      const pageAnswers = this.answers[pageIndex];
      const questionsOnPage = [page.parent, ...page.subs];
      if (page.subs.length > 0) {
        // Check only sub-questions
        const subsAnswers = pageAnswers.slice(1);
        const subsQuestions = page.subs;
        return subsAnswers.every((ans, i) => {
          const q = subsQuestions[i];
          if (q.question_type === "matching") {
            return ans.every((a) => a !== "");
          } else {
            return ans !== null && ans !== "";
          }
        });
      } else {
        // Check parent question
        const ans = pageAnswers[0];
        const q = page.parent;
        if (q.question_type === "matching") {
          return ans.every((a) => a !== "");
        } else {
          return ans !== null && ans !== "";
        }
      }
    },
    allPagesAnswered() {
      return this.pages.every((_, i) => this.allAnsweredOnPage(i));
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

      // Helper to normalize answers based on question type
      const normalizeAnswer = (question, userAnswer) => {
        const type = question.question_type;

        if (type === "matching") {
          const left = question.options?.left || [];
          const right = question.options?.right || [];
          const leftLen = left.length;
          const selections = Array.isArray(userAnswer)
            ? userAnswer.slice(0, leftLen)
            : [];
          while (selections.length < leftLen) selections.push("");

          const pairs = selections.map((sel, idx) => {
            if (sel === "" || sel == null) {
              return { left_index: idx, right_index: null };
            }
            const rightIndex = right.findIndex((r) => r === sel);
            return { left_index: idx, right_index: rightIndex >= 0 ? rightIndex : null };
          });

          return { pairs, raw: left };
        } else if (type === "true_false") {
          let val = userAnswer != null ? String(userAnswer).toLowerCase() : "";
          if (val !== "true" && val !== "false") val = "";
          return val;
        } else if (type === "short_answer") {
          return userAnswer != null ? String(userAnswer).trim() : "";
        } else {
          // multiple_choice or other types default to string
          return userAnswer != null ? String(userAnswer) : "";
        }
      };

      try {
        const answersPayload = [];

        this.pages.forEach((page, pageIdx) => {
          if (page.subs?.length > 0) {
            page.subs.forEach((q, qIdx) => {
              const userAnswer = this.answers[pageIdx][qIdx + 1];
              answersPayload.push({
                question_id: q.question_id || q.id,
                answer: normalizeAnswer(q, userAnswer),
              });
            });
          } else {
            const q = page.parent;
            const userAnswer = this.answers[pageIdx][0];
            answersPayload.push({
              question_id: q.question_id || q.id,
              answer: normalizeAnswer(q, userAnswer),
            });
          }
        });

        const payload = {
          assessment_id: this.assessment.id,
          answers: answersPayload,
        };

        const response = await axios.post(
          "/assessments/submit-answers",
          payload,
          {
            headers: { Authorization: `Bearer ${token}` },
            transformResponse: [
              (data) => {
                try {
                  return JSON.parse(data);
                } catch {
                  return data; // keep raw text if not JSON
                }
              },
            ],
          }
        );

        this.submitSuccess = true;
        this.message =
          typeof response.data === "string"
            ? response.data
            : response.data.message || "Answers submitted successfully!";

        setTimeout(() => {
          this.$router.push({
            name: "StudentPracticeList",
            query: { success: "Practice submitted successfully!" },
          });
        }, 1200);
      } catch (err) {
        this.submitSuccess = false;

        if (err.response) {
          // Handle JSON or plain text response
          const data = err.response.data;
          this.message =
            (typeof data === "string" ? data : data.message) ||
            "Submission failed. Try again.";
        } else {
          this.message = err.message || "Submission failed. Try again.";
        }
      } finally {
        this.submitting = false;
      }
    },
  },
};
</script>

<style scoped>
.question-number {
  color: #4338ca;
  margin-right: 0.5rem;
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
  transition: background-color 0.15s ease, border-color 0.15s ease,
    box-shadow 0.15s ease;
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
