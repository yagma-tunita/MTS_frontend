<template>
  <div class="tracking-page">
    <el-row :gutter="16">
      <el-col :span="10">
        <el-card>
          <template #header>
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span>订单列表</span>
              <el-select v-model="statusFilter" placeholder="状态" clearable size="small" style="width:100px" @change="loadOrders">
                <el-option label="待确认" :value="0" /><el-option label="已确认" :value="1" />
                <el-option label="运输中" :value="2" /><el-option label="已完成" :value="3" /><el-option label="已取消" :value="4" />
              </el-select>
            </div>
          </template>
          <el-table :data="orders" v-loading="loadingOrders" stripe style="width:100%;cursor:pointer;" @row-click="selectOrder" highlight-current-row>
            <el-table-column prop="order_no" label="订单号" width="150" />
            <el-table-column label="状态" width="70">
              <template #default="{row}"><el-tag :type="tagType(row.order_status)" size="small">{{ tagLabel(row.order_status) }}</el-tag></template>
            </el-table-column>
            <el-table-column label="费用" width="80"><template #default="{row}">¥{{ (row.total_cost || 0).toFixed(0) }}</template></el-table-column>
          </el-table>
          <el-empty v-if="!loadingOrders && orders.length === 0" description="暂无订单" />
        </el-card>
      </el-col>
      <el-col :span="14">
        <el-card>
          <template #header>
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span>订单追踪</span>
              <div>
                <el-input v-model="searchId" placeholder="输入订单ID查询" size="small" style="width:160px;margin-right:8px;" @keyup.enter="fetchTracking" />
                <el-button type="primary" size="small" :loading="loading" @click="fetchTracking">查询</el-button>
              </div>
            </div>
          </template>
          <div v-if="tracking">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="订单号" :span="2">{{ tracking.order_no }}</el-descriptions-item>
              <el-descriptions-item label="状态"><el-tag :type="tagType(tracking.order_status)" effect="dark">{{ tagLabel(tracking.order_status) }}</el-tag></el-descriptions-item>
              <el-descriptions-item label="船舶">{{ tracking.vessel_name || '-' }}</el-descriptions-item>
              <el-descriptions-item label="航线">{{ tracking.line_name || '-' }}</el-descriptions-item>
              <el-descriptions-item label="起运港">{{ tracking.departure_port || '-' }}</el-descriptions-item>
              <el-descriptions-item label="目的港">{{ tracking.destination_port || '-' }}</el-descriptions-item>
              <el-descriptions-item label="计划离港">{{ formatTime(tracking.departure_planned) }}</el-descriptions-item>
              <el-descriptions-item label="实际离港">{{ formatTime(tracking.departure_actual) }}</el-descriptions-item>
              <el-descriptions-item label="计划到港">{{ formatTime(tracking.arrival_planned) }}</el-descriptions-item>
              <el-descriptions-item label="实际到港">{{ formatTime(tracking.arrival_actual) }}</el-descriptions-item>
              <el-descriptions-item label="装货时间">{{ formatTime(tracking.load_time) }}</el-descriptions-item>
              <el-descriptions-item label="卸货时间">{{ formatTime(tracking.unload_time) }}</el-descriptions-item>
            </el-descriptions>
          </div>
          <el-empty v-else-if="searched && !loading" description="未找到该订单，请从左边列表选择或输入ID查询" />
          <div v-else style="text-align:center;padding:60px 0;color:#8c8c8c;">从左侧列表选择订单查看追踪信息</div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getOrderTrackingApi, getOrderListApi } from '@/api/order'
import { ElMessage } from 'element-plus'

const route = useRoute()
const searchId = ref('')
const loading = ref(false)
const tracking = ref(null)
const searched = ref(false)
const orders = ref([])
const loadingOrders = ref(false)
const statusFilter = ref('')
const tagType = s => ({ 0: 'info', 1: 'primary', 2: 'warning', 3: 'success', 4: 'danger' })[s] || 'info'
const tagLabel = s => ({ 0: '待确认', 1: '已确认', 2: '运输中', 3: '已完成', 4: '已取消' })[s] || s
const formatTime = t => t ? String(t).slice(0, 19).replace('T', ' ') : '-'

async function loadOrders() {
  loadingOrders.value = true
  try {
    const params = { page: 1, page_size: 20 }
    const userId = localStorage.getItem('user_id')
    if (userId) params.shipper_company_id = userId
    if (statusFilter.value !== '' && statusFilter.value !== null) params.order_status = statusFilter.value
    const res = await getOrderListApi(params)
    orders.value = res.data || []
  } catch { orders.value = [] }
  finally { loadingOrders.value = false }
}

async function fetchTracking(id) {
  const orderId = id || searchId.value.trim()
  if (!orderId) { ElMessage.warning('请输入或选择订单ID'); return }
  loading.value = true; searched.value = true
  try { const res = await getOrderTrackingApi(orderId); tracking.value = res.data } catch { tracking.value = null; ElMessage.error('查询失败') }
  finally { loading.value = false }
}

function selectOrder(row) {
  searchId.value = String(row.order_id)
  fetchTracking(row.order_id)
}

onMounted(() => {
  loadOrders()
  if (route.query.orderId) {
    searchId.value = route.query.orderId
    fetchTracking(route.query.orderId)
  }
})
</script>

<style scoped>
.tracking-page { padding: 20px; }
.el-table :deep(.el-table__row) { cursor: pointer; }
.el-table :deep(.current-row) { background: #e6f7ff !important; }
</style>
