 

import axios from 'axios';


export const questionService = {
  async fetchQuestions(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.subject) params.append('subject_id', String(filters.subject));
      if (filters.grade) params.append('grade_id', String(filters.grade));
      if (filters.search) params.append('search', filters.search);

      let url = '/questions';
      if (filters.topic) {
        url = `/topics/${filters.topic}/questions`;
      }
      const response = await axios.get(url, { params });
      return response.data.data || response.data; // Always return the array
    } catch (error) {
      console.error('Error fetching questions:', error);
      throw error;
    }
  },

  async fetchExistingQuestions(assessmentId) {
    try {
  const response = await axios.get(`/assessments/${assessmentId}/questions`);
      return response.data;
    } catch (error) {
      console.error('Error fetching existing questions:', error);
      throw error;
    }
  },

  async saveQuestions(assessmentId, questionIds, removeIds = []) {
    try {
  const response = await axios.post(`/assessments/${assessmentId}/questions`, {
        question_ids: questionIds,
        remove_ids: removeIds
      });
      return response.data;
    } catch (error) {
      console.error('Error saving questions:', error);
      throw error;
    }
  },

  async fetchSubjects(gradeId) {
    try {
      // Always use /grade-levels/{gradeId}/subjects if gradeId is provided
      const url = gradeId
        ? `/grade-levels/${gradeId}/subjects`
        : `/subjects`;
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching subjects:', error);
      throw error;
    }
  },
 async fetchTopicsWithQuestionsBySubjectAndGrade(subjectId, gradeLevelId) {
    try {
      const response = await axios.get(`/subjects/${subjectId}/topics-with-questions`);
      return response.data;
    } catch (error) {
      console.error('Error fetching topics with questions for subject and grade:', error);
      throw error;
    }
  },
  async fetchTopics(subjectId, gradeId) {
    try {
      // Use /subjects/{subjectId}/grades/{gradeId}/units if both provided
      let url;
      if (subjectId && gradeId) {
  url = `/subjects/${subjectId}/grades/${gradeId}/units`;
      } else if (subjectId) {
  url = `/subjects/${subjectId}/topics`;
      } else {
  url = `/topics`;
      }
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching topics:', error);
      throw error;
    }
  },

  async fetchGradeLevels() {
    try {
      const response = await axios.get(`/grade-levels`);
      return response.data;
    } catch (error) {
      console.error('Error fetching grade levels:', error);
      throw error;
    }
  },
    async fetchTopicsWithQuestionsBySubject(subjectId) {
    try {
      const response = await axios.get(`/subjects/${subjectId}/topics-with-questions`);
      return response.data;
    } catch (error) {
      console.error('Error fetching topics with questions:', error);
      throw error;
    }
  },
  async searchSubjects(searchTerm) {
    try {
      const response = await axios.get(`/subjects/search`, {
        params: { search: searchTerm }
      });
      return response.data;
    } catch (error) {
      console.error('Error searching subjects:', error);
      throw error;
    }
  }
};
