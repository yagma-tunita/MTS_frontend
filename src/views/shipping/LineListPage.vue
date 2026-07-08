<template>
  <div class="line-list-page"><el-card><template #header><span>航线列表</span></template>
    <el-table :data="list" border stripe v-loading="loading">
      <el-table-column prop="line_id" label="ID" width="60" /><el-table-column prop="line_name" label="航线名称" min-width="180" />
      <el-table-column prop="departure_port_name" label="起始港" width="120" /><el-table-column prop="destination_port_name" label="目的港" width="120" />
      <el-table-column prop="total_distance_nm" label="总距离(海里)" width="130" />
      <el-table-column label="状态" width="90"><template #default="{row}"><el-tag :type="row.line_status===1?'success':(row.line_status===0?'warning':'info')" size="small">{{ {0:'待审核',1:'已启用',2:'已弃用'}[row.line_status]||'-' }}</el-tag></template></el-table-column>
      <el-table-column label="操作" min-width="200">
        <template #default="{ row }">
          <el-button size="small" @click="$router.push(`/shipping/line/detail/${row.line_id}`)">详情</el-button>
          <el-button v-if="row.line_status===1" size="small" type="danger" @click="handleDeprecate(row)">停用</el-button>
          <el-button v-if="row.line_status===2" size="small" type="primary" @click="handleReactivate(row)">重新申请</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination v-if="meta.total" v-model:current-page="query.page" v-model:page-size="query.page_size" :total="meta.total" layout="total, sizes, prev, pager, next" @change="loadData" />
  </el-card></div>
</template>
<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getLineListApi } from '@/api/data'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/api/request'
const loading = ref(false); const list = ref([]); const meta = ref({}); const query = reactive({ page: 1, page_size: 10 })
async function loadData() { loading.value = true; try { const res = await getLineListApi(query); list.value = res.data || []; meta.value = res.meta || {} } catch (e) { ElMessage.error(e.message || '加载失败') } finally { loading.value = false } }
async function handleDeprecate(row) { try { await ElMessageBox.confirm(`确认停用航线 "${row.line_name}"？停用后需重新申请方可恢复。`, '提示'); await request.delete(`/shipping-lines/${row.line_id}`); ElMessage.success('已停用，等待管理员审核'); loadData() } catch { /* ignore */ } }
async function handleReactivate(row) { try { await request.post(`/shipping-lines/${row.line_id}/reactivate`); ElMessage.success('已提交重新申请，等待管理员审核'); loadData() } catch(e) { ElMessage.error(e.message||'操作失败') } }
onMounted(loadData)
</script>
