<template>
  <div class="questions-list container-fluid p-4 bg-white rounded shadow-sm">
    <h2 class="section-title mb-4">Question Management</h2>
    <div class="filter-section mb-4">
      <form class="row g-3 align-items-end">
        <div class="col-md-3">
          <label for="subject_id" class="form-label">Subject</label>
          <select v-model="selectedSubject" id="subject_id" @change="onSubjectChange" required class="form-select">
            <option value="" disabled>Select subject</option>
            <option v-for="subject in subjects" :key="subject.id" :value="subject.id">{{ subject.name }}</option>
          </select>
        </div>
        <div class="col-md-3">
          <label for="grade_level_id" class="form-label">Grade Level</label>
          <select v-model="selectedGradeFilter" id="grade_level_id" @change="onGradeChange" class="form-select" :disabled="!selectedSubject || gradeLevels.length === 0" required>
            <option :value="''" disabled>Select grade</option>
            <option v-for="grade in gradeLevels" :key="grade.id" :value="grade.id">{{ grade.grade_name }}</option>
          </select>
        </div>
        <div class="col-md-3">
          <label for="topic_id" class="form-label">Topic</label>
          <div class="input-group">
            <select v-model="selectedTopic" id="topic_id" @change="fetchQuestions" :disabled="!selectedGradeFilter || topics.length === 0" required class="form-select">
              <option value="" disabled>Select topic</option>
              <option v-for="topic in topics" :key="topic.id" :value="topic.id">{{ topic.topic_name }}</option>
            </select>
            <!-- <CreateTopicInline
              :subject-id="selectedSubject"
              :grade-level-id="selectedGradeFilter"
              :disabled="!canCreateTopic()"
              @created="onTopicCreated"
            /> -->
          </div>
        </div>
        <div class="col-md-3 d-flex align-items-end">
          <button
            type="button"
            @click="openAddModal"
            class="btn btn-primary w-100"
            :disabled="!selectedSubject || !selectedTopic"
            :style="(!selectedSubject || !selectedTopic) ? 'opacity:0.6;cursor:not-allowed;' : ''"
            title="Add a new question to this topic"
          >
            <span class="fw-bold">+</span> Add Question
          </button>
        </div>
      </form>
    </div>
    <div v-if="loading" class="d-flex flex-column align-items-center justify-content-center py-5">
      <div class="spinner-border text-primary mb-3" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <div class="text-primary fw-semibold">Loading questions...</div>
    </div>
    <div v-else-if="filteredQuestions.length === 0 && selectedTopic && !showAddInline" class="no-questions">
      <div class="text-center py-5 text-muted">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="1.5">
          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
          <path d="M12 8v4m0 0v4m0-4h4m-4 0H8" />
        </svg>
        <p class="mt-3">No questions found for this topic.</p>
        <button type="button" @click="openAddModal" class="btn btn-outline-primary mt-2" title="Add your first question">
          <span class="fw-bold">+</span> Add First Question
        </button>
      </div>
    </div>
    <div v-else-if="showAddInline && filteredQuestions.length === 0 && selectedTopic" class="empty-add-form">
      <div class="card card-body shadow-sm mb-4">
        <QuestionForm
          :subject-id="selectedSubject"
          :topic-id="selectedTopic"
          :selected-grade-filter="selectedGradeFilter"
          @created="onCreatedInline"
          @cancel="closeAddInline"
        />
      </div>
    </div>

    <div v-else class="questions-container">
      <div v-for="(q, idx) in filteredQuestions" :key="q.id" class="card mb-3 shadow-sm">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <div class="fw-bold text-secondary">#{{ idx + 1 }}</div>
            <div class="d-flex align-items-center gap-2">
              <span class="badge bg-light text-dark border me-1">{{ q.question_type ? q.question_type.replace('_', ' ') : (q.is_chemistry ? 'Chemistry' : (q.is_math ? 'Math' : 'Text')) }}</span>
              <span v-if="q.grade_level_id" class="badge bg-info text-dark">{{ gradeLevels.find(g => g.id === q.grade_level_id)?.grade_name || q.grade_level_id }}</span>
            </div>
            <button type="button" class="btn btn-outline-secondary btn-sm" @click="openEditModal(q)" title="Edit question">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              <span class="ms-1">Edit</span>
            </button>
          </div>
          <div class="mb-2">
            <!-- Display question text, math, or KaTeX -->
            <span v-if="q.is_math && (q.katex_content || (q.metadata && q.metadata.katex_content))" class="fw-semibold" v-html="renderKaTeX(q.katex_content || (q.metadata && q.metadata.katex_content))"></span>
            <span v-else class="fw-semibold" v-html="renderMarkdown(q.question)"></span>
            <img v-if="q.question_image_url" :src="q.question_image_url" alt="Question Image" class="img-thumbnail ms-2" style="max-width:180px;max-height:120px;object-fit:contain;" />
          </div>
          <div>
            <!-- MCQ options -->
            <template v-if="q.question_type === 'mcq' && Array.isArray(q.options)">
              <div v-for="(opt, oidx) in q.options" :key="oidx" class="form-check" :class="{'bg-success-subtle': isCorrectOption(q.correct_answer, getOptionValue(opt))}">
                <input class="form-check-input" type="checkbox" :checked="isCorrectOption(q.correct_answer, getOptionValue(opt))" disabled />
                <label v-if="q.is_math" class="form-check-label" v-html="renderMarkdown(getOptionValue(opt))"></label>
                <label v-else class="form-check-label">{{ getOptionValue(opt) }}</label>
              </div>
            </template>
            <!-- True/False -->
            <template v-else-if="q.question_type === 'true_false'">
              <div class="form-check" :class="{'bg-success-subtle': isCorrectOption(q.correct_answer, 'True')}">
                <input class="form-check-input" type="checkbox" :checked="isCorrectOption(q.correct_answer, 'True')" disabled />
                <label class="form-check-label">True</label>
              </div>
              <div class="form-check" :class="{'bg-success-subtle': isCorrectOption(q.correct_answer, 'False')}">
                <input class="form-check-input" type="checkbox" :checked="isCorrectOption(q.correct_answer, 'False')" disabled />
                <label class="form-check-label">False</label>
              </div>
            </template>
            <!-- Short Answer -->
            <template v-else-if="q.question_type === 'short_answer'">
              <div class="form-text">Short Answer: <strong v-if="q.is_math" v-html="renderMarkdown(q.correct_answer)"></strong><strong v-else>{{ q.correct_answer }}</strong></div>
            </template>
            <!-- Other options -->
            <template v-else-if="Array.isArray(q.options)">
              <div v-for="(opt, oidx) in q.options" :key="oidx" class="form-check" :class="{'bg-success-subtle': isCorrectOption(q.correct_answer, getOptionValue(opt))}">
                <input class="form-check-input" type="checkbox" :checked="isCorrectOption(q.correct_answer, getOptionValue(opt))" disabled />
                <label v-if="q.is_math" class="form-check-label" v-html="renderMarkdown(getOptionValue(opt))"></label>
                <label v-else class="form-check-label">{{ getOptionValue(opt) }}</label>
              </div>
            </template>
          </div>
          <div class="d-flex justify-content-between align-items-center mt-3">
            <span class="badge bg-light text-dark">{{ q.marks || 1 }} {{ q.marks === 1 ? 'point' : 'points' }}</span>
            <div>
              <span v-if="q.difficulty" class="badge bg-warning text-dark me-1">{{ q.difficulty }}</span>
              <span v-if="q.required" class="badge bg-primary">Required</span>
            </div>
          </div>
          <div v-if="q.explanation" class="alert alert-info mt-2 p-2">
            <div class="fw-semibold">Explanation:</div>
            <div>{{ q.explanation }}</div>
          </div>
          <!-- Insert add form after last question -->
          <div v-if="showAddInline && idx === filteredQuestions.length - 1" class="mt-4">
            <div class="card card-body shadow-sm">
              <QuestionForm
                :subject-id="selectedSubject"
                :topic-id="selectedTopic"
                :selected-grade-filter="selectedGradeFilter"
                :compact="true"
                hide-meta
                @created="onCreatedInline"
                @cancel="closeAddInline"
              />
            </div>
          </div>
        </div>
      </div>
      <!-- If no questions, show add form at top -->
      <div v-if="showAddInline && filteredQuestions.length === 0" class="mt-4">
        <div class="card card-body shadow-sm">
          <QuestionForm
            :subject-id="selectedSubject"
            :topic-id="selectedTopic"
            :selected-grade-filter="selectedGradeFilter"
            :compact="true"
            hide-meta
            @created="onCreatedInline"
            @cancel="closeAddInline"
          />
        </div>
      </div>

      <!-- Add Question button after the last question -->
      <div v-if="questions.length > 0 && !showAddInline" class="d-flex justify-content-center mt-4">
        <button type="button" @click="openAddModal" class="btn btn-outline-primary" title="Add another question">
          <span class="fw-bold">+</span> Add Question
        </button>
      </div>
    </div>

    <!-- Modal for edit only -->
    <div v-if="showModal" class="modal fade show d-block" tabindex="-1" style="background:rgba(0,0,0,0.25);" @click.self="closeModal">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Edit Question</h5>
            <button type="button" class="btn-close" @click="closeModal" title="Close"></button>
          </div>
          <div class="modal-body">
            <QuestionForm
              v-if="showModal"
              :edit-question="editingQuestion"
              :subject-id="selectedSubject"
              :topic-id="selectedTopic"
              :selected-grade-filter="selectedGradeFilter"
              @created="onSaved"
              @cancel="closeModal"
            />
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeModal">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import QuestionForm from './QuestionFormWithMathKaTeX.vue';
import CreateTopicInline from './CreateTopicInline.vue';
import katex from 'katex';
import 'katex/dist/katex.min.css';
export default {
  name: 'QuestionsList',
  components: { QuestionForm, CreateTopicInline },
  data() {
    return {
      selectedSubject: '',
      topics: [],
      selectedTopic: '',
      questions: [],
      filteredQuestions: [],
      subjects: [],
      gradeLevels: [],
      selectedGradeFilter: '',
      loading: false,
      showModal: false,
      editingQuestion: null,
      showAddInline: false,
    };
  },
  created() {
    this.fetchSubjects();
    this.fetchGradeLevels();
  },
  methods: {
    // Render KaTeX content safely
    renderKaTeX(text) {
      if (!text) return '';
      
      try {
        // Handle MathML content by extracting and rendering with KaTeX
        let processedText = text.replace(/<math[^>]*>[\s\S]*?<\/math>/g, (mathML) => {
          try {
            // Extract content from MathML
            // For complex MathML, we'll extract specific elements
            let latex = '';
            
            // Extract variables (mi elements)
            const miMatches = mathML.match(/<mi>([^<]*)<\/mi>/g);
            if (miMatches && miMatches.length > 0) {
              miMatches.forEach(match => {
                const content = match.replace(/<mi>([^<]*)<\/mi>/, '$1');
                latex += content;
              });
            }
            
            // Extract operators (mo elements)
            const moMatches = mathML.match(/<mo>([^<]*)<\/mo>/g);
            if (moMatches && moMatches.length > 0) {
              moMatches.forEach(match => {
                const content = match.replace(/<mo>([^<]*)<\/mo>/, '$1');
                latex += content;
              });
            }
            
            // Extract numbers (mn elements)
            const mnMatches = mathML.match(/<mn>([^<]*)<\/mn>/g);
            if (mnMatches && mnMatches.length > 0) {
              mnMatches.forEach(match => {
                const content = match.replace(/<mn>([^<]*)<\/mn>/, '$1');
                latex += content;
              });
            }
            
            // Handle special case for modulus |z|
            if (mathML.includes('<mfenced open="|" close="|">')) {
              const mfencedContent = mathML.match(/<mfenced[^>]*>([\s\S]*?)<\/mfenced>/g);
              if (mfencedContent && mfencedContent.length > 0) {
                const innerContent = mfencedContent[0].match(/<mi>([^<]*)<\/mi>/g);
                if (innerContent && innerContent.length > 0) {
                  const variable = innerContent[0].replace(/<mi>([^<]*)<\/mi>/, '$1');
                  latex = `|${variable}|`;
                }
              }
            }
            
            // If we couldn't extract anything meaningful, use a simple approach
            if (!latex) {
              latex = mathML
                .replace(/<math[^>]*>([\s\S]*?)<\/math>/, '$1')
                .replace(/<[^>]*>/g, '')
                .trim();
            }
            
            // Render the extracted LaTeX with KaTeX
            return katex.renderToString(latex, { throwOnError: false, displayMode: false });
          } catch (err) {
            console.error('MathML processing error:', err);
            return mathML; // Return original MathML on error
          }
        });
        
        // Process KaTeX delimiters \( ... \)
        processedText = processedText.replace(/\\\(([^\)]*)\\\)/g, (match, latex) => {
          try {
            return katex.renderToString(latex, { throwOnError: false, displayMode: false });
          } catch (err) {
            console.error('KaTeX rendering error:', err);
            return match; // Return original on error
          }
        });
        
        // Process standard LaTeX notation like \sqrt{169}
        processedText = processedText.replace(/\\sqrt\{([^}]*)\}/g, (match, content) => {
          try {
            return katex.renderToString(`\\sqrt{${content}}`, { throwOnError: false, displayMode: false });
          } catch (err) {
            console.error('KaTeX rendering error:', err);
            return match; // Return original on error
          }
        });
        
        // Process trigonometric functions with degrees
        processedText = processedText.replace(/\\(cos|sin|tan)([^\s{}]+)\^0/g, (match, func, angle) => {
          try {
            return katex.renderToString(`\\${func}${angle}^\\circ`, { throwOnError: false, displayMode: false });
          } catch (err) {
            console.error('KaTeX trig function rendering error:', err);
            return match; // Return original on error
          }
        });
        
        // Process polar form expressions directly
        processedText = processedText.replace(/\\\((.*?)\\\)/g, (match, content) => {
          // Check if this is a polar form expression
          if (content.includes('\\sqrt') && content.includes('\\cos') && content.includes('\\sin')) {
            try {
              // Directly render the entire LaTeX expression
              return katex.renderToString(content, { throwOnError: false, displayMode: false });
            } catch (err) {
              console.error('KaTeX polar form rendering error:', err);
              return match; // Return original on error
            }
          }
          return match; // Not a polar form, let other handlers process it
        });
        
        // Return the processed text
        return processedText;
      } catch (err) {
        console.error('Error processing KaTeX:', err);
        return text; // Return original text on error
      }
    },
    
    // Check if an option is a KaTeX object
    isKaTeXOption(opt) {
      return typeof opt === 'object' && opt !== null && opt.katex_content;
    },
    
    // Get the display value of an option (handles both string and object options)
    getOptionValue(opt) {
      if(typeof opt ==='object' && opt !== null && opt.value) {
        return opt.value.replace(/\\\\/g, '\\');
      }
      if (typeof opt === 'string') {
        return opt.replace(/\\\\/g, '\\');
      }
      return opt;
    },
    filteredQuestions() {
      if (!this.selectedTopic){
        return [];
      }
      return this.questions.filter(q => q.topic_id === this.selectedTopic);
    },
    processedQuestions() {
      return this.filteredQuestions.map(q => {
        const newQ = { ...q };
        // Ensure options are always an array
        if (typeof newQ.options === 'string') {
          try {
            newQ.options = JSON.parse(newQ.options);
          } catch (e) {
            console.error(`Failed to parse options for question ID ${newQ.id}:`, newQ.options);
            newQ.options = [];
          }
        }
        // Ensure correct_answer is usable
        if (typeof newQ.correct_answer === 'string') {
          try {
            newQ.correct_answer = JSON.parse(newQ.correct_answer);
          } catch (e) {
            // Not a JSON string, leave as is.
          }
        }
        return newQ;
      });
    },
    // renderMarkdown(content) {
    //   if (!content) return '';
    //   content = content.replace(/\\\[(.*?)\\\]|\$\$(.*?)\$\$/gs, (match, p1, p2) => {
    //     const math = p1 || p2;
    //     try {
    //       return katex.renderToString(math, { displayMode: true, throwOnError: false });
    //     } catch (e) {
    //       return `<span class="text-danger">Error rendering KaTeX: ${e.message}</span>`;
    //     }
    //   });
    //   // Replace inline KaTeX delimeters \(...\) and $...$
    //   content = content.replace(/\\\((.*?)\\\)|\$(.*?)\$/g, (match, p1, p2) => {
    //     const math = p1 || p2;
    //     if (math.trim() === '') return match;
    //     try {
    //       return katex.renderToString(math, { displayMode: false, throwOnError: false });
    //     } catch (e) {
    //       return `<span class="text-danger">Error rendering KaTeX: ${e.message}</span>`;
    //     }
    //   });
    //   return content;
    // },
    renderMarkdown(content) {
      if (!content) return '';

      const processedContent = String(content);

      // A helper function to safely render with KaTeX
      const safeRender = (math, options) => {
        try {
          // Let KaTeX display its own errors gracefully
          return katex.renderToString(math, { ...options, throwOnError: false, output: 'html' });
        } catch (e) {
          // This is a fallback for unexpected errors in KaTeX itself
          return `<span class="text-danger" title="${e.message}">KaTeX Error</span>`;
        }
      };

      // Regex to find all forms of delimiters.
      const regex = /\\\[(.*?)\\\]|\$\$(.*?)\$\$|\\\((.*?)\\\)|\$(.*?)\$/gs;
      
      let delimitersFound = false;
      const newContent = processedContent.replace(regex, (match, block1, block2, inline1, inline2) => {
        delimitersFound = true;
        const isBlock = block1 !== undefined || block2 !== undefined;
        const math = block1 || block2 || inline1 || inline2;
        
        if (math.trim() === '') return match;

        return safeRender(math, { displayMode: isBlock });
      });

      // If delimiters were found, we assume the content is mixed text and math.
      if (delimitersFound) {
        return newContent;
      }

      // If no delimiters were found, try to render the whole string.
      // This handles the case for the options which are pure LaTeX.
      return safeRender(processedContent, { displayMode: false });
    },
    
    isCorrectOption(correct, opt) {
      // Handles correct_answer as string, array, or JSON string
      if (Array.isArray(correct)) {
        return correct.map(String).includes(String(opt));
      }
      // If correct is a JSON string (e.g., '"2"'), parse it
      try {
        const parsed = JSON.parse(correct);
        if (Array.isArray(parsed)) {
          return parsed.map(String).includes(String(opt));
        }
        return String(parsed) === String(opt);
      } catch (e) {
        // If not JSON, fallback to string compare
        return String(correct) === String(opt);
      }
    },
    async fetchSubjects() {
      try {
        const res = await axios.get('http://localhost:8000/api/subjects');
        this.subjects = res.data;
      } catch (e) {
        this.subjects = [];
      }
    },
    async fetchGradesForSubject(subjectId) {
      // Backend endpoint: /api/subjects/{subjectId}/grades
      // Returns grades associated with this subject (via grade_topic pivot)
      try {
        const res = await axios.get(`http://localhost:8000/api/subjects/${subjectId}/grades`);
        this.gradeLevels = res.data;
      } catch (e) {
        this.gradeLevels = [];
      }
    },
    async fetchTopicsForSubjectAndGrade(subjectId, gradeId) {
      // Backend endpoint: /api/subjects/{subjectId}/grades/{gradeId}/topics
      // Returns topics for this subject and grade (via grade_topic pivot)
      this.topics = [];
      this.selectedTopic = '';
      this.questions = [];
      if (!subjectId || !gradeId) return;
      try {
        const res = await axios.get(`http://localhost:8000/api/subjects/${subjectId}/grades/${gradeId}/topics`);
        this.topics = res.data;
      } catch (e) {
        this.topics = [];
      }
    },
    onSubjectChange() {
      this.selectedGradeFilter = '';
      this.selectedTopic = '';
      this.topics = [];
      this.questions = [];
      if (this.selectedSubject) {
        this.fetchGradesForSubject(this.selectedSubject);
      } else {
        this.gradeLevels = [];
      }
    },
    onGradeChange() {
      this.selectedTopic = '';
      this.topics = [];
      this.questions = [];
      if (this.selectedSubject && this.selectedGradeFilter) {
        this.fetchTopicsForSubjectAndGrade(this.selectedSubject, this.selectedGradeFilter);
      }
    },
    onTopicCreated(topic) {
      // Add new topic to list and select it
      this.topics.push(topic);
      this.selectedTopic = topic.id;
    },
    async createTopic() {
      this.topicCreateError = '';
      if (!this.selectedSubject || !this.selectedGradeFilter || !this.newTopicName) {
        this.topicCreateError = 'Please select subject, grade, and enter a topic name.';
        return;
      }
      try {
        // Create topic for subject
        const topicPayload = {
          subject_id: this.selectedSubject,
          topic_name: this.newTopicName,
        };
        const topicRes = await axios.post('http://localhost:8000/api/topics', topicPayload);
        const topic = topicRes.data;
        // Associate topic with grade via pivot
        await axios.post('http://localhost:8000/api/grade-topic', {
          topic_id: topic.id,
          grade_level_id: this.selectedGradeFilter,
        });
        // Add new topic to list and select it (with grade association)
        topic.grade_topics = [{ grade_level_id: this.selectedGradeFilter }];
        this.topics.push(topic);
        this.selectedTopic = topic.id;
        this.showCreateTopic = false;
        this.newTopicName = '';
      } catch (e) {
        this.topicCreateError = e.response?.data?.message || 'Failed to create topic.';
      }
    },
     canCreateTopic() {
      // Ensure both are truthy and not empty strings
      return Boolean(this.selectedSubject) && Boolean(this.selectedGradeFilter);
    },
    async fetchGradeLevels() {
      try {
        // Try to fetch from the API first
        const response = await axios.get('http://localhost:8000/api/grade-levels');
        this.gradeLevels = response.data;
      } catch (e) {
        try {
          // If dedicated endpoint fails, try to get from the database table directly
          const response = await axios.get('http://localhost:8000/api/grades');
          this.gradeLevels = response.data.map(grade => grade.grade_name);
        } catch (err) {
          // Fallback to default grade levels if both APIs fail
          this.gradeLevels = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'];
        }
      }
    },
    
    async fetchQuestions() {
        this.questions = [];
        this.filteredQuestions = [];
        if (!this.selectedTopic) return;
        this.loading = true;
        try {
          // Add grade level filter if selected
          let url = `http://localhost:8000/api/topics/${this.selectedTopic}/questions`;
          if (this.selectedGradeFilter) {
            url += `?grade_level_id=${this.selectedGradeFilter}`;
          }
          const res = await axios.get(url);
          this.questions = res.data;
          this.applyFilters();
        } catch (e) {
          this.questions = [];
          this.filteredQuestions = [];
        }
        this.loading = false;
  },
    applyFilters() {
      // Questions are no longer associated with grade_level_id; just show all for the topic
      this.filteredQuestions = [...this.questions];
    },
    openAddModal() {
      this.showAddInline = true;
    },
    closeAddInline() {
      this.showAddInline = false;
    },
    onCreatedInline() {
      this.closeAddInline();
      this.fetchQuestions();
    },
    openEditModal(q) {
      this.editingQuestion = q;
      this.showModal = true;
    },
    closeModal() {
      this.showModal = false;
      this.editingQuestion = null;
    },
    onSaved() {
      this.closeModal();
      this.fetchQuestions();
    },
  },
  watch: {
    selectedTopic(newVal) {
      if (newVal) this.fetchQuestions();
    },
  },
};
</script>

