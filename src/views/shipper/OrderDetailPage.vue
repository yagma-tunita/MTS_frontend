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

      <el-descriptions title="订单信息" :column="2" border>
        <el-descriptions-item label="订单号" :span="2">{{ order.order_no }}</el-descriptions-item>
        <el-descriptions-item label="订单状态">
          <el-tag :type="tagType(order.order_status)" effect="dark">{{ tagLabel(order.order_status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="支付状态">{{ order.payment_status === 1 ? '已支付' : '未支付' }}</el-descriptions-item>
        <el-descriptions-item label="货主公司">{{ order.shipper_company?.company_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="所在城市">{{ order.city?.city_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="起运港">{{ order.departure_port?.port_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="目的港">{{ order.destination_port?.port_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="预计离港日期">{{ formatDate(order.expected_departure_date) }}</el-descriptions-item>
        <el-descriptions-item label="预计到达日期">{{ formatDate(order.expected_arrival_date) }}</el-descriptions-item>
        <el-descriptions-item label="发货联系人">{{ order.shipper_contact || '-' }}</el-descriptions-item>
        <el-descriptions-item label="收货联系人">{{ order.consignee_contact || '-' }}</el-descriptions-item>
        <el-descriptions-item label="总重量(吨)">{{ order.total_weight_ton || '-' }}</el-descriptions-item>
        <el-descriptions-item label="总体积(m3)">{{ order.total_volume_cubic_meter || '-' }}</el-descriptions-item>
        <el-descriptions-item label="总费用">¥{{ (order.total_cost || 0).toFixed(2) }}</el-descriptions-item>
      </el-descriptions>

      <el-divider content-position="left">航线信息</el-divider>
      <div v-if="routePorts.length > 0" style="padding:12px 0;display:flex;align-items:center;flex-wrap:wrap;gap:4px;">
        <template v-for="(name, i) in routePorts" :key="i">
          <el-tag :type="i === 0 ? 'primary' : (i === routePorts.length - 1 ? 'warning' : 'info')" size="small">{{ name }}</el-tag>
          <span v-if="i < routePorts.length - 1" style="color:#8c8c8c;">→</span>
        </template>
      </div>
      <el-empty v-else-if="loadingRoute" description="加载航线信息..." />

      <el-divider content-position="left">物流追踪时间线</el-divider>
      <div v-if="trackingStops.length > 0" style="padding:12px 0;">
        <el-steps :active="trackingCurrent" direction="vertical">
          <el-step v-for="(stop, i) in trackingStops" :key="stop.port_id">
            <template #title>
              <span :style="{ fontWeight: i === trackingCurrent ? 'bold' : 'normal' }">
                {{ stop.port_name }}
                <el-tag v-if="i === trackingCurrent" size="small" type="warning" style="margin-left:8px;">当前</el-tag>
                <el-tag v-else-if="stop.status === 'completed'" size="small" type="success" style="margin-left:8px;">已离港</el-tag>
                <el-tag v-else-if="stop.status === 'berthed'" size="small" type="primary" style="margin-left:8px;">已靠泊</el-tag>
              </span>
            </template>
            <template #description>
              <div style="font-size:12px;color:#8c8c8c;">
                <div v-if="stop.planned_arrival">计划到港：{{ formatTime(stop.planned_arrival) }}</div>
                <div v-if="stop.actual_arrival">实际到港：{{ formatTime(stop.actual_arrival) }}</div>
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
      <el-empty v-else-if="loadingTracking" description="加载追踪信息..." />
      <div v-else style="padding:12px 0;color:#8c8c8c;">暂无追踪数据</div>

      <el-descriptions title="时间记录" :column="3" border style="margin-top: 16px;">
        <el-descriptions-item label="创建时间">{{ formatTime(order.create_time) }}</el-descriptions-item>
        <el-descriptions-item label="最后更新">{{ formatTime(order.update_time) }}</el-descriptions-item>
        <el-descriptions-item label="支付时间">{{ order.payment_time ? formatTime(order.payment_time) : '-' }}</el-descriptions-item>
      </el-descriptions>

      <el-divider content-position="left">货物清单</el-divider>
      <el-table :data="order.order_cargos || []" stripe style="width: 100%">
        <el-table-column prop="cargo_name" label="货物名称" min-width="150" />
        <el-table-column prop="cargo_type" label="类型" width="100" />
        <el-table-column prop="quantity" label="数量" width="80" />
        <el-table-column prop="weight_ton" label="重量(吨)" width="100" />
        <el-table-column prop="volume_cubic_meter" label="体积(m3)" width="100" />
        <el-table-column label="单价" width="100"><template #default="{ row }">¥{{ (row.unit_price || 0).toFixed(2) }}</template></el-table-column>
        <el-table-column label="小计" width="110"><template #default="{ row }">¥{{ (row.subtotal || 0).toFixed(2) }}</template></el-table-column>
      </el-table>

      <el-divider content-position="left">装/卸货通知</el-divider>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-card shadow="never">
            <template #header>装货通知</template>
            <div v-if="order.load_note">
              <p><strong>操作类型：</strong>{{ order.load_note.operation_type }}</p>
              <p><strong>货物：</strong>{{ order.load_note.cargo_name }}</p>
              <p><strong>重量：</strong>{{ order.load_note.weight_ton }} 吨</p>
              <p><strong>状态：</strong>{{ order.load_note.cargo_handled_ton ? '已完成' : '待处理' }}</p>
            </div>
            <el-empty v-else description="暂无装货通知" />
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card shadow="never">
            <template #header>卸货通知</template>
            <div v-if="order.unload_note">
              <p><strong>操作类型：</strong>{{ order.unload_note.operation_type }}</p>
              <p><strong>货物：</strong>{{ order.unload_note.cargo_name }}</p>
              <p><strong>重量：</strong>{{ order.unload_note.weight_ton }} 吨</p>
              <p><strong>状态：</strong>{{ order.unload_note.cargo_handled_ton ? '已完成' : '待处理' }}</p>
            </div>
            <el-empty v-else description="暂无卸货通知" />
          </el-card>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
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
const tagType = s => ({ 0: 'info', 1: 'primary', 2: 'warning', 3: 'success', 4: 'danger' })[s] || 'info'
const tagLabel = s => ({ 0: '待确认', 1: '已确认', 2: '运输中', 3: '已完成', 4: '已取消' })[s] || s

function formatDate(d) { return d ? d.slice(0, 10) : '-' }
function formatTime(t) { return t ? t.slice(0, 19).replace('T', ' ') : '-' }

async function fetchDetail() { loading.value = true; try { const res = await getOrderDetailApi(route.params.id); order.value = res.data; await loadRoute(); await loadTracking() } catch { order.value = {} } finally { loading.value = false } }

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
async function loadTracking() { if (!order.value.order_id) return; loadingTracking.value = true; try { const res = await getOrderTrackingApi(order.value.order_id); trackingStops.value = res.data?.stops || []; trackingCurrent.value = res.data?.current_stop_index ?? -1 } catch { /* ignore */ } finally { loadingTracking.value = false } }
function handleCancel() { ElMessageBox.confirm('确认取消此订单？', '提示', { type: 'warning' }).then(async () => { await cancelOrderApi(order.value.order_id); ElMessage.success('已取消'); fetchDetail() }).catch(() => {}) }
async function handlePay() { try { await payOrderApi(order.value.order_id); ElMessage.success('支付成功'); fetchDetail() } catch (e) { ElMessage.error(e.message || '支付失败') } }
onMounted(fetchDetail)
</script>

<style scoped>
.order-detail-page { padding: 20px; }
.page-header { display: flex; justify-content: space-between; align-items: center; font-weight: 600; font-size: 16px; }
.el-descriptions__title { font-size: 15px; }
</style>
