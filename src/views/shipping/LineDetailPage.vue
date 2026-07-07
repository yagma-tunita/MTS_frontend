<template>
  <div class="line-detail-page"><el-card v-loading="loading"><template #header><el-button size="small" @click="$router.back()">返回</el-button><span style="margin-left: 12px">航线详情</span></template>
    <el-descriptions v-if="line" :column="2" border>
      <el-descriptions-item label="航线名称">{{ line.line_name }}</el-descriptions-item>
      <el-descriptions-item label="起始港">{{ line.departure_port_name }}</el-descriptions-item>
      <el-descriptions-item label="目的港">{{ line.destination_port_name }}</el-descriptions-item>
      <el-descriptions-item label="总距离(海里)">{{ line.total_distance_nm }}</el-descriptions-item>
      <el-descriptions-item label="描述">{{ line.description || '-' }}</el-descriptions-item>
    </el-descriptions>
    <el-divider v-if="portNames.length">港口顺序</el-divider>
    <el-timeline v-if="portNames.length">
      <el-timeline-item v-for="(name, i) in portNames" :key="i" :timestamp="`第${i + 1}站`">{{ name }}</el-timeline-item>
    </el-timeline>
  </el-card></div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getLineDetailApi, getLinePortSequenceApi, getPortListApi } from '@/api/data'
import { ElMessage } from 'element-plus'
const route = useRoute(); const loading = ref(false); const line = ref(null); const portNames = ref([])
onMounted(async () => {
  loading.value = true
  try {
    const [lineRes, seqRes, portRes] = await Promise.all([
      getLineDetailApi(route.params.id), getLinePortSequenceApi(route.params.id),
      getPortListApi({ page: 1, page_size: 100 })
    ])
    line.value = lineRes.data
    const portIds = seqRes.data?.port_sequence || []
    const ports = portRes.data || []
    portNames.value = portIds.map(id => { const p = ports.find(x => x.port_id === id); return p ? p.port_name : `港口#${id}` })
  } catch (e) { ElMessage.error(e.message || '加载失败') }
  finally { loading.value = false }
})
</script>
