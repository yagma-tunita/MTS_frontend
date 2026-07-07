<template>
  <div class="port-manage-page">
    <el-card>
      <template #header><span>港口管理</span><el-button size="small" style="float: right; margin-right: 8px" @click="handleExportPorts">导出</el-button><el-button size="small" style="float: right; margin-right: 8px" @click="handleImportClick">导入</el-button><el-button size="small" type="primary" style="float: right" @click="openCreate">添加港口</el-button><input type="file" ref="fileInputPort" accept=".xlsx" style="display:none" @change="handleImportPorts" /></template>
      <el-table :data="list" border stripe v-loading="loading">
        <el-table-column prop="port_id" label="ID" width="60" /><el-table-column prop="port_name" label="港口名称" width="180" />
        <el-table-column prop="port_code" label="港口代码" width="120" />
        <el-table-column label="城市" width="120"><template #default="{ row }">{{ row.city?.city_name || '-' }}</template></el-table-column>
        <el-table-column label="国家" width="120"><template #default="{ row }">{{ row.city?.country || '-' }}</template></el-table-column>
        <el-table-column prop="port_type" label="类型" width="100" /><el-table-column prop="latitude" label="纬度" width="100" /><el-table-column prop="longitude" label="经度" width="100" />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }"><el-button size="small" @click="openEdit(row)">编辑</el-button><el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button></template>
        </el-table-column>
      </el-table>
      <el-pagination v-if="meta.total" v-model:current-page="query.page" v-model:page-size="query.page_size" :total="meta.total" layout="total, sizes, prev, pager, next" @change="loadData" />
    </el-card>
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑港口' : '添加港口'" width="500px">
      <el-form :model="form" label-width="110px">
        <el-form-item label="港口名称" prop="port_name"><el-input v-model="form.port_name" /></el-form-item>
        <el-form-item label="港口代码" prop="port_code"><el-input v-model="form.port_code" /></el-form-item>
        <el-form-item label="所属城市" prop="city_id">
          <el-select v-model="form.city_id" filterable style="width: 100%"><el-option v-for="c in cities" :key="c.city_id" :label="c.city_name" :value="c.city_id" /></el-select>
        </el-form-item>
        <el-form-item label="港口类型" prop="port_type">
          <el-select v-model="form.port_type" style="width: 100%"><el-option label="海港 (Sea Port)" value="Sea Port" /><el-option label="河港 (River Port)" value="River Port" /><el-option label="陆港 (Inland Port)" value="Inland Port" /></el-select>
        </el-form-item>
        <el-row :gutter="16"><el-col :span="12"><el-form-item label="纬度" prop="latitude"><el-input-number v-model="form.latitude" :min="-90" :max="90" :precision="6" :step="0.1" style="width: 100%" /></el-form-item></el-col>
        <el-col :span="12"><el-form-item label="经度" prop="longitude"><el-input-number v-model="form.longitude" :min="-180" :max="180" :precision="6" :step="0.1" style="width: 100%" /></el-form-item></el-col></el-row>
        <el-form-item label="最大吃水(m)" prop="max_draft_meter"><el-input-number v-model="form.max_draft_meter" :min="0" :precision="1" style="width: 100%" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="dialogVisible = false">取消</el-button><el-button type="primary" :loading="saving" @click="handleSave">{{ isEdit ? '保存' : '添加' }}</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { createPortApi, updatePortApi, deletePortApi } from '@/api/admin'
import { getPortListApi, getCityListApi } from '@/api/data'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const loading = ref(false); const saving = ref(false); const list = ref([]); const meta = ref({}); const cities = ref([]); const fileInputPort = ref(null)
const query = reactive({ page: 1, page_size: 10 }); const dialogVisible = ref(false); const isEdit = ref(false)
let editId = null
const form = reactive({ port_name: '', port_code: '', city_id: null, port_type: '', latitude: 0, longitude: 0, max_draft_meter: 0 })

async function loadData() { loading.value = true; try { const res = await getPortListApi(query); list.value = res.data || []; meta.value = res.meta || {} } catch (e) { ElMessage.error(e.message || '加载失败') } finally { loading.value = false } }
function handleExportPorts() { const token = localStorage.getItem('access_token'); window.open('/api/v1/export/ports?token=' + token, '_blank') }
function handleImportClick() { fileInputPort.value.click() }
async function handleImportPorts(e) { const file = e.target.files[0]; if (!file) return; const formData = new FormData(); formData.append('file', file); const token = localStorage.getItem('access_token'); try { await axios.post('/api/v1/import/ports', formData, { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }); ElMessage.success('导入成功'); loadData() } catch (err) { ElMessage.error(err.response?.data?.message || '导入失败') }; e.target.value = '' }
function resetForm() { Object.assign(form, { port_name: '', port_code: '', city_id: null, port_type: '', latitude: 0, longitude: 0, max_draft_meter: 0 }) }
function openCreate() { isEdit.value = false; editId = null; resetForm(); dialogVisible.value = true }
function openEdit(row) { isEdit.value = true; editId = row.port_id; form.port_name = row.port_name; form.port_code = row.port_code; form.city_id = row.city_id; form.port_type = row.port_type; form.latitude = row.latitude; form.longitude = row.longitude; form.max_draft_meter = row.max_draft_meter; dialogVisible.value = true }
async function handleSave() { saving.value = true; try { if (isEdit.value && editId) { await updatePortApi(editId, { ...form }); ElMessage.success('更新成功') } else { await createPortApi({ ...form }); ElMessage.success('添加成功') }; dialogVisible.value = false; await loadData() } catch (e) { ElMessage.error(e.message || '操作失败') } finally { saving.value = false } }
async function handleDelete(row) { try { await ElMessageBox.confirm(`确认删除港口 "${row.port_name}"？`, '提示'); await deletePortApi(row.port_id); ElMessage.success('已删除'); await loadData() } catch { /* ignore */ } }
onMounted(async () => { await loadData(); try { const res = await getCityListApi({ page: 1, page_size: 100 }); cities.value = res.data || [] } catch {} })
</script>
