<template>
  <div class="container py-4">
    <h2 class="h4 fw-semibold mb-4">🎯 Manage Groups</h2>

    <!-- Create Group -->
    <div class="mb-4">
      <div class="input-group">
        <input
          v-model="newGroupName"
          type="text"
          placeholder="Enter new group name"
          class="form-control"
        />
        <button
          @click="createGroup"
          class="btn btn-primary"
        >
          Create
        </button>
      </div>
    </div>

    <!-- Group List -->
    <div v-if="loading" class="d-flex align-items-center text-muted">
      <div class="spinner-border spinner-border-sm me-2" role="status"></div>
      Loading groups...
    </div>
    <div v-else>
      <div v-if="(groups && groups.length)" class="row g-3">
        <div class="col-12 col-md-6 col-lg-4" v-for="group in (groups || [])" :key="group.id ?? group.group_id ?? group.groupID ?? group.group_name">
          <div class="card shadow-sm h-100">
            <div class="card-body d-flex justify-content-between align-items-center">
              <h3 class="h6 mb-0">{{ group.group_name }}</h3>
              <div class="d-flex gap-2 align-items-center">
                <button
                  class="btn btn-outline-primary btn-sm"
                  @click="selectGroup(group)"
                >
                  Open
                </button>
                <button
                  v-if="group.id !== undefined && group.id !== null"
                  @click="deleteGroup(group.id)"
                  class="btn btn-link text-danger btn-sm p-0"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="card shadow-sm">
        <div class="card-body text-center text-muted">
          No groups found.
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "@/axios";

export default {
  name: "GroupManager",
  data() {
    return {
      groups: [],
      newGroupName: "",
      loading: false,
    };
  },
  async created() {
    await this.loadGroups();
  },
  methods: {
    async loadGroups() {
      this.loading = true;
      try {
        const groupsRes = await axios.get("/groups");
        this.groups = groupsRes.data || [];
      } catch (error) {
        console.error("❌ Failed to load groups:", error);
      } finally {
        this.loading = false;
      }
    },

    async createGroup() {
      if (!this.newGroupName.trim()) return;
      try {
        const { data } = await axios.post("/groups", {
          group_name: this.newGroupName,
        });
        this.groups.push(data);
        this.newGroupName = "";
      } catch (error) {
        console.error("❌ Failed to create group:", error);
      }
    },

    async deleteGroup(id) {
      if (!confirm("Are you sure you want to delete this group?")) return;
      try {
        await axios.delete(`/groups/${id}`);
        this.groups = this.groups.filter((g) => g.id !== id);
      } catch (error) {
        console.error("❌ Failed to delete group:", error);
      }
    },

    selectGroup(group) {
      this.$emit('group-selected', group);
      if (group && (group.id !== undefined && group.id !== null)) {
        this.$router.push({ name: 'group-details', params: { id: group.id } });
      }
    },
  },
};
</script>
