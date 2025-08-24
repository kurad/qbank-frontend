<template>
  <div class="container mt-4">
    <div class="row">
      <!-- Subjects Column -->
      <div class="col-md-3 border-end">
        <h5>Subjects & Grades</h5>
        <ul class="list-group">
          <li 
            v-for="subject in subjects" 
            :key="subject.id" 
            @click="selectSubject(subject)" 
            :class="['list-group-item', selectedSubject && selectedSubject.id === subject.id ? 'active' : '']"
            style="cursor: pointer;"
          >
            {{ subject.name }} - {{ subject.grade_level }}
          </li>
        </ul>
      </div>

      <!-- Topics Column -->
      <div class="col-md-3 border-end">
        <h5>Topics</h5>
        <div v-if="topics.length === 0 && selectedSubject" class="text-muted">No topics available for {{ selectedSubject.name }}.</div>
        <ul v-else class="list-group">
          <li 
            v-for="topic in topics" 
            :key="topic.id" 
            @click="selectTopic(topic)" 
            :class="['list-group-item', selectedTopic && selectedTopic.id === topic.id ? 'active' : '']"
            style="cursor: pointer;"
          >
            {{ topic.topic_name }}
            <span class="badge bg-secondary float-end">{{ topic.questions_count }}</span>
          </li>
        </ul>
      </div>

      <!-- Questions Column -->
<div class="col-md-6">
  <h5>Questions</h5>
  <div v-if="questions.length === 0" class="text-muted">Select a topic to see questions</div>

  <div v-else>
    <div 
      v-for="question in questions" 
      :key="question.id" 
      class="card mb-3 shadow-sm"
    >
      <div class="card-header d-flex justify-content-between align-items-center bg-primary text-white">
        <span>Difficulty: <strong>{{ question.difficulty_level }}</strong></span>
        <span class="badge bg-light text-dark">Type: {{ question.question_type.toUpperCase() }}</span>
      </div>

      <div class="card-body">
        <!-- Question Text with LaTeX -->
        <p v-html="question.is_math ? renderMath(question.question) : question.question"></p>

        <!-- Optional Question Image -->
        <div v-if="question.question_image_url" class="mb-3 text-center">
          <img :src="question.question_image_url" class="img-fluid rounded" alt="Question Image">
        </div>

        <!-- MCQ Options -->
        <ul class="list-group">
          <li 
            v-for="(option, idx) in question.options" 
            :key="idx" 
            class="list-group-item list-group-item-action"
            style="cursor: pointer;"
          >
            <span class="me-2 fw-bold">{{ String.fromCharCode(65 + idx) }}.</span>
            <span v-html="question.is_math ? renderMath(`$${option}$`) : option"></span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</div>


    </div>
  </div>
</template>

<script>
import axios from 'axios';
import katex from 'katex';
import 'katex/dist/katex.min.css';

export default {
  name: "SubjectsOverview",
  data() {
    return {
      subjects: [],
      topics: [],
      questions: [],
      selectedSubject: null,
      selectedTopic: null
    };
  },
  mounted() {
    this.fetchSubjects();
  },
  methods: {
    fetchSubjects() {
      axios.get('/subjects/overview')
        .then(response => {
          this.subjects = response.data;
        })
        .catch(error => {
          console.error('Error fetching subjects:', error);
        });
    },
    selectSubject(subject) {
      this.selectedSubject = subject;
      this.selectedTopic = null;
      this.questions = [];
      this.fetchTopics(subject.id);
    },
    fetchTopics(subjectId) {
      axios.get(`/subjects/${subjectId}/topics`)
        .then(response => {
          this.topics = response.data.topics;
        })
        .catch(error => {
          console.error('Error fetching topics:', error);
        });
    },
    selectTopic(topic) {
      this.selectedTopic = topic;
      this.fetchQuestions(topic.id);
    },
    fetchQuestions(topicId) {
      axios.get(`/topics/${topicId}/questions`)
        .then(response => {
          let questions = response.data.questions;
          // Normalize options (parse if it's a string)
          questions.forEach(q => {
            if (typeof q.options === 'string') {
                try {
                    q.options = JSON.parse(q.options);
                } catch (e) {
                    console.error('Error parsing options for question:', q.id, e);
                    q.options = [];
                }
            }
          });
          this.questions = questions;
        })
        .catch(error => {
          console.error('Error fetching questions:', error);
        });
    },
    renderMath(text) {
      if (!text) return '';

      // Replace display math $$...$$
      text = text.replace(/\$\$([^$]+)\$\$/g, (_, math) => {
        try { return katex.renderToString(math, { displayMode: true, throwOnError: false }); }
        catch (e) { console.error(e); return math; }
      });

      // Replace inline math $...$
      text = text.replace(/\$(.+?)\$/g, (_, math) => {
        try { return katex.renderToString(math, { displayMode: false, throwOnError: false }); }
        catch (e) { console.error(e); return math; }
      });

      return text;
    },
    isMath(text) {
      return /\$/.test(text) || /\\[a-zA-Z]+/.test(text);
    }
     
  }
};
</script>

<style scoped>
.list-group-item.active {
  background-color: #0d6efd;
  border-color: #0d6efd;
  color: white;
}
</style>
