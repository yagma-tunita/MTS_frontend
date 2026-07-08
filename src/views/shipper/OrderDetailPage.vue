<template>
  <div class="order-detail-page">
    <el-card shadow="never" v-loading="loading">
      <template #header>
        <div class="page-header"><span>订单详情 - {{ order.order_no }}</span>
          <div>
            <el-button v-if="order.order_status === 0 || order.order_status === 1" type="danger" @click="handleCancel">取消订单</el-button>
            <el-button v-if="order.order_status === 1" type="success" @click="handlePay">去支付</el-button>
            <el-button type="primary" @click="$router.push(`/shipper/tracking?orderId=${order.order_id}`)">跟踪</el-button>
          </div>
        </div>
      </template>

      <el-descriptions title="订单信息" :column="3" border>
        <el-descriptions-item label="订单号" :span="3">{{ order.order_no }}</el-descriptions-item>
        <el-descriptions-item label="状态"><el-tag :type="tagType(order.order_status)" size="small">{{ tagLabel(order.order_status) }}</el-tag></el-descriptions-item>
        <el-descriptions-item label="支付状态">{{ order.payment_status === 1 ? '已支付' : '未支付' }}</el-descriptions-item>
        <el-descriptions-item label="货主公司">{{ order.shipper_company?.company_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="起运港">{{ order.departure_port?.port_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="目的港">{{ order.destination_port?.port_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="发货联系人">{{ order.shipper_contact || '-' }}</el-descriptions-item>
        <el-descriptions-item label="收货联系人">{{ order.consignee_contact || '-' }}</el-descriptions-item>
        <el-descriptions-item label="总重量">{{ order.total_weight_ton || '-' }}吨</el-descriptions-item>
        <el-descriptions-item label="总体积">{{ order.total_volume_cubic_meter || '-' }}m³</el-descriptions-item>
        <el-descriptions-item label="总费用">¥{{ (order.total_cost || 0).toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="预计离港">{{ formatDate(order.expected_departure_date) }}</el-descriptions-item>
        <el-descriptions-item label="预计到达">{{ formatDate(order.expected_arrival_date) }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatTime(order.create_time) }}</el-descriptions-item>
      </el-descriptions>

      <div v-if="trackData" style="margin-top:16px;display:flex;flex-wrap:wrap;gap:12px;padding:12px;background:#f8f9fa;border:1px solid #d0d8de;border-radius:4px;">
        <span>船舶：<strong>{{ trackData.vessel_name || '-' }}</strong></span>
        <span>类型：<strong>{{ trackData.vessel_type || '-' }}</strong></span>
        <span>载重：<strong>{{ trackData.vessel_capacity || '-' }}吨</strong></span>
        <span>TEU：<strong>{{ trackData.vessel_teu || '-' }}</strong></span>
        <span>航速：<strong>{{ trackData.vessel_speed || '-' }}节</strong></span>
        <span>航线：<strong>{{ trackData.line_name || '-' }}</strong></span>
        <span>当前载货：<strong>{{ trackData.vessel_current_load || 0 }}吨 / {{ trackData.vessel_capacity || '?' }}吨</strong></span>
      </div>

      <el-row :gutter="16" style="margin-top:16px;">
        <el-col :span="12">
          <el-card shadow="never">
            <template #header><span style="font-weight:600;">预计航次</span></template>
            <div v-if="routePorts.length > 0">
              <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:12px;">
                <template v-for="(name,i) in routePorts" :key="i">
                  <el-tag :type="i===0?'primary':(i===routePorts.length-1?'warning':'info')" size="small">{{ name }}</el-tag>
                  <span v-if="i<routePorts.length-1" style="color:#aaa;">→</span>
                </template>
              </div>
              <el-steps direction="vertical" :active="-1">
                <el-step v-for="(s,i) in plannedStops" :key="i">
                  <template #title><span style="font-weight:600;">{{ s.port_name || routePorts[i] }}</span></template>
                  <template #description>
                    <div style="font-size:12px;color:#888;">
                      <div v-if="s.planned_arrival">到港：{{ formatTime(s.planned_arrival) }}</div>
                      <div v-if="s.planned_departure">离港：{{ formatTime(s.planned_departure) }}</div>
                    </div>
                  </template>
                </el-step>
              </el-steps>
            </div>
            <el-empty v-else-if="loadingRoute" description="加载中..." />
            <div v-else style="color:#888;padding:20px;text-align:center;">暂无航线数据</div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card shadow="never">
            <template #header><span style="font-weight:600;">实际航次</span></template>
            <div v-if="actualStops.length > 0">
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
            <div v-else style="color:#888;padding:20px;text-align:center;">暂无实际航次数据</div>
          </el-card>
        </el-col>
      </el-row>

      <div v-if="trackData&&trackData.cargo_summary&&trackData.cargo_summary.length>0" style="margin-top:16px;">
        <div style="font-weight:600;margin-bottom:8px;">货物装载状态</div>
        <el-table :data="trackData.cargo_summary" stripe style="width:100%">
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

      <el-divider content-position="left">货物清单</el-divider>
      <el-table :data="order.order_cargos||[]" stripe style="width:100%">
        <el-table-column prop="cargo_name" label="货物名称" min-width="150" />
        <el-table-column prop="cargo_type" label="类型" width="100" />
        <el-table-column prop="quantity" label="数量" width="80" />
        <el-table-column prop="weight_ton" label="重量(吨)" width="100" />
        <el-table-column prop="volume_cubic_meter" label="体积(m³)" width="100" />
        <el-table-column label="单价" width="100"><template #default="{row}">¥{{ (row.unit_price||0).toFixed(2) }}</template></el-table-column>
        <el-table-column label="小计" width="110"><template #default="{row}">¥{{ (row.subtotal||0).toFixed(2) }}</template></el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getOrderDetailApi, cancelOrderApi, payOrderApi, getOrderTrackingApi } from '@/api/order'
import { getLineDetailApi, getLinePortSequenceApi, getPortListApi } from '@/api/data'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRoute } from 'vue-router'

const route = useRoute()
const loading = ref(false); const order = ref({})
const routePorts = ref([])
const loadingRoute = ref(false)
const trackingStops = ref([])
const trackingCurrent = ref(-1)
const loadingTracking = ref(false)
const trackData = ref(null)
const tagType = s => ({ 0:'info',1:'primary',2:'warning',3:'success',4:'danger' })[s]||'info'
const tagLabel = s => ({ 0:'待确认',1:'已确认',2:'运输中',3:'已完成',4:'已取消' })[s]||s
function formatDate(d) { return d ? d.slice(0,10) : '-' }
function formatTime(t) { return t ? String(t).slice(0,19).replace('T',' ') : '-' }

const plannedStops = computed(() => {
  if (!trackingStops.value || trackingStops.value.length === 0) {
    return routePorts.value.map((name,i) => ({ port_name: name, planned_arrival: null, planned_departure: null }))
  }
  return trackingStops.value.map(s => ({
    port_name: s.port_name, planned_arrival: s.planned_arrival, planned_departure: s.planned_departure
  }))
})
const actualStops = computed(() => {
  if (!trackingStops.value || (order.value.order_status != null && order.value.order_status < 2)) return []
  return trackingStops.value.filter(s => s.actual_arrival || s.actual_departure || s.status === 'completed' || s.status === 'berthed')
})

async function fetchDetail() {
  loading.value = true
  try {
    const res = await getOrderDetailApi(route.params.id)
    order.value = res.data
    await loadRoute()
    await loadTracking()
  } catch { order.value = {} }
  finally { loading.value = false }
}
async function loadRoute() {
  const note = order.value.load_note
  if (!note || !note.line_id) return
  loadingRoute.value = true
  try {
    const [lineRes, seqRes, portRes] = await Promise.all([
      getLineDetailApi(note.line_id),
      getLinePortSequenceApi(note.line_id),
      getPortListApi({ page: 1, page_size: 100 })
    ])
    const portIds = seqRes.data?.port_sequence || []
    const ports = portRes.data || []
    routePorts.value = portIds.map(id => {
      const p = ports.find(x => x.port_id === id)
      return p ? p.port_name : `港口#${id}`
    })
  } catch {} finally { loadingRoute.value = false }
}
async function loadTracking() {
  if (!order.value.order_id) return
  loadingTracking.value = true
  try {
    const res = await getOrderTrackingApi(order.value.order_id)
    trackData.value = res.data
    trackingStops.value = res.data?.stops || []
    trackingCurrent.value = res.data?.current_stop_index ?? -1
  } catch { /* ignore */ }
  finally { loadingTracking.value = false }
}
function handleCancel() {
  ElMessageBox.confirm('确认取消此订单？','提示',{type:'warning'}).then(async()=>{await cancelOrderApi(order.value.order_id);ElMessage.success('已取消');fetchDetail()}).catch(()=>{})
}
async function handlePay() {
  try { await payOrderApi(order.value.order_id); ElMessage.success('支付成功'); fetchDetail() }
  catch(e) { ElMessage.error(e.message||'支付失败') }
}
onMounted(fetchDetail)
</script>

<style scoped>
.order-detail-page { padding: 20px; }
.page-header { display:flex; justify-content:space-between; align-items:center; font-weight:600; font-size:16px; }
</style>