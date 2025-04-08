import { createRouter, createWebHistory } from 'vue-router'
import CalendarView from '../views/CalendarView.vue'
import DefaultLayout from '../layouts/DefaultLayout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: DefaultLayout,
      children: [
        {
          path: '/',
          name: 'calendar',
          component: CalendarView,
        },
        {
          path: '/booking/:stationId/:bookingId',
          name: 'bookingDetail',
          component: () => import('../views/BookingDetailView.vue'),
        },
      ],
    },
  ],
})

export default router
