<template>
  <div class="container py-4" style="background: linear-gradient(120deg, #f0f4ff 0%, #e0e7ff 100%); border-radius: 2em; box-shadow: 0 8px 32px rgba(99,102,241,0.13), 0 2px 8px rgba(99,102,241,0.10);">
    <h2 class="mb-4 fw-bold text-center" style="background: linear-gradient(90deg, #6366f1 0%, #60a5fa 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; text-fill-color: transparent; font-size: 2.2em; letter-spacing: 1px;">Practice Questions</h2>
    <div v-if="filteredQuestions.length" class="mb-4">
      <div class="d-flex align-items-center mb-2" style="background: linear-gradient(90deg, #6366f1 0%, #60a5fa 100%); border-radius: 1em; padding: 1em 2em; box-shadow: 0 2px 12px rgba(60,72,88,0.07);">
        <span class="me-3 text-white fw-semibold">Progress: <strong>{{ currentIndex + 1 }} / {{ filteredQuestions.length }}</strong></span>
        <div class="flex-grow-1">
          <div class="progress" style="height: 16px; background: #e0e7ff;">
            <div class="progress-bar" role="progressbar" :style="{ width: ((currentIndex + 1) / filteredQuestions.length * 100) + '%', background: 'linear-gradient(90deg, #34d399 0%, #10b981 100%)' }" :aria-valuenow="currentIndex + 1" :aria-valuemin="0" :aria-valuemax="filteredQuestions.length"></div>
          </div>
        </div>
        <span class="ms-3 text-white fw-semibold">Score: <strong>{{ score }} / {{ filteredQuestions.length }}</strong></span>
        <span class="ms-3 text-white fw-semibold">Marks: <strong>{{ earnedMarks }} / {{ totalMarksAvailable }}</strong></span>
      </div>
    </div>
    <div class="card mb-4 p-3 shadow-sm">
      <div class="row g-3" style="background: #fff; border-radius: 1.5em; box-shadow: 0 2px 12px rgba(60,72,88,0.07);">
        <div class="col-md-4">
          <label for="subject_id" class="form-label">Subject</label>
          <select v-model="selectedSubject" id="subject_id" @change="fetchTopics" required class="form-select">
            <option value="" disabled>Select subject</option>
            <option v-for="subject in subjects" :key="subject.id" :value="subject.id">{{ subject.name }}</option>
          </select>
        </div>
        <div class="col-md-4">
          <label for="topic_id" class="form-label">Topic</label>
          <select v-model="selectedTopic" id="topic_id" @change="fetchQuestions" :disabled="!topics.length" required class="form-select">
            <option value="" disabled>Select topic</option>
            <option v-for="topic in topics" :key="topic.id" :value="topic.id">{{ topic.topic_name }}</option>
          </select>
        </div>
        <div class="col-md-4">
          <label for="grade_filter" class="form-label">Grade Level</label>
          <select v-model="selectedGradeFilter" id="grade_filter" @change="applyFilters" class="form-select">
            <option value="">All Grades</option>
            <option v-for="grade in gradeLevels" :key="grade.id" :value="grade.id">{{ grade.grade_name }}</option>
          </select>
        </div>
      </div>
    </div>
    <div v-if="loading" class="d-flex flex-column align-items-center justify-content-center py-5">
      <div class="spinner-border text-primary mb-3" role="status"></div>
      <div class="text-primary">Loading questions...</div>
    </div>
    <div v-else-if="filteredQuestions.length === 0 && selectedTopic" class="text-center py-5">
      <div class="mb-3">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="1.5">
          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
          <path d="M12 8v4m0 0v4m0-4h4m-4 0H8" />
        </svg>
      </div>
      <p class="lead text-muted">No questions found for this topic.</p>
    </div>
    <div v-else>
      <div v-if="filteredQuestions.length" class="card shadow-sm mb-4">
        <div class="card-header d-flex justify-content-between align-items-center" style="background: linear-gradient(90deg, #6366f1 0%, #60a5fa 100%); border-radius: 1em 1em 0 0; color: #fff; box-shadow: 0 2px 8px rgba(99,102,241,0.10);">
          <div class="fw-semibold" style="font-size: 1.2em;">Question {{ currentIndex + 1 }}</div>
          <div class="d-flex align-items-center gap-3">
            <span class="badge" style="background: linear-gradient(90deg, #6366f1 0%, #60a5fa 100%); color: #fff; font-weight: 600; font-size: 1em;">{{ normalizedType(currentQuestion) }}</span>
            <span v-if="currentQuestion.grade_level_id" class="badge bg-info text-dark" style="font-weight: 600; font-size: 1em;">
              {{ gradeLevels.find(g => g.id === currentQuestion.grade_level_id)?.grade_name || currentQuestion.grade_level_id }}
            </span>
            <span v-if="normalizedDifficulty(currentQuestion)" class="badge bg-warning text-dark" style="font-weight: 600; font-size: 1em;">
              {{ normalizedDifficulty(currentQuestion) }}
            </span>
            <span v-if="normalizedRequired(currentQuestion)" class="badge bg-danger" style="font-weight: 600; font-size: 1em;">Required</span>
          </div>
        </div>
        <div class="card-body" style="background: #f9fafb; border-radius: 0 0 1em 1em;">
          <div class="d-flex align-items-center mb-3">
            <span class="fw-bold me-3" style="font-size: 1.15em; color: #374151;">{{ currentQuestion.question }}</span>
            <img v-if="currentQuestion.question_image_url" :src="currentQuestion.question_image_url" alt="Question Image" class="img-thumbnail ms-3" style="max-width:180px;max-height:120px; border-radius: 1em; box-shadow: 0 2px 8px rgba(99,102,241,0.10);" />
          </div>
          <div class="mb-3">
            <template v-if="normalizedTypeRaw(currentQuestion) === 'true_false'">
              <div class="form-check mb-2" v-for="opt in ['A', 'B', 'C', 'D'].includes(currentQuestion.options?.[0]) ? currentQuestion.options : ['True', 'False']" :key="opt" style="background: #e0e7ff; border-radius: 0.7em; box-shadow: 0 2px 8px rgba(99,102,241,0.07);">
                <input class="form-check-input" type="radio" :name="'tf_' + currentQuestion.id" :value="opt" v-model="studentAnswers[currentQuestion.id]" />
                <label class="form-check-label fw-semibold" style="font-size: 1.08em;">{{ opt }}</label>
              </div>
            </template>
            <template v-else-if="normalizedTypeRaw(currentQuestion) === 'mcq'">
              <div v-for="(opt, oidx) in (Array.isArray(currentQuestion.options) ? currentQuestion.options : [])" :key="oidx" class="form-check mb-2" style="background: #e0e7ff; border-radius: 0.7em; box-shadow: 0 2px 8px rgba(99,102,241,0.07);">
                <input class="form-check-input" type="radio" :name="'mcq_' + currentQuestion.id" :value="opt" v-model="studentAnswers[currentQuestion.id]" />
                <label class="form-check-label fw-semibold" style="font-size: 1.08em;">{{ opt }}</label>
              </div>
              <div v-if="!Array.isArray(currentQuestion.options) || currentQuestion.options.length === 0" class="text-danger">No options available for this question.</div>
            </template>
            <template v-else-if="normalizedTypeRaw(currentQuestion) === 'short_answer'">
              <input type="text" v-model="studentAnswers[currentQuestion.id]" placeholder="Type your answer..." class="form-control" style="background: #e0e7ff; border-radius: 0.7em; font-size: 1.08em;" />
            </template>
          </div>
          <transition name="fade">
            <span v-if="feedback[currentQuestion.id]" :class="{'text-success': feedback[currentQuestion.id] === 'Correct!', 'text-danger': feedback[currentQuestion.id] !== 'Correct!'}" class="fw-bold d-block mb-2" style="font-size: 1.15em; background: #e0e7ff; border-radius: 0.7em; padding: 0.5em 1em; box-shadow: 0 2px 8px rgba(99,102,241,0.07);">{{ feedback[currentQuestion.id] }}</span>
          </transition>
          <div class="d-flex gap-3">
            <button class="btn btn-gradient px-4 py-2 fw-bold" style="font-size: 1.08em;" @click="submitAnswer(currentQuestion)" :disabled="answered">
              <i class="bi bi-check2-circle me-2"></i>Submit Answer
            </button>
            <button v-if="answered && currentIndex < filteredQuestions.length - 1" class="btn btn-gradient px-4 py-2 fw-bold" style="background: linear-gradient(90deg, #10b981 0%, #22d3ee 100%); font-size: 1.08em;" @click="nextQuestion">
              <i class="bi bi-arrow-right-circle me-2"></i>Next Question
            </button>
          </div>
          <span v-if="answered && currentIndex === filteredQuestions.length - 1" class="text-success fw-bold mt-3 d-block"><span class="me-2">✔</span> Practice Complete!</span>
          <span v-if="answered && currentIndex === filteredQuestions.length - 1" class="text-success fw-bold mt-3 d-block" style="font-size: 1.2em; background: linear-gradient(90deg, #34d399 0%, #10b981 100%); color: #fff; border-radius: 0.7em; padding: 0.5em 1em; box-shadow: 0 2px 8px rgba(16,185,129,0.10);"><span class="me-2">✔</span> Practice Complete!</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
