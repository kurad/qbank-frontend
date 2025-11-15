<template>
  <!-- Backdrop -->
  <div v-if="showAddModal" class="custom-backdrop" aria-hidden="true"></div>

  <!-- Modal -->
  <div v-if="showAddModal" class="modal d-block" tabindex="-1" role="dialog" aria-modal="true">
    <div class="modal-dialog modal-fullscreen" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Add Questions</h5>
          <button type="button" class="btn-close" aria-label="Close" @click="closeAddModal"></button>
        </div>

        <div class="modal-body">
          <!-- Subject Filter -->
          <div class="mb-3">
            <label class="form-label">Subject Filter</label>
            <div class="position-relative">
              <input
                v-model="subjectSearch"
                @input="searchSubjects"
                @focus="showSubjectDropdown = true"
                type="text"
                class="form-control"
                placeholder="Type subject name (e.g., Computer Science)"
              />
              <div v-if="showSubjectDropdown && filteredSubjects.length" class="dropdown-menu d-block w-100 position-absolute">
                <button 
                  v-for="subject in filteredSubjects" 
                  :key="subject.id" 
                  class="dropdown-item" 
                  @click="selectSubject(subject)"
                >
                  {{ subject.name }} - {{ subject.grade_level }}
                </button>
              </div>
            </div>
            <div v-if="selectedSubject" class="mt-2 d-flex align-items-center">
              <span class="badge bg-primary me-2">{{ selectedSubject.name }} - {{ selectedSubject.grade_level }}</span>
              <button class="btn btn-sm btn-outline-danger" @click="clearSubject">×</button>
            </div>
          </div>

          <!-- Question Search -->
          <div class="mb-3 d-flex align-items-center gap-2">
            <input
              v-model="availableSearch"
              @keyup.enter="fetchAvailableQuestions()"
              type="text"
              class="form-control"
              placeholder="Search questions (enter to search)"
            />
            <button class="btn btn-outline-secondary" type="button" @click="fetchAvailableQuestions()" :disabled="availableLoading">
              <span v-if="availableLoading" class="spinner-border spinner-border-sm me-1"></span>
              Search
            </button>
          </div>

          <div v-if="availableError" class="alert alert-danger py-2">{{ availableError }}</div>

          <!-- Questions container -->
          <div class="border rounded" style="max-height: 75vh; overflow:auto;">
            <div v-if="availableLoading" class="p-3 text-muted">Loading questions...</div>

            <template v-else>
              <div v-for="grp in groupedAvailable" :key="grp.name" class="border-bottom">
                <button
                  class="w-100 text-start btn btn-light d-flex justify-content-between align-items-center px-3 py-2"
                  @click="toggleGroup(grp.name)"
                >
                  <span class="fw-semibold">{{ grp.name || 'Ungrouped' }}</span>
                  <span class="text-muted small">
                    {{ grp.items.length }} questions
                    <i class="bi" :class="isExpanded(grp.name) ? 'bi-chevron-up' : 'bi-chevron-down'"></i>
                  </span>
                </button>

                <!-- Smooth collapse -->
                <transition name="collapse">
                  <div v-if="isExpanded(grp.name)" class="px-3 pb-3">
                    <div
                      v-for="q in grp.items"
                      :key="q.id"
                      class="p-2 border rounded mb-2 d-flex align-items-start justify-content-between"
                    >
                      <div class="me-3" style="max-width: 70%;">
                        <div class="fw-semibold mb-1">
                          Q#{{ q.id }} — <span class="text-muted">{{ q.question_type }}</span>
                        </div>

                        <!-- Render math text -->
                        <div class="mb-2 question-text" v-html="renderMath(q.is_math ? ('$' + q.question_text + '$') : q.question_text)"></div>

                        <!-- True/False -->
                        <div v-if="q.question_type === 'true_false'" class="mb-2">
                          <ul class="mb-0 ps-3">
                            <li>
                              <span :class="{ 'text-success fw-semibold': q.correct_answer === 'true' }">True</span>
                            </li>
                            <li>
                              <span :class="{ 'text-success fw-semibold': q.correct_answer === 'false' }">False</span>
                            </li>
                          </ul>
                        </div>

                        <!-- Multiple choice -->
                        <div v-else-if="(q.options || []).length" class="mb-2">
                          <ul class="mb-0 ps-3">
                            <li v-for="(opt, oi) in q.options" :key="oi">
                              <span class="me-1 text-muted">{{ String.fromCharCode(65 + oi) }}.</span>
                              <span v-html="renderMath(opt.option_text)"></span>
                              <span v-if="opt.is_correct" class="text-success fw-semibold ms-1">(Correct)</span>
                            </li>
                          </ul>
                        </div>

                        <!-- Tags -->
                        <div class="mt-1">
                          <span class="badge me-2" :class="getDifficultyBadgeClass(q.difficulty_level)">
                            {{ q.difficulty_level }}
                          </span>
                          <span class="badge bg-success">{{ q.marks }} marks</span>
                        </div>
                      </div>

                      <!-- Selection -->
                      <div class="text-nowrap">
                        <input
                          class="form-check-input"
                          type="checkbox"
                          :id="'pick-' + q.id"
                          :disabled="existingQuestionIds.has(q.id)"
                          :checked="selectedToAdd.has(q.id)"
                          @change="toggleSelect(q.id)"
                        />
                        <label class="form-check-label ms-2" :for="'pick-' + q.id">
                          {{ existingQuestionIds.has(q.id) ? 'Already Added' : (selectedToAdd.has(q.id) ? 'Selected' : 'Select') }}
                        </label>
                      </div>
                    </div>
                  </div>
                </transition>
              </div>

              <div v-if="!groupedAvailable.length" class="p-3 text-muted">No questions found.</div>
            </template>
          </div>
        </div>

        <!-- Footer -->
        <div class="modal-footer w-100 d-flex justify-content-between align-items-center">
          <div class="d-flex align-items-center gap-2">
            <button type="button" class="btn btn-outline-secondary" @click="goPrevPage" :disabled="availableLoading || availablePage <= 1">Prev</button>
            <span class="text-muted">Page {{ availablePage }} of {{ availableLastPage }}</span>
            <button type="button" class="btn btn-outline-secondary" @click="goNextPage" :disabled="availableLoading || availablePage >= availableLastPage">Next</button>
          </div>

          <div>
            <button type="button" class="btn btn-outline-secondary me-2" @click="closeAddModal" :disabled="addIsLoading || availableLoading">Cancel</button>
            <button type="button" class="btn btn-primary" @click="addSelectedQuestions" :disabled="addIsLoading || selectedToAdd.size === 0">
              <span v-if="addIsLoading" class="spinner-border spinner-border-sm me-1"></span>
              Add Selected ({{ selectedToAdd.size }})
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from '@/axios'
import katex from 'katex'
import 'katex/dist/katex.min.css'

