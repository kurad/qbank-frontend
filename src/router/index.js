import { createRouter, createWebHistory } from 'vue-router'
import QuestionForm from '@/components/QuestionForm.vue'
import QuestionFormWithMath from '@/components/QuestionFormWithMath.vue'
import QuestionsList from '../components/QuestionsList.vue'
import TeacherLayout from '@/views/TeacherLayout.vue'
import PracticeQuestions from '@/views/PracticeQuestions.vue'
import StudentLayout from '@/views/StudentLayout.vue'
import StartPractice from '@/views/student/StartPractice.vue'
import StudentLogin from '@/views/student/StudentLogin.vue'
import StudentRegister from '@/views/student/StudentRegister.vue'
import PracticeSession from '@/views/student/PracticeSession.vue'
import { checkAuth } from '@/auth'
import Question from '@/components/Question.vue'
const routes = [
  {
    path: '/login',
    name: 'login',
    component: StudentLogin
  },
  {
    path: '/register',
    name: 'register',
    component: StudentRegister
  },
  {
  path: "/auth/callback",
  name: "authCallback",
  component: () => import("@/views/student/AuthCallback.vue"),
},
  {
    path: '/practice',
    component: StudentLayout,
        meta: { requiresAuth: true , role: 'student' }, // Ensure this route requires authentication

    children: [
      {
        path: '',
        name: 'practice',
        component: PracticeQuestions,
      },
      {
        path: '/student-dashboard',
        name: 'studentDashboard',
        component: () => import('@/views/student/StudentDashboard.vue'),
      },
      {
        path: '/start-practice',
        name: 'start-practice',
        component: StartPractice
      },
      {
        path: '/practice-session/:id',
        name: 'PracticeSession',
        component: PracticeSession
      },
      {
        path: '/student/practice-list',
        name: 'StudentPracticeList',
        component: () => import('@/views/student/StudentPracticeList.vue')
      },
      {
        path: '/student/assessment-results/:id',
        name: 'AssessmentResults',
        component: () => import('@/views/student/AssessmentResults.vue'),

      },
      
    ]
  },
  {
    path: '/layout',
    name: 'layout',
    component: TeacherLayout,
        meta: { requiresAuth: true , role: 'teacher' },
    children: [
      {
        path: '/questions',
        name: 'questions',
        component: QuestionsList
      },
      {
        path: '/teacher-dashboard',
        name: 'teacherDashboard',
        component: () => import('@/views/teacher/TeacherDashboard.vue'),
      },
      {
        path: '/',
        name: 'home',
        component: QuestionFormWithMath
      },
      {
        path: '/type-question',
        name: 'type-question',
        component: Question
      },
      {
        path: '/create-assessment',
        name: 'create-assessment',
        component: () => import('@/views/teacher/CreateAssessment.vue')
      },
      {
        path: '/assign-assessment',
        name: 'assign-assessment',
        component: () => import('@/views/teacher/AssignAssessment.vue')
      },
      {
        path: '/select-questions/:id',
        name: 'SelectQuestions',
        component: () => import('@/views/teacher/SelectQuestions.vue')
      },
      {
        path: '/assessment-list',
        name: 'AssessmentList',
        component: () => import('@/views/teacher/AssessmentList.vue')
      },
      {
        path: '/question-overview',
        name: 'QuestionOverview',
        component: () => import('@/views/teacher/QuestionOverview.vue')
      },
      {
        path: '/assessment/:id/review',
        name: 'ReviewAssessment',
        component: () => import('@/views/teacher/ReviewAssessment.vue'),
        props: true
      }
    ]
  },
  {
    path: '/admin',
    name: 'admin',
    component: () => import('@/views/admin/AdminLayout.vue'),
    meta: { requiresAuth: true, role: 'admin' },
    children: [
      {
        path: 'admin-dashboard',
        name: 'AdminDashboard',
        component: () => import('@/views/admin/AdminDashboard.vue')
      },
      {
        path: 'user-management',
        name: 'UserManagement',
        component: () => import('@/views/admin/UserManagement.vue')
      },
      {
        path: 'subjects',
        name: 'SubjectsManagement',
        component: () => import('@/views/admin/SubjectsView.vue')
      },
      {
        path: 'topics',
        name: 'TopicManagement',
        component: () => import('@/views/admin/TopicManagement.vue')
      }
    ]
  }
  
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
  linkActiveClass: 'active',
})
router.beforeEach(async(to, from, next) => {
  if (to.matched.some(record => record.meta.requiresAuth)) {
    const authStatus = await checkAuth();
    if (!authStatus.isAuthenticated) {
      next({name: 'login' })
    }else if (to.meta.role && to.meta.role !== authStatus.role) {
      next({ name: 'login' })
    }else {
      next();
    }
  }else {
    next();
  }
  })
export default router