export default {
  name: 'PracticeQuestions',
  data() {
    return {
      selectedSubject: '',
      topics: [],
      selectedTopic: '',
      questions: [],
      filteredQuestions: [],
      subjects: [],
      gradeLevels: [],
      selectedGradeFilter: '',
      loading: false,
      studentAnswers: {},
      feedback: {},
      currentIndex: 0,
      score: 0,
      earnedMarks: 0,
      answered: false,
    };
  },
  created() {
    this.fetchSubjects();
    this.fetchGradeLevels();
  },
  computed: {
    currentQuestion() {
      return this.filteredQuestions[this.currentIndex] || {};
    },
    totalMarksAvailable() {
      return this.filteredQuestions.reduce((sum, q) => sum + (parseFloat(q.marks) || 1), 0);
    },
  },
  methods: {
    normalizedTypeRaw(q) {
      // Normalize question_type to lower case
      return (q.question_type || '').toString().trim().toLowerCase();
    },
    normalizedType(q) {
      const type = this.normalizedTypeRaw(q);
      if (type === 'mcq') return 'Multiple Choice';
      if (type === 'true_false') return 'True/False';
      if (type === 'short_answer') return 'Short Answer';
      return type.charAt(0).toUpperCase() + type.slice(1);
    },
    normalizedDifficulty(q) {
      return q.difficulty || q.difficulty_level || '';
    },
    normalizedRequired(q) {
      return q.required || q.is_required || false;
    },
    async fetchSubjects() {
      try {
        const res = await axios.get('http://localhost:8000/api/subjects');
        this.subjects = res.data;
      } catch (e) {
        this.subjects = [];
      }
    },
    async fetchTopics() {
      this.topics = [];
      this.selectedTopic = '';
      this.questions = [];
      if (!this.selectedSubject) return;
      try {
        const res = await axios.get(`http://localhost:8000/api/subjects/${this.selectedSubject}/topics`);
        this.topics = res.data;
      } catch (e) {
        this.topics = [];
      }
    },
    async fetchGradeLevels() {
      try {
        const response = await axios.get('http://localhost:8000/api/grade-levels');
        this.gradeLevels = response.data;
      } catch (e) {
        try {
          const response = await axios.get('http://localhost:8000/api/grades');
          this.gradeLevels = response.data.map(grade => grade.grade_name);
        } catch (err) {
          this.gradeLevels = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'];
        }
      }
    },
    async fetchQuestions() {
      this.questions = [];
      this.filteredQuestions = [];
      if (!this.selectedTopic) return;
      this.loading = true;
      try {
        let url = `http://localhost:8000/api/topics/${this.selectedTopic}/questions`;
        if (this.selectedGradeFilter) {
          url += `?grade_level_id=${this.selectedGradeFilter}`;
        }
        const res = await axios.get(url);
        this.questions = res.data;
        this.applyFilters();
      } catch (e) {
        this.questions = [];
        this.filteredQuestions = [];
      }
      this.loading = false;
    },
    applyFilters() {
      if (!this.selectedGradeFilter) {
        this.filteredQuestions = [...this.questions];
        return;
      }
      this.filteredQuestions = this.questions.filter(question => {
        if (!this.selectedGradeFilter) return true;
        return String(question.grade_level_id) === String(this.selectedGradeFilter);
      });
    },
    submitAnswer(q) {
      if (this.answered) return;
      const answer = this.studentAnswers[q.id];
      let correct = false;
      if (this.normalizedTypeRaw(q) === 'true_false' || this.normalizedTypeRaw(q) === 'mcq') {
        if (Array.isArray(q.correct_answer)) {
          correct = q.correct_answer.map(String).includes(String(answer));
        } else {
          try {
            const parsed = JSON.parse(q.correct_answer);
            if (Array.isArray(parsed)) {
              correct = parsed.map(String).includes(String(answer));
            } else {
              correct = String(parsed) === String(answer);
            }
          } catch (e) {
            correct = String(q.correct_answer) === String(answer);
          }
        }
      } else if (this.normalizedTypeRaw(q) === 'short_answer') {
        if (Array.isArray(q.correct_answer)) {
          correct = q.correct_answer.some(ca => String(ca).toLowerCase().trim() === String(answer).toLowerCase().trim());
        } else {
          correct = String(q.correct_answer).toLowerCase().trim() === String(answer).toLowerCase().trim();
        }
      }
      this.feedback[q.id] = correct ? 'Correct!' : 'Try again.';
      this.answered = true;
      if (correct) {
        this.score++;
        this.earnedMarks += parseFloat(q.marks) || 1;
      }
    },
    nextQuestion() {
      this.answered = false;
      this.currentIndex++;
    },
  },
  watch: {
    selectedTopic(newVal) {
      if (newVal) {
        this.fetchQuestions();
        this.currentIndex = 0;
        this.score = 0;
        this.answered = false;
        this.studentAnswers = {};
        this.feedback = {};
      }
    },
    filteredQuestions() {
      this.currentIndex = 0;
      this.score = 0;
      this.earnedMarks = 0;
      this.answered = false;
      this.studentAnswers = {};
      this.feedback = {};
    },
  },
};
</script>

  <style scoped>
