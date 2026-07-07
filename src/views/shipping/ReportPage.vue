<template>
  <div class="report-page">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="订单统计报表" name="order">
        <el-card>
          <el-form :model="orderQuery" inline>
            <el-form-item label="日期范围">
              <el-date-picker v-model="orderQuery.dateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" />
            </el-form-item>
            <el-form-item><el-button type="primary" @click="loadOrderStats">查询</el-button></el-form-item>
          </el-form>
          <el-row :gutter="20" v-if="orderStats">
            <el-col :span="4"><el-card shadow="hover" class="stat-card"><div class="stat-value">{{ orderStats.total_orders }}</div><div class="stat-label">总订单数</div></el-card></el-col>
            <el-col :span="4"><el-card shadow="hover" class="stat-card"><div class="stat-value">{{ orderStats.total_weight }}</div><div class="stat-label">总重量(吨)</div></el-card></el-col>
            <el-col :span="4"><el-card shadow="hover" class="stat-card"><div class="stat-value">{{ (orderStats.total_cost || 0).toFixed(2) }}</div><div class="stat-label">总费用</div></el-card></el-col>
            <el-col :span="4"><el-card shadow="hover" class="stat-card"><div class="stat-value">{{ orderStats.completed }}</div><div class="stat-label">已完成</div></el-card></el-col>
            <el-col :span="4"><el-card shadow="hover" class="stat-card"><div class="stat-value">{{ orderStats.cancelled }}</div><div class="stat-label">已取消</div></el-card></el-col>
            <el-col :span="4"><el-card shadow="hover" class="stat-card"><div class="stat-value">{{ orderStats.in_transit }}</div><div class="stat-label">运输中</div></el-card></el-col>
          </el-row>
        </el-card>
      </el-tab-pane>
      <el-tab-pane label="航次利用率报表" name="voyage">
        <el-card>
          <el-form :model="voyageQuery" inline>
            <el-form-item label="航线">
              <el-select v-model="voyageQuery.line_id" filterable placeholder="选择航线" style="width: 200px"><el-option v-for="l in lines" :key="l.line_id" :label="l.line_name" :value="l.line_id" /></el-select>
            </el-form-item>
            <el-form-item label="船舶">
              <el-select v-model="voyageQuery.vessel_id" filterable placeholder="选择船舶" style="width: 200px"><el-option v-for="v in vessels" :key="v.vessel_id" :label="v.vessel_name" :value="v.vessel_id" /></el-select>
            </el-form-item>
            <el-form-item label="航次日期">
              <el-date-picker v-model="voyageQuery.voyage_date" type="date" value-format="YYYY-MM-DD" />
            </el-form-item>
            <el-form-item><el-button type="primary" @click="loadUtilization">查询</el-button></el-form-item>
          </el-form>
          <div v-if="utilization">
            <el-descriptions :column="1" border style="margin-top: 16px">
              <el-descriptions-item label="最大载重(吨)">{{ utilization.max_deadweight_ton }}</el-descriptions-item>
              <el-descriptions-item label="已使用(吨)">{{ utilization.used_ton }}</el-descriptions-item>
              <el-descriptions-item label="利用率"><el-progress :percentage="utilization.utilization_rate" :status="utilization.utilization_rate > 90 ? 'exception' : 'success'" /></el-descriptions-item>
            </el-descriptions>
          </div>
        </el-card>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getLineListApi, getVesselListApi } from '@/api/data'
import { getOrderStatsApi, getVoyageUtilizationApi } from '@/api/report'
import { ElMessage } from 'element-plus'

const activeTab = ref('order')
const lines = ref([]); const vessels = ref([])
const orderQuery = reactive({ dateRange: null }); const orderStats = ref(null)
const voyageQuery = reactive({ line_id: null, vessel_id: null, voyage_date: '' }); const utilization = ref(null)

async function loadOrderStats() {
  if (!orderQuery.dateRange || orderQuery.dateRange.length !== 2) { ElMessage.warning('请选择日期范围'); return }
  try { const params = { start_date: orderQuery.dateRange[0], end_date: orderQuery.dateRange[1] }; const res = await getOrderStatsApi(params); orderStats.value = res.data || {} } catch (e) { ElMessage.error(e.message || '查询失败') }
}
async function loadUtilization() {
  if (!voyageQuery.line_id || !voyageQuery.vessel_id || !voyageQuery.voyage_date) { ElMessage.warning('请选择所有查询条件'); return }
  try { const res = await getVoyageUtilizationApi({ line_id: voyageQuery.line_id, vessel_id: voyageQuery.vessel_id, voyage_date: voyageQuery.voyage_date }); utilization.value = res.data || {} } catch (e) { ElMessage.error(e.message || '查询失败') }
}
onMounted(async () => { try { const [lineRes, vesselRes] = await Promise.all([getLineListApi({ page: 1, page_size: 100 }), getVesselListApi({ page: 1, page_size: 100 })]); lines.value = lineRes.data || []; vessels.value = vesselRes.data || [] } catch {} })
</script>

<style scoped>
.stat-card { text-align: center; margin-bottom: 12px; }
.stat-value { font-size: 28px; font-weight: 700; color: #409eff; }
.stat-label { font-size: 13px; color: #909399; margin-top: 6px; }
</style>
