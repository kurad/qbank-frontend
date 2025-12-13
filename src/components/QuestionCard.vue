<template>
  <div class="card mb-4 border-0 shadow-sm question-card">
    <div class="card-body">
      <!-- Header -->
      <div class="d-flex justify-content-between align-items-start mb-3">
        <div class="fw-bold text-secondary">Q{{ indexLabel }}</div>
        <span class="badge bg-light text-dark text-capitalize">
          {{ question.question_type || 'Text' }}
        </span>
        <div class="d-flex align-items-center gap-2">
          <button
            type="button"
            class="btn btn-sm btn-outline-secondary me-1"
            @click="$emit('edit', question)"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M16.862 3.487a2.121 2.121 0 113 3L7.5 18.75 3 21l2.25-4.5L16.862 3.487z"
              />
            </svg>
          </button>
          <button
            type="button"
            class="btn btn-sm btn-outline-danger"
            title="Delete Question"
            @click="$emit('delete', question)"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      <!-- Question -->
      <div class="mb-3">
        <div
          class="fw-semibold fs-5 mb-2"
          v-html="renderMath(question.question, question.is_math)"
        ></div>
        <img
          v-if="question.question_image_url"
          :src="question.question_image_url"
          alt="Question Image"
          class="img-thumbnail mt-2"
          style="max-width: 220px; max-height: 150px; object-fit: contain"
        />
      </div>

      <!-- Options / types -->
      <div>
        <!-- MCQ -->
        <template
          v-if="question.question_type === 'mcq' && Array.isArray(question.options)"
        >
          <div
            v-for="(opt, oidx) in question.options"
            :key="oidx"
            class="option-card py-2 px-3 mb-1"
            :class="{ 'correct': isCorrectOption(question.correct_answer, getOptionValue(opt)) }"
          >
            <div class="d-flex align-items-start">
              <div class="option-label me-2">{{ String.fromCharCode(65 + oidx) }}.</div>
              <div class="flex-grow-1 math-content small">
                <div v-html="renderMath(getOptionValue(opt), question.is_math)"></div>
                <img
                  v-if="getOptionImageUrl(opt)"
                  :src="getOptionImageUrl(opt)"
                  alt="Option Image"
                  class="img-thumbnail mt-1"
                  style="max-width: 180px; max-height: 120px; object-fit: contain"
                />
              </div>
              <div class="ms-1">
                <span v-if="isCorrectOption(question.correct_answer, getOptionValue(opt))" class="text-success">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              </div>
            </div>
          </div>
        </template>

        <!-- True/False -->
        <template v-else-if="question.question_type === 'true_false'">
          <div
            v-for="val in ['true', 'false']"
            :key="val"
            class="form-check mb-2 p-1 ms-2"
            :class="{
              'bg-success-subtle border-success': isCorrectOption(
                question.correct_answer,
                val
              ),
            }"
          >
            <input
              class="form-check-input me-2"
              type="checkbox"
              :checked="isCorrectOption(question.correct_answer, val)"
              disabled
            />
            <label class="form-check-label ms-3">
              {{ val.charAt(0).toUpperCase() + val.slice(1) }}
            </label>
          </div>
        </template>

        <!-- Short Answer -->
        <template v-else-if="question.question_type === 'short_answer'">
          <div class="alert alert-secondary py-2">
            <strong>Answer: </strong>
            <span v-html="renderMarkdown(question.correct_answer)"></span>
          </div>
          <div v-if="question.correct_answer_image_url" class="mt-2">
            <img
              :src="question.correct_answer_image_url"
              alt="Correct Answer Image"
              class="img-thumbnail"
              style="max-width: 200px; max-height: 150px; object-fit: contain;"
            />
          </div>
        </template>

        <!-- Matching -->
        <template v-else-if="question.question_type === 'matching'">
          <div class="matching-container mb-3">
            <div class="row g-3">
              <div class="col-md-5">
                <strong>Left Column</strong>
                <ul class="list-group list-group-flush">
                  <li
                    v-for="(item, idx) in question.matching_items?.left || []"
                    :key="'left-' + idx"
                    class="list-group-item matching-item-left"
                  >
                    {{ item || `Left ${idx + 1}` }}
                  </li>
                </ul>
              </div>
              <div class="col-md-5">
                <strong>Right Column</strong>
                <ul class="list-group list-group-flush">
                  <li
                    v-for="(item, idx) in question.matching_items?.right || []"
                    :key="'right-' + idx"
                    class="list-group-item matching-item-right"
                  >
                    {{ item || `Right ${idx + 1}` }}
                  </li>
                </ul>
              </div>
            </div>
            <div class="mt-3">
              <strong>✅ Correct Pairs:</strong>
              <ul class="list-unstyled mb-0">
                <li
                  v-for="(pair, idx) in question.matching_pairs || []"
                  :key="'pair-' + idx"
                  class="matching-pair"
                >
                  <span class="pair-left">
                    {{
                      question.matching_items?.left?.[pair.left_index] ||
                        `Left ${pair.left_index + 1}`
                    }}
                  </span>
                  <span class="arrow">→</span>
                  <span class="pair-right">
                    {{
                      question.matching_items?.right?.[pair.right_index] ||
                        `Right ${pair.right_index + 1}`
                    }}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </template>
      </div>

      <!-- Footer -->
      <div
        class="d-flex justify-content-between align-items-center mt-3 border-top pt-2"
      >
        <span class="badge bg-light text-dark">
          {{ question.marks || 1 }} {{ question.marks === 1 ? 'point' : 'points' }}
        </span>
        <div>
          <span
            v-if="question.difficulty_level"
            class="badge bg-warning text-dark me-1"
          >
            {{ question.difficulty_level }}
          </span>
          <span v-if="question.required" class="badge bg-primary">Required</span>
        </div>
      </div>

      <!-- Explanation -->
      <div v-if="question.explanation" class="alert alert-info mt-3">
        <div class="fw-semibold">💡 Explanation:</div>
        <div v-html="renderMath(question.explanation, question.is_math)"></div>
      </div>

      <!-- Sub-questions -->
      <div
        v-if="question.sub_questions && question.sub_questions.length"
        class="mt-3 ms-3 border-start ps-3"
      >
        <div class="fw-semibold mb-2">Sub-questions</div>
        <div
          v-for="(subQ, sIdx) in question.sub_questions"
          :key="subQ.id || sIdx"
          class="mb-3"
        >
          <div class="d-flex justify-content-between align-items-start mb-2">
            <div class="fw-bold text-secondary">{{ sIdx + 1 }}.</div>
            <span class="badge bg-light text-dark text-capitalize">
              {{ subQ.question_type || 'Text' }}
            </span>
          </div>

          <div class="mb-2">
            <div
              class="fw-semibold"
              v-html="renderMath(subQ.question, subQ.is_math)"
            ></div>
            <img
              v-if="subQ.question_image_url"
              :src="subQ.question_image_url"
              alt="Sub-question Image"
              class="img-thumbnail mt-2"
              style="max-width: 220px; max-height: 150px; object-fit: contain"
            />
          </div>

          <!-- MCQ sub-question -->
          <template
            v-if="subQ.question_type === 'mcq' && Array.isArray(subQ.options)"
          >
            <div
              v-for="(opt, oidx) in subQ.options"
              :key="oidx"
              class="option-card py-2 px-3 mb-1"
              :class="{
                correct: isCorrectOption(subQ.correct_answer, getOptionValue(opt)),
              }"
            >
              <div class="d-flex align-items-start">
                <div class="option-label me-2">
                  {{ String.fromCharCode(65 + oidx) }}.
                </div>
                <div class="flex-grow-1 math-content small">
                  <div
                    v-html="renderMath(getOptionValue(opt), subQ.is_math)"
                  ></div>
                  <img
                    v-if="getOptionImageUrl(opt)"
                    :src="getOptionImageUrl(opt)"
                    alt="Option Image"
                    class="img-thumbnail mt-1"
                    style="
                      max-width: 180px;
                      max-height: 120px;
                      object-fit: contain;
                    "
                  />
                </div>
                <div class="ms-1">
                  <span
                    v-if="isCorrectOption(subQ.correct_answer, getOptionValue(opt))"
                    class="text-success"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </span>
                </div>
              </div>
            </div>
          </template>

          <!-- True/False sub-question -->
          <template v-else-if="subQ.question_type === 'true_false'">
            <div
              v-for="val in ['true', 'false']"
              :key="val"
              class="form-check mb-2 p-1 ms-2"
              :class="{
                'bg-success-subtle border-success': isCorrectOption(
                  subQ.correct_answer,
                  val,
                ),
              }"
            >
              <input
                class="form-check-input me-2"
                type="checkbox"
                :checked="isCorrectOption(subQ.correct_answer, val)"
                disabled
              />
              <label class="form-check-label ms-3">
                {{ val.charAt(0).toUpperCase() + val.slice(1) }}
              </label>
            </div>
          </template>

          <!-- Short Answer sub-question -->
          <template v-else-if="subQ.question_type === 'short_answer'">
            <div class="alert alert-secondary py-2">
              <strong>Answer: </strong>
              <span v-html="renderMarkdown(subQ.correct_answer)"></span>
            </div>
            <div v-if="subQ.correct_answer_image_url" class="mt-2">
              <img
                :src="subQ.correct_answer_image_url"
                alt="Correct Answer Image"
                class="img-thumbnail"
                style="max-width: 200px; max-height: 150px; object-fit: contain;"
              />
            </div>
          </template>

          <!-- Matching sub-question -->
          <template v-else-if="subQ.question_type === 'matching'">
            <div class="matching-container mb-3">
              <div class="row g-3">
                <div class="col-md-5">
                  <strong>Left Column</strong>
                  <ul class="list-group list-group-flush">
                    <li
                      v-for="(item, idx) in subQ.matching_items?.left || []"
                      :key="'sub-left-' + idx"
                      class="list-group-item matching-item-left"
                    >
                      {{ item || `Left ${idx + 1}` }}
                    </li>
                  </ul>
                </div>
                <div class="col-md-5">
                  <strong>Right Column</strong>
                  <ul class="list-group list-group-flush">
                    <li
                      v-for="(item, idx) in subQ.matching_items?.right || []"
                      :key="'sub-right-' + idx"
                      class="list-group-item matching-item-right"
                    >
                      {{ item || `Right ${idx + 1}` }}
                    </li>
                  </ul>
                </div>
              </div>
              <div class="mt-3">
                <strong>✅ Correct Pairs:</strong>
                <ul class="list-unstyled mb-0">
                  <li
                    v-for="(pair, idx) in subQ.matching_pairs || []"
                    :key="'sub-pair-' + idx"
                    class="matching-pair"
                  >
                    <span class="pair-left">
                      {{
                        subQ.matching_items?.left?.[pair.left_index] ||
                          `Left ${pair.left_index + 1}`
                      }}
                    </span>
                    <span class="arrow">→</span>
                    <span class="pair-right">
                      {{
                        subQ.matching_items?.right?.[pair.right_index] ||
                          `Right ${pair.right_index + 1}`
                      }}
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </template>

          <!-- Sub-question footer -->
          <div
            class="d-flex justify-content-between align-items-center mt-2"
          >
            <span class="badge bg-light text-dark">
              {{ subQ.marks || 1 }}
              {{ subQ.marks == 1 || subQ.marks === 1 ? 'point' : 'points' }}
            </span>
            <div>
              <span
                v-if="subQ.difficulty_level"
                class="badge bg-warning text-dark me-1"
              >
                {{ subQ.difficulty_level }}
              </span>
              <span v-if="subQ.required" class="badge bg-primary">
                Required
              </span>
            </div>
          </div>

          <div
            v-if="subQ.explanation"
            class="alert alert-info mt-2 mb-0"
          >
            <div class="fw-semibold">
              💡 Explanation:
            </div>
            <div v-html="renderMath(subQ.explanation, subQ.is_math)"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import katex from 'katex';
