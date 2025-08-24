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
        <button class="btn btn-success me-3" @click="saveOrder" :disabled="isSaving">
          <span v-if="isSaving" class="spinner-border spinner-border-sm me-1" role="status"></span>
          {{ isSaving ? 'Saving...' : 'Save Changes' }}
        </button>

        <div class="btn-group" role="group">
          <button 
            type="button" 
            class="btn btn-primary dropdown-toggle" 
            data-bs-toggle="dropdown" 
            :disabled="isLoading"
            aria-expanded="false"
          >
            <span v-if="isLoading" class="spinner-border spinner-border-sm me-1" role="status"></span>
            {{ isLoading ? 'Generating...' : 'Download PDF' }}
          </button>
          <ul class="dropdown-menu">
            <li>
              <a class="dropdown-item" href="#" @click.prevent="generatePdf()">
                <i class="bi bi-file-earmark-check me-2"></i>Marking Guide
              </a>
            </li>
            <li>
              <a class="dropdown-item" href="#" @click.prevent="generatePdfStudent()">
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
          <div class="mb-2" v-html="renderMath(question.question_text)"></div>

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
                :checked="option.is_correct"
                disabled
              >
              <label class="form-check-label d-flex align-items-start" :for="'q' + question.id + 'o' + optIndex">
                <span class="me-2 fw-bold">{{ String.fromCharCode(65 + optIndex) }}.</span>
                <span v-html="renderMath(option.option_text)"></span>
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
                :checked="question.correct_answer === opt"
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
      showAnswer: false,
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
        option_text: qData.is_math ? `$${opt}$` : opt,
        is_correct: opt.toString() === correct
      }));
      return {
        id: q.id,
        question_text: qData.question || '',
        question_type: qData.question_type || 'mcq',
        question_image: qData.question_image_url || null,
        options,
        correct_answer: correct,
        is_math: qData.is_math || false,
        marks: qData.marks || 0
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
     cleanMath (text)  {
      if (!text) return '';
      if (text.startsWith('$') && text.endsWith('$')) {
        return text.slice(1, -1).trim();
      }
      return text;
    },
    generatePdf(isTeacher = true) {
      this.showAnswer = isTeacher;
      const pdfContent = document.createElement('div');
      pdfContent.style.padding = '30px';
      pdfContent.style.fontFamily = 'Times New Roman, serif';
      pdfContent.style.color = '#000';
      pdfContent.style.fontSize = '12pt';
      pdfContent.style.lineHeight = '1.5';
      let schoolLogoHtml = '';
      if(this.assessment.school?.logo_url) {
        schoolLogoHtml = `<img src=\"${this.assessment.school.logo_url}\" style=\"max-height: 80px; margin-bottom: 10px; display: block; margin-left: auto; margin-right: auto;\" />`;
      }
      pdfContent.innerHTML = `
        <div style=\"text-align:center; margin-bottom:40px; border-bottom: 2px solid #000; padding-bottom: 10px;\">
          ${schoolLogoHtml}
          <h1 style=\"font-size: 24pt; margin-bottom: 5px;\">${this.assessment.creator.school?.school_name || 'School Name'}</h1>
          <p style=\"font-size: 12pt; margin: 0;\">${this.assessment.creator.school?.address || 'School Address'}</p>
          ${isTeacher ? '' : `<div style=\"margin-top: 20px; text-align: left; font-size: 12pt;\">
            <p><strong>Student Name:</strong> ____________________________</p>
            <p><strong>Grade:</strong> ____________________________</p>
          </div>`}
          <div style=\"text-align:center; margin-top: 30px;\">
            <h2 style=\"font-size: 18pt; margin-bottom: 5px;\">${this.assessment.title}</h2>
            <p style=\"font-size: 14pt; margin: 0;\">Subject: ${this.assessment.subject?.name || ''}</p>
            <p style=\"font-size: 14pt; margin: 0;\">Due Date: ${this.assessment.due_date || ''}</p>
          </div>
        </div>
        `;

        // Calculate total marks
const totalMarks = this.questions.reduce((sum, q) => sum + (parseFloat(q.marks || 0) || 0), 0);

        // Questions
        this.questions.forEach((q, idx) => {
          const questionDiv = document.createElement('div');
          questionDiv.style.marginBottom = '30px';

          // Question Number, Text and Marks
          const qHeader = document.createElement('h2');
          qHeader.style.fontSize = '14pt';
          qHeader.style.marginBottom = '10px';
          qHeader.style.borderBottom = '1px solid #ccc';
          qHeader.style.paddingBottom = '5px';
          qHeader.innerHTML = `Question ${idx + 1} <span style=\"color: #6c757d; float: right; font-weight: normal;\">[marks: ${q.marks || 0}]</span>`;
          questionDiv.appendChild(qHeader);

          const qText = document.createElement('div');
          qText.style.marginBottom = '10px';
          qText.innerHTML = q.is_math ? this.renderMath(q.question_text, { displayMode: true}) : q.question_text;
          questionDiv.appendChild(qText);

          // Question image
          if (q.question_image) {
            const img = document.createElement('img');
            img.src = q.question_image;
            img.style.maxWidth = '300px';
            img.style.maxHeight = '200px';
            img.style.display = 'block';
            img.style.marginBottom = '10px';
            questionDiv.appendChild(img);
          }

          // Options
          q.options.forEach((opt, oidx) => {
            const optDiv = document.createElement('div');
            optDiv.style.marginLeft = '20px';
            optDiv.style.marginBottom = '6px';
            const optText = q.is_math ? katex.renderToString(this.cleanMath(opt.option_text), { displayMode: false }) : opt.option_text;
            optDiv.innerHTML = `<strong>${String.fromCharCode(65 + oidx)}.</strong> ${optText} ${isTeacher && opt.is_correct ? '<span style="color:green; font-weight: bold;">(✔)</span>' : ''}`;
            questionDiv.appendChild(optDiv);
          });

          pdfContent.appendChild(questionDiv);
        });

        // Total Marks display
        const totalMarksDiv = document.createElement('div');
        totalMarksDiv.style.textAlign = 'right';
        totalMarksDiv.style.fontSize = '14pt';
        totalMarksDiv.style.fontWeight = 'bold';
        totalMarksDiv.style.marginTop = '20px';
        // totalMarksDiv.style.color = '#6c757d';
        totalMarksDiv.textContent = `Total Marks: ${totalMarks}`;
        pdfContent.appendChild(totalMarksDiv);


        // Footer
        const footer = document.createElement('div');
        footer.style.textAlign = 'center';
        footer.style.marginTop = '40px';
        footer.style.fontSize = '10pt';
        footer.style.color = '#666';
        footer.innerHTML = `<p>Generated on: ${new Date().toLocaleString()} By ${this.assessment.creator?.name || 'N/A'}</p>`;
        pdfContent.appendChild(footer);

        // Generate PDF
        html2pdf()
          .set({
            margin: 20,
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