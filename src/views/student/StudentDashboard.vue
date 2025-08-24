<template>
  <div class="container-fluid">

    <!-- Statistics Cards -->
    <div class="row g-3 mb-4">
      <div class="col-md-3" v-for="card in cards" :key="card.title">
        <div :class="['card text-white h-100', card.bgClass]">
          <div class="card-body text-center">
            <h5 class="card-title">{{ card.title }}</h5>
            <p class="card-text fs-3 fw-bold">{{ card.value }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Performance Charts -->
    <div class="row g-3 mb-4">
      <!-- Assessment Completion Chart -->
      <div class="col-md-6">
        <div class="card shadow-sm h-100">
          <div class="card-body">
            <h5 class="card-title">Assessment Completion</h5>
            <canvas id="completionChart"></canvas>
          </div>
        </div>
      </div>

      <!-- Subject Performance Chart -->
      <div class="col-md-6">
        <div class="card shadow-sm h-100">
          <div class="card-body">
            <h5 class="card-title">Subject-wise Performance</h5>
            <canvas id="subjectChart"></canvas>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Scores Table -->
    <div class="row g-3 mb-4">
      <div class="col-12">
        <div class="card shadow-sm">
          <div class="card-body">
            <h5 class="card-title">Recent Assessment Scores</h5>
            <div class="table-responsive">
              <table class="table table-hover">
                <thead class="table-light">
                  <tr>
                    <th>Assessment</th>
                    <th>Score</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in recentScores" :key="item.id">
                    <td>{{ item.title }}</td>
                    <td>{{ item.score }}%</td>
                    <td>
                      <span 
                        :class="[
                          'badge',
                          item.score >= 50 ? 'bg-success' : 'bg-danger'
                        ]"
                      >
                        {{ item.score >= 50 ? 'Passed' : 'Failed' }}
                      </span>
                    </td>
                    <td>{{ formatDate(item.date) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>
<script>
import axios from 'axios';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

export default {
  name: 'StudentDashboard',
  data() {
    return {
      totalAssessments: 0,
      totalStudents: 0,
      totalQuestions: 0,
      totalPractices: 0,
      recentScores: [],
      subjectPerformance: [],
      assessmentCompletion: { completed: 0, pending: 0 },
    };
  },
  computed: {
    cards() {
      return [
        { title: 'Total Assessments', value: this.totalAssessments, bgClass: 'bg-primary' },
        { title: 'Total Questions', value: this.totalQuestions, bgClass: 'bg-success' },
        { title: 'Total Practices', value: this.totalPractices, bgClass: 'bg-warning' },
        { title: 'Total Students', value: this.totalStudents, bgClass: 'bg-danger' },
      ];
    }
  },
  methods: {
    async fetchStatistics() {
      try {
        const token = localStorage.getItem('auth_token');
        const res = await axios.get('/student/statistics', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = res.data;

        this.totalAssessments = data.totalAssessments || 0;
        this.totalStudents = data.totalStudents || 0;
        this.totalQuestions = data.totalQuestions || 0;
        this.totalPractices = data.totalPractices || 0;

        this.assessmentCompletion = {
          completed: data.completedAssessments || 0,
          pending: data.pendingAssessments || 0,
        };

        this.subjectPerformance = data.subjectPerformance || [];
        this.recentScores = data.recentScores || [];

        this.initCharts();
      } catch (err) {
        console.error('Error fetching statistics:', err);
      }
    },

    formatDate(dateString) {
      if (!dateString) return 'N/A';
      return new Date(dateString).toLocaleDateString();
    },

    initCharts() {
      // Assessment Completion Pie
      const ctx1 = document.getElementById('completionChart').getContext('2d');
      new Chart(ctx1, {
        type: 'doughnut',
        data: {
          labels: ['Completed', 'Pending'],
          datasets: [{
            data: [this.assessmentCompletion.completed, this.assessmentCompletion.pending],
            backgroundColor: ['#198754', '#ffc107'],
          }]
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
      });

      // Subject Performance Bar
      const ctx2 = document.getElementById('subjectChart').getContext('2d');
      new Chart(ctx2, {
        type: 'bar',
        data: {
          labels: this.subjectPerformance.map(s => s.subject),
          datasets: [{
            label: 'Average Score',
            data: this.subjectPerformance.map(s => s.avgScore),
            backgroundColor: '#0d6efd',
          }]
        },
        options: { responsive: true, scales: { y: { beginAtZero: true, max: 100 } } }
      });
    }
  },
  mounted() {
    this.fetchStatistics();
  }
};
</script>
