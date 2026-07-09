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
      <el-table :data="orders" border stripe v-loading="loading" style="width:100%">
        <el-table-column prop="order_no" label="订单号" min-width="160" />
        <el-table-column label="货主公司" min-width="140"><template #default="{ row }">{{ row.shipper_company?.company_name || '-' }}</template></el-table-column>
        <el-table-column label="出发港" min-width="120"><template #default="{ row }">{{ row.departure_port?.port_name || '-' }}</template></el-table-column>
        <el-table-column label="目的港" min-width="120"><template #default="{ row }">{{ row.destination_port?.port_name || '-' }}</template></el-table-column>
        <el-table-column label="总费用" width="120"><template #default="{ row }">¥{{ (row.total_cost || 0).toFixed(2) }}</template></el-table-column>
        <el-table-column label="状态" width="90"><template #default="{ row }"><el-tag :type="tagType(row.order_status)" size="small">{{ tagLabel(row.order_status) }}</el-tag></template></el-table-column>
        <el-table-column label="创建时间" width="160"><template #default="{ row }">{{ formatTime(row.create_time) }}</template></el-table-column>
        <el-table-column label="操作" min-width="380">
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
  </div>
  <el-dialog v-model="statusVisible" :title="statusDialogTitle" width="600px" :close-on-click-modal="false">
    <p v-if="statusOrder">订单：{{ statusOrder.order_no }} | 当前：{{ statusOrder.shipper_company?.company_name }} | 总重：{{ statusOrder.total_weight_ton }}吨</p>
    <el-form :model="statusForm" label-width="120px" style="margin-top:12px;">
      <el-form-item v-if="nextStatus === 2 || nextStatus === 3" label="作业港口">
        <el-select v-model="statusForm.port_id" placeholder="选择港口" style="width:100%">
          <el-option v-for="s in statusStops" :key="s.port_id" :label="s.port_name" :value="s.port_id" />
        </el-select>
      </el-form-item>
      <el-form-item v-if="nextStatus === 2" label="实际离港时间">
        <el-date-picker v-model="statusForm.actual_time" type="datetime" placeholder="选择实际离港时间" value-format="YYYY-MM-DD HH:mm:ss" style="width:100%" />
      </el-form-item>
      <el-form-item v-if="nextStatus === 3" label="实际到港时间">
        <el-date-picker v-model="statusForm.actual_time" type="datetime" placeholder="选择实际到港时间" value-format="YYYY-MM-DD HH:mm:ss" style="width:100%" />
      </el-form-item>
      <template v-if="nextStatus === 2 || nextStatus === 3">
        <el-divider content-position="left">货物操作</el-divider>
        <el-button type="primary" @click="addCargoOp('status')" style="margin-bottom:8px;">添加货物操作</el-button>
        <el-table :data="statusForm.cargo_operations" stripe style="width:100%" :fit="false">
          <el-table-column label="货物名称" width="200"><template #default="{ row }"><el-input v-model="row.cargo_name" /></template></el-table-column>
          <el-table-column label="类型" width="140"><template #default="{ row }"><el-select v-model="row.cargo_type" style="width:100%"><el-option v-for="ct in cargoTypes" :key="ct.type_code" :label="ct.type_name" :value="ct.type_code" /></el-select></template></el-table-column>
          <el-table-column label="重量(吨)" width="140"><template #default="{ row }"><el-input-number v-model="row.weight_ton" :min="0" :precision="1" style="width:120px" /></template></el-table-column>
          <el-table-column label="装卸" width="120"><template #default="{ row }"><el-select v-model="row.operation" style="width:100%"><el-option label="装货" value="LOAD" /><el-option label="卸货" value="UNLOAD" /></el-select></template></el-table-column>
          <el-table-column label="" width="50"><template #default="{ $index }"><el-button link type="danger" @click="statusForm.cargo_operations.splice($index,1)">×</el-button></template></el-table-column>
        </el-table>
      </template>
      <el-form-item label="操作备注">
        <el-input v-model="statusForm.notes" type="textarea" :rows="2" placeholder="可选" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="statusVisible = false">取消</el-button>
      <el-button type="primary" :loading="statusLoading" @click="confirmStatus">确认{{ labelText(nextStatus) }}</el-button>
    </template>
  </el-dialog>
  <el-dialog v-model="portVisible" title="港口更新" width="700px" :close-on-click-modal="false">
    <p v-if="portOrder">订单：{{ portOrder.order_no }}</p>
    <el-form :model="portForm" label-width="130px" style="margin-top:12px;">
      <el-form-item label="作业港口">
        <el-select v-model="portForm.port_id" placeholder="选择港口" style="width:100%">
          <el-option v-for="s in portStops" :key="s.port_id" :label="s.port_name" :value="s.port_id" />
        </el-select>
      </el-form-item>
      <el-row :gutter="16">
        <el-col :span="12"><el-form-item label="实际到港时间"><el-date-picker v-model="portForm.actual_arrival" type="datetime" placeholder="到港时间" value-format="YYYY-MM-DD HH:mm:ss" style="width:100%" /></el-form-item></el-col>
        <el-col :span="12"><el-form-item label="实际离港时间"><el-date-picker v-model="portForm.actual_departure" type="datetime" placeholder="离港时间" value-format="YYYY-MM-DD HH:mm:ss" style="width:100%" /></el-form-item></el-col>
      </el-row>
      <el-divider content-position="left">货物操作</el-divider>
      <el-button type="primary" @click="addCargoOp('port')" style="margin-bottom:8px;">添加货物操作</el-button>
      <el-table :data="portForm.cargo_operations" stripe style="width:100%" :fit="false">
        <el-table-column label="货物名称" width="200"><template #default="{ row }"><el-input v-model="row.cargo_name" /></template></el-table-column>
        <el-table-column label="类型" width="140"><template #default="{ row }"><el-select v-model="row.cargo_type" style="width:100%"><el-option v-for="ct in cargoTypes" :key="ct.type_code" :label="ct.type_name" :value="ct.type_code" /></el-select></template></el-table-column>
        <el-table-column label="重量(吨)" width="140"><template #default="{ row }"><el-input-number v-model="row.weight_ton" :min="0" :precision="1" style="width:120px" /></template></el-table-column>
        <el-table-column label="装卸" width="120"><template #default="{ row }"><el-select v-model="row.operation" style="width:100%"><el-option label="装货" value="LOAD" /><el-option label="卸货" value="UNLOAD" /></el-select></template></el-table-column>
        <el-table-column label="" width="50"><template #default="{ $index }"><el-button link type="danger" @click="portForm.cargo_operations.splice($index,1)">×</el-button></template></el-table-column>
      </el-table>
    </el-form>
    <template #footer>
      <el-button @click="portVisible = false">取消</el-button>
      <el-button type="primary" :loading="portLoading" @click="confirmPort">提交</el-button>
    </template>
  </el-dialog>
  <el-dialog v-model="detailVisible" title="订单详情" width="850px">
    <p v-if="detail"><strong>{{ detail.order_no }}</strong> | <el-tag :type="tagType(detail.order_status)" size="small">{{ tagLabel(detail.order_status) }}</el-tag></p>
    <el-row :gutter="16" v-if="detailTrack" style="margin-top:12px;">
      <el-col :span="12">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="货主公司">{{ detail.shipper_company?.company_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="出发港">{{ detail.departure_port?.port_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="目的港">{{ detail.destination_port?.port_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="总重量">{{ detail.total_weight_ton }}吨</el-descriptions-item>
          <el-descriptions-item label="总费用">¥{{ (detail.total_cost || 0).toFixed(2) }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatTime(detail.create_time) }}</el-descriptions-item>
        </el-descriptions>
      </el-col>
      <el-col :span="12">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="船舶名称">{{ detailTrack.vessel_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="船舶类型">{{ detailTrack.vessel_type || '-' }}</el-descriptions-item>
          <el-descriptions-item label="最大载重">{{ detailTrack.vessel_capacity ? detailTrack.vessel_capacity + '吨' : '-' }}</el-descriptions-item>
          <el-descriptions-item label="集装箱(TEU)">{{ detailTrack.vessel_teu || '-' }}</el-descriptions-item>
          <el-descriptions-item label="航速">{{ detailTrack.vessel_speed ? detailTrack.vessel_speed + '节' : '-' }}</el-descriptions-item>
          <el-descriptions-item label="当前载货">{{ detailTrack.vessel_current_load||0 }}吨/{{ detailTrack.vessel_capacity||'?' }}吨</el-descriptions-item>
          <el-descriptions-item label="航线名称">{{ detailTrack.line_name || '-' }}</el-descriptions-item>
        </el-descriptions>
      </el-col>
    </el-row>
    <div v-if="detailTrack && detailTrack.cargo_summary && detailTrack.cargo_summary.length > 0" style="margin-top:16px;">
      <p style="font-weight:600;margin-bottom:8px;">货物装载状态</p>
      <el-table :data="detailTrack.cargo_summary" stripe style="width:100%">
        <el-table-column prop="cargo_name" label="货物名称" width="160" />
        <el-table-column prop="cargo_type" label="类型" width="100" />
        <el-table-column prop="weight_ton" label="计划(吨)" width="100" />
        <el-table-column label="已装船(吨)" width="110"><template #default="{row}">{{ row.loaded_ton || 0 }}</template></el-table-column>
        <el-table-column label="已卸货(吨)" width="110"><template #default="{row}">{{ row.discharged || 0 }}</template></el-table-column>
        <el-table-column label="状态" width="110">
          <template #default="{row}">
            <el-tag :type="{pending:'info',partial:'warning',loaded:'primary',discharged:'success'}[row.status]||'info'" size="small">{{ {pending:'待装船',partial:'部分装船',loaded:'已装船',discharged:'已卸货'}[row.status]||row.status }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <el-row :gutter="16" style="margin-top:16px;">
      <el-col :span="12">
        <div style="font-weight:600;margin-bottom:8px;">预计航次</div>
        <div v-if="plannedStops2.length>0">
          <el-steps direction="vertical" :active="-1">
            <el-step v-for="(s,i) in plannedStops2" :key="i">
              <template #title>{{ s.port_name||s }}</template>
              <template #description>
                <div style="font-size:12px;color:#888;">
                  <div v-if="s.planned_arrival">到港：{{ formatTime(s.planned_arrival) }}</div>
                  <div v-if="s.planned_departure">离港：{{ formatTime(s.planned_departure) }}</div>
                </div>
              </template>
            </el-step>
          </el-steps>
        </div>
        <div v-else style="color:#888;padding:12px;text-align:center;">暂无计划数据</div>
      </el-col>
      <el-col :span="12">
        <div style="font-weight:600;margin-bottom:8px;">实际航次</div>
        <div v-if="actualStops2.length>0">
          <el-steps direction="vertical" :active="detailCurrent">
            <el-step v-for="(s,i) in actualStops2" :key="s.port_id">
              <template #title>
                {{ s.port_name }}
                <el-tag v-if="i===detailCurrent" size="small" type="warning">当前位置</el-tag>
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
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { getOrderListApi, cancelOrderApi, getOrderTrackingApi } from '@/api/order'
import { getCargoTypeListApi } from '@/api/data'
import request from '@/api/request'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const orders = ref([])
const meta = ref({})
const query = reactive({ page: 1, page_size: 10 })
const cargoTypes = ref([])
const searchForm = reactive({ order_no: '', order_status: '' })
const tagType = s => ({ 0:'info',1:'primary',2:'warning',3:'success',4:'danger' })[s]||'info'
const tagLabel = s => ({ 0:'待确认',1:'已确认',2:'运输中',3:'已完成',4:'已取消' })[s]||s
const formatTime = t => t ? String(t).slice(0,19).replace('T',' ') : '-'

async function loadOrders() {
  loading.value = true
  try {
    const params = { ...query }
    if (searchForm.order_no) params.order_no = searchForm.order_no
    if (searchForm.order_status !== '' && searchForm.order_status !== null) params.order_status = searchForm.order_status
    const res = await getOrderListApi(params)
    orders.value = res.data || []
    meta.value = res.meta || {}
  } catch(e) { ElMessage.error(e.message||'加载失败') }
  finally { loading.value = false }
}
function handleSearch() { query.page = 1; loadOrders() }
function handleReset() { searchForm.order_no = ''; searchForm.order_status = ''; query.page = 1; loadOrders() }
async function handleCancel(row) {
  try { await ElMessageBox.confirm('确认取消该订单？','提示'); await cancelOrderApi(row.order_id); ElMessage.success('已取消'); await loadOrders() }
  catch { /* ignore */ }
}

// 状态更新
const statusVisible = ref(false)
const statusOrder = ref(null)
const nextStatus = ref(0)
const statusLoading = ref(false)
const statusForm = reactive({ port_id:'', actual_time:'', notes:'', cargo_operations:[] })
const statusStops = ref([])
const statusDialogTitle = computed(() => {
  const map = { 1:'确认订单', 2:'确认发货', 3:'确认完成' }
  return map[nextStatus.value] || '更新状态'
})
function labelText(s) {
  return tagLabel(s)
}
function defaultCargoType() {
  return cargoTypes.value.length > 0 ? cargoTypes.value[0].type_code : 'bulk'
}
function addCargoOp(type) {
  const op = { cargo_name:'', cargo_type: defaultCargoType(), weight_ton:0, operation:'LOAD' }
  if (type === 'status') statusForm.cargo_operations.push({...op})
  else portForm.cargo_operations.push({...op})
}
async function openStatusDialog(row, status) {
  statusOrder.value = row
  nextStatus.value = status
  statusForm.port_id = ''
  statusForm.actual_time = ''
  statusForm.notes = ''
  statusForm.cargo_operations = []
  try {
    const res = await getOrderTrackingApi(row.order_id)
    statusStops.value = res.data?.stops || []
    if (status === 2 && row.departure_port) statusForm.port_id = row.departure_port.port_id
    else if (status === 3 && row.destination_port) statusForm.port_id = row.destination_port.port_id
  } catch { statusStops.value = [] }
  statusVisible.value = true
}
async function confirmStatus() {
  const row = statusOrder.value
  if (!row) return
  statusLoading.value = true
  try {
    const payload = { status: nextStatus.value }
    if (statusForm.port_id) payload.port_id = Number(statusForm.port_id)
    if (statusForm.actual_time) payload.actual_time = statusForm.actual_time
    if (statusForm.notes) payload.notes = statusForm.notes
    if (statusForm.cargo_operations.length > 0) {
      payload.cargo_operations = statusForm.cargo_operations
        .filter(c => c.cargo_name)
        .map(c => ({ cargo_name: c.cargo_name, cargo_type: c.cargo_type, weight_ton: Number(c.weight_ton), operation: c.operation }))
    }
    await request.put(`/orders/${row.order_id}/status`, payload)
    ElMessage.success(`订单已${tagLabel(nextStatus.value)}`)
    statusVisible.value = false
    await loadOrders()
  } catch(e) { ElMessage.error(e.message||'更新失败') }
  finally { statusLoading.value = false }
}

// 港口更新
const portVisible = ref(false)
const portOrder = ref(null)
const portStops = ref([])
const portLoading = ref(false)
const portForm = reactive({ port_id:'', actual_arrival:'', actual_departure:'', cargo_operations:[] })
async function openPortVisit(row) {
  portOrder.value = row
  portForm.port_id = ''
  portForm.actual_arrival = ''
  portForm.actual_departure = ''
  portForm.cargo_operations = []
  try {
    const res = await getOrderTrackingApi(row.order_id)
    portStops.value = res.data?.stops || []
  } catch { portStops.value = [] }
  portVisible.value = true
}
async function confirmPort() {
  if (!portForm.port_id) { ElMessage.warning('请选择港口'); return }
  portLoading.value = true
  try {
    const payload = { port_id: Number(portForm.port_id) }
    if (portForm.actual_arrival) payload.actual_arrival = portForm.actual_arrival
    if (portForm.actual_departure) payload.actual_departure = portForm.actual_departure
    if (portForm.cargo_operations.length > 0) {
      payload.cargo_operations = portForm.cargo_operations
        .filter(c => c.cargo_name)
        .map(c => ({ cargo_name: c.cargo_name, cargo_type: c.cargo_type, weight_ton: Number(c.weight_ton), operation: c.operation }))
    }
    await request.post(`/orders/${portOrder.value.order_id}/port-visit`, payload)
    ElMessage.success('港口记录已更新')
    portVisible.value = false
  } catch(e) { ElMessage.error(e.message||'更新失败') }
  finally { portLoading.value = false }
}

// 详情
const detailVisible = ref(false)
const detail = ref(null)
const detailTrack = ref(null)
const detailStops = ref([])
const detailCurrent = ref(-1)
const plannedStops2 = computed(() => {
  if (!detailStops.value || detailStops.value.length === 0) return []
  return detailStops.value.map(s => ({ port_name: s.port_name, planned_arrival: s.planned_arrival, planned_departure: s.planned_departure }))
})
const actualStops2 = computed(() => {
  if (!detailStops.value || (detail.value?.order_status != null && detail.value.order_status < 2)) return []
  return detailStops.value.filter(s => s.actual_arrival || s.actual_departure || s.status === 'completed' || s.status === 'berthed')
})
async function viewDetail(row) {
  detail.value = row
  detailVisible.value = true
  try {
    const res = await getOrderTrackingApi(row.order_id)
    detailTrack.value = res.data
    detailStops.value = res.data?.stops || []
    detailCurrent.value = res.data?.current_stop_index ?? -1
  } catch { detailStops.value = [] }
}

onMounted(async () => { loadOrders(); try { const res = await getCargoTypeListApi(); cargoTypes.value = res.data || [] } catch { /* ignore */ } })
</script>

<style scoped>
.order-list-page { padding: 20px; }
.search-form { margin-bottom: 16px; }
</style>