/* Enhanced Header & Meta Badges */
.enhanced-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
}
.question-meta-group {
  display: flex;
  align-items: center;
  gap: 1.2em;
}
.meta-badges {
  display: flex;
  gap: 0.7em;
}
/* Enhanced Options */
.enhanced-options {
  margin-top: 1.2em;
  margin-bottom: 1.2em;
}
.mcq-option-row {
  display: flex;
  align-items: center;
  gap: 0.7em;
  padding: 0.5em 0;
  cursor: pointer;
  border-radius: 7px;
  transition: background 0.2s, border-color 0.2s;
  border: 2px solid transparent;
}
.selected-option {
  background: #eef2ff;
  border-left: 3px solid #6366f1;
  border: 2px solid #6366f1;
  box-shadow: 0 2px 8px rgba(99,102,241,0.07);
}
.mcq-option-input {
  flex: 1;
  font-size: 1.08em;
  padding: 0.7em 1em;
  background: #fff;
  border-radius: 7px;
  border: 1px solid #e5e7eb;
  transition: border 0.2s;
}
.selected-option .mcq-option-input {
  border: 1.5px solid #6366f1;
  background: #f3f4fd;
}
/* Enhanced Bottom Bar & Buttons */
.enhanced-bottom-bar {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1em;
  margin-top: 1.5em;
}
.button-group {
  display: flex;
  gap: 1.2em;
  justify-content: center;
  margin-top: 0.5em;
}
.enhanced-feedback {
  font-size: 1.1em;
  font-weight: 700;
  margin-bottom: 0.5em;
  margin-top: 0.2em;
  text-align: center;
}
.enhanced-end-msg {
  font-size: 1.15em;
  font-weight: 700;
  color: #10b981;
  margin-top: 1em;
  display: flex;
  align-items: center;
  gap: 0.5em;
}
.end-icon {
  font-size: 1.3em;
  color: #10b981;
}
@media (max-width: 768px) {
  .enhanced-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.7em;
  }
  .button-group {
    flex-direction: column;
    gap: 0.7em;
    width: 100%;
  }
  .enhanced-bottom-bar {
    align-items: stretch;
  }
}
/* Progress Bar Styles */
.progress-bar-container {
  margin-bottom: 2em;
  display: flex;
  align-items: center;
  gap: 2em;
  flex-wrap: wrap;
}
.progress-label, .score-label {
  font-weight: 600;
  color: #6366f1;
}
.progress-bar {
  flex: 1;
  height: 12px;
  background: #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  min-width: 120px;
}
.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #6366f1 0%, #60a5fa 100%);
  border-radius: 8px;
  transition: width 0.3s;
}
/* Enhanced Card Styles */
.enhanced-card {
  box-shadow: 0 8px 32px rgba(99,102,241,0.13), 0 2px 8px rgba(99,102,241,0.10);
  border-left: 4px solid #6366f1;
  padding: 2em 2em 1.5em 2em;
  margin-bottom: 2em;
  animation: fadeIn 0.4s;
}
.selected-option {
  background: #eef2ff;
  border-left: 3px solid #6366f1;
  transition: background 0.2s, border-color 0.2s;
}
.next-btn {
  background: linear-gradient(90deg, #10b981 0%, #22d3ee 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 0.6em 1.3em;
  font-size: 1em;
  font-weight: 600;
  cursor: pointer;
  margin-left: 1em;
  box-shadow: 0 2px 10px rgba(16,185,129,0.10);
  transition: all 0.2s;
}
.next-btn:hover {
  background: linear-gradient(90deg, #059669 0%, #0ea5e9 100%);
  box-shadow: 0 6px 24px rgba(16,185,129,0.13);
  transform: translateY(-2px) scale(1.02);
}
.end-msg {
  font-weight: 700;
  color: #10b981;
  margin-left: 1em;
  font-size: 1.1em;
}
/* Feedback Animation */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.4s;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}
.practice-questions {
  max-width: 100%;
  margin: 0 auto;
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 6px 32px rgba(60,72,88,0.13), 0 1.5px 4px rgba(60,72,88,0.10);
  padding: 2em;
  border: 1.5px solid #e5e7eb;
}
.section-title {
  font-size: 1.6em;
  font-weight: 700;
  color: #374151;
  margin: 0 0 1em 0;
  padding-bottom: 0.5em;
  border-bottom: 2px solid #f3f4f6;
}
.filter-section {
  max-width: 100%;
  background: #f9fafb;
  border-radius: 10px;
  padding: 1.5em;
  margin-bottom: 2em;
  border: 1px solid #e5e7eb;
}
.select-wrapper {
  position: relative;
  width: 100%;
}
.select-wrapper select {
  appearance: none;
  width: 100%;
  padding: 0.8em 1em;
  border: 1.5px solid #d1d5db;
  border-radius: 8px;
  background: #f8fafc;
  font-size: 1em;
  cursor: pointer;
  transition: all 0.2s;
}
.select-wrapper select:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99,102,241,0.2);
  outline: none;
  background: #fff;
}
.select-arrow {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 6px solid #6b7280;
  pointer-events: none;
}
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3em 0;
  gap: 1em;
}
.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(99,102,241,0.2);
  border-radius: 50%;
  border-top-color: #6366f1;
  animation: spin 1s linear infinite;
}
.loading-text {
  color: #6366f1;
  font-weight: 500;
  font-size: 1.1em;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3em 0;
  gap: 1.5em;
  color: #6b7280;
  text-align: center;
}
.empty-state p {
  font-size: 1.1em;
  margin: 0;
}
.questions-container {
  max-width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.5em;
}
.question-card {
  max-width: 100%;
  margin-bottom: 0.5em;
  transition: transform 0.2s, box-shadow 0.2s;
  position: relative;
  overflow: hidden;
  border-left: 3px solid transparent;
}
.question-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 0.8em;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 1em;
}
.question-id {
  font-size: 0.9em;
  font-weight: 600;
  color: #6b7280;
  background: #f3f4f6;
  padding: 0.3em 0.6em;
  border-radius: 4px;
}
.question-badges {
  display: flex;
  align-items: center;
  gap: 0.5em;
}
.question-type-badge {
  font-size: 0.8em;
  font-weight: 600;
  color: #4b5563;
  background: #f3f4f6;
  padding: 0.3em 0.7em;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
}
.math-badge {
  color: #5b21b6;
  background: #ede9fe;
  border-color: #c4b5fd;
}
.grade-badge-container {
  display: flex;
}
.grade-badge {
  display: inline-block;
  padding: 0.2em 0.5em;
  font-size: 0.7em;
  font-weight: 500;
  line-height: 1;
  color: #5b21b6;
  background-color: #f5f3ff;
  border: 1px solid #ddd6fe;
  border-radius: 9999px;
}
.question-image {
  max-width: 180px;
  max-height: 120px;
  margin-left: 1em;
  border-radius: 7px;
  border: 1px solid #e5e7eb;
  object-fit: contain;
}
  .mcq-option-row {
    display: flex;
    align-items: center;
    gap: 0.7em;
    padding: 0.5em 0;
    cursor: pointer;
    border-radius: 7px;
    transition: background 0.2s, border-color 0.2s;
  }
