<template>
  <div class="selected-questions-container">
    <div class="card shadow-sm h-100">
      <div class="card-header bg-light d-flex justify-content-between align-items-center">
        <h5 class="mb-0">
          Selected Questions 
          <span class="badge bg-primary">{{ totalSelected }}</span>
        </h5>
        <div v-if="totalSelected > 0" class="d-flex gap-2">
          <button 
            class="btn btn-sm btn-outline-secondary" 
            @click="$emit('clear')"
            title="Clear selection"
          >
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
      </div>
      
      <div class="card-body p-0">
        <div v-if="totalSelected === 0" class="text-center p-4">
          <p class="text-muted mb-2">No questions selected yet</p>
          <p class="small text-muted">Click on questions to select them</p>
        </div>
        
        <div v-else class="selected-questions-list">
          <div 
            v-for="(question, index) in selectedQuestions" 
            :key="'selected-'+question.id" 
            class="selected-question-item"
            :class="{ 'existing-question': isExisting(question) }"
          >
            <div class="d-flex align-items-center p-2 border-bottom">
              <span class="me-2 text-muted">{{ index + 1 }}.</span>
              <div class="flex-grow-1 text-truncate" :title="getQuestionTitle(question)">
                {{ getQuestionTitle(question) }}
              </div>
              <button 
                class="btn btn-sm btn-link text-danger"
                @click.stop="handleRemove(question)"
                :title="isMarkedForRemoval(question) ? 'Undo remove' : 'Remove'"
              >
                <i :class="isMarkedForRemoval(question) ? 'bi-arrow-counterclockwise' : 'bi-x'"></i>
              </button>
            </div>
          </div>
          
          <div v-if="questionsMarkedForRemoval.length > 0" class="border-top pt-2">
            <h6 class="px-3 mb-2 text-muted">To be removed ({{ questionsMarkedForRemoval.length }})</h6>
            <div 
              v-for="question in questionsMarkedForRemoval" 
              :key="'remove-'+question.id"
              class="selected-question-item text-muted"
            >
              <div class="d-flex align-items-center p-2 border-bottom">
                <span class="me-2">
                  <i class="bi bi-trash text-danger"></i>
                </span>
                <div class="flex-grow-1 text-truncate" :title="getQuestionTitle(question)">
                  {{ getQuestionTitle(question) }}
                </div>
                <button 
                  class="btn btn-sm btn-link text-success"
                  @click.stop="handleUndo(question)"
                  title="Keep question"
                >
                  <i class="bi-arrow-counterclockwise"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div v-if="totalSelected > 0" class="card-footer bg-light">
        <button 
          class="btn btn-primary w-100" 
          :disabled="isSaving"
          @click="handleSave"
        >
          <span v-if="isSaving" class="spinner-border spinner-border-sm me-1"></span>
          {{ isSaving ? 'Saving...' : `Save ${totalSelected} Question${totalSelected !== 1 ? 's' : ''}` }}
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from 'vue';
import type { Question } from '@/types/question';

export default defineComponent({
  name: 'SelectedQuestions',
  props: {
    selectedQuestions: {
      type: Array as PropType<Question[]>,
      default: () => []
    },
    questionsMarkedForRemoval: {
      type: Array as PropType<Question[]>,
      default: () => []
    },
    existingQuestions: {
      type: Array as PropType<Question[]>,
      default: () => []
    },
    isSaving: {
      type: Boolean,
      default: false
    }
  },
  emits: ['save', 'remove', 'undo-remove', 'clear'],
  setup(props, { emit }) {
    const totalSelected = computed(() => {
      return props.selectedQuestions.length;
    });

    const isExisting = (question: Question) => {
      return props.existingQuestions.some(q => q.id === question.id);
    };

    const isMarkedForRemoval = (question: Question) => {
      return props.questionsMarkedForRemoval.some(q => q.id === question.id);
    };

    const getQuestionTitle = (question: Question) => {
      return question.question_text 
        ? question.question_text.replace(/[#*_`]/g, '').substring(0, 60) + (question.question_text.length > 60 ? '...' : '')
        : 'Untitled question';
    };

    const handleRemove = (question: Question) => {
      emit('remove', question);
    };

    const handleUndo = (question: Question) => {
      emit('undo-remove', question);
    };

    const handleSave = () => {
      emit('save');
    };

    return {
      totalSelected,
      isExisting,
      isMarkedForRemoval,
      getQuestionTitle,
      handleRemove,
      handleUndo,
      handleSave
    };
  }
});
</script>

<style scoped>
.selected-questions-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.selected-questions-list {
  max-height: 500px;
  overflow-y: auto;
}

.selected-question-item {
  transition: all 0.2s ease;
  cursor: pointer;
}

.selected-question-item:hover {
  background-color: rgba(0, 0, 0, 0.03);
}

.selected-question-item.existing-question {
  opacity: 0.7;
}

.badge {
  font-size: 0.75rem;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
}
</style>
