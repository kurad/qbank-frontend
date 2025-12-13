<template>
  <div class="filter-section mb-4 shadow-sm">
    <form class="row g-3 align-items-end">
      <div class="col-md-3 mb-3">
        <label for="grade_level_id" class="form-label fw-semibold">
          Select Grade Level
        </label>
        <select
          :value="selectedGrade"
          id="grade_level_id"
          class="form-select shadow-sm"
          @change="$emit('update:selectedGrade', castNumber($event.target.value))"
        >
          <option :value="''" disabled>Select grade</option>
          <option
            v-for="grade in gradeLevels"
            :key="grade.id"
            :value="grade.id"
          >
            {{ grade.grade_name }}
          </option>
        </select>
      </div>

      <div class="col-md-3 mb-3" v-if="subjects && subjects.length">
        <label for="subject_id" class="form-label fw-semibold">Subject</label>
        <select
          :value="selectedSubject"
          id="subject_id"
          class="form-select shadow-sm"
          @change="$emit('update:selectedSubject', castNumber($event.target.value))"
        >
          <option value="" disabled>Select subject</option>
          <option
            v-for="subject in subjects"
            :key="subject.id"
            :value="subject.id"
          >
            {{ subject.name }}
          </option>
        </select>
      </div>

      <div class="col-md-3 mb-3" v-if="topics && topics.length">
        <label for="topic_id" class="form-label fw-semibold">Topic</label>
        <select
          :value="selectedTopic"
          id="topic_id"
          class="form-select shadow-sm"
          @change="$emit('update:selectedTopic', castNumber($event.target.value))"
        >
          <option value="" disabled>Select topic</option>
          <option
            v-for="topic in topics"
            :key="topic.id"
            :value="topic.id"
          >
            {{ topic.topic_name }}
          </option>
        </select>
      </div>

      <!-- Searching question  -->
      <div class="col-12">
        <div class="row g-3 search-row align-items-end">
          <div class="col-md-4 mb-3">
            <label class="form-label fw-semibold">Search question text</label>
            <input
              :value="searchText"
              type="text"
              class="form-control shadow-sm"
              placeholder="Type to search..."
              :disabled="!selectedTopic"
              @input="$emit('update:searchText', $event.target.value.trim())"
              @keyup.enter.prevent="$emit('search')"
            />
          </div>

          <div class="col-md-2 mb-3">
            <label class="form-label fw-semibold">Question Type</label>
            <select
              :value="filterQuestionType"
              class="form-select shadow-sm"
              :disabled="!selectedTopic"
              @change="$emit('update:filterQuestionType', $event.target.value)"
            >
              <option value="">All types</option>
              <option value="mcq">Multiple Choice</option>
              <option value="true_false">True / False</option>
              <option value="short_answer">Short Answer</option>
              <option value="matching">Matching</option>
            </select>
          </div>

          <div class="col-md-2 mb-3">
            <label class="form-label fw-semibold">Difficulty</label>
            <select
              :value="filterDifficulty"
              class="form-select shadow-sm"
              :disabled="!selectedTopic"
              @change="$emit('update:filterDifficulty', $event.target.value)"
            >
              <option value="">All levels</option>
              <option value="remembering">Remembering</option>
              <option value="understanding">Understanding</option>
              <option value="applying">Applying</option>
              <option value="analyzing">Analyzing</option>
              <option value="evaluating">Evaluating</option>
              <option value="creating">Creating</option>
            </select>
          </div>

          <div class="col-md-2 mb-3 d-flex justify-content-end gap-2">
            <button
              type="button"
              class="btn btn-primary"
              :disabled="!selectedTopic"
              @click.prevent="$emit('search')"
            >
              Search
            </button>
            <button
              type="button"
              class="btn btn-outline-secondary"
              :disabled="!selectedTopic"
              @click.prevent="$emit('reset')"
            >
              Reset
            </button>
          </div>
        </div>
        <p class="text-muted small mt-1" v-if="!selectedTopic">
          Select a topic above to enable search.
        </p>
      </div>
    </form>
  </div>
</template>

<script>
export default {
  name: 'QuestionsFilters',
  props: {
    gradeLevels: {
      type: Array,
      default: () => [],
    },
    subjects: {
      type: Array,
      default: () => [],
    },
    topics: {
      type: Array,
      default: () => [],
    },
    selectedGrade: {
      type: [String, Number, null],
      default: null,
    },
    selectedSubject: {
      type: [String, Number, null],
      default: null,
    },
    selectedTopic: {
      type: [String, Number, null],
      default: null,
    },
    searchText: {
      type: String,
      default: '',
    },
    filterQuestionType: {
      type: String,
      default: '',
    },
    filterDifficulty: {
      type: String,
      default: '',
    },
  },
  methods: {
    castNumber(value) {
      // Preserve empty string/null, otherwise cast to number where possible
      if (value === '' || value === null || value === undefined) return '';
      const num = Number(value);
      return Number.isNaN(num) ? value : num;
    },
  },
};
</script>