.mcq-option-check input[type="radio"] {
  accent-color: #6366f1;
  width: 1.1em;
  height: 1.1em;
}
.short-answer-input {
  width: 100%;
  padding: 0.6em 1em;
  border: 1px solid #d1d5db;
  border-radius: 7px;
  font-size: 1em;
  background: #f8fafc;
}
.mcq-bottom-bar {
  display: flex;
  align-items: center;
  gap: 1em;
  margin-top: 1em;
}
.submit-btn {
  background: linear-gradient(90deg, #6366f1 0%, #60a5fa 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 0.6em 1.3em;
  font-size: 1em;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(99,102,241,0.10);
  transition: all 0.2s;
}
.submit-btn:hover {
  background: linear-gradient(90deg, #4f46e5 0%, #2563eb 100%);
  box-shadow: 0 6px 24px rgba(99,102,241,0.13);
  transform: translateY(-2px) scale(1.02);
}
.feedback-msg {
  font-size: 1em;
  font-weight: 600;
  margin-left: 1em;
}
.correct-feedback {
  color: #10b981;
}
.incorrect-feedback {
  color: #ef4444;
}
@media (max-width: 768px) {
  .practice-questions {
    padding: 1.5em 1em;
    border-radius: 12px;
  }
  .filter-section {
    padding: 1em;
  }
  .mcq-bottom-bar {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.7em;
  }
}
.marks-label {
  font-weight: 600;
  color: #10b981;
}
</style>