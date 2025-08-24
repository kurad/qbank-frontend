<template>
  <div class="layout">
    <nav class="navbar">
      <span class="navbar-title">Quiz App</span>
    </nav>
    <aside class="sidebar">
      <ul>
        <li><a href="#">Dashboard</a></li>
        <li><a href="#">Create Question</a></li>
        <li><a href="#">Quizzes</a></li>
        <li><a href="#">Settings</a></li>
      </ul>
    </aside>
    <main class="main-content">
        <router-view/>
    </main>
  </div>
</template>

<style>
/* MS Forms inspired MCQ card layout */
.mcq-card {
  background: #fafbfc;
  border-radius: 10px;
  box-shadow: 0 1px 4px rgba(60,72,88,0.07);
  padding: 1.2em 1.5em 0.5em 1.5em;
  margin-bottom: 2em;
  border: 1.5px solid #e5e7eb;
}
.mcq-header {
  display: flex;
  align-items: center;
  gap: 1em;
  margin-bottom: 1.2em;
}
.mcq-number {
  font-size: 1.1em;
  font-weight: 500;
  color: #888;
}
.mcq-question {
  flex: 1 1 0;
  font-size: 1.13em;
  padding: 0.7em 1em;
  border: 1.5px solid #d1d5db;
  border-radius: 7px;
  background: #fff;
}
.img-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.2em;
  margin-left: 0.2em;
  border-radius: 5px;
  transition: background 0.15s;
}
.img-btn:hover {
  background: #f3f4f6;
}
.mcq-options {
  margin-bottom: 1.2em;
}
.mcq-option-row {
  display: flex;
  align-items: center;
  gap: 0.7em;
  margin-bottom: 0.7em;
}
.mcq-option-check {
  display: flex;
  align-items: center;
}
.mcq-option-input {
  flex: 0 1 420px;
  max-width: 420px;
  min-width: 120px;
  font-size: 1em;
  padding: 0.7em 1em;
  border: 1.5px solid #d1d5db;
  border-radius: 7px;
  background: #fff;
}
.remove-btn {
  background: none;
  border: none;
  color: #dc2626;
  font-size: 1.5em;
  cursor: pointer;
  margin-left: 0.2em;
  border-radius: 5px;
  padding: 0 0.3em;
  transition: background 0.15s;
}
.remove-btn:hover {
  background: #fef2f2;
}
.add-option-link {
  background: none;
  border: none;
  color: #059669;
  font-size: 1.08em;
  font-weight: 500;
  cursor: pointer;
  margin-top: 0.5em;
  margin-bottom: 0.5em;
  padding: 0;
  text-align: left;
  transition: color 0.15s;
}
.add-option-link:hover {
  color: #047857;
  text-decoration: underline;
}
.mcq-bottom-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1.5px solid #e5e7eb;
  margin-top: 1.2em;
  padding-top: 0.7em;
  gap: 2em;
}
.mcq-points {
  display: flex;
  align-items: center;
  gap: 0.5em;
}
.mcq-points-input {
  width: 60px;
  padding: 0.5em 0.7em;
  font-size: 1.08em;
  border: 1.5px solid #d1d5db;
  border-radius: 7px;
  background: #fff;
}
.mcq-toggles {
  display: flex;
  align-items: center;
  gap: 1.2em;
}
.toggle-label {
  display: flex;
  align-items: center;
  gap: 0.4em;
  font-size: 1.04em;
  color: #444;
  font-weight: 500;
}
/* ...existing code... */
form {
  width: 100%;
  margin: 1em 0;
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 6px 32px rgba(60,72,88,0.13), 0 1.5px 4px rgba(60,72,88,0.10);
  padding: 2.5em 2.7em 2em 2.7em;
  display: flex;
  flex-direction: column;
  gap: 2em;
  border: 1.5px solid #e5e7eb;
}

.form-section {
  margin-bottom: 1em;
}

label {
  font-weight: 500;
  color: #222;
  font-size: 1.08em;
  margin-bottom: 0.5em;
  display: block;
  letter-spacing: 0.01em;
}

.question-type-group {
  display: flex;
  gap: 2em;
  margin-top: 0.5em;
  margin-bottom: 0.5em;
}
.question-type-group label {
  font-weight: 400;
  color: #444;
  margin-bottom: 0;
  font-size: 1em;
}

input[type="radio"] {
  margin-right: 0.5em;
  accent-color: #6366f1;
}

input, select, textarea, math-field {
  width: 100%;
  padding: 1em 1.1em;
  border: 1.5px solid #d1d5db;
  border-radius: 8px;
  font-size: 1.08em;
  margin-top: 0.2em;
  background: #f8fafc;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
}
input:focus, select:focus, textarea:focus, math-field:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 2px #6366f133;
  outline: none;
  background: #fff;
}

