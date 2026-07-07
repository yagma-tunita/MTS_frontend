<template>
  <div class="create-voyage-page">
    <el-card>
      <template #header><span>航线申请</span></template>
      <el-form :model="form" label-width="140px" style="max-width: 1000px">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="航线" prop="line_id" :rules="[{ required: true, message: '请选择航线' }]">
              <el-select v-model="form.line_id" filterable style="width: 100%" @change="onLineChange">
                <el-option v-for="item in lines" :key="item.line_id" :label="item.line_name" :value="item.line_id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="船舶" prop="vessel_id" :rules="[{ required: true, message: '请选择船舶' }]">
              <el-select v-model="form.vessel_id" filterable style="width: 100%">
                <el-option v-for="item in vessels" :key="item.vessel_id" :label="`${item.vessel_name}（${item.speed_knot}节）`" :value="item.vessel_id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="启航日期" prop="voyage_date" :rules="[{ required: true, message: '请选择日期' }]">
              <el-date-picker v-model="form.voyage_date" type="date" style="width: 100%" value-format="YYYY-MM-DD" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="单价(元/吨)" prop="unit_price">
              <el-input-number v-model="form.unit_price" :min="0" :precision="2" :step="5" style="width: 100%" placeholder="每吨运费" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <div v-if="selectedLine" style="margin-bottom: 16px; padding: 12px 16px; background: #f0f5ff; border: 1px solid #d6e4ff; border-radius: 2px;">
        <el-row :gutter="20">
          <el-col :span="12"><strong>航线：</strong>{{ selectedLine.line_name }}</el-col>
          <el-col :span="12"><strong>总航程：</strong>{{ selectedLine.total_distance_nm }} 海里</el-col>
        </el-row>
        <el-row :gutter="20" style="margin-top: 6px;">
          <el-col :span="12"><strong>起始港：</strong>{{ selectedLine.departure_port_name }}（{{ getPortCountry(selectedLine.departure_port_name) }}）</el-col>
          <el-col :span="12"><strong>目的港：</strong>{{ selectedLine.destination_port_name }}（{{ getPortCountry(selectedLine.destination_port_name) }}）</el-col>
        </el-row>
        <el-row :gutter="20" style="margin-top: 6px;">
          <el-col :span="24"><strong>船舶：</strong>{{ selectedVessel?.vessel_name || '-' }} | <strong>航速：</strong>{{ selectedVessel?.speed_knot || '-' }} 节 | <strong>载重：</strong>{{ selectedVessel?.max_deadweight_ton || '-' }} 吨 | <strong>单价：</strong>{{ form.unit_price > 0 ? form.unit_price + ' 元/吨' : '系统默认' }}</el-col>
        </el-row>
      </div>

      <el-divider>靠泊计划</el-divider>
      <div style="margin-bottom: 12px;">
        <el-button type="primary" size="small" @click="addPortStop">添加途经港口</el-button>
      </div>

      <el-table :data="portStops" border stripe style="width: 100%">
        <el-table-column label="顺序" width="60">
          <template #default="{ $index }"><strong>{{ $index + 1 }}</strong></template>
        </el-table-column>
        <el-table-column label="港口类型" width="100">
          <template #default="{ $index }">
            <el-tag v-if="$index === 0" type="primary" size="small">起始港</el-tag>
            <el-tag v-else-if="$index === portStops.length - 1" type="warning" size="small">目的港</el-tag>
            <el-tag v-else type="info" size="small">途经</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="港口" min-width="200">
          <template #default="{ row, $index }">
            <el-select v-model="row.port_id" filterable placeholder="选择港口" style="width: 100%">
              <el-option v-for="p in ports" :key="p.port_id" :label="p.port_name + (p.city?.country ? ' (' + p.city.country + ')' : '')" :value="p.port_id" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="计划到达时间" min-width="180">
          <template #default="{ row }">
            <el-date-picker v-model="row.arrival_time" type="datetime" style="width: 100%" placeholder="选择到达时间" />
          </template>
        </el-table-column>
        <el-table-column label="计划离港时间" min-width="180">
          <template #default="{ row }">
            <el-date-picker v-model="row.departure_time" type="datetime" style="width: 100%" placeholder="选择离港时间" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80">
          <template #default="{ $index }">
            <el-button v-if="portStops.length > 1" size="small" type="danger" @click="portStops.splice($index, 1)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="portStops.length > 0" style="margin-top: 16px; padding: 16px; background: #fafafa; border: 1px solid #e8e8e8; border-radius: 2px;">
        <strong>航次概览：</strong>
        <span v-for="(ps, i) in portStops" :key="i">
          <el-tag :type="i === 0 ? 'primary' : (i === portStops.length - 1 ? 'warning' : 'info')" size="small" style="margin:0 4px;">
            {{ getPortName(ps.port_id) || '?' }}
          </el-tag>
          <span v-if="i < portStops.length - 1" style="color:#8c8c8c;"> → </span>
        </span>
      </div>

      <div style="margin-top: 24px;">
        <el-button type="primary" size="default" :loading="submitting" @click="handleSubmit">提交申请</el-button>
        <el-button size="default" @click="resetForm">重置</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { getLineListApi, getPortListApi, getVesselListApi } from '@/api/data'
