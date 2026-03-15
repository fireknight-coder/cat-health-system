import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { Role } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/Login.vue'),
      meta: { public: true },
    },
    {
      path: '/',
      component: () => import('@/views/layout/UserLayout.vue'),
      meta: { role: 'user' as Role },
      children: [
        { path: '', name: 'UserHome', redirect: '/report' },
        { path: 'report', name: 'ReportCreate', component: () => import('@/views/user/ReportCreate.vue') },
        { path: 'adopt', name: 'AdoptList', component: () => import('@/views/user/AdoptList.vue') },
        { path: 'adopt/:catId', name: 'AdoptDetail', component: () => import('@/views/user/AdoptDetail.vue') },
        { path: 'adopt/apply/:catId', name: 'AdoptApply', component: () => import('@/views/user/AdoptApply.vue') },
        { path: 'pets', name: 'MyPets', component: () => import('@/views/user/MyPets.vue') },
        { path: 'pets/bind', name: 'DeviceBind', component: () => import('@/views/user/DeviceBind.vue') },
        { path: 'observation', name: 'ObservationCreate', component: () => import('@/views/user/ObservationCreate.vue') },
        { path: 'intervention', name: 'InterventionCreate', component: () => import('@/views/user/InterventionCreate.vue') },
        { path: 'pets/:petId/location', name: 'PetLocation', component: () => import('@/views/user/PetLocation.vue') },
      ],
    },
    {
      path: '/admin',
      component: () => import('@/views/layout/AdminLayout.vue'),
      meta: { role: 'admin' as Role },
      children: [
        { path: '', name: 'AdminHome', redirect: '/admin/dashboard' },
        { path: 'dashboard', name: 'Dashboard', component: () => import('@/views/admin/Dashboard.vue') },
        { path: 'reports', name: 'ReportQueue', component: () => import('@/views/admin/ReportQueue.vue') },
        { path: 'reports/:id', name: 'ReportReview', component: () => import('@/views/admin/ReportReview.vue') },
        { path: 'cats', name: 'CatList', component: () => import('@/views/admin/CatList.vue') },
        { path: 'cats/:id', name: 'CatDetail', component: () => import('@/views/admin/CatDetail.vue') },
        { path: 'interventions', name: 'InterventionList', component: () => import('@/views/admin/InterventionList.vue') },
        { path: 'interventions/:id', name: 'InterventionDetail', component: () => import('@/views/admin/InterventionDetail.vue') },
        { path: 'adoptions', name: 'AdoptionManage', component: () => import('@/views/admin/AdoptionManage.vue') },
        { path: 'review', name: 'AdminReview', component: () => import('@/views/admin/AdminReview.vue'), meta: { role: 'superadmin' as Role } },
      ],
    },
    { path: '/:pathMatch(.*)*', name: 'NotFound', redirect: '/' },
  ],
})

router.beforeEach((to, _from, next) => {
  const auth = useAuthStore()
  
  // 公共路由直接放行
  if (to.meta.public) return next()
  
  // 未登录用户重定向到登录页
  if (!auth.isLoggedIn) return next({ name: 'Login', query: { redirect: to.fullPath } })
  
  const requiredRole = to.meta.role as Role | undefined
  
  // 如果没有角色要求，直接放行
  if (!requiredRole) return next()
  
  // 检查角色权限（超级管理员可以访问所有管理功能）
  if (requiredRole === 'superadmin' && !auth.isSuperAdmin) {
    // 超级管理员权限不足，重定向到管理员首页
    return next('/admin')
  }
  
  if (requiredRole === 'admin' && !auth.isAdmin) {
    // 管理员权限不足，重定向到用户首页
    return next('/')
  }
  
  if (requiredRole === 'user' && !auth.isUser) {
    // 用户权限不足，重定向到管理员首页
    return next('/admin')
  }
  
  // 权限检查通过
  next()
})

export default router