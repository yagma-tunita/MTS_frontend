<template>
  <div class="layout">
    <div class="sidebar">
      <div class="sidebar-logo">
        <el-icon :size="20" color="#1890ff"><Ship /></el-icon>
        <span class="sidebar-title">MTS 航运物流管理系统</span>
      </div>
      <el-menu :default-active="activeMenu" router background-color="#001529" text-color="rgba(255,255,255,0.65)" active-text-color="#fff">
        <el-menu-item index="/shipper/dashboard"><el-icon><Odometer /></el-icon><span>工作台</span></el-menu-item>
        <el-sub-menu index="order">
          <template #title><el-icon><List /></el-icon><span>订单管理</span></template>
          <el-menu-item index="/shipper/order/list">订单列表</el-menu-item>
          <el-menu-item index="/shipper/order/create">创建订单</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="basic">
          <template #title><el-icon><DataBoard /></el-icon><span>基础数据</span></template>
          <el-menu-item index="/shipper/port/list">港口信息</el-menu-item>
          <el-menu-item index="/shipper/vessel/list">船舶信息</el-menu-item>
          <el-menu-item index="/shipper/line/list">航线信息</el-menu-item>
        </el-sub-menu>
      </el-menu>
      <div class="sidebar-footer">
        <div class="sidebar-user">
          <span class="sidebar-user-icon">{{ userName.charAt(0) }}</span>
          <div class="sidebar-user-info">
            <span class="sidebar-user-name">{{ userName }}</span>
            <span class="sidebar-user-role">{{ roleLabel[userRole] || userRole }}</span>
          </div>
        </div>
      </div>
    </div>
    <div class="main-area">
      <div class="header">
        <div class="header-left">
          <el-breadcrumb separator=">">
            <el-breadcrumb-item :to="{ path: '/shipper/dashboard' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="pageTitle">{{ pageTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <span class="header-time">{{ currentTime }}</span>
          <el-badge :value="unreadCount" :hidden="unreadCount === 0" class="notify-badge">
            <el-icon :size="18" class="header-icon" @click="notifyDrawer = true"><Bell /></el-icon>
          </el-badge>
          <el-dropdown trigger="click">
            <span class="header-user">
              <span class="header-user-icon">{{ userName.charAt(0) }}</span>
              {{ userName }}
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-item @click="handlePersonalInfo">个人信息</el-dropdown-item>
              <el-dropdown-item divided @click="passwordDialogVisible = true">修改密码</el-dropdown-item>
              <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
            </template>
          </el-dropdown>
        </div>
        <el-drawer v-model="notifyDrawer" title="通知消息" size="400px">
          <div v-loading="notifyLoading">
            <div v-if="notifyList.length === 0" style="text-align: center; color: #999; padding: 40px 0">暂无通知</div>
            <div v-for="item in notifyList" :key="item.id" class="notify-item" :class="{ 'notify-unread': !item.read }" @click="handleMarkRead(item)">
              <div class="notify-title">{{ item.title }}</div>
              <div class="notify-content">{{ item.content }}</div>
              <div class="notify-time">{{ item.create_time }}</div>
            </div>
          </div>
        </el-drawer>
      </div>
      <div class="content"><router-view /></div>
    </div>
    <PasswordChangeDialog :visible="passwordDialogVisible" role="shipper" :user-id="userIdStr" @close="passwordDialogVisible = false" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import { Ship, Odometer, List, DataBoard, ArrowDown, Bell } from '@element-plus/icons-vue'
import PasswordChangeDialog from '@/components/PasswordChangeDialog.vue'
import { getNotificationListApi, markNotificationReadApi } from '@/api/notification'
import { getCurrentUserApi } from '@/api/auth'

