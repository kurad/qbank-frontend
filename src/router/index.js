import { createRouter, createWebHistory } from "vue-router";
import QuestionForm from "@/components/QuestionForm.vue";
import QuestionFormWithMath from "@/components/QuestionFormWithMath.vue";
import QuestionsList from "../components/QuestionsList.vue";
import TeacherLayout from "@/views/TeacherLayout.vue";
import PracticeQuestions from "@/views/PracticeQuestions.vue";
import StudentLayout from "@/views/StudentLayout.vue";
import StartPractice from "@/views/student/StartPractice.vue";
import StudentLogin from "@/views/student/StudentLogin.vue";
import StudentRegister from "@/views/student/StudentRegister.vue";
import PracticeSession from "@/views/student/PracticeSession.vue";
import { checkAuth } from "@/auth";
import Question from "@/components/Question.vue";
import LandingPage from "../LandingPage.vue";
import BulkQuestionCreator from "@/components/BulkQuestionCreator.vue";

const routes = [
  {path: "/login", name: "login", component: StudentLogin, },
  {path: "/register", name: "register", component: StudentRegister, },
  {path: "/", name: "home", component: LandingPage, },
  {path: "/auth/callback", name: "authCallback", component: () => import("@/views/student/AuthCallback.vue"),},

  // --------------- Student Routes ----------------
  {
    path: "/student",
    component: StudentLayout,
    meta: { requiresAuth: true, role: "student" },
    children: [
      {
        path: "", // /student
        name: "practice",
        component: PracticeQuestions,
      },
      {
        path: "student-dashboard", // ✅ now /practice/student-dashboard
        name: "studentDashboard",
        component: () => import("@/views/student/StudentDashboard.vue"),
      },
      {
        path: "start-practice", // ✅ /practice/start-practice
        name: "start-practice",
        component: StartPractice,
      },
      {
        path: "practice-session/:id", // ✅ /practice/practice-session/:id
        name: "PracticeSession",
        component: PracticeSession,
      },
      {
        path: "practice-list", // ✅ /practice/practice-list
        name: "StudentPracticeList",
        component: () => import("@/views/student/StudentPracticeList.vue"),
      },
      {
        path: "assessment-results/:id", // ✅ /practice/assessment-results/:id
        name: "AssessmentResults",
        component: () => import("@/views/student/AssessmentResults.vue"),
      },
    ],
  },

  // --------------- Teacher Routes ----------------
  {
    path: "/teacher",
    component: TeacherLayout,
    meta: { requiresAuth: true, role: "teacher" },
    children: [
      {
        path: "questions", // ✅ /teacher/questions 
        name: "questions",
        component: QuestionsList,
      },
      {
        path: "questions/bulk", // ✅ /teacher/questions/bulk
        name: "bulk-questions",
        component: BulkQuestionCreator,
      },
      {
        path: "teacher-dashboard", // ✅ /teacher/teacher-dashboard
        name: "teacherDashboard",
        component: () => import("@/views/teacher/TeacherDashboard.vue"),
      },
      {
        path: "type-question", // ✅ /teacher/type-question
        name: "type-question",
        component: Question,
      },
      // {
      //   path: "create-assessment", // ✅ /teacher/create-assessment 
      //   name: "create-assessment",
      //   component: () => import("@/views/teacher/CreateAssessment.vue"),
      // },
      {
        path: "create-assessment", // ✅ /teacher/create-assessment 
        name: "create-assessment",
        component: () => import("@/components/assessment/AssessmentBuilder.vue"),
      },
      {
        path: "assessment/:id/edit", 
        name: "assessment-edit",
        component: () => import("@/components/assessment/AssessmentEditor.vue"),
      },
      {
        path: "assign-assessment", // ✅ /teacher/assign-assessment
        name: "assign-assessment",
        component: () => import("@/views/teacher/AssignAssessment.vue"),
      },
      {
        path: "select-questions/:assessmentId", // ✅ /teacher/select-questions/:assessmentId
        name: "SelectQuestions",
        component: () => import("@/views/teacher/SelectQuestions.vue"),
        props: true,
      },
      {
        path: "assessment-list", // ✅ /teacher/assessment-list
        name: "AssessmentList",
        component: () => import("@/views/teacher/AssessmentList.vue"),
      },
      {
        path: "question-overview", // ✅ /teacher/question-overview
        name: "QuestionOverview",
        component: () => import("@/views/teacher/QuestionOverview.vue"),
      },
      {
        path: "assessment/:id/review", // ✅ /teacher/assessment/:id/review
        name: "ReviewAssessment",
        component: () => import("@/views/teacher/ReviewAssessment.vue"),
        props: true,
      },
      {
        path: 'groups',
        name: 'groups',
        component: () => import('@/views/teacher/GroupManager.vue'),
      },
      {
        path: 'groups/:id',
        name: 'group-details',
        component: () => import('@/views/teacher/GroupDetails.vue'),
        props: true,
      },
    ],
  },

  // --------------- Admin Routes ----------------
  {
    path: "/admin",
    component: () => import("@/views/admin/AdminLayout.vue"),
    meta: { requiresAuth: true, role: "admin" },
    children: [
      {
        path: "admin-dashboard", // ✅ /admin/admin-dashboard
        name: "AdminDashboard",
        component: () => import("@/views/admin/AdminDashboard.vue"),
      },
      {
        path: "user-management", // ✅ /admin/user-management
        name: "UserManagement",
        component: () => import("@/views/admin/UserManagement.vue"),
      },
      {
        path: "subjects", // ✅ /admin/subjects
        name: "SubjectsManagement",
        component: () => import("@/views/admin/SubjectsView.vue"),
      },
      {
        path: "topics", // ✅ /admin/topics
        name: "TopicManagement",
        component: () => import("@/views/admin/TopicManagement.vue"),
      },
      {
        path: "schools", // ✅ /admin/schools
        name: "SchoolsManagement",
        component: () => import("@/views/admin/SchoolsManager.vue"),
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  linkActiveClass: "active",
});

router.beforeEach(async (to, from, next) => {
 const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
 const requiredRole = to.meta.role;
 // If route does not require authentication -> allow immediately
 
 if (!requiresAuth) {
  return next();
 }
 // Check authentication from backend (via Sunctum)
 const auth = await checkAuth();
 //Not authenticated -> redirect globally to login

 if(!auth.isAuthenticated){
  return next({
    name: "login",
    query: { redirect: to.fullPath }, // Optional: return user to intended page
  });
 }
 // Authenticated but trying to access a different role's area
 if(requiredRole && requiredRole !== auth.role) {
  // Redirect based on actual role
  if(auth.role === "student"){
    return next({
      name: "studentDashboard",
    });
  }else if(auth.role === "teacher"){
    return next({
      name: "teacherDashboard",
    });
  }else if(auth.role === "admin"){
    return next({
      name: "AdminDashboard",
    });
  }
  // Fallback
  return next({
    name: "login",
  });
 }
 // Authenticated and trying to access correct role's area
 return next();
});

export default router;
