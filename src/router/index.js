import { createRouter, createWebHistory } from 'vue-router'
import TripsView from '../views/TripsView.vue'
import TripDetailView from '../views/TripDetailView.vue'
import RoutesView from '../views/RoutesView.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'trips', component: TripsView, meta: { title: 'Мои походы' } },
    { path: '/trip/:id', name: 'trip', component: TripDetailView, meta: { title: 'Поход' } },
    { path: '/routes', name: 'routes', component: RoutesView, meta: { title: 'Каталог маршрутов' } },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.afterEach((to) => {
  document.title = `${to.meta.title} — ПоходПлан`
})