const router = useRouter(); const route = useRoute()
const userName = ref(localStorage.getItem('user_name') || '用户')
const userRole = ref(localStorage.getItem('user_role') || '')
const roleLabel = { shipper: '货主', shipping: '海运公司', admin: '管理员' }
const passwordDialogVisible = ref(false)
const userIdStr = localStorage.getItem('user_id')
const notifyDrawer = ref(false); const notifyList = ref([]); const notifyLoading = ref(false); const unreadCount = ref(0)
async function loadNotifications() { notifyLoading.value = true; try { const res = await getNotificationListApi({ page: 1, page_size: 50 }); notifyList.value = res.data || []; unreadCount.value = notifyList.value.filter(n => !n.read).length } catch {} finally { notifyLoading.value = false } }
async function handleMarkRead(item) { if (item.read) return; try { await markNotificationReadApi(item.id); item.read = true; unreadCount.value = notifyList.value.filter(n => !n.read).length } catch {} }
const currentTime = ref('')
let timer
let ws = null
async function refreshUser() { try { const res = await getCurrentUserApi(); if (res.data) { const d = res.data; localStorage.setItem('user_id', String(d.user_id)) } } catch {} }
onMounted(() => { const p = n => String(n).padStart(2, '0'); timer = setInterval(() => { const d = new Date(); currentTime.value = `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}` }, 1000); loadNotifications(); refreshUser(); const token = localStorage.getItem('access_token'); if (token) { try { const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`; ws = new WebSocket(`${wsUrl}?token=${token}`); ws.onmessage = (event) => { try { const data = JSON.parse(event.data); if (data.type === 'order_status_update') { ElNotification({ title: '订单状态更新', message: `订单 #${data.order_id} 状态已变更`, type: 'success' }) } } catch {} }; ws.onerror = () => {} } catch {} } })
onUnmounted(() => { clearInterval(timer); if (ws) ws.close() })
const pageTitle = computed(() => {
  const map = { '/shipper/dashboard': '工作台', '/shipper/order/list': '订单列表', '/shipper/order/create': '创建订单', '/shipper/order/detail': '订单详情', '/shipper/tracking': '订单跟踪', '/shipper/port/list': '港口信息', '/shipper/port/detail': '港口详情', '/shipper/vessel/list': '船舶信息', '/shipper/vessel/detail': '船舶详情', '/shipper/line/list': '航线信息', '/shipper/line/detail': '航线详情' }
  for (const [k, v] of Object.entries(map)) { if (route.path.startsWith(k)) return v }; return ''
})
const activeMenu = computed(() => {
  const path = route.path
  if (path.startsWith('/shipper/order/')) return '/shipper/order/list'
  if (path.startsWith('/shipper/port/')) return '/shipper/port/list'
  if (path.startsWith('/shipper/vessel/')) return '/shipper/vessel/list'
  if (path.startsWith('/shipper/line/')) return '/shipper/line/list'
  if (path.startsWith('/shipper/tracking')) return '/shipper/tracking'
  return path
})
function handlePersonalInfo() {
  const roleLabels = { shipper: '货主', shipping: '海运公司', admin: '管理员' }
  const role = localStorage.getItem('user_role')
  ElMessageBox.alert(
    `用户名：${localStorage.getItem('user_name') || '-'}\n角色：${roleLabels[role] || role}\n用户ID：${localStorage.getItem('user_id') || '-'}`,
    '个人信息',
    { confirmButtonText: '确定' }
  )
}
function handleLogout() { ;['access_token','refresh_token','user_role','user_id','user_name'].forEach(k => localStorage.removeItem(k)); router.push('/login') }
</script>

<style scoped>
.layout { display: flex; height: 100vh; width: 100vw; overflow: hidden; }
.sidebar { width: 200px; background: #001529; display: flex; flex-direction: column; flex-shrink: 0; }
.sidebar-logo { height: 48px; display: flex; align-items: center; gap: 8px; padding: 0 16px; border-bottom: 1px solid rgba(255,255,255,0.08); flex-shrink: 0; }
.sidebar-title { font-size: 14px; color: #fff; font-weight: 600; white-space: nowrap; }
.el-menu { flex: 1; overflow-y: auto; }
.el-menu :deep(.el-menu-item.is-active) { background: #1890ff !important; }
.el-menu :deep(.el-sub-menu .el-menu) { background: #000c17 !important; }
.sidebar-footer { border-top: 1px solid rgba(255,255,255,0.08); padding: 10px 16px; flex-shrink: 0; }
.sidebar-user { display: flex; align-items: center; gap: 8px; color: rgba(255,255,255,0.65); font-size: 13px; }
.sidebar-user-icon { width: 28px; height: 28px; border-radius: 2px; background: #1890ff; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 12px; flex-shrink: 0; }
.sidebar-user-info { display: flex; flex-direction: column; overflow: hidden; }
.sidebar-user-name { font-size: 13px; color: rgba(255,255,255,0.85); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sidebar-user-role { font-size: 11px; color: rgba(255,255,255,0.45); }
.main-area { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.header { height: 48px; background: #fff; border-bottom: 1px solid #e8e8e8; display: flex; align-items: center; justify-content: space-between; padding: 0 20px; flex-shrink: 0; }
.header-left { display: flex; align-items: center; }
.header-right { display: flex; align-items: center; gap: 20px; }
.header-time { font-size: 12px; color: #8c8c8c; }
.header-user { display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 13px; color: #595959; }
.header-user-icon { width: 22px; height: 22px; border-radius: 2px; background: #1890ff; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 11px; }
.header-icon { cursor: pointer; color: #595959; vertical-align: middle; }
.notify-badge { line-height: 1; }
.notify-item { padding: 10px 12px; border-bottom: 1px solid #f0f0f0; cursor: pointer; }
.notify-item:hover { background: #f5f5f5; }
.notify-unread { background: #e6f7ff; }
.notify-title { font-size: 14px; font-weight: 600; color: #333; }
.notify-content { font-size: 13px; color: #666; margin-top: 4px; }
.notify-time { font-size: 12px; color: #999; margin-top: 4px; }
.content { flex: 1; padding: 16px; overflow-y: auto; background: #f0f2f5; }
</style>
