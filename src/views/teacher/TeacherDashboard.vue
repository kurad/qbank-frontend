<template>
  <div class="row g-3 mb-4">
    <!-- Statistics Cards -->
    <div class="row g-3 mb-4">
      <div class="col-md-3" v-for="card in cards" :key="card.title">
        <div :class="['card text-white h-100', card.bgClass]">
          <div class="card-body text-center">
            <h5 class="card-title">{{ card.title }}</h5>
            <p class="card-text fs-3 fw-bold">{{ card.value }}</p>
          </div>
        </div>
      </div>
    </div>

    
    <!-- Toast container -->
    <div class="position-fixed bottom-0 end-0 p-3" style="z-index: 1100">
      <div
        id="liveToast"
        class="toast align-items-center text-white bg-success border-0"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        ref="toast"
      >
        <div class="d-flex">
          <div class="toast-body">
            {{ toastMessage }}
          </div>
          <button
            type="button"
            class="btn-close btn-close-white me-2 m-auto"
            data-bs-dismiss="toast"
            aria-label="Close"
          ></button>
        </div>
      </div>
    </div>
    <!-- Drill-down Card (Grade ->Subjects -> Topics) -->

    <div class="col-12">
      <div class="card h-100 shadow-sm">
        <div class="card-header bg-info text-white text-center">
          <h5 class="mb-0">Check if topics for your subject are recorded</h5>
        </div>
        <div class="card-body">
          <div class="row">
            <!-- Grade Levels -->
            <div class="col-md-4 border-end">
              <h6 class="fw-bold">Select a Grade</h6>
              <ul class="list-group">
                <li v-if="loadingGrades" class="list-group-item text-muted">
                  Loading...
                </li>
                <li
                  v-for="grade in gradeLevels"
                  :key="grade.id"
                  class="list-group-item list-group-item-action"
                  style="cursor: pointer"
                  :class="{ active: grade.id === selectedGrade }"
                  @click="selectGrade(grade.id)"
                >
                  {{ grade.grade_name }}
                </li>
              </ul>
            </div>

            <!-- Subjects -->
            <div class="col-md-3 border-end" v-if="selectedGrade">
              <h6 class="fw-bold">Subjects</h6>

              <ul class="list-group">
                <li v-if="loadingSubjects" class="list-group-item text-muted">
                  Loading...
                </li>
                <li
                  v-else-if="subjects.length === 0"
                  class="list-group-item text-muted"
                >
                  No Subjects for this Grade
                </li>
                <li
                  v-for="subject in subjects"
                  :key="subject.id"
                  class="list-group-item list-group-item-action"
                  style="cursor: pointer"
                  :class="{ active: subject.id === selectedSubject }"
                  @click="selectSubject(subject.id)"
                >
                  {{ subject.name }}
                </li>
              </ul>
            </div>

            <!-- Topics -->
            <div class="col-md-5" v-if="selectedSubject">
              <h6 class="fw-bold">Units</h6>
              <!-- Add Topic -->
              <div class="input-group mb-2">
                <input
                  type="text"
                  class="form-control"
                  placeholder="New Unit Name"
                  v-model="newTopicName"
                  @keyup.enter="addTopic"
                />
                <button
                  class="btn btn-primary"
                  :disabled="loadingAddTopic || !newTopicName"
                  @click="addTopic"
                >
                  <span
                    v-if="loadingAddTopic"
                    class="spinner-border spinner-border-sm"
                  ></span>
                  Add
                </button>
              </div>
              <ul class="list-group">
                <li v-if="loadingTopics" class="list-group-item text-muted">
                  Loading...
                </li>
                <li
                  v-else-if="paginatedTopics.length === 0"
                  class="list-group-item text-muted"
                >
                  No Units for this Subject
                </li>
                <li
                  v-for="topic in paginatedTopics"
                  :key="topic.id"
                  class="list-group-item d-flex justify-content-between align-items-center"
                  style="font-size: small"
                >
                  <div v-if="!topic.editing">
                    {{ topic.topic_name }}
                  </div>
                  <div v-else class="flex-grow-1 me-2">
                    <input
                      type="text"
                      class="form-control form-control-sm"
                      v-model="topic.tempName"
                      @keyup.enter="updateTopic(topic)"
                    />
                  </div>
                  <div>
                    <button
                      v-if="!topic.editing"
                      class="btn btn-sm btn-outline-primary rounded-circle me-1"
                      title="Edit"
                      @click="enableEdit(topic)"
                    >
                      <i class="bi bi-pencil-fill"></i>
                    </button>
                    <button
                      v-if="topic.editing"
                      class="btn btn-sm btn-success rounded-circle me-1"
                      :disabled="loadingUpdateTopic"
                      title="Save"
                      @click="updateTopic(topic)"
                    >
                      <span
                        v-if="loadingUpdateTopic"
                        class="spinner-border spinner-border-sm"
                      ></span>
                      <i v-else class="bi bi-check-lg"></i>
                    </button>
                    <button
                      v-if="topic.editing"
                      class="btn btn-sm btn-danger rounded-circle me-1"
                      title="Cancel"
                      @click="cancelEdit(topic)"
                    >
                      <i class="bi bi-x-lg"></i>
                    </button>
                    <button
                      v-if="!topic.editing"
                      class="btn btn-sm btn-outline-danger rounded-circle"
                      title="Delete Topic"
                      :disabled="topic.question_count > 0"
                      @click="deleteTopic(topic)"
                    >
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                </li>
              </ul>
              <!-- Pagination Controls -->
              <nav aria-label="Page navigation">
                <ul class="pagination justify-content-center">
                  <li
                    class="page-item"
                    :class="{ disabled: currentPage === 1 }"
                  >
                    <a
                      class="page-link"
                      @click="currentPage--"
                      :disabled="currentPage === 1"
                      >Previous</a
                    >
                  </li>
                  <li
                    class="page-item"
                    v-for="page in totalPages"
                    :key="page"
                    :class="{ active: currentPage === page }"
                  >
                    <a class="page-link" @click="currentPage = page">{{
                      page
                    }}</a>
                  </li>
                  <li
                    class="page-item"
                    :class="{ disabled: currentPage === totalPages }"
                  >
                    <a
                      class="page-link"
                      @click="currentPage++"
                      :disabled="currentPage === totalPages"
                      >Next</a
                    >
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- Questions Summary Chart -->
    <div class="row mb-4 mt-4">
      <div class="col-12">
        <QuestionsSummaryChart
          :summary="questionsSummary"
          title="Questions per Subject by Grade"
          :stacked="false"
        />
      </div>
    </div>

    <!-- Questions Section -->
    <div class="card shadow-sm mb-4">
      <UserQuestions />
    </div>
  </div>
  
