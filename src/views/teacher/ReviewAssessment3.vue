<template>
  <div class="container mt-4">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <button class="btn btn-outline-secondary me-2" @click="$router.go(-1)">
          <i class="bi bi-arrow-left"></i> Back
        </button>
        <h2 class="d-inline-block mb-0">Assessment type: {{ assessment.title || 'Assessment Review' }}</h2>
      </div>
      <div>
        <div class="btn-group" role="group">
          <button 
            type="button" 
            class="btn btn-primary dropdown-toggle" 
            data-bs-toggle="dropdown" 
            :disabled="loading"
            aria-expanded="false"
          >
            {{ loading ? 'Loading...' : 'Download PDF' }}
          </button>
          <ul class="dropdown-menu">
            <li>
              <a class="dropdown-item" href="#" @click.prevent="generatePdf(true)">
                <i class="bi bi-file-earmark-check me-2"></i>Marking Guide
              </a>
            </li>
            <li>
              <a class="dropdown-item" href="#" @click.prevent="generatePdf(false)">
                <i class="bi bi-file-earmark-text me-2"></i>Student Version
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Loader -->
    <div v-if="loading" class="text-center my-5">
      <div class="spinner-border text-primary" role="status"></div>
      <p class="mt-2">Loading assessment...</p>
    </div>

    <!-- Assessment Questions -->
    <div v-else>
      <div class="list-group list-group-flush">
        <div 
          v-for="(question, index) in questions" 
          :key="question.id"
          class="list-group-item mb-3"
        >
          <!-- Question text -->
          <div class="mb-2" v-html="question.is_math ? renderMath(question.question_text) : question.question_text"></div>

          <!-- Question image -->
          <div v-if="question.question_image" class="mb-2">
            <img :src="question.question_image" class="img-thumbnail" style="max-width:180px; max-height:120px;" />
          </div>

          <!-- MCQ Options -->
          <div v-if="question.options.length" class="ms-3">
            <div 
              v-for="(option, optIndex) in question.options" 
              :key="optIndex" 
              class="form-check mb-1"
            >
              <input 
                class="form-check-input" 
                type="radio" 
                :name="'q' + question.id" 
                :id="'q' + question.id + 'o' + optIndex" 
                :checked="option.is_correct && showAnswer"
                disabled
              >
              <label class="form-check-label d-flex align-items-start" :for="'q' + question.id + 'o' + optIndex">
                <span class="me-2 fw-bold">{{ String.fromCharCode(65 + optIndex) }}.</span>
                <span v-html="question.is_math ? renderMath(option.option_text) : option.option_text"></span>
                <span v-if="showAnswer && option.is_correct" class="text-success ms-2">(✔)</span>
              </label>
            </div>
          </div>

          <!-- True/False -->
          <div v-else-if="question.question_type === 'true_false'" class="ms-3">
            <div class="form-check" v-for="opt in ['True','False']" :key="opt">
              <input 
                class="form-check-input" 
                type="radio"
                :name="'q' + question.id"
                :id="'q' + question.id + opt"
                :checked="question.correct_answer === opt && showAnswer"
                disabled
              >
              <label class="form-check-label" :for="'q' + question.id + opt">{{ opt }}</label>
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
import html2pdf from 'html2pdf.js';

export default {
  name: 'ReviewAssessment',
  data() {
    return {
      assessment: {},
      questions: [],
      loading: true,
      showAnswer: false
    };
  },
  async created() {
    await this.fetchAssessment();
  },
  methods: {
    async fetchAssessment() {
      const token = localStorage.getItem('auth_token');
      const assessmentId = this.$route.params.id;
      if (!token) { this.$router.push({ name: 'Login' }); return; }

      try {
        const response = await axios.get(`/assessments/${assessmentId}/details`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        this.assessment = response.data.assessment;
        this.questions = this.assessment.questions.map(q => {
          const qData = q.question;
          const correct = qData.correct_answer || '';
          const options = (qData.options || []).map(opt => ({
            option_text: opt,
            is_correct: opt.toString() === correct
          }));
          return {
            id: q.id,
            question_text: qData.question || '',
            question_type: qData.question_type || 'mcq',
            question_image: qData.question_image_url || null,
            options,
            correct_answer: correct,
            is_math: qData.is_math || false
          };
        });
      } catch (err) {
        console.error('Error fetching assessment', err.response || err);
      } finally {
        this.loading = false;
      }
    },

    renderMath(text) {
      if (!text) return '';

      text = text.replace(/\$\$([^$]+)\$\$/g, (_, math) => {
        try { return katex.renderToString(math, { displayMode: true, throwOnError: false }); }
        catch (e) { console.error(e); return math; }
      });

      text = text.replace(/\$(.+?)\$/g, (_, math) => {
        try { return katex.renderToString(math, { displayMode: false, throwOnError: false }); }
        catch (e) { console.error(e); return math; }
      });

      return text;
    },

    generatePdf(isTeacher = true) {
      this.showAnswer = isTeacher;

      const pdfContent = document.createElement('div');
      pdfContent.style.padding = '15px';
      pdfContent.innerHTML = `
        <div style="text-align:center; margin-bottom:20px;">
          <h1>${this.assessment.title}</h1>
          <p>Subject: ${this.assessment.subject?.name || ''}</p>
          <p>Due Date: ${this.assessment.due_date || ''}</p>
        </div>
        ${this.questions.map((q, idx) => {
          const qText = q.is_math ? this.renderMath(q.question_text) : q.question_text;
          return `
            <div style="margin-bottom:20px;">
              <div>${idx+1}. ${qText}</div>
              ${q.question_image ? `<div><img src="${q.question_image}" style="max-width:200px; max-height:150px;"></div>` : ''}
              <div style="margin-left:15px; margin-top:5px;">
                ${q.options.map((opt, oidx) => {
                  const optText = q.is_math ? this.renderMath(opt.option_text) : opt.option_text;
                  return `
                    <div>
                      <strong>${String.fromCharCode(65+oidx)}.</strong>
                      ${optText}
                      ${isTeacher && opt.is_correct ? ' <span style="color:green;">(✔)</span>' : ''}
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          `;
        }).join('')}
        <div style="text-align:center; margin-top:30px;">
          <p>Generated on: ${new Date().toLocaleString()}</p>
        </div>
      `;

      html2pdf()
        .set({
          margin: 15,
          filename: `${isTeacher ? 'teacher' : 'student'}-${this.assessment.title.replace(/[^a-z0-9]/gi,'-').toLowerCase()}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        })
        .from(pdfContent)
        .save();
    },

    generatePdfStudent() {
      this.generatePdf(false);
    }
  }
};
</script>

<style scoped>
.list-group-item {
  border: 1px solid #ddd;
  border-radius: 5px;
  padding: 15px;
}
.form-check-label span {
  display: inline-block;
}
</style>
