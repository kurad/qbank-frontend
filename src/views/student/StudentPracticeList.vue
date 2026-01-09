<template>
  <div class="container-fluid px-0">
    <div class="card shadow-sm border-0 mt-2">
      <div class="card-body">
        <h2 class="card-title h5 mb-3 text-primary">Your Assessments</h2>
        
        <!-- Tabs Navigation -->
        <ul class="nav nav-tabs mb-4" id="assessmentsTab" role="tablist">
          <li class="nav-item" role="presentation">
            <button
              class="nav-link"
              :class="{ 'active': activeTab === 'practice' }"
              @click="setActiveTab('practice')"
              type="button"
            >
              <i class="bi bi-journal-text me-1"></i> Practice Assessments
            </button>
          </li>
          <li class="nav-item" role="presentation">
            <button
              class="nav-link"
              :class="{ 'active': activeTab === 'assigned' }"
              @click="setActiveTab('assigned')"
              type="button"
            >
              <i class="bi bi-person-video3 me-1"></i> Assigned by Teachers
            </button>
          </li>
        </ul>
        
        <!-- Tab Content -->
        <div class="tab-content pt-2">
          <!-- Practice Assessments Tab -->
          <div :class="{ 'd-block': activeTab === 'practice', 'd-none': activeTab !== 'practice' }" class="tab-pane fade show">
            <div v-if="loading" class="alert alert-info py-2">Loading...</div>
            <div v-else-if="assessments.length === 0" class="alert alert-secondary py-2">No practice assessments found.</div>
            <div v-else class="table-responsive">
              <table class="table table-hover align-middle mb-0">
                <thead class="table-light">
                  <tr>
                    <th>ID</th>
                    <th>Createt At</th>
                    <th>Title</th>
                    <th>Topic</th>
                    <th>Subject</th>
                    <th>Questions</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(assessment, idx ) in assessments" :key="'practice-' + assessment.id">
                    <td>{{ idx+1 }}</td>
                    <td>{{ formatDate(assessment.student_assessment?.assigned_at) }}</td>
                    <td>{{ assessment.title || 'N/A' }}</td>
                    <td>{{ (assessment.subject?.topic?.topic_name) || 'N/A' }}</td>
                    <td>{{ (assessment.subject && assessment.subject.name) || 'N/A' }}</td>
                    <td>{{ assessment.question_count || 0 }}</td>
                    <td>
                      <span v-if="assessment.student_assessment?.status === 'completed'" class="badge bg-success">Completed</span>
                      <span v-else-if="assessment.student_assessment?.status === 'Pending'" class="badge bg-warning text-dark">Not Started</span>
                      <span v-else class="badge bg-secondary">Not Started</span>
                    </td>
                    <td>
                      <button
                        @click="beginAssessment(assessment, false)"
                        :class="buttonClass(assessment, false)"
                        class="btn btn-sm"
                      >
                        {{ getButtonText(assessment, false) }}
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
              
              <!-- Practice Assessments Pagination -->
              <div v-if="showPracticePagination" class="mt-4 d-flex justify-content-center">
                <nav aria-label="Practice assessments pagination">
                  <ul class="pagination mb-0">
                    <li class="page-item" :class="{ 'disabled': practicePagination.current_page === 1 }">
                      <button 
                        class="page-link" 
                        @click="changePage(practicePagination.current_page - 1, false)"
                        :disabled="practicePagination.current_page === 1"
                      >
                        &laquo; Previous
                      </button>
                    </li>
                    
                    <li 
                      v-for="(link, index) in practicePaginationLinks" 
                      :key="'practice-page-' + index"
                      class="page-item"
                      :class="{ 
                        'active': link.active,
                        'disabled': !link.url
                      }"
                    >
                      <button 
                        v-html="link.label"
                        class="page-link"
                        @click="changePage(link.label, false)"
                        :disabled="!link.url || link.active"
                      ></button>
                    </li>
                    
                    <li class="page-item" :class="{ 'disabled': practicePagination.current_page === practicePagination.last_page }">
                      <button 
                        class="page-link" 
                        @click="changePage(practicePagination.current_page + 1, false)"
                        :disabled="practicePagination.current_page === practicePagination.last_page"
                      >
                        Next &raquo;
                      </button>
                    </li>
                  </ul>
                  <div class="text-muted text-center mt-2">
                    Showing {{ practicePagination.from }} to {{ practicePagination.to }} of {{ practicePagination.total }} entries
                  </div>
                </nav>
              </div>
            </div>
          </div>
          
          <!-- Assigned Assessments Tab -->
          <div :class="{ 'd-block': activeTab === 'assigned', 'd-none': activeTab !== 'assigned' }" class="tab-pane fade show">
            <div v-if="loadingAssigned" class="alert alert-info py-2">Loading assigned assessments...</div>
            <div v-else-if="assignedAssessments.length === 0" class="alert alert-secondary py-2">
              No assessments assigned by teachers yet.
            </div>
            <div v-else class="table-responsive">
              <table class="table table-hover align-middle mb-0">
                <thead class="table-light">
                  <tr>
                    <th>ID</th>
                    <th>Title</th>
                    <th>Teacher</th>
                    <th>Subject</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="assessment in assignedAssessments" :key="'assigned-' + assessment.id">
                    <td>{{ assessment.id }}</td>
                    <td>{{ assessment.assessment.title }}</td>
                    <td>{{ assessment.teacher_name || 'Teacher' }}</td>
                    <td>{{ assessment.assessment.subject?.name || 'N/A' }}</td>
                    <td>{{ formatDate(assessment.assessment.due_date) }}</td>
                    <td>
                      <span v-if="assessment.status === 'completed'" class="badge bg-success">Completed</span>
                      <span v-else-if="assessment.status === 'pending'" class="badge bg-warning text-dark">Not Started</span>
                      <span v-else-if="isPastDue(assessment.assessment.due_date)" class="badge bg-danger">Overdue</span>
                      <span v-else class="badge bg-secondary">Not Started</span>
                    </td>
                    <td>
                      <button
                        @click="beginAssessment(assessment, true)"
                        :class="buttonClass(assessment, true)"
                        class="btn btn-sm"
                        :disabled="isPastDue(assessment.assessment.due_date) && assessment.status !== 'completed'"
                      >
                        {{ getButtonText(assessment, true) }}
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
              
              <!-- Assigned Assessments Pagination -->
              <div v-if="showAssignedPagination" class="mt-4 d-flex justify-content-center">
                <nav aria-label="Assigned assessments pagination">
                  <ul class="pagination mb-0">
                    <li class="page-item" :class="{ 'disabled': assignedPagination.current_page === 1 }">
                      <button 
                        class="page-link" 
                        @click="changePage(assignedPagination.current_page - 1, true)"
                        :disabled="assignedPagination.current_page === 1"
                      >
                        &laquo; Previous
                      </button>
                    </li>
                    
                    <li 
                      v-for="(link, index) in assignedPaginationLinks" 
                      :key="'assigned-page-' + index"
                      class="page-item"
                      :class="{ 
                        'active': link.active,
                        'disabled': !link.url
                      }"
                    >
                      <button 
                        v-html="link.label"
                        class="page-link"
                        @click="changePage(link.label, true)"
                        :disabled="!link.url || link.active"
                      ></button>
                    </li>
                    
                    <li class="page-item" :class="{ 'disabled': assignedPagination.current_page === assignedPagination.last_page }">
                      <button 
                        class="page-link" 
                        @click="changePage(assignedPagination.current_page + 1, true)"
                        :disabled="assignedPagination.current_page === assignedPagination.last_page"
                      >
                        Next &raquo;
                      </button>
                    </li>
                  </ul>
                  <div class="text-muted text-center mt-2">
                    Showing {{ assignedPagination.from }} to {{ assignedPagination.to }} of {{ assignedPagination.total }} entries
                  </div>
                </nav>
              </div>
            </div>
          </div>
        </div>
        
        <div v-if="message" class="alert alert-danger mt-3">{{ message }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'StudentPracticeList',
  data() {
    return {
      activeTab: 'practice',
      assessments: [],
      assignedAssessments: [],
      loading: false,
      loadingAssigned: false,
      message: '',
      // Pagination for practice assessments
      practicePagination: {
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
        from: 0,
        to: 0,
        links: []
      },
      // Pagination for assigned assessments
      assignedPagination: {
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
        from: 0,
        to: 0,
        links: []
      }
    };
  },
  computed: {
    showPracticePagination() {
      return this.practicePagination.total > this.practicePagination.per_page;
    },
    showAssignedPagination() {
      return this.assignedPagination.total > this.assignedPagination.per_page;
    },
    practicePaginationLinks() {
      if (!this.practicePagination.links) return [];
      // Return all links except first and last
      return this.practicePagination.links.slice(1, -1);
    },
    assignedPaginationLinks() {
      if (!this.assignedPagination.links) return [];
      // Return all links except first and last
      return this.assignedPagination.links.slice(1, -1);
    }
  },
  methods: {
    setActiveTab(tab) {
      this.activeTab = tab;
      if (tab === 'assigned' && this.assignedAssessments.length === 0) {
        this.fetchAssignedAssessments();
      }
    },
    
    formatDate(dateString) {
      if (!dateString) return 'No due date';
      const options = { year: 'numeric', month: 'short', day: 'numeric' };
      return new Date(dateString).toLocaleDateString(undefined, options);
    },
    
    isPastDue(dueDate) {
      if (!dueDate) return false;
      return new Date(dueDate) < new Date();
    },
    
    async fetchAssessments(page = 1) {
      this.loading = true;
      this.message = '';
      try {
        const token = localStorage.getItem('auth_token');
        const res = await axios.get(`/student/practice-assessments?page=${page}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        this.assessments = res.data.data || [];
        console.log(this.assessments);

        // Update pagination info
        this.practicePagination = {
          current_page: res.data.current_page,
          last_page: res.data.last_page,
          per_page: res.data.per_page,
          total: res.data.total,
          from: res.data.from,
          to: res.data.to,
          links: res.data.links || []
        };
      } catch (err) {
        this.message = err.response?.data?.message || 'Failed to load practice assessments.';
      } finally {
        this.loading = false;
      }
    },
    
    changePage(page, isAssigned = false) {
      if (page === '...') return;
      if (isAssigned) {
        this.fetchAssignedAssessments(page);
      } else {
        this.fetchAssessments(page);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    
    async fetchAssignedAssessments(page = 1) {
      this.loadingAssigned = true;
      try {
        const token = localStorage.getItem('auth_token');
        
        // Fetch student's groups
        const groupsRes = await axios.get('/student/groups', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const groups = groupsRes.data || [];
        
        // Fetch assignments from all groups
        const allAssignments = [];
        for (const group of groups) {
          try {
            const res = await axios.get(`/groups/${group.id}/assignments`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            allAssignments.push(...(res.data || []));
          } catch (e) {
            // Ignore errors for individual groups
          }
        }
        
        this.assignedAssessments = allAssignments;
        
      } catch (err) {
        this.message = err.response?.data?.message || 'Failed to load assigned assessments.';
      } finally {
        this.loadingAssigned = false;
      }
    },
    
    getButtonText(assessment, isAssigned = false) {
      const isCompleted = isAssigned ? assessment.status === 'completed' : assessment.student_assessment?.status === 'completed';
      const dueDate = isAssigned ? assessment.assessment?.due_date : assessment.due_date;
      
      if (this.isPastDue(dueDate) && !isCompleted) {
        return 'Expired';
      }
      
      if (isAssigned) {
        // For assigned assessments
        switch (assessment.status) {
          case 'completed':
            return 'View Results';
          case 'pending':
            return 'Start';
          default:
            return 'Begin';
        }
      } else {
        // For practice assessments - use the status from student_assessment
        const status = assessment.student_assessment.status;
        if (!status) {
          return 'Start';
        }
        
        switch (status) {
          case 'completed':
            return 'View Results';
          case 'in_progress':
            return 'Continue';
          case 'pending':
          default:
            return 'Start';
        }
      }
    },
    
    buttonClass(assessment, isAssigned = false) {
      const isCompleted = isAssigned ? assessment.status === 'completed' : assessment.status === 'completed';
      const dueDate = isAssigned ? assessment.assessment?.due_date : assessment.due_date;
      
      if (this.isPastDue(dueDate) && !isCompleted) {
        return 'btn-outline-secondary';
      }
      
      if (isCompleted) {
        return 'btn-success';
      } else if (isAssigned ? assessment.status === 'pending' : ['In Progress', 'Pending'].includes(assessment.status)) {
        return 'btn-warning text-dark';
      } else {
        return 'btn-primary';
      }
    },
    
    beginAssessment(assessment, isAssigned = false) {
      const isCompleted = isAssigned ? assessment.status === 'completed' : assessment.student_assessment?.status === 'completed';
      
      if (isAssigned) {
        if (isCompleted) {
          // For completed assigned assessments, go to results
          const studentAssessmentId = assessment.id; // For assigned assessments, the ID is already the student_assessment ID
          this.$router.push({ name: 'AssessmentResults', params: { id: studentAssessmentId } });
        } else {
          // For not completed assigned assessments, go to the assessment
          this.$router.push({ name: 'TakeAssessment', params: { id: assessment.assessment.id } });
        }
      } else {
        // For practice assessments
        const status = assessment.student_assessment?.status;
        
        if (status === 'completed' && assessment.student_assessment?.id) {
          // For completed practice assessments with a valid student_assessment ID, go to results
          this.$router.push({ 
            name: 'AssessmentResults', 
            params: { id: assessment.student_assessment.id } 
          });
        } else if (status === 'in_progress' || status === 'pending') {
          // For in-progress or pending practice assessments, go to practice session
          this.$router.push({ 
            name: 'AssessmentSession', 
            params: { id: assessment.id } 
          });
        } else {
          // Default case (shouldn't normally happen)
          this.$router.push({ 
            name: 'PracticeSession', 
            params: { id: assessment.id } 
          });
        }
      }
    }
  },
  mounted() {
    this.fetchAssessments(1);
  }
};
</script>

<style scoped>
.nav-tabs .nav-link {
  color: #495057;
  font-weight: 500;
  border: none;
  border-bottom: 3px solid transparent;
  padding: 0.75rem 1.25rem;
  transition: all 0.2s;
}

.nav-tabs .nav-link.active {
  color: #0d6efd;
  background-color: transparent;
  border-color: #0d6efd;
}

.nav-tabs .nav-link:hover:not(.active) {
  border-color: #dee2e6;
}

.table th {
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.5px;
  color: #6c757d;
  border-top: none;
  border-bottom: 2px solid #dee2e6;
}

.table td {
  vertical-align: middle;
  padding: 1rem 0.75rem;
}

.btn-sm {
  padding: 0.25rem 0.75rem;
  font-size: 0.825rem;
  min-width: 100px;
}

.badge {
  font-weight: 500;
  padding: 0.4em 0.7em;
}

.page-link {
  position: relative;
  display: block;
  padding: 0.5rem 0.75rem;
  margin-left: -1px;
  line-height: 1.25;
  color: #0d6efd;
  background-color: #fff;
  border: 1px solid #dee2e6;
  transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out, border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.page-item.disabled .page-link {
  color: #6c757d;
  pointer-events: none;
  background-color: #fff;
  border-color: #dee2e6;
}

.page-item.active .page-link {
  z-index: 3;
  color: #fff;
  background-color: #0d6efd;
  border-color: #0d6efd;
}

.page-link:hover {
  z-index: 2;
  color: #0a58ca;
  background-color: #e9ecef;
  border-color: #dee2e6;
}

.page-link:focus {
  z-index: 3;
  color: #0a58ca;
  background-color: #e9ecef;
  outline: 0;
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
}
</style>
