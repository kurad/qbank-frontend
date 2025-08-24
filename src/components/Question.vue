<template>
  <div class="form-section mb-4">
    <h3 class="section-subtitle">Add Question</h3>

    <!-- Question Input -->
    <label class="block mb-2">Question:</label>
    <textarea 
      v-model="questionText"
      placeholder="Type question text here..."
      class="border rounded p-2 w-full"
    ></textarea>

    <!-- Math Input -->
    <label class="block mt-4 mb-2">Insert Equation:</label>
    <div style="min-height: 50px; width: 100%;">
    <math-field
      ref="mathField"
      v-model="mathEquation"
      class="border rounded p-2 w-full bg-white"
      style="min-height:50px;"
    ></math-field>
</div>
    <button 
      class="mt-3 bg-blue-600 text-white px-3 py-1 rounded"
      @click="insertEquation"
    >
      Insert Equation
    </button>

    <!-- Preview -->
    <div class="mt-4">
      <h4 class="font-semibold">Preview:</h4>
      <div v-html="renderedPreview"></div>
    </div>

    <!-- Submit -->
    <button 
      class="mt-5 bg-green-600 text-white px-4 py-2 rounded"
      @click="submitQuestion"
    >
      Save Question
    </button>
  </div>
</template>

<script>
import "mathlive"; 
import katex from "katex";
import "katex/dist/katex.min.css";

export default {
  data() {
    return {
      questionText: "",
      mathEquation: "",
      renderedPreview: "",
    };
  },
  methods: {
    insertEquation() {
      if (this.mathEquation.trim()) {
        // Insert LaTeX inline inside text
        this.questionText += ` $${this.mathEquation}$ `;
        this.mathEquation = "";
        this.updatePreview();
      }
    },
    updatePreview() {
      // Render text + equations
      this.renderedPreview = this.questionText.replace(
        /\$(.*?)\$/g,
        (match, tex) => {
          try {
            return katex.renderToString(tex, { throwOnError: false });
          } catch (e) {
            return match;
          }
        }
      );
    },
    submitQuestion() {
      this.updatePreview();
      const payload = {
        question: this.questionText, // Save raw text with $...$
      };
      this.$axios.post("/questions", payload).then(() => {
        alert("Question saved!");
        this.questionText = "";
        this.renderedPreview = "";
      });
    },
  },
  watch: {
    questionText() {
      this.updatePreview();
    },
  },
};
</script>
