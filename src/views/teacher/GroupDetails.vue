<template>
  <div class="container py-4">
    <div class="d-flex align-items-center justify-content-between mb-3">
      <button class="btn btn-link p-0" @click="$router.back()">← Back</button>
      <h2 class="h4 fw-semibold mb-0">{{ group?.group_name || 'Group Details' }}</h2>
      <div></div>
    </div>

    <div v-if="loading" class="d-flex align-items-center text-muted">
      <div class="spinner-border spinner-border-sm me-2" role="status"></div>
      Loading group details...
    </div>

    <div v-else>
      <div class="mb-4">
        <div class="card">
          <div class="card-header bg-secondary text-white d-flex justify-content-between align-items-center">
            <span>Students Enrolled <span class="badge bg-light text-dark ms-1">{{ studentCount }}</span></span>
            <div class="btn-group btn-group-sm">
              <button class="btn btn-light" type="button">View All</button>
              <button class="btn btn-success" type="button">Invite Students</button>
            </div>
          </div>
          <ul v-if="students && students.length" class="list-group list-group-flush">
            <li v-for="s in students" :key="s.id" class="list-group-item d-flex justify-content-between align-items-center small">
              <span>{{ s.name || s.full_name || ('Student #' + s.id) }}</span>
            </li>
          </ul>
          <div v-else class="card-body text-muted small">No students yet.</div>
        </div>
      </div>

      <div class="mb-4">
        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <span class="fw-semibold">Assignments</span>
            <div class="btn-group btn-group-sm">
              <button class="btn btn-success" type="button">Add Assignment</button>
            </div>
          </div>
          <div v-if="assignments && assignments.length">
            <div v-for="a in assignments" :key="a.id" class="border-bottom p-3">
              <div class="fw-semibold">{{ a.title }}</div>
              <div class="text-muted small">Created by : {{ a.created_by || '—' }} | Modified by : {{ a.modified_by || '—' }} <span v-if="a.published">| Published</span></div>
              <div class="mt-2 d-flex gap-2 flex-wrap">
                <span class="badge bg-warning text-dark">{{ a.stats?.not_submitted ?? 0 }} not submitted yet</span>
                <span class="badge bg-info text-dark">{{ a.stats?.pending ?? 0 }} pending for evaluation</span>
                <span class="badge bg-success">{{ a.stats?.submitted ?? 0 }} submission done</span>
              </div>
            </div>
          </div>
          <div v-else class="card-body text-muted small">No assignments for this group.</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from '@/axios';

export default {
  name: 'GroupDetails',
  props: {
    id: { type: [String, Number], required: true },
  },
  data() {
    return {
      loading: false,
      group: null,
      students: [],
      assignments: [],
    };
  },
  computed: {
    studentCount() {
      return this.students?.length || 0;
    },
  },
  async created() {
    await this.loadData();
  },
  methods: {
    async loadData() {
      this.loading = true;
      try {
        const groupRes = await axios.get(`/groups/${this.id}`);
        this.group = groupRes.data || null;
        this.students = Array.isArray(this.group?.students) ? this.group.students : [];
      } catch (e) {
        console.error('Failed to load group:', e);
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
  },
};
</script>