<style scoped>
/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0,0,0,0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(2px);
  transition: all 0.3s ease;
}
.modal-content {
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 8px 40px rgba(60,72,88,0.18);
  min-width: 340px;
  max-width: 98vw;
  max-height: 98vh;
  overflow-y: auto;
  position: relative;
  animation: modalFadeIn 0.3s ease;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.2em 1.5em;
  border-bottom: 1px solid #e5e7eb;
}
.modal-title {
  font-size: 1.3em;
  font-weight: 600;
  color: #374151;
  margin: 0;
}
.modal-close {
  background: none;
  border: none;
  font-size: 1.8em;
  color: #888;
  cursor: pointer;
  transition: color 0.2s;
  line-height: 1;
}
.modal-close:hover {
  color: #4f46e5;
}
.modal-footer {
  padding: 1em 1.5em 1.5em;
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid #e5e7eb;
  margin-top: 1em;
}
.cancel-btn {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 0.7em 1.5em;
  font-size: 1em;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}
.cancel-btn:hover {
  background: #e5e7eb;
  border-color: #9ca3af;
}

/* Main Container Styles */
.questions-list {
  max-width: 100%;
  margin: 0 auto;
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 6px 32px rgba(60,72,88,0.13), 0 1.5px 4px rgba(60,72,88,0.10);
  padding: 2em;
  border: 1.5px solid #e5e7eb;
}
.section-title {
  font-size: 1.6em;
  font-weight: 700;
  color: #374151;
  margin: 0 0 1em 0;
  padding-bottom: 0.5em;
  border-bottom: 2px solid #f3f4f6;
}
.filter-section {
    max-width: 100%;
  background: #f9fafb;
  border-radius: 10px;
  padding: 1.5em;
  margin-bottom: 2em;
  border: 1px solid #e5e7eb;
}

