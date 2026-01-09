<template>
  <div class="container py-4">
    <div class="d-flex align-items-center justify-content-between mb-3">
      <button class="btn btn-link p-0" @click="$router.back()">← Back</button>
      <h2 class="h4 fw-semibold mb-0">
        {{ group?.group_name || "Group Details" }}
      </h2>
      <div></div>
    </div>

    <!-- Submissions Modal -->
    <div
      v-if="showSubmissionsModal"
      class="modal fade show d-block"
      tabindex="-1"
      style="background-color: rgba(0, 0, 0, 0.5)"
    >
      <div class="modal-dialog modal-lg modal-dialog-centered" style="max-width: 900px;">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Submissions — {{ selectedAssignment?.title }}</h5>
            <button type="button" class="btn-close" @click="closeSubmissions()"></button>
          </div>
          <div class="modal-body" style="max-height:60vh; overflow:auto;">
            <div v-if="loadingSubmissions" class="text-center py-4">
              <div class="spinner-border text-primary" role="status"></div>
            </div>

            <div v-else>
              <div v-if="submissions && submissions.length">
                <div class="row">
                  <div class="col-md-5 border-end" style="max-height:55vh; overflow:auto;">
                    <div class="list-group list-group-flush">
                      <button
                        v-for="s in submissions"
                        :key="s.student?.id || s.student_assessment?.id || s.id"
                        class="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                        :class="{ active: selectedSubmission && (selectedSubmission.student?.id === s.student?.id) }"
                        @click="viewSubmission(s)"
                      >
                        <div>
                          <div class="fw-semibold">{{ s.student?.name || s.student?.email || ('Student #' + (s.student?.id || '')) }}</div>
                          <div class="small text-muted">Submitted: {{ s.student_assessment?.completed_at || s.student_assessment?.created_at || '—' }}</div>
                        </div>
                        <div class="text-end">
                          <span :class="['badge', s.student_assessment?.status === 'graded' ? 'bg-success' : 'bg-secondary']">{{ s.student_assessment?.status || (s.student_assessment ? 'Submitted' : 'No Submission') }}</span>
                          <div class="small mt-1">Score: {{ s.student_assessment?.score ?? s.student_assessment?.points_earned ?? '—' }}</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  <div class="col-md-7" style="max-height:55vh; overflow:auto;">
                    <div v-if="selectedSubmission">
                      <div class="p-3">
                        <h5 class="mb-1">{{ selectedSubmission.student?.name || selectedSubmission.student?.email }}</h5>
                        <div class="small text-muted mb-2">Submitted: {{ selectedSubmission.student_assessment?.completed_at || selectedSubmission.student_assessment?.created_at || '—' }}</div>
                        <div class="mb-2">Status: <strong>{{ selectedSubmission.student_assessment?.status || '—' }}</strong></div>
                        <div class="mb-3">Score: <strong>{{ selectedSubmission.student_assessment?.score ?? '—' }}</strong></div>

                        <div v-if="selectedSubmission.student_assessment && selectedSubmission.student_assessment.answers && selectedSubmission.student_assessment.answers.length">
                          <h6>Answers</h6>
                          <ul class="list-group">
                            <li v-for="ans in selectedSubmission.student_assessment.answers" :key="ans.id" class="list-group-item">
                              <div class="small text-muted">Question: {{ getQuestionText(ans) }}</div>

                              <!-- Matching type -->
                              <div v-if="(ans.question_type === 'matching' || (ans.matching && ans.matching.pairs))">
                                <ul class="list-group mt-2">
                                  <li v-for="p in (buildMatchingDisplay(ans))" :key="p.left_index" class="list-group-item d-flex justify-content-between align-items-center">
                                    <div>
                                      <div class="fw-semibold">{{ p.left_text }}</div>
                                      <div class="small text-muted">Your: {{ p.student_right_text || 'No match' }}</div>
                                    </div>
                                    <div class="text-end small">
                                      <div :class="{ 'text-success': p.correct_right_text && p.student_right_text && p.correct_right_text === p.student_right_text, 'text-danger': p.correct_right_text && p.student_right_text && p.correct_right_text !== p.student_right_text }">
                                        Correct: {{ p.correct_right_text || '—' }}
                                      </div>
                                    </div>
                                  </li>
                                </ul>
                              </div>

                              <!-- Other types -->
                              <div v-else>
                                <div class="fw-semibold">{{ ans.answer || 'No Answer' }}</div>
                                <div class="small mt-1">Points: {{ ans.points_earned ?? '—' }} <span class="ms-2">Correct: {{ ans.is_correct ? 'Yes' : 'No' }}</span></div>
                              </div>
                            </li>
                          </ul>
                        </div>
                        <div v-else class="text-muted">No submission details available.</div>
                      </div>
                    </div>
                    <div v-else class="p-3 text-muted">Select a student on the left to view their submission.</div>
                  </div>
                </div>
              </div>
              <div v-else class="text-center text-muted">No submissions yet.</div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="closeSubmissions()">Close</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Removed fixed sidebar; details are shown inside the submissions modal as a right column -->

    <div v-if="loading" class="d-flex align-items-center text-muted">
      <div class="spinner-border spinner-border-sm me-2" role="status"></div>
      Loading group details...
    </div>

    <div v-else>
      <div class="mb-4">
        <div class="card">
          <div
            class="card-header bg-secondary text-white d-flex justify-content-between align-items-center"
          >
            <span
              >Students Enrolled
              <span class="badge bg-light text-dark ms-1">{{
                studentCount
              }}</span></span
            >
            <div class="btn-group btn-group-sm">
              <button
                class="btn btn-light"
                type="button"
                @click="showCodeModal = true"
              >
                Show Class Code
              </button>
              <button class="btn btn-success" type="button">
                Invite Students
              </button>
            </div>
          </div>
          <ul
            v-if="students && students.length"
            class="list-group list-group-flush"
          >
            <li
              v-for="s in students"
              :key="s.id"
              class="list-group-item d-flex justify-content-between align-items-center small"
            >
              <span>{{ s.name || s.full_name || "Student #" + s.id }}</span>
            </li>
          </ul>
          <div v-else class="card-body text-muted small">No students yet.</div>
        </div>
      </div>

      <div class="mb-4">
        <div class="card">
          <div
            class="card-header d-flex justify-content-between align-items-center"
          >
            <span class="fw-semibold">Assignments</span>
            <div class="btn-group btn-group-sm">
              
              <button
                class="btn btn-primary"
                type="button"
                @click="showAssignAssessmentModal = true"
              >
                Assign Assessment
              </button>
            </div>
          </div>
          <div v-if="assignments && assignments.length">
            <div v-for="a in assignments" :key="a.id" class="border-bottom p-3">
              <div class="fw-semibold">{{ a.title }}</div>
              <div class="text-muted small">
                Created by : {{ a.created_by || "—" }} | Modified by :
                {{ a.modified_by || "—" }}
                <span v-if="a.published">| Published</span>
              </div>
              <div class="mt-2 d-flex gap-2 flex-wrap">
                <span class="badge bg-warning text-dark"
                  >{{ a.stats?.not_submitted ?? 0 }} not submitted yet</span
                >
                <span class="badge bg-info text-dark"
                  >{{ a.stats?.pending ?? 0 }} pending for evaluation</span
                >
                <span class="badge bg-success"
                  >{{ a.stats?.submitted ?? 0 }} submission done</span
                >
                <button class="btn btn-sm btn-outline-secondary" @click="loadSubmissions(a)">View Submissions</button>
              </div>
            </div>
          </div>
          <div v-else class="card-body text-muted small">
            No assignments for this group.
          </div>
        </div>
      </div>
    </div>

    <!-- Class Code Modal -->
    <div
      v-if="showCodeModal"
      class="modal fade show d-block"
      tabindex="-1"
      style="background-color: rgba(0, 0, 0, 0.5)"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Class Code</h5>
            <button
              type="button"
              class="btn-close"
              @click="showCodeModal = false"
            ></button>
          </div>
          <div class="modal-body text-center">
            <p class="mb-3">
              Share this code with your students to join the group:
            </p>
            <div class="input-group mb-3">
              <input
                type="text"
                class="form-control text-center fw-bold fs-4"
                :value="group?.class_code || 'N/A'"
                readonly
              />
              <button
                class="btn btn-outline-secondary"
                type="button"
                @click="copyCode"
              >
                <i class="bi bi-clipboard"></i> Copy
              </button>
            </div>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              @click="showCodeModal = false"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Assign Assessment Modal -->
    <div
      v-if="showAssignAssessmentModal"
      class="modal fade show d-block"
      tabindex="-1"
      style="background-color: rgba(0, 0, 0, 0.5)"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Assign Assessment to Group</h5>
            <button
              type="button"
              class="btn-close"
              @click="showAssignAssessmentModal = false"
            ></button>
          </div>
          <div class="modal-body">
            <label for="assessmentSelect" class="form-label"
              >Select Assessment:</label
            >
            <select
              id="assessmentSelect"
              v-model="selectedAssessmentId"
              class="form-select"
            >
              <option
                v-for="a in availableAssessments"
                :key="a.id"
                :value="a.id"
              >
                {{ a.title }}
              </option>
            </select>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              @click="showAssignAssessmentModal = false"
            >
              Cancel
            </button>
            <button
              type="button"
              class="btn btn-success"
              @click="assignAssessmentToGroup"
            >
              Assign
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "@/axios";

