// src/composables/useQuestionSelection.js
import { ref, computed } from 'vue';

export function useQuestionSelection() {
  const selectedQuestions = ref([]);
  const questionsMarkedForRemoval = ref([]);
  const existingQuestions = ref([]);

  const isSelected = (question) => {
    return selectedQuestions.value.some(q => q.id === question.id);
  };

  const isExistingQuestion = (question) => {
    return existingQuestions.value.some(q => q.id === question.id);
  };

  const isMarkedForRemoval = (question) => {
    return questionsMarkedForRemoval.value.some(q => q.id === question.id);
  };

  const toggleQuestion = (question) => {
    const index = selectedQuestions.value.findIndex(q => q.id === question.id);
    if (index > -1) {
      selectedQuestions.value.splice(index, 1);
    } else {
      selectedQuestions.value.push(question);
    }
  };

  const removeQuestion = (question) => {
    const index = existingQuestions.value.findIndex(q => q.id === question.id);
    if (index > -1) {
      questionsMarkedForRemoval.value.push(question);
    }
  };

  const undoRemoveQuestion = (question) => {
    const index = questionsMarkedForRemoval.value.findIndex(q => q.id === question.id);
    if (index > -1) {
      questionsMarkedForRemoval.value.splice(index, 1);
    }
  };

  const resetSelections = () => {
    selectedQuestions.value = [];
    questionsMarkedForRemoval.value = [];
  };

  return {
    selectedQuestions,
    questionsMarkedForRemoval,
    existingQuestions,
    isSelected,
    isExistingQuestion,
    isMarkedForRemoval,
    toggleQuestion,
    removeQuestion,
    undoRemoveQuestion,
    resetSelections
  };
}