/* Button Styles */
.add-question-btn {
  background: linear-gradient(90deg, #6366f1 0%, #60a5fa 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 0.7em 1.5em;
  font-size: 1.08em;
  font-weight: 600;
  cursor: pointer;
  margin-left: 1em;
  box-shadow: 0 2px 10px rgba(99,102,241,0.10);
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5em;
}
.add-question-btn:hover {
  background: linear-gradient(90deg, #4f46e5 0%, #2563eb 100%);
  box-shadow: 0 6px 24px rgba(99,102,241,0.13);
  transform: translateY(-2px) scale(1.02);
}
.btn-icon {
  font-size: 1.2em;
  font-weight: 700;
  line-height: 1;
}
.action-btn {
  display: flex;
  align-items: center;
  gap: 0.4em;
  background: #f3f4f6;
  color: #4b5563;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 0.5em 0.8em;
  font-size: 0.9em;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}
.action-btn:hover {
  background: #e5e7eb;
  color: #1f2937;
  border-color: #d1d5db;
}
.edit-btn:hover {
  background: #dbeafe;
  color: #2563eb;
  border-color: #93c5fd;
}

/* Select Styles */
.select-wrapper {
  position: relative;
  width: 100%;
}
.select-wrapper select {
  appearance: none;
  width: 100%;
  padding: 0.8em 1em;
  border: 1.5px solid #d1d5db;
  border-radius: 8px;
  background: #f8fafc;
  font-size: 1em;
  cursor: pointer;
  transition: all 0.2s;
}
.select-wrapper select:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99,102,241,0.2);
  outline: none;
  background: #fff;
}
.select-arrow {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 6px solid #6b7280;
  pointer-events: none;
}

