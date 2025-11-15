<template>
  <div class="card shadow-sm mb-4">
    <div class="card-header bg-light">
      <h5 class="mb-0">Filters</h5>
    </div>
    <div class="card-body">
      <div class="row g-3">
        <div class="col-md-3">
          <label class="form-label">Grade Level</label>
          <select 
            class="form-select" 
            v-model="selectedGrade"
            @change="handleGradeChange"
          >
            <option value="">All Grades</option>
            <option 
              v-for="grade in gradeLevels" 
              :key="grade.id" 
              :value="grade.id"
            >
              {{ grade.grade_name }}
            </option>
          </select>
        </div>
        <div class="col-md-3">
          <label class="form-label">Subject</label>
          <select 
            class="form-select" 
            v-model="filters.subject"
            :disabled="!selectedGrade"
            @change="handleSubjectChange"
          >
            <option value="">All Subjects</option>
            <option 
              v-for="subject in subjects" 
              :key="subject.id" 
              :value="subject.id"
            >
              {{ subject.name }}
            </option>
          </select>
        </div>
        <div class="col-md-3">
          <label class="form-label">Topic</label>
          <select 
            class="form-select" 
            v-model="filters.topic"
            :disabled="!filters.subject"
          >
            <option value="">All Topics</option>
            <option 
              v-for="topic in topics" 
              :key="topic.id" 
              :value="topic.id"
            >
              {{ topic.topic_name }}
            </option>
          </select>
        </div>
        <div class="col-md-3">
          <label class="form-label">Search</label>
          <input 
            type="text" 
            class="form-control" 
            placeholder="Search questions..." 
            v-model="filters.search" 
            @input="handleSearch"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from 'vue';
import { questionService } from '@/services/questionService';
import type { GradeLevel, Subject, Topic } from '@/types/question';

export default defineComponent({
  name: 'QuestionFilters',
  props: {
    modelValue: {
      type: Object,
      required: true
    }
  },
  emits: ['update:modelValue', 'filter'],
  setup(props, { emit }) {
    const gradeLevels = ref<GradeLevel[]>([]);
    const subjects = ref<Subject[]>([]);
    const topics = ref<Topic[]>([]);
    const selectedGrade = ref<string | number>('');
    const filters = ref({
      search: props.modelValue.search || '',
      topic: props.modelValue.topic || '',
      subject: props.modelValue.subject || '',
      grade: props.modelValue.grade || ''
    });

    // Watch for changes in filters and emit update
    watch(filters.value, (newFilters) => {
      emit('update:modelValue', { ...newFilters });
    }, { deep: true });

    // Watch for external modelValue changes
    watch(() => props.modelValue, (newVal) => {
      filters.value = { ...newVal };
      if (newVal.grade && newVal.grade !== selectedGrade.value) {
        selectedGrade.value = newVal.grade;
      }
    }, { deep: true });

    const fetchGradeLevels = async () => {
      try {
        const data = await questionService.fetchGradeLevels();
        gradeLevels.value = data;
      } catch (error) {
        console.error('Failed to fetch grade levels:', error);
      }
    };

    const fetchSubjects = async (gradeId: string | number) => {
      try {
        const data = await questionService.fetchSubjects(gradeId);
        subjects.value = data;
      } catch (error) {
        console.error('Failed to fetch subjects:', error);
        subjects.value = [];
      }
    };

    const fetchTopics = async (subjectId: string | number) => {
      try {
        const data = await questionService.fetchTopics(subjectId);
        topics.value = data;
      } catch (error) {
        console.error('Failed to fetch topics:', error);
        topics.value = [];
      }
    };

    const handleGradeChange = () => {
      filters.value.subject = '';
      filters.value.topic = '';
      filters.value.grade = selectedGrade.value;
      
      if (selectedGrade.value) {
        fetchSubjects(selectedGrade.value);
      } else {
        subjects.value = [];
        topics.value = [];
      }
      
      emitFilter();
    };

    const handleSubjectChange = () => {
      filters.value.topic = '';
      
      if (filters.value.subject) {
        fetchTopics(filters.value.subject);
      } else {
        topics.value = [];
      }
      
      emitFilter();
    };

    const handleSearch = () => {
      emitFilter();
    };

    const emitFilter = () => {
      emit('filter', { ...filters.value });
    };

    // Initialize
    fetchGradeLevels();
    if (props.modelValue.grade) {
      selectedGrade.value = props.modelValue.grade;
      fetchSubjects(props.modelValue.grade);
    }
    if (props.modelValue.subject) {
      fetchTopics(props.modelValue.subject);
    }

    return {
      gradeLevels,
      subjects,
      topics,
      selectedGrade,
      filters,
      handleGradeChange,
      handleSubjectChange,
      handleSearch,
      emitFilter
    };
  }
});
</script>

<style scoped>
.form-select:disabled,
.form-control:disabled {
  background-color: #f8f9fa;
  cursor: not-allowed;
}

.form-label {
  font-weight: 500;
  margin-bottom: 0.3rem;
}
</style>
