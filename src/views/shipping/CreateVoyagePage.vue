<template>
  <div class="create-voyage-page">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="航线申请" name="line">
        <el-card>
          <template #header><span>申请新航线</span></template>
          <el-form :model="lineForm" label-width="150px" style="max-width: 900px">
            <el-form-item label="航线名称" prop="line_name">
              <el-input v-model="lineForm.line_name" placeholder="如：上海港→新加坡港" />
            </el-form-item>
            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item label="起始港" prop="departure_port_id">
                  <el-select v-model="lineForm.departure_port_id" filterable placeholder="选择起始港" style="width:100%" @change="updatePortSequence">
                    <el-option v-for="p in ports" :key="p.port_id" :label="p.port_name + (p.city?.country ? ' (' + p.city.country + ')' : '')" :value="p.port_id" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="目的港" prop="destination_port_id">
                  <el-select v-model="lineForm.destination_port_id" filterable placeholder="选择目的港" style="width:100%" @change="updatePortSequence">
                    <el-option v-for="p in ports" :key="p.port_id" :label="p.port_name + (p.city?.country ? ' (' + p.city.country + ')' : '')" :value="p.port_id" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="途经港口顺序">
              <div style="width:100%">
                <el-tag v-for="(pid, idx) in lineForm.port_sequence" :key="idx" closable :type="idx === 0 ? 'primary' : (idx === lineForm.port_sequence.length - 1 ? 'warning' : 'info')" style="margin: 2px 4px" @close="removePortSeq(idx)">
                  {{ getPortName(pid) }}
                </el-tag>
                <el-select v-model="addPortId" filterable placeholder="添加途经港" style="width:200px;margin-left:4px" @change="addPortSeq">
                  <el-option v-for="p in ports" :key="p.port_id" :label="p.port_name" :value="p.port_id" />
                </el-select>
              </div>
            </el-form-item>
            <el-form-item label="总航程(海里)">
              <el-input-number v-model="lineForm.total_distance_nm" :min="0" :precision="2" :step="100" style="width:200px" />
            </el-form-item>
            <el-form-item label="描述">
              <el-input v-model="lineForm.description" type="textarea" :rows="2" placeholder="航线描述（选填）" style="width:400px" />
            </el-form-item>
          </el-form>
          <div style="margin-top: 24px;">
            <el-button type="primary" :loading="lineSubmitting" @click="submitLine">提交航线申请</el-button>
            <el-button @click="resetLineForm">重置</el-button>
          </div>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="创建航次" name="voyage">
        <el-card>
          <template #header><span>为已启用航线创建航次</span></template>
          <el-form :model="voyageForm" label-width="140px" style="max-width: 1000px">
            <el-row :gutter="20">
              <el-col :span="8">
                <el-form-item label="航线" prop="line_id">
                  <el-select v-model="voyageForm.line_id" filterable style="width: 100%" @change="onLineChange">
                    <el-option v-for="item in activeLines" :key="item.line_id" :label="item.line_name" :value="item.line_id" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="船舶" prop="vessel_id">
                  <el-select v-model="voyageForm.vessel_id" filterable style="width: 100%">
                    <el-option v-for="item in filteredVessels" :key="item.vessel_id" :label="`${item.vessel_name}（${item.speed_knot || '-'}节/ ${item.max_deadweight_ton || '-'}吨）`" :value="item.vessel_id" />
                    <template #empty><span style="color:#8c8c8c">该航线未分配可用船舶</span></template>
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="启航日期">
                  <el-date-picker v-model="voyageForm.voyage_date" type="date" style="width: 100%" value-format="YYYY-MM-DD" />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="单价(元/吨)">
                  <el-input-number v-model="voyageForm.unit_price" :min="0" :precision="2" :step="5" style="width: 100%" placeholder="用于计算运费" />
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
              <el-col :span="12"><strong>起始港：</strong>{{ selectedLine.departure_port_name || '-' }}</el-col>
              <el-col :span="12"><strong>目的港：</strong>{{ selectedLine.destination_port_name || '-' }}</el-col>
            </el-row>
          </div>

          <el-divider>靠泊计划（途经港口）</el-divider>

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
              <template #default="{ row }">
                <el-tag>{{ getPortName(row.port_id) || '?' }}</el-tag>
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
          </el-table>

          <div v-if="portStops.length > 1" style="margin-top: 16px; padding: 16px; background: #fafafa; border: 1px solid #e8e8e8; border-radius: 2px;">
            <strong>航次路线：</strong>
            <span v-for="(ps, i) in portStops" :key="i">
              <el-tag :type="i === 0 ? 'primary' : (i === portStops.length - 1 ? 'warning' : 'info')" size="small" style="margin:0 4px;">
                {{ getPortName(ps.port_id) || '?' }}
              </el-tag>
              <span v-if="i < portStops.length - 1" style="color:#8c8c8c;"> → </span>
            </span>
          </div>

          <div style="margin-top: 24px;">
            <el-button type="primary" :loading="voyageSubmitting" @click="submitVoyage">创建航次</el-button>
            <el-button @click="resetVoyageForm">重置</el-button>
          </div>
        </el-card>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { getLineListApi, getPortListApi, getVesselListApi, getLinePortSequenceApi, getLineAssignedVesselsApi } from '@/api/data'
import { createVoyageApi, createShippingLineApi } from '@/api/voyage'
import { ElMessage } from 'element-plus'

const activeTab = ref('line')
const ports = ref([])
const vessels = ref([])
const allLines = ref([])
const lineSubmitting = ref(false)
const voyageSubmitting = ref(false)
const addPortId = ref(null)
const lineAssignedVesselIds = ref([])

