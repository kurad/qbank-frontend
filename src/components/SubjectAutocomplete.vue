<template>
  <div class="subject-autocomplete">
    <input
      type="text"
      class="form-control"
      v-model="search"
      @input="onInput"
      @focus="showList = true"
      @blur="onBlur"
      placeholder="Type subject name..."
      autocomplete="off"
    />
    <ul v-if="showList && filteredSubjects.length" class="list-group position-absolute w-100 z-3" style="max-height:200px;overflow:auto;">
      <li
        v-for="subject in filteredSubjects"
        :key="subject.id + '-' + subject.grade_id"
        class="list-group-item list-group-item-action"
        @mousedown.prevent="selectSubject(subject)"
      >
        {{ subject.name }} - {{ getGradeName(subject.grade_id) }}
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  name: 'SubjectAutocomplete',
  props: {
    subjects: { type: Array, required: true },
    grades: { type: Array, required: true }
  },
  data() {
    return {
      search: '',
      showList: false
    };
  },
  computed: {
    filteredSubjects() {
      if (!this.search) return [];
      const s = this.search.toLowerCase();
      return this.subjects.filter(subj =>
        subj.name.toLowerCase().includes(s)
      );
    }
  },
  methods: {
    onInput() {
      this.showList = true;
    },
    onBlur() {
      setTimeout(() => { this.showList = false; }, 150);
    },
    selectSubject(subject) {
      this.search = `${subject.name} - ${this.getGradeName(subject.grade_id)}`;
      this.showList = false;
      this.$emit('select', subject);
    },
    getGradeName(gradeId) {
      const grade = this.grades.find(g => g.id === gradeId);
      return grade ? `S${grade.grade_name}` : gradeId;
    }
  }
};
</script>

<style scoped>
.subject-autocomplete { position: relative; }
</style>
