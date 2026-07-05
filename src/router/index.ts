import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      redirect: '/add'
    },
    {
      path: '/add',
      name: 'add',
      component: () => import('@/views/AddExpense.vue')
    },
    {
      path: '/list',
      name: 'list',
      component: () => import('@/views/ExpenseList.vue')
    },
    {
      path: '/stats',
      name: 'stats',
      component: () => import('@/views/Statistics.vue')
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/Settings.vue')
    },
    {
      path: '/snake',
      name: 'snake',
      component: () => import('@/views/SnakeGame.vue')
    }
  ]
})

export default router