import { createVoyageBerthingApi } from '@/api/voyage'
import { ElMessage } from 'element-plus'
import request from '@/api/request'

const lines = ref([])
const ports = ref([])
const vessels = ref([])
const submitting = ref(false)
const form = reactive({
  line_id: null, vessel_id: null, voyage_date: '', unit_price: 0
})
const portStops = ref([])

const selectedLine = computed(() => lines.value.find(l => l.line_id === form.line_id))
const selectedVessel = computed(() => vessels.value.find(v => v.vessel_id === form.vessel_id))

function getPortName(portId) {
  const p = ports.value.find(x => x.port_id === portId)
  return p ? p.port_name : null
}
function getPortCountry(portName) {
  const p = ports.value.find(x => x.port_name === portName)
  return p?.city?.country || '—'
}

function onLineChange() {
  portStops.value = []
}

function addPortStop() {
  portStops.value.push({
    port_id: null,
    arrival_time: null,
    departure_time: null
  })
}

function resetForm() {
  form.line_id = null; form.vessel_id = null; form.voyage_date = ''
  portStops.value = []
}

async function handleSubmit() {
  if (!form.line_id || !form.vessel_id || !form.voyage_date) {
    ElMessage.warning('请选择航线和船舶并填写启航日期'); return
  }
  if (portStops.value.length < 2) {
    ElMessage.warning('请至少添加起始港和目的港（至少2个港口）'); return
  }
  for (const ps of portStops.value) {
    if (!ps.port_id) { ElMessage.warning('请选择所有停靠港口'); return }
  }
  submitting.value = true
  let createdIds = []
  let successCount = 0
  try {
    for (let i = 0; i < portStops.value.length; i++) {
      const ps = portStops.value[i]
      const res = await createVoyageBerthingApi({
        line_id: form.line_id,
        vessel_id: form.vessel_id,
        voyage_date: form.voyage_date,
        sequence_no: i + 1,
        port_id: ps.port_id,
        planned_arrival_time: ps.arrival_time || undefined,
        planned_departure_time: ps.departure_time || undefined,
        unit_price: form.unit_price > 0 ? form.unit_price : undefined
      })
      if (res?.data?.berthing_id) createdIds.push(res.data.berthing_id)
      successCount++
    }
    ElMessage.success(`航线申请成功，共 ${successCount} 个靠泊港`)
    resetForm()
  } catch (e) {
    for (const id of createdIds) {
      try { await request.delete(`/berthings/${id}`) } catch {}
    }
    ElMessage.error(`提交失败，已回滚 ${createdIds.length} 个记录`)
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  try {
    const [lineRes, portRes, vesselRes] = await Promise.all([
      getLineListApi({ page: 1, page_size: 100 }),
      getPortListApi({ page: 1, page_size: 100 }),
      getVesselListApi({ page: 1, page_size: 100 })
    ])
    lines.value = lineRes.data || []
    ports.value = portRes.data || []
    vessels.value = vesselRes.data || []
  } catch { /* ignore */ }
})
</script>

<style scoped>
.create-voyage-page { padding: 20px; }
</style>
