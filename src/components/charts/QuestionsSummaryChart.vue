<template>
  <div class="card h-100 shadow-sm">
    <div class="card-header bg-secondary text-white d-flex justify-content-between align-items-center">
      <h6 class="mb-0">{{ title }}</h6>
      <div class="form-check form-switch">
        <input class="form-check-input" type="checkbox" id="stackedSwitch" v-model="internalStacked" />
        <label class="form-check-label" for="stackedSwitch">Stacked</label>
      </div>
    </div>
    <div class="card-body">
      <div v-if="!summary || summary.length === 0" class="text-muted text-center py-4">
        No data to display
      </div>
      <canvas v-else ref="canvasEl"></canvas>
    </div>
  </div>
</template>

<script>
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

export default {
  name: 'QuestionsSummaryChart',
  props: {
    summary: {
      type: Array,
      required: true,
      // [{ subject_name: string, grade_name: string, questions_count: number }]
    },
    title: {
      type: String,
      default: 'Questions Summary'
    },
    stacked: {
      type: Boolean,
      default: true
    },
    colors: {
      type: Array,
      default: () => [
        '#0d6efd',
        '#6f42c1',
        '#198754',
        '#fd7e14',
        '#dc3545',
        '#20c997'
      ]
    }
  },
  data() {
    return {
      chart: null,
      internalStacked: this.stacked
    };
  },
  watch: {
    summary: {
      handler() {
        // Wait for DOM to switch from "No data" block to canvas
        this.$nextTick(() => this.buildChart());
      },
      deep: true
    },
    internalStacked() {
      this.buildChart();
    }
  },
  mounted() {
    this.buildChart();
  },
  beforeUnmount() {
    this.destroyChart();
  },
  methods: {
    destroyChart() {
      if (this.chart) {
        this.chart.destroy();
        this.chart = null;
      }
    },
    uniqueOrdered(arr) {
      const seen = new Set();
      return arr.filter(x => (seen.has(x) ? false : seen.add(x)));
    },
    sortGrades(grades) {
      // Attempt to sort by trailing number after 'S' (e.g., S4, S5, S6)
      return [...grades].sort((a, b) => {
        const na = parseInt(String(a).replace(/\D+/g, ''), 10) || 0;
        const nb = parseInt(String(b).replace(/\D+/g, ''), 10) || 0;
        if (na !== nb) return na - nb;
        return String(a).localeCompare(String(b));
      });
    },
    buildChart() {
      // Safety
      if (!this.$refs.canvasEl) {
        // If canvas isn't in DOM yet, try again on next tick
        this.$nextTick(() => {
          if (this.$refs.canvasEl) this.buildChart();
        });
        return;
      }
      this.destroyChart();

      const data = Array.isArray(this.summary) ? this.summary : [];
      if (data.length === 0) return;

      const subjects = this.uniqueOrdered(data.map(d => d.subject_name));
      const gradesRaw = this.uniqueOrdered(data.map(d => d.grade_name));
      const grades = this.sortGrades(gradesRaw);

      // Build datasets per grade
      const datasets = grades.map((grade, idx) => {
        const points = subjects.map(subj => {
          const item = data.find(d => d.subject_name === subj && d.grade_name === grade);
          return item ? (Number(item.questions_count) || 0) : 0;
        });
        return {
          label: grade,
          data: points,
          backgroundColor: this.colors[idx % this.colors.length]
        };
      });

      const ctx = this.$refs.canvasEl.getContext('2d');
      this.chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: subjects,
          datasets
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { position: 'bottom' },
            tooltip: { enabled: true }
          },
          scales: {
            x: {
              stacked: this.internalStacked,
              ticks: { autoSkip: false, maxRotation: 45, minRotation: 0 }
            },
            y: {
              stacked: this.internalStacked,
              beginAtZero: true,
              title: { display: true, text: 'Questions Count' }
            }
          }
        }
      });
    }
  }
};
</script>

<style scoped>
.card-body {
  height: 420px;
}
</style>
