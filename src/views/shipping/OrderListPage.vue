<template>
  <div class="order-list-page">
    <el-card>
      <template #header><span>订单管理</span></template>
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="订单号"><el-input v-model="searchForm.order_no" placeholder="输入订单号" clearable /></el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.order_status" placeholder="全部" clearable style="width: 120px">
            <el-option label="待确认" :value="0" /><el-option label="已确认" :value="1" />
            <el-option label="运输中" :value="2" /><el-option label="已完成" :value="3" /><el-option label="已取消" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item><el-button type="primary" @click="handleSearch">搜索</el-button><el-button @click="handleReset">重置</el-button></el-form-item>
      </el-form>
      <el-table :data="orders" border stripe v-loading="loading">
        <el-table-column prop="order_no" label="订单号" min-width="180" />
        <el-table-column label="货主公司" min-width="150"><template #default="{ row }">{{ row.shipper_company?.company_name || '-' }}</template></el-table-column>
        <el-table-column prop="total_weight_ton" label="总重量(吨)" width="120" />
        <el-table-column label="总费用" width="130"><template #default="{ row }">¥{{ (row.total_cost || 0).toFixed(2) }}</template></el-table-column>
        <el-table-column prop="order_status" label="状态" width="110">
          <template #default="{ row }"><el-tag :type="statusType[row.order_status]" effect="dark" size="small">{{ statusLabel[row.order_status] }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="create_time" label="创建时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="viewDetail(row)">详情</el-button>
            <el-button v-if="row.order_status === 0" size="small" type="primary" @click="openStatusDialog(row, 1)">确认</el-button>
            <el-button v-if="row.order_status === 1" size="small" type="primary" @click="openStatusDialog(row, 2)">发货</el-button>
            <el-button v-if="row.order_status === 2" size="small" @click="openPortVisit(row)">港口更新</el-button>
            <el-button v-if="row.order_status === 2" size="small" type="success" @click="openStatusDialog(row, 3)">完成</el-button>
            <el-button v-if="row.order_status === 0" size="small" type="danger" @click="handleCancel(row)">取消</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination v-if="meta.total" v-model:current-page="query.page" v-model:page-size="query.page_size" :total="meta.total" :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next" @change="loadOrders" style="margin-top: 16px; justify-content: flex-end" />
    </el-card>

    <el-dialog v-model="statusVisible" :title="statusDialogTitle" width="550px" :close-on-click-modal="false">
      <el-descriptions :column="2" border style="margin-bottom:16px;">
        <el-descriptions-item label="订单号">{{ statusOrder?.order_no }}</el-descriptions-item>
        <el-descriptions-item label="当前状态"><el-tag :type="statusType[statusOrder?.order_status]" size="small">{{ statusLabel[statusOrder?.order_status] }}</el-tag></el-descriptions-item>
        <el-descriptions-item label="货主">{{ statusOrder?.shipper_company?.company_name }}</el-descriptions-item>
        <el-descriptions-item label="总重量">{{ statusOrder?.total_weight_ton }}吨</el-descriptions-item>
      </el-descriptions>
      <el-form :model="statusForm" label-width="120px">
        <el-form-item v-if="nextStatus === 2 || nextStatus === 3" label="作业港口">
          <el-select v-model="statusForm.port_id" placeholder="选择港口" style="width:100%">
            <el-option v-for="s in statusStops" :key="s.port_id" :label="s.port_name" :value="s.port_id" />
          </el-select>
          <div v-if="selectedStop" style="font-size:12px;color:#8c8c8c;margin-top:4px;">
            <span v-if="nextStatus === 2">计划离港：{{ formatTime(selectedStop.planned_departure) }}</span>
            <span v-if="nextStatus === 3">计划到港：{{ formatTime(selectedStop.planned_arrival) }}</span>
          </div>
        </el-form-item>
        <el-form-item v-if="nextStatus === 2" label="实际离港时间">
          <el-date-picker v-model="statusForm.actual_time" type="datetime" placeholder="选择实际离港时间" value-format="YYYY-MM-DD HH:mm:ss" style="width:100%" />
        </el-form-item>
        <el-form-item v-if="nextStatus === 3" label="实际到港时间">
          <el-date-picker v-model="statusForm.actual_time" type="datetime" placeholder="选择实际到港时间" value-format="YYYY-MM-DD HH:mm:ss" style="width:100%" />
        </el-form-item>
        <el-form-item label="操作备注">
          <el-input v-model="statusForm.notes" type="textarea" :rows="3" placeholder="可选，输入备注信息" />
        </el-form-item>
        <div v-if="nextStatus === 2" style="background:#f0f9eb;padding:12px;border-radius:4px;">
          <div style="font-weight:600;font-size:13px;color:#67c23a;">即将执行的操作</div>
          <div style="font-size:12px;color:#606266;margin-top:4px;">
            · 订单状态：已确认 → <strong>运输中</strong><br>
            · 记录所选港口的实际离港时间<br>
            · 货主将收到实时通知
          </div>
        </div>
        <div v-if="nextStatus === 3" style="background:#e6f7ff;padding:12px;border-radius:4px;">
          <div style="font-weight:600;font-size:13px;color:#1890ff;">即将执行的操作</div>
          <div style="font-size:12px;color:#606266;margin-top:4px;">
            · 订单状态：运输中 → <strong>已完成</strong><br>
            · 记录所选港口的实际到港时间<br>
            · 货主将收到实时通知
          </div>
        </div>
        <div v-if="nextStatus === 1" style="background:#fff7e6;padding:12px;border-radius:4px;">
          <div style="font-weight:600;font-size:13px;color:#e6a23c;">即将执行的操作</div>
          <div style="font-size:12px;color:#606266;margin-top:4px;">
            · 确认接受该运输订单<br>
            · 订单状态：待确认 → <strong>已确认</strong><br>
            · 货主将收到实时通知
          </div>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="statusVisible = false">取消</el-button>
        <el-button type="primary" :loading="statusUpdating" @click="confirmStatus">确认{{ statusLabel[nextStatus] }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="portVisitVisible" title="港口更新 - 记录到港/离港与装卸货" width="600px" :close-on-click-modal="false">
      <el-descriptions :column="2" border style="margin-bottom:16px;">
        <el-descriptions-item label="订单号">{{ portVisitOrder?.order_no }}</el-descriptions-item>
        <el-descriptions-item label="当前状态">运输中</el-descriptions-item>
      </el-descriptions>
      <el-form :model="portVisitForm" label-width="120px">
        <el-form-item label="作业港口">
          <el-select v-model="portVisitForm.port_id" placeholder="选择港口" style="width:100%">
            <el-option v-for="s in portVisitStops" :key="s.port_id" :label="s.port_name" :value="s.port_id" />
          </el-select>
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="实际到港时间"><el-date-picker v-model="portVisitForm.actual_arrival" type="datetime" placeholder="到港时间" value-format="YYYY-MM-DD HH:mm:ss" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="实际离港时间"><el-date-picker v-model="portVisitForm.actual_departure" type="datetime" placeholder="离港时间" value-format="YYYY-MM-DD HH:mm:ss" style="width:100%" /></el-form-item></el-col>
        </el-row>
        <el-divider content-position="left">货物操作</el-divider>
        <el-button size="small" type="primary" @click="addPortCargoOp" style="margin-bottom:8px;">添加货物操作</el-button>
        <el-table :data="portVisitForm.cargo_operations" stripe style="width:100%">
          <el-table-column label="货物名称" width="140"><template #default="{ row }"><el-input v-model="row.cargo_name" size="small" /></template></el-table-column>
          <el-table-column label="类型" width="100"><template #default="{ row }"><el-select v-model="row.cargo_type" size="small" style="width:100%"><el-option label="散货" value="bulk" /><el-option label="集装箱" value="container" /><el-option label="液体" value="liquid" /></el-select></template></el-table-column>
          <el-table-column label="重量(吨)" width="100"><template #default="{ row }"><el-input-number v-model="row.weight_ton" :min="0" :precision="1" size="small" style="width:80px" /></template></el-table-column>
          <el-table-column label="操作" width="80"><template #default="{ row }"><el-select v-model="row.operation" size="small"><el-option label="装货" value="LOAD" /><el-option label="卸货" value="UNLOAD" /></el-select></template></el-table-column>
          <el-table-column label="" width="50"><template #default="{ $index }"><el-button link type="danger" size="small" @click="portVisitForm.cargo_operations.splice($index,1)">×</el-button></template></el-table-column>
        </el-table>
      </el-form>
      <template #footer>
        <el-button @click="portVisitVisible = false">取消</el-button>
        <el-button type="primary" :loading="portVisitUpdating" @click="confirmPortVisit">提交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="订单详情" width="750px">
      <el-descriptions v-if="current" :column="2" border>
        <el-descriptions-item label="订单号">{{ current.order_no }}</el-descriptions-item>
        <el-descriptions-item label="状态"><el-tag :type="statusType[current.order_status]" effect="dark">{{ statusLabel[current.order_status] }}</el-tag></el-descriptions-item>
        <el-descriptions-item label="货主公司">{{ current.shipper_company?.company_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="出发港">{{ current.departure_port?.port_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="目的港">{{ current.destination_port?.port_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="总重量(吨)">{{ current.total_weight_ton }}</el-descriptions-item>
        <el-descriptions-item label="总费用">¥{{ (current.total_cost || 0).toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ current.create_time }}</el-descriptions-item>
      </el-descriptions>
      <div v-if="trackingStops.length > 0" style="padding:16px 0;">
        <div style="font-weight:600;margin-bottom:12px;font-size:14px;">航次时间线</div>
        <el-steps :active="trackingCurrent" direction="vertical">
          <el-step v-for="(stop, i) in trackingStops" :key="stop.port_id">
            <template #title>
              <span :style="{ fontWeight: i === trackingCurrent ? 'bold' : 'normal' }">
                {{ stop.port_name }}
                <el-tag v-if="i === trackingCurrent" size="small" type="warning" style="margin-left:8px;">当前位置</el-tag>
                <el-tag v-else-if="stop.status === 'completed'" size="small" type="success" style="margin-left:8px;">已离港</el-tag>
                <el-tag v-else-if="stop.status === 'berthed'" size="small" type="primary" style="margin-left:8px;">已靠泊</el-tag>
              </span>
            </template>
            <template #description>
              <div style="font-size:12px;color:#8c8c8c;">
                <div v-if="stop.planned_arrival">计划到港：{{ formatTime(stop.planned_arrival) }}</div>
                <div v-if="stop.actual_arrival" style="color:#52c41a;">实际到港：{{ formatTime(stop.actual_arrival) }}</div>
                <div v-if="stop.planned_departure">计划离港：{{ formatTime(stop.planned_departure) }}</div>
                <div v-if="stop.actual_departure" style="color:#52c41a;">实际离港：{{ formatTime(stop.actual_departure) }}</div>
                <div v-if="stop.cargo_operations && stop.cargo_operations.length > 0" style="margin-top:4px;">
                  <el-tag v-for="(op, oi) in stop.cargo_operations" :key="oi" :type="op.operation === 'LOAD' ? '' : 'warning'" size="small" style="margin-right:4px;margin-bottom:2px;">
                    {{ op.operation === 'LOAD' ? '装' : '卸' }}{{ op.cargo_name }}{{ op.weight_ton }}吨
                  </el-tag>
                </div>
              </div>
            </template>
          </el-step>
        </el-steps>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { getOrderListApi, updateOrderStatusApi, cancelOrderApi, getOrderTrackingApi } from '@/api/order'
import request from '@/api/request'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const orders = ref([])
const meta = ref({})
const query = reactive({ page: 1, page_size: 10 })
const searchForm = reactive({ order_no: '', order_status: '' })
const detailVisible = ref(false)
const current = ref(null)
const trackingStops = ref([])
const trackingCurrent = ref(-1)
const statusVisible = ref(false)
const statusOrder = ref(null)
const nextStatus = ref(0)
const statusUpdating = ref(false)
const statusForm = reactive({ port_id: '', actual_time: '', notes: '' })
const portVisitVisible = ref(false)
const portVisitOrder = ref(null)
const portVisitStops = ref([])
const portVisitUpdating = ref(false)
const portVisitForm = reactive({ port_id: '', actual_arrival: '', actual_departure: '', cargo_operations: [] })
function addPortCargoOp() { portVisitForm.cargo_operations.push({ cargo_name: '', cargo_type: 'bulk', weight_ton: 0, operation: 'LOAD' }) }
const statusStops = ref([])
const selectedStop = computed(() => statusStops.value.find(s => s.port_id === Number(statusForm.port_id)))
const formatTime = t => t ? String(t).slice(0, 19).replace('T', ' ') : '-'
const statusType = { 0: 'info', 1: 'primary', 2: 'warning', 3: 'success', 4: 'danger' }
const statusLabel = { 0: '待确认', 1: '已确认', 2: '运输中', 3: '已完成', 4: '已取消' }
const statusDialogTitle = computed(() => {
  if (!statusOrder.value) return ''
  const labels = { 1: '确认订单', 2: '确认发货', 3: '确认完成' }
  return labels[nextStatus.value] || '更新状态'
})

async function loadOrders() {
  loading.value = true
  try {
    const params = { ...query }
    if (searchForm.order_no) params.order_no = searchForm.order_no
    if (searchForm.order_status !== '' && searchForm.order_status !== null) params.order_status = searchForm.order_status
    const res = await getOrderListApi(params)
    orders.value = res.data || []
    meta.value = res.meta || {}
  } catch (e) { ElMessage.error(e.message || '加载失败') }
  finally { loading.value = false }
}
function handleSearch() { query.page = 1; loadOrders() }
function handleReset() { searchForm.order_no = ''; searchForm.order_status = ''; query.page = 1; loadOrders() }

async function openStatusDialog(row, status) {
  statusOrder.value = row
  nextStatus.value = status
  statusForm.port_id = ''
  statusForm.actual_time = ''
  statusForm.notes = ''
  // 加载追踪数据获取港口列表
  try {
    const res = await getOrderTrackingApi(row.order_id)
    statusStops.value = res.data?.stops || []
    // 默认选中：出发港（离港）或目的港（到港）
    if (status === 2 && row.departure_port) {
      statusForm.port_id = row.departure_port.port_id
    } else if (status === 3 && row.destination_port) {
      statusForm.port_id = row.destination_port.port_id
    }
  } catch { statusStops.value = [] }
  statusVisible.value = true
}

async function confirmStatus() {
  const row = statusOrder.value
  if (!row) return
  statusUpdating.value = true
  try {
    const payload = { status: nextStatus.value }
    if (statusForm.port_id) payload.port_id = Number(statusForm.port_id)
    if (statusForm.actual_time) payload.actual_time = statusForm.actual_time
    if (statusForm.notes) payload.notes = statusForm.notes
    await updateOrderStatusApi(row.order_id, payload)
    ElMessage.success(`订单已${statusLabel[nextStatus.value]}`)
    statusVisible.value = false
    await loadOrders()
  } catch (e) { ElMessage.error(e.message || '更新失败') }
  finally { statusUpdating.value = false }
}

async function handleCancel(row) {
  try { await ElMessageBox.confirm('确认取消该订单？此操作不可撤销。', '提示'); await cancelOrderApi(row.order_id); ElMessage.success('已取消'); await loadOrders() } catch { /* ignore */ }
}
async function viewDetail(row) { current.value = row; detailVisible.value = true; try { const res = await getOrderTrackingApi(row.order_id); trackingStops.value = res.data?.stops || []; trackingCurrent.value = res.data?.current_stop_index ?? -1 } catch { trackingStops.value = []; trackingCurrent.value = -1 } }

async function openPortVisit(row) {
  portVisitOrder.value = row
  portVisitForm.port_id = ''
  portVisitForm.actual_arrival = ''
  portVisitForm.actual_departure = ''
  portVisitForm.cargo_operations = []
  try {
    const res = await getOrderTrackingApi(row.order_id)
    portVisitStops.value = res.data?.stops || []
  } catch { portVisitStops.value = [] }
  portVisitVisible.value = true
}

async function confirmPortVisit() {
  if (!portVisitForm.port_id) { ElMessage.warning('请选择港口'); return }
  portVisitUpdating.value = true
  try {
    const payload = { port_id: Number(portVisitForm.port_id) }
    if (portVisitForm.actual_arrival) payload.actual_arrival = portVisitForm.actual_arrival
    if (portVisitForm.actual_departure) payload.actual_departure = portVisitForm.actual_departure
    if (portVisitForm.cargo_operations.length > 0) {
      payload.cargo_operations = portVisitForm.cargo_operations.map(c => ({
        cargo_name: c.cargo_name, cargo_type: c.cargo_type, weight_ton: Number(c.weight_ton), operation: c.operation
      })).filter(c => c.cargo_name)
    }
    await request.post(`/orders/${portVisitOrder.value.order_id}/port-visit`, payload)
    ElMessage.success('港口记录已更新')
    portVisitVisible.value = false
  } catch (e) { ElMessage.error(e.message || '更新失败') }
  finally { portVisitUpdating.value = false }
}
onMounted(loadOrders)
</script>

<style scoped>
.order-list-page { padding: 20px; }
.search-form { margin-bottom: 16px; }
</style>