import { renderMath as renderMathUtil } from '@/utils/mathRenderer';

export default {
  name: 'QuestionCard',
  props: {
    question: {
      type: Object,
      required: true,
    },
    indexLabel: {
      type: Number,
      default: 0,
    },
  },
  methods: {
    getOptionValue(opt) {
      if (typeof opt === 'object' && opt !== null) {
        if (typeof opt.text === 'string') return opt.text;
        if (typeof opt.value === 'string') return opt.value;
      }
      return opt;
    },
    getOptionImageUrl(opt) {
      if (!opt || typeof opt !== 'object' || !opt.image) return '';
      if (opt.image.startsWith('http://') || opt.image.startsWith('https://')) {
        return opt.image;
      }
      try {
        const base = (axios.defaults.baseURL || '').replace(/\/?api\/?$/i, '');
        if (base) {
          return `${base}/storage/${opt.image}`;
        }
      } catch {}
      return `/storage/${opt.image}`;
    },
    renderMarkdown(content) {
      if (!content) return '';
      try {
        content = content.replace(/\$(.+?)\$/g, (match, text) =>
          katex.renderToString(text, {
            throwOnError: false,
            displayMode: false,
          })
        );
        content = content.replace(/\$\$([^$]+)\$\$/g, (match, text) =>
          katex.renderToString(text, {
            throwOnError: false,
            displayMode: true,
          })
        );
        return content;
      } catch (err) {
        return content;
      }
    },
    isCorrectOption(correct, opt) {
      if (!correct) return false;
      const normalize = (val) => String(val).toLowerCase();
      if (Array.isArray(correct))
        return correct.map(normalize).includes(normalize(opt));
      try {
        const parsed = JSON.parse(correct);
        if (Array.isArray(parsed))
          return parsed.map(normalize).includes(normalize(opt));
        return normalize(parsed) === normalize(opt);
      } catch {
        return normalize(correct) === normalize(opt);
      }
    },
    renderMath(content, isMath) {
      if (!content) return '';

      if (!isMath) {
        return this.renderMarkdown(content);
      }

      try {
        if (/^(\$\$.*\$\$|\$[^\$]*\$|\\\(.*\\\)|\\\[.*\\\])$/.test(content)) {
          return renderMathUtil(content);
        }

        let result = content;

        result = result.replace(/\$\$(.*?)\$\$/g, (match, tex) =>
          renderMathUtil(`$$${tex}$$`)
        );

        result = result.replace(/\$([^\$]+)\$/g, (match, tex) =>
          renderMathUtil(`$${tex}$`)
        );

        result = result.replace(/\\\((.*?)\\\)/g, (match, tex) =>
          renderMathUtil(`\\(${tex}\\)`)
        );

        return result;
      } catch (err) {
        return this.renderMarkdown(content);
      }
    },
  },
};
</script>

<style scoped>
.question-card {
  transition: all 0.2s ease-in-out;
}
.question-card:hover {
  transform: translateY(-2px);
}
.question-card img.img-thumbnail {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: zoom-in;
}

@media (hover: hover) and (pointer: fine) {
  .question-card img.img-thumbnail:hover {
    transform: scale(2);
    z-index: 10;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
  }
}
</style>
