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

    <el-card>
      <template #header>最近订单</template>
      <el-table :data="orders" v-loading="loading" stripe style="width:100%">
        <el-table-column prop="order_no" label="订单号" width="200" />
        <el-table-column label="货主" width="140"><template #default="{ row }">{{ row.shipper_company?.company_name || '-' }}</template></el-table-column>
        <el-table-column label="起运港" width="160"><template #default="{ row }">{{ row.departure_port?.port_name || '-' }}</template></el-table-column>
        <el-table-column label="目的港" width="160"><template #default="{ row }">{{ row.destination_port?.port_name || '-' }}</template></el-table-column>
        <el-table-column prop="total_weight_ton" label="重量(吨)" width="100" />
        <el-table-column label="状态" width="90"><template #default="{ row }"><el-tag :type="tagType(row.order_status)" size="small">{{ tagLabel(row.order_status) }}</el-tag></template></el-table-column>
      </el-table>
    </el-card>

    <el-card style="margin-top:16px">
      <template #header>最近航次</template>
      <el-table :data="voyages" v-loading="voyageLoading" stripe style="width:100%">
        <el-table-column label="航次日期" width="120"><template #default="{ row }">{{ row.voyage_date ? String(row.voyage_date).slice(0,10) : '-' }}</template></el-table-column>
        <el-table-column label="航线" width="200"><template #default="{ row }">{{ row.line?.line_name || row.line_id || '-' }}</template></el-table-column>
        <el-table-column label="船舶" width="180"><template #default="{ row }">{{ row.vessel?.vessel_name || row.vessel_id || '-' }}</template></el-table-column>
        <el-table-column label="港口" width="160"><template #default="{ row }">{{ row.port?.port_name || '-' }}</template></el-table-column>
        <el-table-column label="计划到港" width="160"><template #default="{ row }">{{ formatTime(row.planned_arrival_time) }}</template></el-table-column>
        <el-table-column label="计划离港" width="160"><template #default="{ row }">{{ formatTime(row.planned_departure_time) }}</template></el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getOrderListApi } from '@/api/order'
import { getVesselListApi, getLineListApi } from '@/api/data'
import { getVoyageGroupsApi } from '@/api/voyage'
import { List, Ship, Connection, Clock } from '@element-plus/icons-vue'

const loading = ref(false)
const orders = ref([])
const voyages = ref([])
const voyageLoading = ref(false)
const userName = ref(localStorage.getItem('user_name') || '')
const stats = ref({ vesselCount: 0, lineCount: 0 })
const tagType = s => ({ 0: 'info', 1: 'primary', 2: 'warning', 3: 'success', 4: 'danger' })[s] || 'info'
const tagLabel = s => ({ 0: '待确认', 1: '已确认', 2: '运输中', 3: '已完成', 4: '已取消' })[s] || s
const statCards = computed(() => [
  { label: '船舶总数', value: stats.value.vesselCount, icon: Ship, color: '#1a5276' },
  { label: '航线总数', value: stats.value.lineCount, icon: Connection, color: '#722ed1' },
  { label: '待处理', value: orders.value.filter(o => o.order_status === 0 || o.order_status === 1).length, icon: Clock, color: '#faad14' },
  { label: '运输中', value: orders.value.filter(o => o.order_status === 2).length, icon: Ship, color: '#52c41a' }
])

async function loadStats() {
  try { const [v, l] = await Promise.all([getVesselListApi({ page: 1, page_size: 1 }), getLineListApi({ page: 1, page_size: 1 })]); stats.value.vesselCount = v.meta?.total || 0; stats.value.lineCount = l.meta?.total || 0 } catch {}
}
const formatTime = t => t ? String(t).slice(0,19).replace('T',' ') : '-'
async function loadOrders() { loading.value = true; try { const res = await getOrderListApi({ page: 1, page_size: 10 }); orders.value = res.data || [] } catch { orders.value = [] } finally { loading.value = false } }
async function loadVoyages() { voyageLoading.value = true; try { const res = await getVoyageGroupsApi({ page: 1, page_size: 10 }); voyages.value = (res.data || []).map(v => ({ ...v, voyage_date: v.voyage_date, line: { line_name: v.line_name }, vessel: { vessel_name: v.vessel_name } })) } catch { voyages.value = [] } finally { voyageLoading.value = false } }
onMounted(() => { loadStats(); loadOrders(); loadVoyages() })
</script>

<style scoped>
.page-title { font-size: 16px; font-weight: 600; color: #262626; }
.page-desc { font-size: 13px; color: #8c8c8c; margin-top: 4px; }
.stat-card { background: #fff; border: 1px solid #e8e8e8; padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; }
.stat-value { font-size: 28px; font-weight: 700; color: #262626; line-height: 1.2; }
.stat-label { font-size: 13px; color: #8c8c8c; margin-top: 4px; }
.stat-icon-wrap { width: 44px; height: 44px; border-radius: 2px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
</style>
