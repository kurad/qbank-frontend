<template>
  <div class="container py-4">
    <div class="d-flex align-items-center justify-content-between mb-3">
      <button class="btn btn-link p-0" @click="$router.go(-1)">← Back</button>
      <h2 class="h4 fw-semibold mb-0">{{ group?.group_name || 'Group Details' }}</h2>
      <div></div>
    </div>

    <div v-if="loading" class="d-flex align-items-center text-muted">
      <div class="spinner-border spinner-border-sm me-2" role="status"></div>
      Loading group details...
    </div>

    <div v-else-if="group">
      <div class="mb-4">
        <div class="card">
          <div class="card-header bg-secondary text-white d-flex justify-content-between align-items-center">
            <span>Assignments <span class="badge bg-light text-dark ms-1">{{ assignments.length }}</span></span>
          </div>
          <div v-if="assignments && assignments.length">
            <div v-for="a in assignments" :key="a.id" class="border-bottom p-3">
              <div class="fw-semibold">{{ a.title }}</div>
              <div class="text-muted small">Created by: {{ a.creator.name || '—' }} | Assigned At: {{ a.created_at || '—' }} <span v-if="a.published">| Published</span></div>
              <!-- <div class="mt-2 d-flex gap-2 flex-wrap">
                <span class="badge bg-warning text-dark">{{ a.stats?.not_submitted ?? 0 }} not submitted yet</span>
                <span class="badge bg-info text-dark">{{ a.stats?.pending ?? 0 }} pending for evaluation</span>
                <span class="badge bg-success">{{ a.stats?.submitted ?? 0 }} submission done</span>
              </div> -->
              <div class="mt-2 d-flex align-items-center gap-2">
                <span 
                  :class="[
                    'badge',
                    a.student_assessment?.status === 'completed' ? 'bg-success' : 'bg-warning text-dark'
                  ]"
                >
                  {{ a.student_assessment?.status === 'completed' ? 'Completed' : 'Not Started' }}
                </span>
                <button 
                  class="btn btn-primary btn-sm" 
                  @click="startAssessment(a)"
                >
                  {{ a.student_assessment?.status === 'completed' ? 'View Results' : 'Start Assessment' }}
                </button>
              </div>
            </div>
          </div>
          <div v-else class="card-body text-muted small">No assignments for this group.</div>
        </div>
      </div>
    </div>

    <div v-else class="alert alert-danger">
      Group not found.
    </div>
  </div>
</template>

<script>
import axios from '@/axios';

export default {
  name: 'StudentGroup',
  props: {
    id: { type: [String, Number], required: true },
  },
  data() {
    return {
      loading: false,
      group: null,
      assignments: [],
    };
  },
  async created() {
    await this.loadData();
  },
  methods: {
    async loadData() {
      this.loading = true;
      try {
        const token = localStorage.getItem('auth_token');
        const groupRes = await axios.get(`/groups/${this.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        this.group = groupRes.data || null;

        const assignRes = await axios.get(`/groups/${this.id}/assignments`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        this.assignments = assignRes.data || [];
      } catch (e) {
        console.error('Failed to load group:', e);
        this.group = null;
        this.assignments = [];
      } finally {
        this.loading = false;
      }
    },
    startAssessment(assessment) {
      if (assessment.student_assessment?.status === 'completed') {
        // Navigate to results
        this.$router.push({ name: 'AssessmentResults', params: { id: assessment.student_assessment.id } });
      } else {
        // Navigate to practice session
        this.$router.push({ name: 'AssessmentSession', params: { id: assessment.id } });
      }
    },
  },
};
</script>

<style scoped>
</style>