/* Loading States */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3em 0;
  gap: 1em;
}
.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(99,102,241,0.2);
  border-radius: 50%;
  border-top-color: #6366f1;
  animation: spin 1s linear infinite;
}
.loading-text {
  color: #6366f1;
  font-weight: 500;
  font-size: 1.1em;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3em 0;
  gap: 1.5em;
  color: #6b7280;
  text-align: center;
}
.empty-state p {
  font-size: 1.1em;
  margin: 0;
}

/* Question Card Styles */
.questions-container {
    max-width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.5em;
}
.question-card {
    max-width: 100%;
  margin-bottom: 0.5em;
  transition: transform 0.2s, box-shadow 0.2s;
  position: relative;
  overflow: hidden;
  border-left: 3px solid transparent;
}
.question-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(60,72,88,0.1);
  border-left-color: #6366f1;
}
.question-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 0.8em;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 1em;
}
.question-id {
  font-size: 0.9em;
  font-weight: 600;
  color: #6b7280;
  background: #f3f4f6;
  padding: 0.3em 0.6em;
  border-radius: 4px;
}
.question-badges {
  display: flex;
  align-items: center;
  gap: 0.5em;
}

.question-type-badge {
  font-size: 0.8em;
  font-weight: 600;
  color: #4b5563;
  background: #f3f4f6;
  padding: 0.3em 0.7em;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
}
.math-badge {
  color: #5b21b6;
  background: #ede9fe;
  border-color: #c4b5fd;
}