const lineForm = reactive({
  line_name: '',
  departure_port_id: null,
  destination_port_id: null,
  port_sequence: [],
  total_distance_nm: 0,
  description: ''
})

const voyageForm = reactive({
  line_id: null,
  vessel_id: null,
  voyage_date: '',
  unit_price: 0
})

const portStops = ref([])

const activeLines = computed(() =>
  allLines.value.filter(l => l.line_status === 1)
)

    const selectedLine = computed(() =>
  activeLines.value.find(l => l.line_id === voyageForm.line_id)
)

const filteredVessels = computed(() => {
  if (lineAssignedVesselIds.value.length === 0) return vessels.value
  return vessels.value.filter(v => lineAssignedVesselIds.value.includes(v.vessel_id))
})

function getPortName(portId) {
  const p = ports.value.find(x => x.port_id === portId)
  return p ? p.port_name : null
}

function updatePortSequence() {
  const seq = []
  if (lineForm.departure_port_id) seq.push(lineForm.departure_port_id)
  if (lineForm.destination_port_id && lineForm.destination_port_id !== lineForm.departure_port_id) {
    seq.push(lineForm.destination_port_id)
  }
  lineForm.port_sequence = seq
}

function addPortSeq(pid) {
  if (!pid) return
  if (lineForm.port_sequence.indexOf(pid) >= 0) {
    ElMessage.warning('该港口已在序列中')
    addPortId.value = null
    return
  }
  const len = lineForm.port_sequence.length
  lineForm.port_sequence.splice(len > 0 ? len - 1 : 0, 0, pid)
  addPortId.value = null
}

function removePortSeq(idx) {
  lineForm.port_sequence.splice(idx, 1)
}

async function submitLine() {
  if (!lineForm.line_name) { ElMessage.warning('请输入航线名称'); return }
  if (!lineForm.departure_port_id) { ElMessage.warning('请选择起始港'); return }
  if (!lineForm.destination_port_id) { ElMessage.warning('请选择目的港'); return }
  if (lineForm.port_sequence.length < 2) { ElMessage.warning('请至少选择起始港和目的港'); return }

  const depPort = ports.value.find(p => p.port_id === lineForm.departure_port_id)
  const destPort = ports.value.find(p => p.port_id === lineForm.destination_port_id)

  lineSubmitting.value = true
  try {
    await createShippingLineApi({
      line_name: lineForm.line_name,
      departure_port_name: depPort?.port_name || '',
      destination_port_name: destPort?.port_name || '',
      port_sequence: JSON.stringify(lineForm.port_sequence),
      total_distance_nm: lineForm.total_distance_nm,
      description: lineForm.description || undefined
    })
    ElMessage.success('航线申请已提交，等待管理员审核')
    resetLineForm()
  } catch (e) {
    ElMessage.error(e.message || '提交失败')
  } finally {
    lineSubmitting.value = false
  }
}

function resetLineForm() {
  lineForm.line_name = ''
  lineForm.departure_port_id = null
  lineForm.destination_port_id = null
  lineForm.port_sequence = []
  lineForm.total_distance_nm = 0
  lineForm.description = ''
}

async function onLineChange() {
  voyageForm.vessel_id = null
  portStops.value = []
  lineAssignedVesselIds.value = []
  if (!voyageForm.line_id) return
  try {
    const [portsRes, vesRes] = await Promise.all([
      getLinePortSequenceApi(voyageForm.line_id),
      getLineAssignedVesselsApi(voyageForm.line_id)
    ])
    const pids = portsRes.data?.port_sequence || []
    portStops.value = pids.map(pid => ({
      port_id: pid,
      arrival_time: null,
      departure_time: null
    }))
    lineAssignedVesselIds.value = vesRes.data?.vessel_ids || []
  } catch {
    portStops.value = []
  }
}

async function submitVoyage() {
  if (!voyageForm.line_id || !voyageForm.vessel_id || !voyageForm.voyage_date) {
    ElMessage.warning('请选择航线和船舶并填写启航日期'); return
  }
  if (portStops.value.length < 2) {
    ElMessage.warning('该航线的途经港口不足2个'); return
  }
  voyageSubmitting.value = true
  try {
    await createVoyageApi({
      line_id: voyageForm.line_id,
      vessel_id: voyageForm.vessel_id,
      voyage_date: voyageForm.voyage_date,
      unit_price: voyageForm.unit_price > 0 ? voyageForm.unit_price : undefined,
      port_stops: portStops.value.map(ps => ({
        port_id: ps.port_id,
        planned_arrival_time: ps.arrival_time || undefined,
        planned_departure_time: ps.departure_time || undefined
      }))
    })
    ElMessage.success('航次创建成功')
    resetVoyageForm()
  } catch (e) {
    ElMessage.error(e.message || '创建失败')
  } finally {
    voyageSubmitting.value = false
  }
}

function resetVoyageForm() {
  voyageForm.line_id = null
  voyageForm.vessel_id = null
  voyageForm.voyage_date = ''
  voyageForm.unit_price = 0
  portStops.value = []
}

onMounted(async () => {
  try {
    const [portRes, vesselRes, lineRes] = await Promise.all([
      getPortListApi({ page: 1, page_size: 200 }),
      getVesselListApi({ page: 1, page_size: 200 }),
      getLineListApi({ page: 1, page_size: 200 })
    ])
    ports.value = portRes.data || []
    vessels.value = vesselRes.data || []
    allLines.value = lineRes.data || []
  } catch { /* ignore */ }
})
</script>

<style scoped>
.create-voyage-page { padding: 20px; }
</style>
