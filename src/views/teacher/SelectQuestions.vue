<template>
  <div class="container py-4">
    <h2 class="mb-4">Select Questions</h2>
    <div class="row mb-3">
      <div class="col-md-3 mb-2">
        <select class="form-select" v-model="filters.subject" @change="filterQuestions">
          <option value="">All Subjects</option>
          <option v-for="subject in subjects" :key="subject.id" :value="subject.id">{{ subject.name }}</option>
        </select>
      </div>
      <div class="col-md-3 mb-2">
        <select class="form-select" v-model="filters.topic" @change="filterQuestions">
          <option value="">All Topics</option>
          <option v-for="topic in topics" :key="topic.id" :value="topic.id">{{ topic.name }}</option>
        </select>
      </div>
      <div class="col-md-3 mb-2">
        <select class="form-select" v-model="filters.grade" @change="filterQuestions">
          <option value="">All Grades</option>
          <option v-for="grade in grades" :key="grade.id" :value="grade.id">{{ grade.grade_name }}</option>
        </select>
      </div>
      <div class="col-md-3 mb-2">
        <input type="text" class="form-control" placeholder="Search questions..." v-model="filters.search" @input="filterQuestions" />
      </div>
    </div>

    <div class="row">
      <div class="col-md-7">
        <h5>Available Questions</h5>
        <ul class="list-group question-list">
          <li v-for="question in filteredQuestions" :key="question.id" class="list-group-item d-flex justify-content-between align-items-center">
            <span v-html="question.question_text"></span>
            <button class="btn btn-sm btn-primary" @click="selectQuestion(question)">Add</button>
          </li>
        </ul>
      </div>
      <div class="col-md-5">
        <h5>Selected Questions</h5>
        <ul class="list-group selected-list">
          <li v-for="question in selectedQuestions" :key="question.id" class="list-group-item d-flex justify-content-between align-items-center">
            <span v-html="question.question_text"></span>
            <button class="btn btn-sm btn-danger" @click="removeQuestion(question)">Remove</button>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      subjects: [],
      topics: [],
      grades: [],
      questions: [],
      filters: {
        subject: '',
        topic: '',
        grade: '',
        search: ''
      },
      filteredQuestions: [],
      selectedQuestions: []
    };
  },
  methods: {
    filterQuestions() {
      this.filteredQuestions = this.questions.filter(q => {
        const matchesSubject = this.filters.subject ? q.subject_id === this.filters.subject : true;
        const matchesTopic = this.filters.topic ? q.topic_id === this.filters.topic : true;
        const matchesGrade = this.filters.grade ? q.grade_id === this.filters.grade : true;
        const matchesSearch = this.filters.search ? q.question_text.toLowerCase().includes(this.filters.search.toLowerCase()) : true;
        return matchesSubject && matchesTopic && matchesGrade && matchesSearch;
      });
    },
    selectQuestion(question) {
      if (!this.selectedQuestions.find(q => q.id === question.id)) {
        this.selectedQuestions.push(question);
      }
    },
    removeQuestion(question) {
      this.selectedQuestions = this.selectedQuestions.filter(q => q.id !== question.id);
    }
  },
  mounted() {
    // Load subjects, topics, grades, and questions from API or props
    // Then call filterQuestions to initialize filteredQuestions
  }
};
</script>

<style scoped>
.question-list, .selected-list {
  max-height: 400px;
  overflow-y: auto;
}
</style>