.grade-badge-container {
  display: flex;
}

.grade-badge {
  display: inline-block;
  padding: 0.2em 0.5em;
  font-size: 0.7em;
  font-weight: 500;
  line-height: 1;
  color: #5b21b6;
  background-color: #f5f3ff;
  border: 1px solid #ddd6fe;
  border-radius: 9999px;
}
.question-actions {
  display: flex;
  gap: 0.5em;
}
.question-image {
  max-width: 180px;
  max-height: 120px;
  margin-left: 1em;
  border-radius: 7px;
  border: 1px solid #e5e7eb;
  object-fit: contain;
}

/* Option Styles */
.correct-option {
  background: #f0fdf4;
  border-radius: 6px;
  border-left: 3px solid #10b981;
}
.points-badge {
  background: #f3f4f6;
  color: #4b5563;
  padding: 0.3em 0.7em;
  border-radius: 4px;
  font-size: 0.9em;
  font-weight: 600;
}
.high-points {
  background: #fef3c7;
  color: #92400e;
}
.difficulty-badge {
  font-size: 0.8em;
  font-weight: 600;
  padding: 0.3em 0.7em;
  border-radius: 4px;
}
.difficulty-easy {
  background: #d1fae5;
  color: #065f46;
}
.difficulty-medium {
  background: #dbeafe;
  color: #1e40af;
}
.difficulty-hard {
  background: #fee2e2;
  color: #b91c1c;
}
.required-badge {
  background: #e0e7ff;
  color: #4338ca;
  font-size: 0.8em;
  font-weight: 600;
  padding: 0.3em 0.7em;
  border-radius: 4px;
}

