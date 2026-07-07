<template>
  <div class="line-list-page"><el-card><template #header><span>航线列表</span></template>
    <el-table :data="list" border stripe v-loading="loading">
      <el-table-column prop="line_id" label="ID" width="60" /><el-table-column prop="line_name" label="航线名称" min-width="180" />
      <el-table-column prop="departure_port_name" label="起始港" width="120" /><el-table-column prop="destination_port_name" label="目的港" width="120" />
      <el-table-column prop="total_distance_nm" label="总距离(海里)" width="130" />
      <el-table-column label="操作" width="100"><template #default="{ row }"><el-button size="small" @click="$router.push(`/shipping/line/detail/${row.line_id}`)">详情</el-button></template></el-table-column>
    </el-table>
    <el-pagination v-if="meta.total" v-model:current-page="query.page" v-model:page-size="query.page_size" :total="meta.total" layout="total, sizes, prev, pager, next" @change="loadData" />
  </el-card></div>
</template>
<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getLineListApi } from '@/api/data'
import { ElMessage } from 'element-plus'
const loading = ref(false); const list = ref([]); const meta = ref({}); const query = reactive({ page: 1, page_size: 10 })
async function loadData() { loading.value = true; try { const res = await getLineListApi(query); list.value = res.data || []; meta.value = res.meta || {} } catch (e) { ElMessage.error(e.message || '加载失败') } finally { loading.value = false } }
onMounted(loadData)
</script>
