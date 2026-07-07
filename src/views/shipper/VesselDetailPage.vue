<template>
  <div class="vessel-detail-page"><el-card v-loading="loading"><template #header><el-button size="small" @click="$router.back()">返回</el-button><span style="margin-left: 12px">船舶详情</span></template>
    <el-descriptions v-if="vessel" :column="2" border>
      <el-descriptions-item label="船舶名称">{{ vessel.vessel_name }}</el-descriptions-item>
      <el-descriptions-item label="IMO">{{ vessel.imo_number }}</el-descriptions-item>
      <el-descriptions-item label="呼号">{{ vessel.call_sign }}</el-descriptions-item>
      <el-descriptions-item label="船舶类型">{{ vessel.vessel_type }}</el-descriptions-item>
      <el-descriptions-item label="最大载重(吨)">{{ vessel.max_deadweight_ton }}</el-descriptions-item>
      <el-descriptions-item label="总吨位">{{ vessel.gross_tonnage }}</el-descriptions-item>
      <el-descriptions-item label="集装箱(TEU)">{{ vessel.container_teu }}</el-descriptions-item>
      <el-descriptions-item label="航速(节)">{{ vessel.speed_knot }}</el-descriptions-item>
      <el-descriptions-item label="吃水(m)">{{ vessel.draft_meter }}</el-descriptions-item>
      <el-descriptions-item label="海运公司">{{ vessel.shipping_company?.company_name || '-' }}</el-descriptions-item>
    </el-descriptions>
  </el-card></div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getVesselDetailApi } from '@/api/data'
import { ElMessage } from 'element-plus'
const route = useRoute(); const loading = ref(false); const vessel = ref(null)
onMounted(async () => { loading.value = true; try { const res = await getVesselDetailApi(route.params.id); vessel.value = res.data } catch (e) { ElMessage.error(e.message || '加载失败') } finally { loading.value = false } })
</script>