/* Explanation Styles */
.explanation {
  background: #f8fafc;
  border-radius: 7px;
  padding: 0.7em 1em;
  margin-top: 0.7em;
  color: #444;
  font-size: 1em;
  border: 1px solid #e5e7eb;
}
.explanation-header {
  font-weight: 600;
  margin-bottom: 0.3em;
  color: #4b5563;
}
.explanation-content {
  color: #6b7280;
  line-height: 1.5;
}

/* Add Question After Container */
.add-question-after-container {
  display: flex;
  justify-content: center;
  margin: 1.5em 0;
  animation: fadeIn 0.3s ease;
}

.add-question-after {
  background: linear-gradient(90deg, #6366f1 0%, #60a5fa 100%);
  margin-left: 0;
  padding: 0.8em 1.8em;
  box-shadow: 0 4px 15px rgba(99,102,241,0.15);
  transition: all 0.3s ease;
}

.add-question-after:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(99,102,241,0.2);
}

/* Inline Add Form */
.inline-add-form {
  margin-top: 1.5em;
  margin-bottom: 1.5em;
  background: #f8fafc;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(60,72,88,0.07);
  padding: 1.2em 1.5em 1em 1.5em;
  border: 1.5px solid #e5e7eb;
  animation: fadeIn 0.3s ease;
}

.empty-add-form {
  margin-top: 1.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1.5rem;
  background-color: #f9fafb;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes modalFadeIn {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Responsive Styles */
@media (max-width: 768px) {
  .questions-list {
    padding: 1.5em 1em;
    border-radius: 12px;
  }
  .filter-section {
    padding: 1em;
  }
  .question-actions {
    flex-direction: column;
  }
  .mcq-bottom-bar {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.7em;
  }
  .mcq-toggles {
    flex-wrap: wrap;
  }
}
</style>