button[type="submit"] {
  background: linear-gradient(90deg, #6366f1 0%, #60a5fa 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 0.9em 2em;
  font-size: 1.13em;
  font-weight: 600;
  cursor: pointer;
  margin-top: 1.2em;
  box-shadow: 0 2px 10px rgba(99,102,241,0.10);
  transition: background 0.2s, box-shadow 0.2s, transform 0.1s;
  letter-spacing: 0.01em;
}
button[type="submit"]:hover {
  background: linear-gradient(90deg, #4f46e5 0%, #2563eb 100%);
  box-shadow: 0 6px 24px rgba(99,102,241,0.13);
  transform: translateY(-2px) scale(1.02);
}

button[type="button"] {
  background: #f3f4f6;
  color: #374151;
  border: 1.5px solid #d1d5db;
  border-radius: 7px;
  padding: 0.5em 1.2em;
  font-size: 1em;
  margin-left: 0.7em;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s, color 0.2s;
}
button[type="button"]:hover {
  background: #e0e7ef;
  border-color: #6366f1;
  color: #3730a3;
}

.options-group {
  margin-bottom: 0.7em;
}

.option-row {
  display: flex;
  align-items: center;
  gap: 0.7em;
  margin-bottom: 0.5em;
}

.error {
  color: #dc2626;
  background: #fef2f2;
  border: 1.5px solid #fecaca;
  border-radius: 7px;
  padding: 0.7em 1.2em;
  margin-top: 0.7em;
  font-size: 1.04em;
  font-weight: 500;
  letter-spacing: 0.01em;
}
.success {
  color: #16a34a;
  background: #f0fdf4;
  border: 1.5px solid #bbf7d0;
  border-radius: 7px;
  padding: 0.7em 1.2em;
  margin-top: 0.7em;
  font-size: 1.04em;
  font-weight: 500;
  letter-spacing: 0.01em;
}
/* Layout for full-width app with sidebar and navbar */
.layout {
  display: flex;
  min-height: 100vh;
  background: #f3f4f6;
}

.navbar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 64px;
  background: linear-gradient(90deg, #6366f1 0%, #60a5fa 100%);
  color: #fff;
  display: flex;
  align-items: center;
  padding: 0 2.5em;
  z-index: 100;
  box-shadow: 0 2px 10px rgba(99,102,241,0.08);
}
.navbar-title {
  font-size: 1.45em;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.sidebar {
  position: fixed;
  top: 64px;
  left: 0;
  width: 220px;
  height: calc(100vh - 64px);
  background: #fff;
  border-right: 1.5px solid #e5e7eb;
  box-shadow: 2px 0 12px rgba(60,72,88,0.06);
  padding: 2.2em 1.2em 1.2em 1.2em;
  z-index: 90;
  display: flex;
  flex-direction: column;
  gap: 1.2em;
}
.sidebar ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1.1em;
}
.sidebar li {
  width: 100%;
}
.sidebar a {
  display: block;
  color: #374151;
  text-decoration: none;
  font-size: 1.08em;
  font-weight: 500;
  padding: 0.7em 1em;
  border-radius: 7px;
  transition: background 0.18s, color 0.18s;
}
.sidebar a:hover, .sidebar a:focus {
  background: #f3f4f6;
  color: #6366f1;
}

.main-content {
  margin-left: 220px;
  margin-top: 64px;
  flex: 1;
  padding: 2.5em 2em 2em 2em;
  min-width: 0;
}

@media (max-width: 900px) {
  .sidebar {
    width: 60px;
    padding: 2.2em 0.3em 1.2em 0.3em;
  }
  .sidebar a {
    font-size: 0.98em;
    padding: 0.7em 0.5em;
    text-align: center;
  }
  .main-content {
    margin-left: 60px;
    padding: 2em 0.5em 2em 0.5em;
  }
}

@media (max-width: 600px) {
  .navbar {
    padding: 0 0.7em;
    font-size: 1em;
  }
  .sidebar {
    display: none;
  }
  .main-content {
    margin-left: 0;
    padding: 1.2em 0.2em 1.2em 0.2em;
  }
}
/* Row group for subject, grade, topic */
.row-group {
  display: flex;
  gap: 1.5em;
  margin-bottom: 1.5em;
}
.row-item {
  flex: 1 1 0;
  min-width: 0;
}
@media (max-width: 900px) {
  .row-group {
    flex-direction: column;
    gap: 0.7em;
  }
}
</style>

