import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', name: 'Login', component: () => import('@/views/login/LoginPage.vue') },
  { path: '/register', name: 'Register', component: () => import('@/views/register/RegisterPage.vue') },
  {
    path: '/shipper', component: () => import('@/views/shipper/Layout.vue'),
    children: [
      { path: 'dashboard', component: () => import('@/views/shipper/DashboardPage.vue') },
      { path: 'order/list', component: () => import('@/views/shipper/OrderListPage.vue') },
      { path: 'order/create', component: () => import('@/views/shipper/CreateOrderPage.vue') },
      { path: 'order/detail/:id', component: () => import('@/views/shipper/OrderDetailPage.vue') },
      { path: 'tracking', component: () => import('@/views/shipper/TrackingPage.vue') },
      { path: 'port/list', component: () => import('@/views/shipper/PortListPage.vue') },
      { path: 'port/detail/:id', component: () => import('@/views/shipper/PortDetailPage.vue') },
      { path: 'vessel/list', component: () => import('@/views/shipper/VesselListPage.vue') },
      { path: 'vessel/detail/:id', component: () => import('@/views/shipper/VesselDetailPage.vue') },
      { path: 'line/list', component: () => import('@/views/shipper/LineListPage.vue') },
      { path: 'line/detail/:id', component: () => import('@/views/shipper/LineDetailPage.vue') },
    ]
  },
  {
    path: '/shipping', component: () => import('@/views/shipping/Layout.vue'),
    children: [
      { path: 'dashboard', component: () => import('@/views/shipping/DashboardPage.vue') },
      { path: 'order/list', component: () => import('@/views/shipping/OrderListPage.vue') },
      { path: 'port/list', component: () => import('@/views/shipping/PortListPage.vue') },
      { path: 'port/detail/:id', component: () => import('@/views/shipping/PortDetailPage.vue') },
      { path: 'vessel/list', component: () => import('@/views/shipping/VesselListPage.vue') },
      { path: 'vessel/detail/:id', component: () => import('@/views/shipping/VesselDetailPage.vue') },
      { path: 'line/list', component: () => import('@/views/shipping/LineListPage.vue') },
      { path: 'line/detail/:id', component: () => import('@/views/shipping/LineDetailPage.vue') },
      { path: 'voyage/create', component: () => import('@/views/shipping/CreateVoyagePage.vue') },
      { path: 'voyage/manage', component: () => import('@/views/shipping/VoyageManagePage.vue') },
      { path: 'report', component: () => import('@/views/shipping/ReportPage.vue') },
    ]
  },
  {
    path: '/admin', component: () => import('@/views/admin/Layout.vue'),
    children: [
      { path: 'dashboard', component: () => import('@/views/admin/DashboardPage.vue') },
      { path: 'shipper', component: () => import('@/views/admin/ShipperPage.vue') },
      { path: 'shipping', component: () => import('@/views/admin/ShippingPage.vue') },
      { path: 'admin/list', component: () => import('@/views/admin/AdminListPage.vue') },
      { path: 'port', component: () => import('@/views/admin/PortManagePage.vue') },
      { path: 'vessel', component: () => import('@/views/admin/VesselManagePage.vue') },
      { path: 'line', component: () => import('@/views/admin/LineManagePage.vue') },
      { path: 'order/list', component: () => import('@/views/admin/OrderListPage.vue') },
      { path: 'cargo', component: () => import('@/views/admin/CargoPage.vue') },
      { path: 'city', component: () => import('@/views/admin/CityManagePage.vue') },
      { path: 'notification', component: () => import('@/views/admin/NotificationPage.vue') },
    ]
  },
  { path: '/:pathMatch(.*)*', name: 'NotFound', component: () => import('@/views/NotFoundPage.vue') }
]

const router = createRouter({ history: createWebHistory(), routes })

const rolePathMap = { shipper: '/shipper', shipping: '/shipping', admin: '/admin' }

function clearAuth() {
  ;['access_token','refresh_token','user_role','user_id','user_name'].forEach(k => localStorage.removeItem(k))
}

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('access_token')
  const role = localStorage.getItem('user_role')
  const whiteList = ['/login', '/register']
  if (whiteList.some(p => to.path.startsWith(p))) {
    if (token && role && rolePathMap[role]) return next(rolePathMap[role] + '/dashboard')
    return next()
  }
  if (!token) return next('/login')
  const expectedPath = rolePathMap[role]
  if (!expectedPath) { clearAuth(); return next('/login') }
  if (role && !to.path.startsWith(expectedPath)) return next(expectedPath + '/dashboard')
  next()
})

export default router