export default {
  name: "GroupDetails",
  props: {
    id: { type: [String, Number], required: true },
  },
  data() {
    return {
      loading: false,
      group: null,
      students: [],
      assignments: [],
      showCodeModal: false,
      showAddAssignmentModal: false,
      showAssignAssessmentModal: false,
      selectedAssessmentId: "",
      availableAssessments: [],
      // Assessment form data
      title: "",
      type: "",
      subjectId: "",
      selectedTopicId: "",
      startTime: "",
      endTime: "",
      isTimed: false,
      timeLimit: "",
      topics: [],
      subjects: [],
      gradeLevels: [],
      studentsList: [],
      selectedStudentIds: [],
      selectAllStudents: false,
      questionsByTopic: {},
      selectedQuestionIds: [],
      questionSearch: "",
      message: "",
      success: false,
      // Submissions view
      selectedAssignment: null,
      submissions: [],
      loadingSubmissions: false,
      showSubmissionsModal: false,
      selectedSubmission: null,
    };
  },
  computed: {
    studentCount() {
      return this.students?.length || 0;
    },
  },
  async created() {
    await this.loadData();
    await this.loadAvailableAssessments();
  },
  methods: {
    async loadData() {
      this.loading = true;
      try {
        const groupRes = await axios.get(`/groups/${this.id}`);
        this.group = groupRes.data || null;
        this.students = Array.isArray(this.group?.students)
          ? this.group.students
          : [];
      } catch (e) {
        console.error("Failed to load group:", e);
      }
      try {
        const assignRes = await axios.get(`/groups/${this.id}/assignments`);
        this.assignments = assignRes.data || [];
      } catch (e) {
        // Endpoint may not exist yet; keep empty list.
        this.assignments = [];
      } finally {
        this.loading = false;
      }
    },
    copyCode() {
      const code = this.group?.class_code || "";
      navigator.clipboard
        .writeText(code)
        .then(() => {
          // Optionally show a toast or alert
          alert("Code copied to clipboard!");
        })
        .catch((err) => {
          console.error("Failed to copy: ", err);
        });
    },
    async loadAvailableAssessments() {
      try {
        const token = localStorage.getItem("auth_token");

        const res = await axios.get("/assessments/created", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // 👇 THIS IS THE FIX
        this.availableAssessments = res.data.created_assessments || [];

        console.log("Available assessments:", this.availableAssessments);
      } catch (e) {
        console.error("Failed to load available assessments", e);
        this.availableAssessments = [];
      }
    },

    async assignAssessmentToGroup() {
      if (!this.selectedAssessmentId) {
        alert("Please select an assessment.");
        return;
      }
      try {
        await axios.post(
          `/assessments/${this.selectedAssessmentId}/assign-group`,
          {
            group_id: this.id,
          }
        );
        alert("Assessment assigned successfully!");
        this.showAssignAssessmentModal = false;
        await this.loadData(); // Refresh assignments
      } catch (e) {
        alert("Failed to assign assessment.");
      }
    },
    async loadSubmissions(assignment) {
      this.selectedAssignment = assignment;
      this.loadingSubmissions = true;
      this.showSubmissionsModal = true;
      this.submissions = [];

      const token = localStorage.getItem('auth_token');

      // Try the most likely group-scoped assignments endpoint first (your route)
      const endpoints = [
        `/groups/${this.id}/assignments/${assignment.id}/submissions`,
        
      ];

      const tried = [];
      let lastError = null;

      for (const url of endpoints) {
        tried.push(url);
        try {
          const res = await axios.get(url, {
            params: { group_id: this.id },
            headers: { Authorization: `Bearer ${token}` },
          });

          this.submissions = res.data.submissions || res.data || [];
          this.loadingSubmissions = false;
          return;
        } catch (err) {
          lastError = err;
          // If 404, continue trying other candidates. For other errors, log but continue.
          if (!(err.response && err.response.status === 404)) {
            console.error(`Error loading submissions from ${url}:`, err);
          }
        }
      }

      // No endpoint worked
      this.loadingSubmissions = false;
      const msg = lastError && lastError.response && lastError.response.data && lastError.response.data.message
        ? lastError.response.data.message
        : 'No submissions endpoint found on the server for this assignment.';
      alert(`${msg}\nTried endpoints:\n${tried.join('\n')}`);
    },

    viewSubmission(sub) {
      this.selectedSubmission = sub;
    },

    parseMaybe(v) {
      if (v == null) return null;
      if (typeof v === 'object') return v;
      try {
        return JSON.parse(v);
      } catch (e) {
        return null;
      }
    },

    getQuestionText(ans) {
      return (
        ans.question?.question || ans.question?.question_text || ans.question_text || ans.question?.text || `Question #${ans.question_id}`
      );
    },

    buildMatchingDisplay(ans) {
      // If backend already returned enriched matching structure, use it
      if (ans.matching && Array.isArray(ans.matching.pairs)) {
        const left = Array.isArray(ans.matching.left) ? ans.matching.left : [];
        const right = Array.isArray(ans.matching.right) ? ans.matching.right : [];
        return (ans.matching.pairs || []).map(p => ({
          left_index: p.left_index,
          left_text: p.left_text ?? left[p.left_index] ?? null,
          student_right_text: p.right_text ?? (p.right_raw ?? (right[p.right_index] ?? null)),
          correct_right_text: null, // canonical pairs may be available in canonical_pairs
          right_index: p.right_index ?? null,
        }));
      }

      const q = ans.question || {};
      // parse options
      let opts = q.options;
      if (typeof opts === 'string') {
        try {
          opts = JSON.parse(opts);
        } catch (e) {
          opts = {};
        }
      }

      const left = Array.isArray(opts?.left) ? opts.left : [];
      const right = Array.isArray(opts?.right) ? opts.right : [];

      const parsedAns = this.parseMaybe(ans.answer) || {};
      // studentPairs may be under pairs or be an array directly
      let studentPairs = Array.isArray(parsedAns?.pairs) ? parsedAns.pairs : (Array.isArray(parsedAns) ? parsedAns : null);
      // if studentPairs is array of selections (strings), convert to pair objects
      if (studentPairs && studentPairs.length && typeof studentPairs[0] !== 'object') {
        // assume array of selected right-texts or right-indices
        const arr = studentPairs;
        studentPairs = arr.map((sel, idx) => {
          if (sel == null || sel === '') return { left_index: idx, right_index: null };
          if (typeof sel === 'number') return { left_index: idx, right_index: sel };
          // sel is string: find index in right
          const ri = right.findIndex(r => String(r) === String(sel));
          return { left_index: idx, right_index: ri >= 0 ? ri : null };
        });
      }

      // correct pairs may be stored on question.correct_answer
      const parsedCorrect = this.parseMaybe(q.correct_answer) || {};
      let correctPairs = Array.isArray(parsedCorrect?.pairs) ? parsedCorrect.pairs : (Array.isArray(parsedCorrect) ? parsedCorrect : null);

      // If correctPairs absent, but question may include a mapping in correct_answer_parsed
      if (!correctPairs && Array.isArray(q.correct_answer_parsed)) correctPairs = q.correct_answer_parsed;

      // Build display per-left item
      return left.map((l, idx) => {
        const sp = Array.isArray(studentPairs) ? studentPairs.find(p => p.left_index === idx) : null;
        const cp = Array.isArray(correctPairs) ? correctPairs.find(p => p.left_index === idx) : null;
        const studentRight = sp && (sp.right_index != null ? (right[sp.right_index] ?? sp.right_raw ?? null) : (sp.right_raw ?? null));
        const correctRight = cp && (cp.right_index != null ? (right[cp.right_index] ?? cp.right_raw ?? null) : (cp.right_raw ?? null));
        return {
          left_index: idx,
          left_text: l,
          student_right_text: studentRight,
          correct_right_text: correctRight,
          is_correct: sp && cp && sp.right_index === cp.right_index,
        };
      });
    },

    closeSubmissions() {
      this.showSubmissionsModal = false;
      this.selectedAssignment = null;
      this.submissions = [];
      this.selectedSubmission = null;
    },
  },
};
</script>
