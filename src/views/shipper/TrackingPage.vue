<template>
  <div class="tracking-page">
    <el-row :gutter="16">
      <el-col :span="8">
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
      <el-col :span="16">
        <el-card>
          <template #header>
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span>物流追踪</span>
              <div>
                <el-input v-model="searchId" placeholder="输入订单ID查询" size="small" style="width:160px;margin-right:8px;" @keyup.enter="fetchTracking" />
                <el-button type="primary" size="small" :loading="loading" @click="fetchTracking">查询</el-button>
              </div>
            </div>
          </template>
          <div v-if="tracking">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="订单号" :span="2">{{ tracking.order_no }}</el-descriptions-item>
              <el-descriptions-item label="状态"><el-tag :type="tagType(tracking.order_status)" size="small">{{ tagLabel(tracking.order_status) }}</el-tag></el-descriptions-item>
              <el-descriptions-item label="船舶名称">{{ tracking.vessel_name || '-' }}</el-descriptions-item>
              <el-descriptions-item label="船舶类型">{{ tracking.vessel_type || '-' }}</el-descriptions-item>
              <el-descriptions-item label="最大载重">{{ tracking.vessel_capacity ? tracking.vessel_capacity+'吨' : '-' }}</el-descriptions-item>
              <el-descriptions-item label="集装箱(TEU)">{{ tracking.vessel_teu || '-' }}</el-descriptions-item>
              <el-descriptions-item label="航速">{{ tracking.vessel_speed ? tracking.vessel_speed+'节' : '-' }}</el-descriptions-item>
              <el-descriptions-item label="当前载货">{{ tracking.vessel_current_load||0 }}吨/{{ tracking.vessel_capacity||'?' }}吨</el-descriptions-item>
              <el-descriptions-item label="航线">{{ tracking.line_name || '-' }}</el-descriptions-item>
              <el-descriptions-item label="起运港">{{ tracking.departure_port || '-' }}</el-descriptions-item>
              <el-descriptions-item label="目的港">{{ tracking.destination_port || '-' }}</el-descriptions-item>
            </el-descriptions>

            <div v-if="tracking.cargo_summary && tracking.cargo_summary.length > 0" style="margin-top:16px;">
              <div style="font-weight:600;margin-bottom:8px;">货物装载状态</div>
              <el-table :data="tracking.cargo_summary" stripe style="width:100%">
                <el-table-column prop="cargo_name" label="货物名称" width="160" />
                <el-table-column prop="weight_ton" label="计划(吨)" width="90" />
                <el-table-column label="已装船(吨)" width="100"><template #default="{row}">{{ row.loaded_ton||0 }}</template></el-table-column>
                <el-table-column label="已卸货(吨)" width="100"><template #default="{row}">{{ row.discharged||0 }}</template></el-table-column>
                <el-table-column label="状态" width="100">
                  <template #default="{row}">
                    <el-tag :type="{pending:'info',partial:'warning',loaded:'primary',discharged:'success'}[row.status]||'info'" size="small">{{ {pending:'待装船',partial:'部分装船',loaded:'已装船',discharged:'已卸货'}[row.status]||row.status }}</el-tag>
                  </template>
                </el-table-column>
              </el-table>
            </div>

            <el-row :gutter="16" style="margin-top:16px;">
              <el-col :span="12">
                <div style="font-weight:600;margin-bottom:8px;">预计航次</div>
                <el-steps direction="vertical" :active="-1" v-if="tracking.stops&&tracking.stops.length>0">
                  <el-step v-for="(s,i) in tracking.stops" :key="i">
                    <template #title>{{ s.port_name }}</template>
                    <template #description>
                      <div style="font-size:12px;color:#888;">
                        <div v-if="s.planned_arrival">到港：{{ formatTime(s.planned_arrival) }}</div>
                        <div v-if="s.planned_departure">离港：{{ formatTime(s.planned_departure) }}</div>
                      </div>
                    </template>
                  </el-step>
                </el-steps>
              </el-col>
              <el-col :span="12">
                <div style="font-weight:600;margin-bottom:8px;">实际航次</div>
                <div v-if="actualStops.length>0">
                  <el-steps direction="vertical" :active="tracking.current_stop_index">
                    <el-step v-for="(s,i) in actualStops" :key="s.port_id">
                      <template #title>
                        {{ s.port_name }}
                        <el-tag v-if="i===tracking.current_stop_index" size="small" type="warning">当前位置</el-tag>
                        <el-tag v-else-if="s.status==='completed'" size="small" type="success">已离港</el-tag>
                        <el-tag v-else-if="s.status==='berthed'" size="small" type="primary">已靠泊</el-tag>
                      </template>
                      <template #description>
                        <div style="font-size:12px;color:#888;">
                          <div v-if="s.actual_arrival" style="color:#52c41a;">到港：{{ formatTime(s.actual_arrival) }}</div>
                          <div v-if="s.actual_departure" style="color:#52c41a;">离港：{{ formatTime(s.actual_departure) }}</div>
                          <div v-if="s.cargo_operations&&s.cargo_operations.length>0" style="margin-top:4px;">
                            <el-tag v-for="(op,oi) in s.cargo_operations" :key="oi" :type="op.operation==='LOAD'?'':'warning'" size="small" style="margin-right:4px;margin-bottom:2px;">{{ op.operation==='LOAD'?'装':'卸' }}{{ op.cargo_name }}{{ op.weight_ton }}吨</el-tag>
                          </div>
                        </div>
                      </template>
                    </el-step>
                  </el-steps>
                </div>
                <div v-else style="color:#888;padding:12px;text-align:center;">暂无实际数据</div>
              </el-col>
            </el-row>
          </div>
          <el-empty v-else-if="searched && !loading" description="未找到该订单，请从左边列表选择或输入ID查询" />
          <div v-else style="text-align:center;padding:60px 0;color:#8c8c8c;">从左侧列表选择订单查看追踪信息</div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
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
const actualStops = computed(() => {
  if (!tracking.value?.stops || (tracking.value?.order_status != null && tracking.value.order_status < 2)) return []
  return tracking.value.stops.filter(s => s.actual_arrival || s.actual_departure || s.status === 'completed' || s.status === 'berthed')
})

async function loadOrders() {
  loadingOrders.value = true
  try {
    const params = { page: 1, page_size: 20 }
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
.el-table :deep(.current-row) { background: #d4e4f0 !important; }
</style>