</template>
<script>
import UserQuestions from "@/components/questions/UserQuestions.vue";
import axios from "axios";
import { Chart, registerables } from "chart.js";
Chart.register(...registerables);
import QuestionsSummaryChart from "@/components/charts/QuestionsSummaryChart.vue";

export default {
  name: "StudentDashboard",
  components: { UserQuestions, QuestionsSummaryChart },
  data() {
    return {
      totalAssessments: 0,
      totalStudents: 0,
      totalQuestions: 0,
      totalPractices: 0,
      recentScores: [],
      subjectPerformance: [],
      assessmentCompletion: { completed: 0, pending: 0 },
      newTopicName: "",
      loadingAddTopic: false,

      newSubjectName: "",
      loadingAddSubject: false,

      toastMessage: "",

      gradeLevels: [],
      subjects: [],
      topics: [],
      selectedGrade: null,
      selectedSubject: null,

      loadingGrades: false,
      loadingSubjects: false,
      loadingTopics: false,

      loadingUpdateTopic: false,

      currentPage: 1,
      itemsPerPage: 5,
      totalTopics: 0,

      // Questions section
      questions: [],
      newQuestion: "",
      loadingQuestions: false,
      loadingAddQuestion: false,
      loadingUpdateQuestion: false,

      // Chart input: populate this from your API response
      // Expected shape: [{ subject_id, subject_name, grade_id, grade_name, questions_count }]
      questionsSummary: []
    };
  },
  computed: {
    cards() {
      return [
        {
          title: "Total Assessments",
          value: this.totalAssessments,
          bgClass: "bg-primary",
        },
        {
          title: "Total Questions",
          value: this.totalQuestions,
          bgClass: "bg-success",
        },
        {
          title: "Total Practices",
          value: this.totalPractices,
          bgClass: "bg-warning",
        },
        {
          title: "Total Students",
          value: this.totalStudents,
          bgClass: "bg-danger",
        },
      ];
    },
    paginatedTopics() {
      return this.topics;
    },
    totalPages() {
      return Math.ceil(this.totalTopics / this.itemsPerPage);
    },
  },
  methods: {
    showToast(message, type = "success") {
      this.toastMessage = message;

      const toastEl = this.$refs.toast;
      toastEl.classList.remove("bg-success", "bg-danger", "bg-warning");
      toastEl.classList.add(type === "success" ? "bg-success" : "bg-danger");
      const toast = new bootstrap.Toast(toastEl);
      toast.show();
    },
    
    async fetchStatistics() {
      try {
        const token = localStorage.getItem("auth_token");
        const res = await axios.get("/student/statistics", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = res.data;

        this.totalAssessments = data.totalAssessments || 0;
        this.totalStudents = data.totalStudents || 0;
        this.totalQuestions = data.totalQuestions || 0;
        this.totalPractices = data.totalPractices || 0;
        this.assessmentCompletion = {
          completed: data.completedAssessments || 0,
          pending: data.pendingAssessments || 0,
        };

        this.subjectPerformance = data.subjectPerformance || [];
        this.recentScores = data.recentScores || [];

        this.initCharts();
      } catch (err) {
        console.error("Error fetching statistics:", err);
      }
    },
    async fetchQuestionsSummary() {
      try {
        const token = localStorage.getItem("auth_token");
        const res = await axios.get("/reports/questions-per-subject", {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Accept either an array directly or { data: [...] }
        const payload = res.data;
        this.questionsSummary = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
          ? payload.data
          : [];
      } catch (err) {
        console.error("Error fetching questions summary:", err);
      }
    },

    // Restored methods
    enableEdit(topic) {
      topic.editing = true;
      topic.tempName = topic.topic_name;
    },

    cancelEdit(topic) {
      topic.editing = false;
      topic.tempName = topic.topic_name;
    },

    async fetchGrades() {
      this.loadingGrades = true;
      try {
        const token = localStorage.getItem("auth_token");
        const res = await axios.get("/grade-levels", {
          headers: { Authorization: `Bearer ${token}` },
        });
        this.gradeLevels = res.data || [];
      } catch (err) {
        console.error("Error fetching grades:", err);
      } finally {
        this.loadingGrades = false;
      }
    },

    // When grade selected → fetch subjects
    async selectGrade(gradeId) {
      this.selectedGrade = gradeId;
      this.selectedSubject = null;
      this.subjects = [];
      this.topics = [];

      this.loadingSubjects = true;
      try {
        const token = localStorage.getItem("auth_token");
        const res = await axios.get(`/grade-levels/${gradeId}/subjects`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        this.subjects = res.data || [];
      } catch (err) {
        console.error("Error fetching subjects:", err);
      } finally {
        this.loadingSubjects = false;
      }
    },

    // When subject selected → fetch topics
    async selectSubject(subjectId) {
      this.selectedSubject = subjectId;
      this.topics = [];

      this.currentPage = 1;

      this.loadingTopics = true;
      try {
        const token = localStorage.getItem("auth_token");
        const res = await axios.get(
          `/subjects/${this.selectedSubject}/grades/${this.selectedGrade}/topics`,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: {
              page: this.currentPage,
              limit: this.itemsPerPage,
            },
          }
        );
        this.topics = res.data.data;
        this.totalTopics = res.data.total || 0;
      } catch (err) {
        console.error("Error fetching topics:", err);
      } finally {
        this.loadingTopics = false;
      }
    },

    async addTopic() {
      if (!this.newTopicName || !this.selectedSubject || !this.selectedGrade)
        return;
      this.loadingAddTopic = true;
      try {
        const token = localStorage.getItem("auth_token");
        const res = await axios.post(
          "/topics",
          {
            grade_level_id: this.selectedGrade,
            subject_id: this.selectedSubject,
            topic_name: this.newTopicName,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        this.topics.push(res.data.data);
        this.newTopicName = "";
      } catch (err) {
        console.error("Error adding topic:", err);
      } finally {
        this.loadingAddTopic = false;
      }
    },

    async updateTopic(topic) {
      if (!topic.tempName || topic.tempName === topic.topic_name) {
        topic.editing = false;
        return;
      }
      this.loadingUpdateTopic = true;
      try {
        const token = localStorage.getItem("auth_token");
        const res = await axios.put(
          `/topics/${topic.id}`,
          { topic_name: topic.tempName },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        topic.topic_name = res.data.data.topic_name;
        topic.editing = false;
        this.showToast("Topic updated successfully ✅", "success");
      } catch (err) {
        console.error("Error updating topic:", err);
        this.showToast("Failed to update topic ❌", "danger");
      } finally {
        this.loadingUpdateTopic = false;
      }
    },

    async deleteTopic(topic) {
      if (topic.question_count > 0) {
        this.showToast("Cannot delete: Topic has questions.", "danger");
        return;
      }
      if (!confirm("Are you sure you want to delete this topic?")) return;
      try {
        const token = localStorage.getItem("auth_token");
        await axios.delete(`/topics/${topic.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        this.topics = this.topics.filter(t => t.id !== topic.id);
        this.showToast("Topic deleted successfully!", "success");
      } catch (err) {
        this.showToast("Failed to delete topic.", "danger");
        console.error("Error deleting topic:", err);
      }
    },

    formatDate(dateString) {
      if (!dateString) return "N/A";
      return new Date(dateString).toLocaleDateString();
    },

    initCharts() {
      // Assessment Completion Pie
      const el1 = document.getElementById("completionChart");
      if (el1) {
        const ctx1 = el1.getContext("2d");
        new Chart(ctx1, {
          type: "doughnut",
          data: {
            labels: ["Completed", "Pending"],
            datasets: [
              {
                data: [
                  this.assessmentCompletion.completed,
                  this.assessmentCompletion.pending,
                ],
                backgroundColor: ["#198754", "#ffc107"],
              },
            ],
          },
          options: {
            responsive: true,
            plugins: { legend: { position: "bottom" } },
          },
        });
      }

      // Subject Performance Bar
      const el2 = document.getElementById("subjectChart");
      if (el2) {
        const ctx2 = el2.getContext("2d");
        new Chart(ctx2, {
          type: "bar",
          data: {
            labels: this.subjectPerformance.map((s) => s.subject),
            datasets: [
              {
                label: "Average Score",
                data: this.subjectPerformance.map((s) => s.avgScore),
                backgroundColor: "#0d6efd",
              },
            ],
          },
          options: {
            responsive: true,
            scales: { y: { beginAtZero: true, max: 100 } },
          },
        });
      }
    },

  },
  mounted() {
    this.fetchStatistics();
    this.fetchGrades();
    this.fetchQuestionsSummary();
  },
  watch: {
    currentPage(newPage) {
      if (this.selectedSubject) {
        this.selectSubject(this.selectedSubject);
      }
    },
  },
};
</script>
