<template>
  <div>
    <div class="page-title">工作台</div>
    <div class="page-desc">欢迎回来，{{ userName }}</div>

    <el-row :gutter="16" style="margin: 16px 0">
      <el-col :span="6" v-for="item in statCards" :key="item.label">
        <div class="stat-card">
          <div class="stat-body">
            <div class="stat-value">{{ item.value }}</div>
            <div class="stat-label">{{ item.label }}</div>
          </div>
          <div class="stat-icon-wrap" :style="{ background: item.color + '1a', color: item.color }">
            <el-icon :size="22"><component :is="item.icon" /></el-icon>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin: 8px 0 16px">
      <el-col :span="8" v-for="item in quickStats" :key="item.label">
        <div class="stat-card" :style="{ borderLeft: '3px solid ' + item.color }">
          <div class="stat-body">
            <div class="stat-value">{{ item.value }}</div>
            <div class="stat-label">{{ item.label }}</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-card>
      <template #header>最近订单</template>
      <el-table :data="orders" v-loading="loading" stripe style="width: 100%">
        <el-table-column prop="order_no" label="订单号" width="200" />
        <el-table-column label="起运港" min-width="130"><template #default="{ row }">{{ row.departure_port?.port_name || '-' }}</template></el-table-column>
        <el-table-column label="目的港" width="150"><template #default="{ row }">{{ row.destination_port?.port_name || '-' }}</template></el-table-column>
        <el-table-column prop="total_weight_ton" label="重量(吨)" width="90" />
        <el-table-column label="总费用" width="110"><template #default="{ row }">¥{{ (row.total_cost || 0).toFixed(2) }}</template></el-table-column>
        <el-table-column prop="order_status" label="状态" width="80">
          <template #default="{ row }"><el-tag :type="tagType(row.order_status)" size="small">{{ tagLabel(row.order_status) }}</el-tag></template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getOrderListApi } from '@/api/order'
import { getOrderStatsApi } from '@/api/report'
import { Document, Clock, CircleCheck, Close } from '@element-plus/icons-vue'

const loading = ref(false)
const orders = ref([])
const userName = ref(localStorage.getItem('user_name') || '')
const tagType = s => ({ 0: 'info', 1: 'primary', 2: 'warning', 3: 'success', 4: 'danger' })[s] || 'info'
const tagLabel = s => ({ 0: '待确认', 1: '已确认', 2: '运输中', 3: '已完成', 4: '已取消' })[s] || s
const statCards = ref([
  { label: '总订单', value: 0, icon: Document, color: '#1a5276' },
  { label: '运输中', value: 0, icon: Clock, color: '#faad14' },
  { label: '已完成', value: 0, icon: CircleCheck, color: '#52c41a' },
  { label: '已取消', value: 0, icon: Close, color: '#ff4d4f' }
])
const quickStats = ref([
  { label: '总重量(吨)', value: 0, color: '#1a5276' },
  { label: '总费用', value: '¥0.00', color: '#52c41a' },
  { label: '已完成订单', value: 0, color: '#722ed1' }
])
async function loadOrders() { loading.value = true; try { const userId = localStorage.getItem('user_id'); const res = await getOrderListApi({ shipper_company_id: userId, page: 1, page_size: 10 }); orders.value = res.data || [] } catch { orders.value = [] } finally { loading.value = false } }
async function loadStats() { try { const now = new Date(); const y = now.getFullYear(); const m = String(now.getMonth()+1).padStart(2,'0'); const d = String(now.getDate()).padStart(2,'0'); const res = await getOrderStatsApi({ start_date: (y-1)+'-'+m+'-'+d, end_date: y+'-'+m+'-'+d }); const data = res.data || {}; statCards.value = [ { label: '总订单', value: data.total_orders || 0, icon: Document, color: '#1a5276' }, { label: '运输中', value: data.in_transit || 0, icon: Clock, color: '#faad14' }, { label: '已完成', value: data.completed || 0, icon: CircleCheck, color: '#52c41a' }, { label: '已取消', value: data.cancelled || 0, icon: Close, color: '#ff4d4f' } ]; quickStats.value = [ { label: '总重量(吨)', value: (data.total_weight || 0).toFixed(2), color: '#1a5276' }, { label: '总费用', value: '¥' + (data.total_cost || 0).toFixed(2), color: '#52c41a' }, { label: '已完成订单', value: data.completed || 0, color: '#722ed1' } ] } catch {} }
onMounted(() => { loadOrders(); loadStats() })
</script>

<style scoped>
.page-title { font-size: 16px; font-weight: 600; color: #262626; }
.page-desc { font-size: 13px; color: #8c8c8c; margin-top: 4px; }
.stat-card { background: #fff; border: 1px solid #e8e8e8; padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; }
.stat-value { font-size: 28px; font-weight: 700; color: #262626; line-height: 1.2; }
.stat-label { font-size: 13px; color: #8c8c8c; margin-top: 4px; }
.stat-icon-wrap { width: 44px; height: 44px; border-radius: 2px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
</style>
