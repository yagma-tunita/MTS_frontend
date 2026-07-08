<template>
  <div class="order-list-page">
    <el-card>
      <template #header><span>订单管理</span><el-button size="small" style="float: right" @click="handleExportOrders">导出订单</el-button></template>
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
        <el-table-column label="起运港" min-width="120"><template #default="{ row }">{{ row.departure_port?.port_name || '-' }}</template></el-table-column>
        <el-table-column label="目的港" min-width="120"><template #default="{ row }">{{ row.destination_port?.port_name || '-' }}</template></el-table-column>
        <el-table-column label="总费用" width="130"><template #default="{ row }">¥{{ (row.total_cost || 0).toFixed(2) }}</template></el-table-column>
        <el-table-column prop="order_status" label="状态" width="110">
          <template #default="{ row }"><el-tag :type="tagType(row.order_status)" effect="dark" size="small">{{ tagLabel(row.order_status) }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="create_time" label="创建时间" width="180" />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="viewDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination v-if="meta.total" v-model:current-page="query.page" v-model:page-size="query.page_size" :total="meta.total" :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next" @change="loadOrders" style="margin-top: 16px; justify-content: flex-end" />
    </el-card>
    <el-dialog v-model="detailVisible" title="订单详情" width="850px">
      <el-row :gutter="16" v-if="current">
        <el-col :span="12">
          <el-descriptions :column="1" border>
            <el-descriptions-item label="订单号">{{ current.order_no }}</el-descriptions-item>
            <el-descriptions-item label="状态"><el-tag :type="tagType(current.order_status)" size="small">{{ tagLabel(current.order_status) }}</el-tag></el-descriptions-item>
            <el-descriptions-item label="支付状态">{{ current.payment_status === 1 ? '已支付' : '未支付' }}</el-descriptions-item>
            <el-descriptions-item label="货主公司">{{ current.shipper_company?.company_name || '-' }}</el-descriptions-item>
            <el-descriptions-item label="城市">{{ current.city?.city_name || '-' }}</el-descriptions-item>
            <el-descriptions-item label="起运港">{{ current.departure_port?.port_name || '-' }}</el-descriptions-item>
            <el-descriptions-item label="目的港">{{ current.destination_port?.port_name || '-' }}</el-descriptions-item>
            <el-descriptions-item label="预计离港">{{ formatShort(current.expected_departure_date) }}</el-descriptions-item>
            <el-descriptions-item label="预计到达">{{ formatShort(current.expected_arrival_date) }}</el-descriptions-item>
            <el-descriptions-item label="总重量(吨)">{{ current.total_weight_ton }}</el-descriptions-item>
            <el-descriptions-item label="总费用">¥{{ (current.total_cost || 0).toFixed(2) }}</el-descriptions-item>
            <el-descriptions-item label="联系人">{{ current.shipper_contact || '-' }}</el-descriptions-item>
            <el-descriptions-item label="收货人">{{ current.consignee_contact || '-' }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ formatTime(current.create_time) }}</el-descriptions-item>
            <el-descriptions-item label="更新时间">{{ formatTime(current.update_time) }}</el-descriptions-item>
          </el-descriptions>
        </el-col>
        <el-col :span="12">
          <el-descriptions :column="1" border v-if="trackingTrack">
            <el-descriptions-item label="船舶名称">{{ trackingTrack.vessel_name || '-' }}</el-descriptions-item>
            <el-descriptions-item label="船舶类型">{{ trackingTrack.vessel_type || '-' }}</el-descriptions-item>
            <el-descriptions-item label="最大载重">{{ trackingTrack.vessel_capacity ? trackingTrack.vessel_capacity+'吨' : '-' }}</el-descriptions-item>
            <el-descriptions-item label="集装箱(TEU)">{{ trackingTrack.vessel_teu || '-' }}</el-descriptions-item>
            <el-descriptions-item label="航速">{{ trackingTrack.vessel_speed ? trackingTrack.vessel_speed+'节' : '-' }}</el-descriptions-item>
            <el-descriptions-item label="当前载货">{{ trackingTrack.vessel_current_load||0 }}吨 / {{ trackingTrack.vessel_capacity||'?' }}吨</el-descriptions-item>
            <el-descriptions-item label="航线">{{ trackingTrack.line_name || '-' }}</el-descriptions-item>
          </el-descriptions>
        </el-col>
      </el-row>
      <div v-if="trackingTrack && trackingTrack.cargo_summary && trackingTrack.cargo_summary.length > 0" style="margin-top:16px;">
        <p style="font-weight:600;margin-bottom:8px;">货物装载状态</p>
        <el-table :data="trackingTrack.cargo_summary" stripe style="width:100%">
          <el-table-column prop="cargo_name" label="货物名称" width="160" />
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
          <div v-if="plannedStops.length>0">
            <el-steps direction="vertical" :active="-1">
              <el-step v-for="(s,i) in plannedStops" :key="i">
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
          <div v-if="actualStops.length>0">
            <el-steps direction="vertical" :active="trackingCurrent">
              <el-step v-for="(s,i) in actualStops" :key="s.port_id">
                <template #title>
                  {{ s.port_name }}
                  <el-tag v-if="i===trackingCurrent" size="small" type="warning">当前位置</el-tag>
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
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { getOrderListApi, getOrderTrackingApi } from '@/api/order'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const orders = ref([])
const meta = ref({})
const query = reactive({ page: 1, page_size: 10 })
const searchForm = reactive({ order_no: '', order_status: '' })
const detailVisible = ref(false)
const current = ref(null)
const trackingTrack = ref(null)
const trackingStops = ref([])
const trackingCurrent = ref(-1)
const tagType = s => ({ 0: 'info', 1: 'primary', 2: 'warning', 3: 'success', 4: 'danger' })[s] || 'info'
const tagLabel = s => ({ 0: '待确认', 1: '已确认', 2: '运输中', 3: '已完成', 4: '已取消' })[s] || s
const formatShort = d => d ? String(d).slice(0, 10) : '-'
const formatTime = t => t ? String(t).slice(0, 19).replace('T', ' ') : '-'
const plannedStops = computed(() => {
  if (!trackingStops.value || trackingStops.value.length === 0) return []
  return trackingStops.value.map(s => ({ port_name: s.port_name, planned_arrival: s.planned_arrival, planned_departure: s.planned_departure }))
})
const actualStops = computed(() => {
  if (!trackingStops.value || (current.value?.order_status != null && current.value.order_status < 2)) return []
  return trackingStops.value.filter(s => s.actual_arrival || s.actual_departure || s.status === 'completed' || s.status === 'berthed')
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
function handleExportOrders() { window.open('/api/v1/export/orders?token=' + localStorage.getItem('access_token'), '_blank') }
function handleSearch() { query.page = 1; loadOrders() }
function handleReset() { searchForm.order_no = ''; searchForm.order_status = ''; query.page = 1; loadOrders() }
async function viewDetail(row) { current.value = row; detailVisible.value = true; try { const res = await getOrderTrackingApi(row.order_id); trackingTrack.value = res.data; trackingStops.value = res.data?.stops || []; trackingCurrent.value = res.data?.current_stop_index ?? -1 } catch { trackingStops.value = []; trackingCurrent.value = -1 } }
onMounted(loadOrders)
</script>

<style scoped>
.order-list-page { padding: 20px; }
.search-form { margin-bottom: 16px; }
</style>
