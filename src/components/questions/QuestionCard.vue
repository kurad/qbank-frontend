<template>
  <div 
    class="card mb-3 question-card"
    :class="cardClasses"
    @click="handleClick"
    :data-question-id="question.id"
  >
    <div class="card-body d-flex align-items-start">
      <div class="form-check me-3 mt-1">
        <input 
          class="form-check-input" 
          type="checkbox" 
          :checked="isSelected"
          :disabled="isExisting && !isMarkedForRemoval"
          @click.stop
        >
      </div>
      
      <div class="position-absolute top-0 end-0 m-2">
        <span 
          v-if="isExisting && !isMarkedForRemoval" 
          class="badge bg-secondary"
        >
          Already Added
        </span>
        <span 
          v-if="isMarkedForRemoval" 
          class="badge bg-danger"
        >
          Will Be Removed
        </span>
      </div>
      
      <div class="flex-grow-1">
        <div class="d-flex justify-content-between align-items-start">
          <h5 class="card-title mb-1">
            <span v-if="subjectName">{{ subjectName }}</span>
            <span v-if="topicName"> › {{ topicName }}</span>
            <span v-if="gradeName" class="badge bg-secondary ms-2">
              Grade {{ gradeName }}
            </span>
          </h5>
          <span 
            v-if="question.difficulty" 
            class="badge"
            :class="getDifficultyClass(question.difficulty)"
          >
            {{ question.difficulty }}
          </span>
        </div>
        
        <div class="question-text" v-html="formattedQuestionText"></div>
        
        <div v-if="question.options && question.options.length > 0" class="mt-2">
          <div 
            v-for="(option, index) in question.options" 
            :key="option.id || index"
            class="form-check"
            :class="{ 'text-success fw-bold': option.is_correct }"
          >
            <input 
              class="form-check-input" 
              type="radio" 
              :checked="option.is_correct"
              disabled
            >
            <label class="form-check-label ms-2">
              {{ String.fromCharCode(65 + index) }}. {{ option.option_text }}
            </label>
          </div>
        </div>
        
        <div v-if="question.explanation" class="explanation mt-2">
          <small class="text-muted">
            <strong>Explanation:</strong> {{ question.explanation }}
          </small>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from 'vue';
import type { Question } from '@/types/question';

export default defineComponent({
  name: 'QuestionCard',
  props: {
    question: {
      type: Object as PropType<Question>,
      required: true
    },
    isSelected: {
      type: Boolean,
      default: false
    },
    isExisting: {
      type: Boolean,
      default: false
    },
    isMarkedForRemoval: {
      type: Boolean,
      default: false
    },
    subjectName: {
      type: String,
      default: ''
    },
    topicName: {
      type: String,
      default: ''
    },
    gradeName: {
      type: String,
      default: ''
    }
  },
  emits: ['select', 'remove', 'undo-remove'],
  setup(props, { emit }) {
    const cardClasses = computed(() => ({
      'border-primary': props.isSelected && !props.isExisting,
      'highlight-question': props.isSelected && !props.isExisting,
      'border-secondary': props.isExisting && !props.isMarkedForRemoval,
      'bg-light': props.isExisting && !props.isMarkedForRemoval,
      'existing-question': props.isExisting && !props.isMarkedForRemoval,
      'border-danger': props.isMarkedForRemoval,
      'bg-light text-muted': props.isMarkedForRemoval,
      'marked-for-removal': props.isMarkedForRemoval,
      'cursor-pointer': true
    }));

    const formattedQuestionText = computed(() => {
      if (!props.question.question_text) return '';
      // Replace **text** with <strong>text</strong> for markdown-like bold
      return props.question.question_text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');
    });

    const getDifficultyClass = (difficulty: string) => {
      const classes: Record<string, string> = {
        easy: 'bg-success',
        medium: 'bg-warning text-dark',
        hard: 'bg-danger',
        default: 'bg-secondary'
      };
      return classes[difficulty.toLowerCase()] || classes.default;
    };

    const handleClick = () => {
      if (props.isMarkedForRemoval) {
        emit('undo-remove', props.question);
      } else if (props.isExisting) {
        emit('remove', props.question);
      } else {
        emit('select', props.question);
      }
    };

    return {
      cardClasses,
      formattedQuestionText,
      getDifficultyClass,
      handleClick
    };
  }
});
</script>

<style scoped>
.question-card {
  transition: all 0.2s ease;
  cursor: pointer;
}

.question-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.1);
}

.highlight-question {
  border-left: 4px solid #0d6efd;
}

.marked-for-removal {
  opacity: 0.7;
}

.question-text {
  white-space: pre-line;
}

.cursor-pointer {
  cursor: pointer;
}

existing-question {
  opacity: 0.8;
}
</style>