export default {
  name: 'AddQuestionsModal',
  props: {
    modelValue: { type: Boolean, required: true },
    assessmentId: { type: [Number, String], required: false },
    existingQuestionIds: { type: Object, required: false, default: () => new Set() },
  },
  emits: ['update:modelValue', 'add-questions'],
  data() {
    return {
      addIsLoading: false,
      availableQuestions: [],
      availableLoading: false,
      availableError: '',
      availableSearch: '',
      selectedToAdd: new Set(),
      availablePage: 1,
      availableLastPage: 1,
      availablePerPage: 10,
      availableTotal: 0,
      expandedGroups: new Set(),
      // Subject filter
      subjectSearch: '',
      subjects: [],
      filteredSubjects: [],
      selectedSubject: null,
      showSubjectDropdown: false,
      subjectsLoading: false,
    }
  },
  computed: {
    // v-model bridge
    showAddModal: {
      get() { return this.modelValue },
      set(v) { this.$emit('update:modelValue', v) }
    },
    groupedAvailable() {
      const groups = new Map()
      for (const q of this.availableQuestions || []) {
        const g = q._group || 'Ungrouped'
        if (!groups.has(g)) groups.set(g, [])
        groups.get(g).push(q)
      }
      return Array.from(groups.entries()).map(([name, items]) => ({ name, items }))
    }
  },
  methods: {
    renderMath(text) {
      if (!text) return ''
      try {
        const clean = String(text).replace(/^\$+|\$+$/g, '')
        return katex.renderToString(clean, { throwOnError: false })
      } catch (e) {
        console.error(e)
        return text
      }
    },
    getDifficultyBadgeClass(level) {
      switch ((level || '').toString().toLowerCase()) {
        case 'easy': return 'bg-info'
        case 'medium': return 'bg-warning'
        case 'hard': return 'bg-danger'
        default: return 'bg-secondary'
      }
    },
    toggleGroup(name) {
      const key = name || 'Ungrouped'
      if (this.expandedGroups.has(key)) this.expandedGroups.delete(key)
      else this.expandedGroups.add(key)
      this.expandedGroups = new Set(this.expandedGroups)
    },
    isExpanded(name) {
      const key = name || 'Ungrouped'
      return this.expandedGroups.has(key)
    },
    closeAddModal() {
      if (this.addIsLoading) return
      this.showAddModal = false
    },
    async fetchAvailableQuestions() {
      this.availableLoading = true
      this.availableError = ''
      try {
        const token = localStorage.getItem('auth_token')
        const headers = token ? { Authorization: `Bearer ${token}` } : {}
        const params = { params: { page: this.availablePage, per_page: this.availablePerPage } }
        const s = (this.availableSearch || '').trim()
        if (s) params.params.search = s
        const resp = await axios.get('/my-questions', { headers, ...params })
        const payload = resp.data || {}

        const flatList = []
        const normalizeItem = (raw, groupName) => {
          const qData = raw?.question || raw || {}
          const correct = qData.correct_answer ?? ''
          let rawOptions = qData.options ?? []
          if (typeof rawOptions === 'string') {
            try { rawOptions = JSON.parse(rawOptions) } catch (_) {
              if (rawOptions.includes(',')) rawOptions = rawOptions.split(',').map(o => o.trim())
              else rawOptions = []
            }
          }
          if (!Array.isArray(rawOptions)) rawOptions = []
          const options = rawOptions
            .filter(opt => opt !== null && opt !== undefined)
            .map(opt => {
              if (typeof opt === 'object' && (opt.option_text !== undefined || opt.is_correct !== undefined)) {
                const text = String(opt.option_text ?? '')
                const isCorrectRaw = opt.is_correct
                const isCorrect = typeof isCorrectRaw === 'boolean' ? isCorrectRaw : String(isCorrectRaw).toLowerCase() === 'true' || String(isCorrectRaw) === '1'
                return { option_text: qData.is_math ? `$${text}$` : text, is_correct: isCorrect }
              }
              const text = String(opt)
              return { option_text: qData.is_math ? `$${text}$` : text, is_correct: text === String(correct) }
            })
          const rawType = String(qData.question_type || 'mcq').toLowerCase()
          return {
            id: raw.id || qData.id,
            question_text: qData.question || qData.question_text || '',
            question_type: rawType.includes('true') ? 'true_false' : rawType,
            question_image: qData.question_image_url || qData.question_image || null,
            options,
            correct_answer: String(correct).toLowerCase(),
            is_math: !!qData.is_math,
            marks: qData.marks || 0,
            difficulty_level: qData.difficulty_level || 'remembering',
            _group: groupName,
          }
        }

        const grouped = payload.data
        if (grouped && typeof grouped === 'object' && !Array.isArray(grouped)) {
          for (const [groupName, arr] of Object.entries(grouped)) {
            const list = Array.isArray(arr) ? arr : []
            list.forEach(raw => flatList.push(normalizeItem(raw, groupName)))
          }
        } else if (Array.isArray(payload.data)) {
          payload.data.forEach(raw => flatList.push(normalizeItem(raw, undefined)))
        } else if (Array.isArray(payload?.data?.data)) {
          payload.data.data.forEach(raw => flatList.push(normalizeItem(raw, undefined)))
        }

        this.availableQuestions = flatList
        const pg = payload.pagination || payload.data?.pagination || {}
        this.availablePage = Number(pg.current_page || this.availablePage || 1)
        this.availableLastPage = Number(pg.last_page || this.availableLastPage || 1)
        this.availablePerPage = Number(pg.per_page || this.availablePerPage || 10)
        this.availableTotal = Number(pg.total || flatList.length)
      } catch (e) {
        console.error('Failed to fetch available questions', e)
        this.availableError = 'Failed to fetch questions'
      } finally {
        this.availableLoading = false
      }
    },
    goPrevPage() {
      if (this.availablePage > 1 && !this.availableLoading) {
        this.availablePage -= 1
        this.fetchAvailableQuestions()
      }
    },
    goNextPage() {
      if (this.availablePage < this.availableLastPage && !this.availableLoading) {
        this.availablePage += 1
        this.fetchAvailableQuestions()
      }
    },
    toggleSelect(id) {
      if (this.existingQuestionIds?.has && this.existingQuestionIds.has(id)) return
      if (this.selectedToAdd.has(id)) this.selectedToAdd.delete(id)
      else this.selectedToAdd.add(id)
      this.selectedToAdd = new Set(this.selectedToAdd)
    },
    async addSelectedQuestions() {
      if (!this.selectedToAdd.size) return
      this.addIsLoading = true
      try {
        const ids = Array.from(this.selectedToAdd)
        await this.$emit('add-questions', ids)
        this.showAddModal = false
      } catch (e) {
        console.error('Add selected failed', e)
      } finally {
        this.addIsLoading = false
      }
    },
  },
  watch: {
    showAddModal(open) {
      if (open) {
        this.selectedToAdd = new Set()
        this.availableSearch = ''
        this.availablePage = 1
        this.expandedGroups = new Set()
        this.fetchAvailableQuestions()
      }
    }
  },
  mounted() {
    if (this.showAddModal) this.fetchAvailableQuestions()
  }
}
</script>

<style scoped>
.modal-fullscreen {
  width: 100%;
  height: 100%;
  margin: 0;
  max-width: none;
}

.custom-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.6);
  z-index: 1040;
}

/* Smooth collapse transition */
.collapse-enter-active,
.collapse-leave-active {
  transition: all 0.3s ease;
}
.collapse-enter-from,
.collapse-leave-to {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
}
.collapse-enter-to,
.collapse-leave-from {
  max-height: 1000px;
  opacity: 1;
}

.question-text {
  font-size: 0.95rem;
  line-height: 1.5;
}

.katex {
  font-size: 1em;
}
</style>
