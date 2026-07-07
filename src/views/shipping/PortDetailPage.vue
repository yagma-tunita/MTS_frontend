<template>
  <div class="port-detail-page"><el-card v-loading="loading"><template #header><el-button size="small" @click="$router.back()">返回</el-button><span style="margin-left: 12px">港口详情</span></template>
    <el-descriptions v-if="port" :column="2" border>
      <el-descriptions-item label="港口名称">{{ port.port_name }}</el-descriptions-item>
      <el-descriptions-item label="港口代码">{{ port.port_code }}</el-descriptions-item>
      <el-descriptions-item label="城市">{{ port.city?.city_name || '-' }}</el-descriptions-item>
      <el-descriptions-item label="国家">{{ port.city?.country || '-' }}</el-descriptions-item>
      <el-descriptions-item label="港口类型">{{ port.port_type }}</el-descriptions-item>
      <el-descriptions-item label="纬度">{{ port.latitude }}</el-descriptions-item>
      <el-descriptions-item label="经度">{{ port.longitude }}</el-descriptions-item>
    </el-descriptions>
  </el-card></div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getPortDetailApi } from '@/api/data'
import { ElMessage } from 'element-plus'
const route = useRoute(); const loading = ref(false); const port = ref(null)
onMounted(async () => { loading.value = true; try { const res = await getPortDetailApi(route.params.id); port.value = res.data } catch (e) { ElMessage.error(e.message || '加载失败') } finally { loading.value = false } })
</script>
