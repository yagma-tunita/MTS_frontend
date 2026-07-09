<template>
  <div class="line-detail-page">
    <el-card v-loading="loading">
      <template #header><el-button size="small" @click="$router.back()">返回</el-button><span style="margin-left: 12px">航线详情</span></template>
      <el-descriptions v-if="line" :column="2" border>
        <el-descriptions-item label="航线名称">{{ line.line_name }}</el-descriptions-item>
        <el-descriptions-item label="起始港">{{ line.departure_port_name }}</el-descriptions-item>
        <el-descriptions-item label="目的港">{{ line.destination_port_name }}</el-descriptions-item>
        <el-descriptions-item label="总距离(海里)">{{ line.total_distance_nm }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="line.line_status===1?'success':(line.line_status===0?'warning':'info')" size="small">{{ {0:'待审核',1:'已启用',2:'已弃用'}[line.line_status]||'-' }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="描述">{{ line.description || '-' }}</el-descriptions-item>
      </el-descriptions>

      <el-divider>港口顺序</el-divider>
      <el-timeline v-if="portNames.length">
        <el-timeline-item v-for="(name, i) in portNames" :key="i" :timestamp="`第${i + 1}站`">{{ name }}</el-timeline-item>
      </el-timeline>

      <el-divider>分配船舶</el-divider>
      <div style="margin-bottom:12px">
        <el-select v-model="addVesselId" filterable placeholder="添加船舶到此航线" style="width:300px" @change="handleAssignVessel">
          <el-option v-for="v in availableVessels" :key="v.vessel_id" :label="`${v.vessel_name}（${v.speed_knot||'-'}节）`" :value="v.vessel_id" />
        </el-select>
      </div>
      <el-table :data="assignedVessels" stripe size="small" v-loading="vesLoading">
        <el-table-column prop="vessel_name" label="船舶名称" min-width="180" />
        <el-table-column prop="imo_number" label="IMO编号" width="140" />
        <el-table-column label="航速" width="100"><template #default="{row}">{{ row.speed_knot || '-' }} 节</template></el-table-column>
        <el-table-column label="载重" width="120"><template #default="{row}">{{ row.max_deadweight_ton || '-' }} 吨</template></el-table-column>
        <el-table-column label="操作" width="100">
          <template #default="{row}">
            <el-button size="small" type="danger" @click="handleUnassignVessel(row)">移除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!vesLoading && assignedVessels.length === 0" description="暂未分配船舶" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getLineDetailApi, getLinePortSequenceApi, getPortListApi, getVesselListApi, getLineAssignedVesselsApi, assignLineVesselApi, unassignLineVesselApi } from '@/api/data'
import { ElMessage } from 'element-plus'

const route = useRoute()
const loading = ref(false)
const vesLoading = ref(false)
const line = ref(null)
const portNames = ref([])
const assignedVesselIds = ref([])
const allVessels = ref([])
const addVesselId = ref(null)

const assignedVessels = computed(() => {
  return allVessels.value.filter(v => assignedVesselIds.value.includes(v.vessel_id))
})

const availableVessels = computed(() => {
  return allVessels.value.filter(v => !assignedVesselIds.value.includes(v.vessel_id))
})

async function loadAssignedVessels() {
  vesLoading.value = true
  try {
    const res = await getLineAssignedVesselsApi(route.params.id)
    assignedVesselIds.value = res.data?.vessel_ids || []
  } catch { assignedVesselIds.value = [] }
  finally { vesLoading.value = false }
}

async function handleAssignVessel(vesselId) {
  if (!vesselId) return
  try {
    await assignLineVesselApi(route.params.id, { vessel_id: vesselId })
    ElMessage.success('船舶已分配')
    addVesselId.value = null
    loadAssignedVessels()
  } catch (e) {
    ElMessage.error(e.message || '分配失败')
  }
}

async function handleUnassignVessel(row) {
  try {
    await unassignLineVesselApi(route.params.id, row.vessel_id)
    ElMessage.success('已移除')
    loadAssignedVessels()
  } catch (e) {
    ElMessage.error(e.message || '移除失败')
  }
}

onMounted(async () => {
  loading.value = true
  try {
    const [lineRes, seqRes, portRes, vesselRes] = await Promise.all([
      getLineDetailApi(route.params.id),
      getLinePortSequenceApi(route.params.id),
      getPortListApi({ page: 1, page_size: 100 }),
      getVesselListApi({ page: 1, page_size: 200 })
    ])
    line.value = lineRes.data
    allVessels.value = vesselRes.data || []
    const portIds = seqRes.data?.port_sequence || []
    const ports = portRes.data || []
    portNames.value = portIds.map(id => { const p = ports.find(x => x.port_id === id); return p ? p.port_name : `港口#${id}` })
    loadAssignedVessels()
  } catch (e) { ElMessage.error(e.message || '加载失败') }
  finally { loading.value = false }
})
</script>
