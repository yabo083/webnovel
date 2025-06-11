import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  {
    path: '/',
    redirect: '/bookshelf'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/Register.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/bookshelf',
    name: 'Bookshelf',
    component: () => import('../views/Bookshelf.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/novel/:id',
    name: 'NovelDetail',
    component: () => import('../views/NovelDetail.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/editor/:chapterId',
    name: 'Editor',
    component: () => import('../views/Editor.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    // 需要登录但未登录，跳转到登录页
    next('/login')
  } else if (to.meta.requiresGuest && authStore.isAuthenticated) {
    // 访客页面但已登录，跳转到书架
    next('/bookshelf')
  } else {
    next()
  }
})

export default router 