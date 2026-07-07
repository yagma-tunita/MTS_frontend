<template>
  <div class="cargo-page">
    <el-card>
      <template #header><span>货物列表</span></template>
      <el-table :data="list" border stripe v-loading="loading">
        <el-table-column prop="detail_id" label="ID" width="60" /><el-table-column prop="cargo_name" label="货物名称" min-width="150" />
        <el-table-column prop="cargo_type" label="类型" width="120" /><el-table-column prop="weight_ton" label="重量(吨)" width="110" />
        <el-table-column prop="volume_cubic_meter" label="体积(m³)" width="110" />
        <el-table-column label="关联订单" min-width="160"><template #default="{ row }">{{ row.order?.order_no || '-' }}</template></el-table-column>
        <el-table-column prop="create_time" label="创建时间" width="180" />
      </el-table>
      <el-pagination v-if="meta.total" v-model:current-page="query.page" v-model:page-size="query.page_size" :total="meta.total" layout="total, sizes, prev, pager, next" @change="loadData" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getCargoListApi } from '@/api/admin'
import { ElMessage } from 'element-plus'

const loading = ref(false); const list = ref([]); const meta = ref({}); const query = reactive({ page: 1, page_size: 10 })
async function loadData() { loading.value = true; try { const res = await getCargoListApi(query); list.value = res.data || []; meta.value = res.meta || {} } catch (e) { ElMessage.error(e.message || '加载失败') } finally { loading.value = false } }
onMounted(loadData)
</script>
