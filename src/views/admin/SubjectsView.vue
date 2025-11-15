<template>
  <div class="container py-4">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h3 class="fw-bold">Subjects</h3>
      <button class="btn btn-primary" @click="showModal = true">
        <i class="bi bi-plus-lg me-1"></i> New Subject
      </button>
    </div>
    <div v-if="loading" class="text-center my-5">
      <div class="spinner-border text-primary" role="status"></div>
    </div>
    <div v-else>
      <div v-if="subjects.length === 0" class="alert alert-info text-center">
        No subjects found.
      </div>
      <table v-else class="table table-sm table-hover align-middle">
        <thead>
          <tr>
            <th>Name</th>
            <th>Grade</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="subject in subjects" :key="subject.id">
            <td>{{ subject.name }}</td>
            <td>{{ subject.grade_levels[0]?.grade_name }}</td>
            <td>
              <button
                class="btn btn-sm btn-warning"
                @click="editSubject(subject)"
              >
                Edit
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <!-- Modal for creating a new subject -->
    <div
      class="modal fade"
      :class="{ 'show d-block': showModal }"
      tabindex="-1"
      v-if="showModal"
    >
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ isEditMode ? 'Edit Subject' : 'Create New Subject' }}</h5>
            <button
              type="button"
              class="btn-close"
              @click="closeModal"
              aria-label="Close"
            ></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">Select Grade Levels</label>
              <div class="d-flex flex-wrap">
                <div
                  v-for="grade in gradeLevels"
                  :key="grade.id"
                  class="form-check me-3"
                >
                  <input
                    class="form-check-input"
                    type="checkbox"
                    :value="grade.id"
                    v-model="selectedGradeLevels"
                    :id="'grade_' + grade.id"
                  />
                  <label class="form-check-label" :for="'grade_' + grade.id">
                    {{ grade.grade_name }}
                  </label>
                </div>
              </div>
            </div>
            <div class="mb-3">
              <label class="form-label">Subject Name</label>
              <input
                type="text"
                class="form-control"
                v-model="newSubjectName"
                placeholder="Enter subject name"
                required
              />
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeModal">
              Cancel
            </button>
            <button
              type="button"
              class="btn btn-primary"
              @click="createSubject"
              :disabled="isCreating || !newSubjectName"
            >
              <span
                v-if="isCreating"
                class="spinner-border spinner-border-sm me-1"
                role="status"
                aria-hidden="true"
              ></span>
              {{ isEditMode ? (isCreating ? "Updating..." :"Update Subject") : (isCreating ? "Creating..." : "Create Subject") }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <div
      v-if="showModal"
      class="modal-backdrop fade show"
      @click="closeModal"
    ></div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  data() {
    return {
      subjects: [],
      gradeLevels: [],
      loading: true,
      showModal: false,
      newSubjectName: "",
      selectedGradeLevels: [],
      isCreating: false,

      isEditMode: false, // Track if in edit mode
      editSubjectId: null, // Store the ID of the subject being edited
    };
  },
  async mounted() {
    await this.fetchSubjects();
    await this.fetchGradeLevels();
  },
  methods: {
    async fetchSubjects() {
      this.loading = true;
      try {
        const token = localStorage.getItem("auth_token");
        const response = await axios.get("/subjects", {
          headers: { Authorization: `Bearer ${token}` },
        });
        this.subjects = response.data;
      } catch (error) {
        console.error("Error fetching subjects:", error);
        this.subjects = [];
      } finally {
        this.loading = false;
      }
    },
    async editSubject(subject) {
      this.newSubjectName = subject.name; // Load subject name
      this.selectedGradeLevels = subject.grade_levels.map((level) => level.id); // Load associated grade levels
      this.showModal = true; // Show the modal
      this.isEditMode = true;
      this.editSubjectId= subject.id;
    },
    async createSubject() {
      if (!this.newSubjectName || this.selectedGradeLevels.length === 0) return;
      this.isCreating = true;
      try {
        const token = localStorage.getItem("auth_token");
        if (this.isEditMode) {
          await axios.put(
            `/subjects/${this.editSubjectId}`,
            {
              name: this.newSubjectName,
              grade_levels: this.selectedGradeLevels.map(Number),
            },
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
        } else {
          await axios.post(
            "/subjects",
            {
              name: this.newSubjectName,
              grade_levels: this.selectedGradeLevels.map(Number),
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )};
        this.newSubjectName = "";
        this.selectedGradeLevels = [];

        this.showModal = false;
        await this.fetchSubjects();
      } catch (error) {
        console.error("Error creating subject:", error);
        alert("Failed to create subject.");
      } finally {
        this.isCreating = false;
      }
    },

    closeModal() {
      this.showModal = false;
      this.newSubjectName = "";
      this.selectedGradeLevels = [];
      this.isEditMode = false; // Reset edit mode
      this.editSubjectId = null; // Reset subject ID
    },
    async fetchGradeLevels() {
      try {
        const token = localStorage.getItem("auth_token");
        const response = await axios.get("/grade-levels", {
          headers: { Authorization: `Bearer ${token}` },
        });
        this.gradeLevels = response.data; // Set the grade levels
      } catch (error) {
        console.error("Error fetching grade levels:", error);
        this.gradeLevels = [];
      }
    },
  },
};
</script>

<style scoped>
.container {
  max-width: 600px;
}
.modal-backdrop {
  z-index: 1040;
}
.modal {
  z-index: 1050;
}
.form-check {
  display: flex;
  align-items: center;
  margin-bottom: 10px; /* Space between checkboxes */
}

.form-check-input {
  width: 20px; /* Adjust checkbox size */
  height: 20px;
  margin-right: 10px; /* Space between checkbox and label */
}

.form-check-label {
  font-size: 14px; /* Adjust font size */
}
</style>
