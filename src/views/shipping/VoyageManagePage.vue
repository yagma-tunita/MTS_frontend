<template>
  <div>
    <div class="page-title">航次管理</div>
    <div class="page-desc">查看和管理您的航次靠泊计划</div>
    <el-card style="margin-top:16px">
      <el-table :data="list" v-loading="loading" stripe style="width:100%">
        <el-table-column label="日期" width="120"><template #default="{row}">{{ formatDate(row.voyage_date) }}</template></el-table-column>
        <el-table-column prop="sequence_no" label="顺序" width="60" />
        <el-table-column label="港口"><template #default="{row}">{{ row.port?.port_name || '-' }}</template></el-table-column>
        <el-table-column label="计划到达" width="180"><template #default="{row}">{{ formatTime(row.planned_arrival_time) }}</template></el-table-column>
        <el-table-column label="计划离港" width="180"><template #default="{row}">{{ formatTime(row.planned_departure_time) }}</template></el-table-column>
        <el-table-column label="实际到达" width="180"><template #default="{row}">{{ formatTime(row.actual_arrival_time) }}</template></el-table-column>
        <el-table-column label="实际离港" width="180"><template #default="{row}">{{ formatTime(row.actual_departure_time) }}</template></el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{row}"><el-button size="small" @click="openUpdate(row)">更新时间</el-button></template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && list.length === 0" description="暂无航次记录" />
    </el-card>
    <el-dialog v-model="dialogVisible" title="更新实际时间" width="500px">
      <el-form :model="editForm" label-width="120px">
        <el-form-item label="实际到达时间"><el-date-picker v-model="editForm.actual_arrival_time" type="datetime" style="width:100%" /></el-form-item>
        <el-form-item label="实际离港时间"><el-date-picker v-model="editForm.actual_departure_time" type="datetime" style="width:100%" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="dialogVisible=false">取消</el-button><el-button type="primary" :loading="saving" @click="handleSave">保存</el-button></template>
    </el-dialog>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/api/request'
const loading = ref(false); const saving = ref(false); const list = ref([]); const dialogVisible = ref(false)
const editForm = ref({ berthing_id: null, actual_arrival_time: null, actual_departure_time: null })
const formatDate = d => d ? String(d).slice(0,10) : '-'
const formatTime = t => t ? String(t).slice(0,19).replace('T',' ') : '-'
async function loadData() { loading.value = true; try { const res = await request.get('/voyages/my'); list.value = res.data || [] } catch {} finally { loading.value = false } }
function openUpdate(row) { editForm.value = { berthing_id: row.berthing_id, actual_arrival_time: row.actual_arrival_time || null, actual_departure_time: row.actual_departure_time || null }; dialogVisible.value = true }
async function handleSave() { saving.value = true; try { await request.put(`/berthings/${editForm.value.berthing_id}/actual-times`, { actual_arrival_time: editForm.value.actual_arrival_time || null, actual_departure_time: editForm.value.actual_departure_time || null }); ElMessage.success('更新成功'); dialogVisible.value = false; loadData() } catch (e) { ElMessage.error(e.message || '更新失败') } finally { saving.value = false } }
onMounted(loadData)
</script>
