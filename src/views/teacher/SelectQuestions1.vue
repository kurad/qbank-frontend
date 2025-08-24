<template>
  <div class="select-questions-root d-flex flex-column h-100 w-100 animated-fade">
    <div class="d-flex align-items-center mb-4 page-header">
      <span class="display-6 me-3 text-primary"><i class="bi bi-list-check"></i></span>
      <h2 class="mb-0 fw-bold">Select Questions for the Assessment</h2>
    </div>
    <div v-if="loading" class="text-center my-5">
      <div class="spinner-border text-primary" role="status"></div>
    </div>
    <div v-else>
      <div class="row mb-4 g-4 filter-bar">
        <div class="col-md-4">
          <label class="form-label fw-semibold">Subject</label>
          <select class="form-select form-select-lg shadow-sm" v-model="selectedSubject" @change="onSubjectChange" :disabled="!!assessment">
            <option v-if="!assessment" value="">Select Subject</option>
            <option v-for="subject in subjects" :key="subject.id" :value="subject.id" :selected="assessment && subject.id === assessment.subject_id">
              {{ subject.name }}
            </option>
          </select>
          <div v-if="assessment" class="form-text text-muted small">Subject is locked to the assessment's subject</div>
        </div>
        <div class="col-md-4">
          <label class="form-label fw-semibold">Grade Level</label>
          <select class="form-select form-select-lg shadow-sm" v-model="selectedGrade" @change="onGradeChange" :disabled="!selectedSubject">
            <option value="">Select Grade</option>
            <option v-for="grade in gradeLevels" :key="grade.id" :value="grade.id">
              {{ grade.grade_name }}
            </option>
          </select>
        </div>
        <div class="col-md-4">
          <label class="form-label fw-semibold">Topic</label>
          <select class="form-select form-select-lg shadow-sm" v-model="selectedTopic" :disabled="!selectedGrade">
            <option value="">All Topics</option>
            <option v-for="topic in topics" :key="topic.id" :value="topic.id">
              {{ topic.topic_name }}
            </option>
          </select>
        </div>
      <!-- // Remove automatic fetching on dropdown change. User must click to load questions. -->
      <div class="col-12 mt-3">
        <div class="input-group input-group-lg">
          <button class="btn btn-primary px-4" :disabled="!selectedSubject || !selectedGrade" @click="fetchQuestions">
            <i class="bi bi-search me-1"></i> Load Questions
          </button>
        </div>
      </div>
      </div>
      <div class="flex-grow-1 d-flex flex-column">
        <div v-if="filteredQuestions.length === 0" class="alert alert-info text-center flex-grow-1 d-flex align-items-center justify-content-center">
          <div class="w-100">No questions found for this subject/grade.</div>
        </div>
        <div v-else class="question-list flex-grow-1 mb-4">
          <div v-for="q in filteredQuestions" :key="q.id" class="list-group-item d-flex align-items-center justify-content-between question-item">
            <div>
              <!-- <div class="fw-semibold">{{ q.question }}</div> -->
              <span v-html="q.question" ></span>
              <div v-if="q.question_image_url" class="my-2">
                <img :src="q.question_image_url" alt="Question Image" class="img-thumbnail" style="max-width:180px;max-height:120px;cursor:pointer;" @click="expandImage(q.question_image_url)" />
              </div>
              <!-- <div class="text-muted small">Topic: {{ q.topic_name }}</div> -->
              <div class="mt-1">
                <template v-if="q.question_type === 'true_false'">
                    <span
                    :class="['badge', 'rounded-pill', 'me-1', 'option-badge', q.correct_answer === 'True' ? 'option-correct' : 'bg-secondary']">
                    True
                    </span>
                    <span
                    :class="['badge', 'rounded-pill', 'me-1', 'option-badge', q.correct_answer === 'False' ? 'option-correct' : 'bg-secondary']">
                    False
                    </span>
                </template>
                <template v-else-if="q.options && q.options.length">
                    <span v-for="(opt, idx) in q.options" :key="idx"
                    :class="['badge', 'rounded-pill', 'me-1', 'option-badge',
                        opt === q.correct_answer ? 'option-correct' : 'bg-secondary']">
                        <template v-if="q.is_math">
                          <span>{{ String.fromCharCode(65 + idx) }}.</span>
                          <math-field
                            :read-only="true"
                            :value="opt"
                            style="font-size: 1em;"
                            ></math-field>
                        </template>
                        <template v-else>
                          {{ String.fromCharCode(65 + idx) }}. {{  opt }}
                        </template>
                    </span>
                </template>
            </div>
            </div>
            <div>
              <input type="checkbox" v-model="selectedIds" :value="q.id" class="form-check-input" />
            </div>
          </div>
        </div>

        <div v-if="selectedIds.length > 0" class="mb-4 review-section">
          <h5 class="fw-bold mb-3 gradient-title">Review Selected Questions</h5>
          <div class="list-group">
            <div v-for="q in selectedQuestions" :key="q.id" class="list-group-item d-flex align-items-center justify-content-between bg-light review-item">
            <div class="w-100">
              <!-- <div class="fw-semibold">{{ q.question }}</div> -->
              <span v-html="q.question" ></span>
              <div v-if="q.question_image_url" class="my-2">
                <img :src="q.question_image_url" alt="Question Image" class="img-thumbnail" style="max-width:180px;max-height:120px;cursor:pointer;" @click="expandImage(q.question_image_url)" />
              </div>
  <!-- Expandable Image Modal -->
            <div v-if="expandedImageUrl" class="image-modal-overlay" @click.self="closeImageModal">
              <div class="image-modal-content">
                <button class="btn btn-close btn-lg position-absolute top-0 end-0 m-3" @click="closeImageModal" aria-label="Close"></button>
                <img :src="expandedImageUrl" alt="Expanded Question Image" class="img-fluid rounded shadow" style="max-width:90vw;max-height:80vh;display:block;margin:auto;" />
              </div>
            </div>
              <!-- <div class="text-muted small">Topic: {{ q.topic_name }}</div> -->
              <div class="mt-1">
              <template v-if="q.question_type === 'true_false'">
                  <span
                  :class="['badge', 'rounded-pill', 'me-1', 'option-badge', q.correct_answer === 'True' ? 'option-correct' : 'bg-secondary']">
                  True
                  </span>
                  <span
                  :class="['badge', 'rounded-pill', 'me-1', 'option-badge', q.correct_answer === 'False' ? 'option-correct' : 'bg-secondary']">
                  False
                  </span>
              </template>
              <template v-else-if="q.options && q.options.length">
                  <span v-for="(opt, idx) in q.options" :key="idx"
                  :class="['badge', 'rounded-pill', 'me-1', 'option-badge',
                      opt === q.correct_answer ? 'option-correct' : 'bg-secondary']">
                  <template v-if="q.is_math">
                    {{ String.fromCharCode(65 + idx) }}.
                    <math-field
                      :value="opt"
                      :read-only="true"
                      style="font-size: 1em;"
                    ></math-field>
                  </template>
                  <template v-else>
                    {{ String.fromCharCode(65 + idx) }}. {{  opt }}
                  </template>
                  </span>
              </template>
            </div>
            </div>
              <button class="btn btn-sm btn-outline-danger ms-3" @click="removeSelected(q.id)"><i class="bi bi-x-lg"></i> Remove</button>
            </div>
          </div>
        </div>

        <div v-if="selectedIds.length > 0" class="d-flex justify-content-end mt-auto">
          <button class="btn btn-gradient btn-lg px-4 shadow-sm" :disabled="saving" @click="saveSelection">
            <span v-if="saving"><span class="spinner-border spinner-border-sm me-2"></span>Saving...</span>
            <span v-else><i class="bi bi-check2-circle me-2"></i>Save Selection</span>
          </button>
        </div>
      </div>
      <div v-if="message" class="mt-4 alert text-center" :class="{'alert-success': success, 'alert-danger': !success}">
        {{ message }}
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
export default {
  // No props needed, use route param instead
  data() {
    return {
      questions: [],
      subjects: [],
      gradeLevels: [],
      topics: [],
      selectedSubject: '',
      selectedGrade: '',
      selectedTopic: '',
      search: '',
      selectedIds: [],
      loading: false,
      loadingTopics: false,
      saving: false,
      message: '',
      success: false,
      assessment: null,
      isInitialized: false,
      expandedImageUrl: null
    };
  },
  computed: {
    filteredQuestions() {
      let qs = this.questions;
      if (this.selectedTopic) {
        qs = qs.filter(q => q.topic_id === this.selectedTopic);
      }
      if (this.search) {
        const s = this.search.toLowerCase();
        qs = qs.filter(q => (q.question || '').toLowerCase().includes(s));
      }
      return qs;
    },
    selectedQuestions() {
      // Return the full question objects for selectedIds, in selection order
      return this.selectedIds.map(id => this.questions.find(q => q.id === id)).filter(Boolean);
    }
  },
  async mounted() {
    await this.fetchSubjects();
    await this.fetchAssessmentDetails();
  },
  // No automatic fetching on dropdown change. User must click to load questions.
  methods: {
    expandImage(url) {
      this.expandedImageUrl = url;
    },
    closeImageModal() {
      this.expandedImageUrl = null;
    },
    async fetchAssessmentDetails() {
      try {
        this.loading = true;
        const token = localStorage.getItem('auth_token');
        const id = this.$route.params.id;
        // Fetch assessment details
        const response = await axios.get(`/assessments/${id}/details`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        this.assessment = response.data.assessment;
        this.selectedSubject = this.assessment.subject_id;
        // Load grade levels for the subject, but don't reset grade if initializing
        await this.onSubjectChange(true);
        this.selectedGrade = this.assessment.grade_level_id;
        // Load topics for the grade
        await this.onGradeChange();
        // Use questions from assessment details
        let existingQuestions = (this.assessment.questions || []).map(q => q.question);
        if (!Array.isArray(existingQuestions)) existingQuestions = [];
        // Store their IDs for pre-selection
        this.selectedIds = existingQuestions.map(q => q.id);
        // Load questions for the subject and grade
        await this.fetchQuestions();
        // Merge existing questions into the main question list if not already present
        const existingIds = new Set(this.questions.map(q => q.id));
        const merged = [...this.questions];
        for (const q of existingQuestions) {
          if (!existingIds.has(q.id)) {
            let options = q.options;
            if (typeof options === 'string') {
              try {
                options = JSON.parse(options);
              } catch (e) {
                options = [];
              }
            }
            merged.push({ ...q, options, topic_name: q.topic?.name || 'N/A', topic_id: q.topic_id });
          }
        }
        this.questions = merged;
      } catch (error) {
        console.error('Error fetching assessment details:', error);
      } finally {
        this.loading = false;
      }
    },
    removeSelected(id) {
      this.selectedIds = this.selectedIds.filter(qid => qid !== id);
    },
    async fetchSubjects() {
      this.loading = true;
      this.subjects = [];
      this.gradeLevels = [];
      this.topics = [];
      this.questions = [];
      this.selectedSubject = '';
      this.selectedGrade = '';
      this.selectedTopic = '';
      this.message = '';
      try {
        const res = await axios.get('/subjects');
        this.subjects = res.data;
      } finally {
        this.loading = false;
      }
    },
    async onSubjectChange() {
      // Accept a flag to skip resetting grade/questions if initializing from assessment
      const skipReset = arguments.length > 0 && arguments[0] === true;
      if (!skipReset) {
        this.selectedGrade = '';
        this.selectedTopic = '';
        this.questions = [];
        this.selectedIds = [];
      }
      if (!this.selectedSubject) {
        this.gradeLevels = [];
        return;
      }
      try {
        const token = localStorage.getItem('auth_token');
        const response = await axios.get(`/subjects/${this.selectedSubject}/grades`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        this.gradeLevels = response.data;
        // If we're initializing from an assessment, don't reset the grade level
        if (this.assessment && !this.isInitialized) {
          this.selectedGrade = this.assessment.grade_level_id;
          this.isInitialized = true;
        }
      } catch (error) {
        console.error('Error fetching grade levels:', error);
      }
    },
    async onGradeChange() {
      this.selectedTopic = '';
      this.topics = [];
      this.questions = [];
      if (!this.selectedSubject || !this.selectedGrade) return;
      this.loadingTopics = true;
      try {
        // Load topics for selected subject and grade (filtering by both)
        const tRes = await axios.get(`/topics?subject_id=${this.selectedSubject}&grade_level_id=${this.selectedGrade}`);
        // Filter topics to ensure both subject and grade match (in case backend returns extra)
        this.topics = tRes.data.filter(topic => topic.subject_id == this.selectedSubject);
      } finally {
        this.loadingTopics = false;
      }
    },
    async fetchQuestions() {
      this.loading = true;
      this.message = '';
      try {
        let qRes;
        if (this.selectedTopic) {
          qRes = await axios.get(`/topics/${this.selectedTopic}/questions`, {
            params: { subject_id: this.selectedSubject, grade_level_id: this.selectedGrade }
          });
        } else if (this.selectedSubject && this.selectedGrade) {
          // Use POST since GET is not supported for /questions
          qRes = await axios.post(`/questions`, {
            subject_id: this.selectedSubject,
            grade_level_id: this.selectedGrade
          });
        } else {
          this.questions = [];
          return;
        }
        // Merge new questions with existing, avoiding duplicates
        const newQuestions = qRes.data.map(q => ({ ...q, topic_name: q.topic?.name || 'N/A', topic_id: q.topic_id }));
        const existingIds = new Set(this.questions.map(q => q.id));
        // Only add new questions not already present
        this.questions = [...this.questions, ...newQuestions.filter(q => !existingIds.has(q.id))];
      } catch (e) {
        this.questions = [];
        this.message = 'Failed to load questions.';
        this.success = false;
      } finally {
        this.loading = false;
      }
    },
    async saveSelection() {
      this.saving = true;
      this.message = '';
      const { id } = this.$route.params;
      const token = localStorage.getItem('auth_token');
      try {
        await axios.post(`/assessments/${id}/questions`, { assessment_id: id, question_ids: this.selectedIds }, { headers: { Authorization: `Bearer ${token}` } });
        this.success = true;
        this.message = 'Questions added to assessment!';
        // Redirect to assessment list after short delay
        setTimeout(() => {
          this.$router.push({ name: 'AssessmentList' });
        }, 1200);
      } catch (e) {
        this.success = false;
        this.message = e.response?.data?.message || 'Failed to save selection.';
      } finally {
        this.saving = false;
      }
    }
  }
};
</script>

<style scoped>

.select-questions-root {
  min-height: 100vh;
  width: 100vw;
  background: linear-gradient(120deg, #f0f4ff 0%, #e0e7ff 100%);
  padding: 0;
  margin: 0;
  box-sizing: border-box;
}
.page-header {
  padding: 2.5em 2em 1.5em 2em;
  background: linear-gradient(90deg, #6366f1 0%, #60a5fa 100%);
  border-radius: 0 0 1.5em 1.5em;
  color: #fff;
  box-shadow: 0 6px 32px rgba(60,72,88,0.10);
}
.gradient-title {
  background: linear-gradient(90deg, #6366f1 0%, #60a5fa 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-fill-color: transparent;
}
.filter-bar {
  background: #fff;
  border-radius: 1em;
  box-shadow: 0 2px 12px rgba(60,72,88,0.07);
  padding: 1.5em 1em 1em 1em;
  margin-bottom: 1.5em;
}
.question-list {
  background: #fff;
  border-radius: 1em;
  box-shadow: 0 2px 12px rgba(60,72,88,0.07);
  padding: 1.5em 1em 1em 1em;
  overflow-y: auto;
  min-height: 200px;
  max-height: 40vh;
}
.question-item {
  border: none;
  border-radius: 0.7em;
  margin-bottom: 0.5em;
  background: #f9fafb;
  transition: box-shadow 0.2s;
}
.question-item:hover {
  box-shadow: 0 2px 8px rgba(99,102,241,0.10);
}
.option-badge {
  font-size: 0.95em;
  font-weight: 500;
  background: #e0e7ff;
  color: #3730a3;
}
.option-correct {
  background: linear-gradient(90deg, #34d399 0%, #10b981 100%) !important;
  color: #fff !important;
  border: 1.5px solid #059669;
  box-shadow: 0 2px 8px rgba(16,185,129,0.10);
}
.review-section {
  background: #f3f4f6;
  border-radius: 1em;
  box-shadow: 0 2px 12px rgba(60,72,88,0.07);
  padding: 1.5em 1em 1em 1em;
}
.review-item {
  border: none;
  border-radius: 0.7em;
  margin-bottom: 0.5em;
  background: #e0e7ff;
  transition: box-shadow 0.2s;
}
.review-item:hover {
  box-shadow: 0 2px 8px rgba(99,102,241,0.10);
}
.btn-gradient {
  background: linear-gradient(90deg, #6366f1 0%, #60a5fa 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.2s;
}
.btn-gradient:hover {
  background: linear-gradient(90deg, #4f46e5 0%, #2563eb 100%);
  color: #fff;
  box-shadow: 0 6px 24px rgba(99,102,241,0.13);
  transform: translateY(-2px) scale(1.02);
}
.form-label {
  color: #374151;
}
.form-control-lg, .form-select-lg {
  font-size: 1.1em;
  padding: 0.75em 1em;
  border-radius: 0.7em;
}
.list-group-item {
  border: 1px solid #e5e7eb;
  border-radius: 0.6em;
  margin-bottom: 0.5em;
  background: #f9fafb;
}
</style>
