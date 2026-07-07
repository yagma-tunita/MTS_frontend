<template>
  <div class="vessel-manage-page">
    <el-card>
      <template #header><span>船舶管理</span><el-button size="small" style="float: right; margin-right: 8px" @click="handleExportVessels">导出</el-button><el-button size="small" style="float: right; margin-right: 8px" @click="handleImportClick">导入</el-button><el-button size="small" type="primary" style="float: right" @click="openCreate">添加船舶</el-button><input type="file" ref="fileInputVessel" accept=".xlsx" style="display:none" @change="handleImportVessels" /></template>
      <el-table :data="list" border stripe v-loading="loading">
        <el-table-column prop="vessel_id" label="ID" width="60" /><el-table-column prop="vessel_name" label="船舶名称" min-width="150" />
        <el-table-column prop="imo_number" label="IMO" width="130" /><el-table-column prop="max_deadweight_ton" label="载重(吨)" width="110" />
        <el-table-column prop="container_teu" label="集装箱(TEU)" width="120" /><el-table-column prop="speed_knot" label="航速(节)" width="100" />
        <el-table-column prop="vessel_type" label="类型" width="100" />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }"><el-button size="small" @click="openEdit(row)">编辑</el-button><el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button></template>
        </el-table-column>
      </el-table>
      <el-pagination v-if="meta.total" v-model:current-page="query.page" v-model:page-size="query.page_size" :total="meta.total" layout="total, sizes, prev, pager, next" @change="loadData" />
    </el-card>
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑船舶' : '添加船舶'" width="550px">
      <el-form :model="form" label-width="120px">
        <el-form-item label="船舶名称" prop="vessel_name"><el-input v-model="form.vessel_name" /></el-form-item>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="IMO编号" prop="imo_number"><el-input v-model="form.imo_number" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="呼号" prop="call_sign"><el-input v-model="form.call_sign" /></el-form-item></el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="船舶类型" prop="vessel_type"><el-select v-model="form.vessel_type" style="width: 100%"><el-option label="集装箱船" value="Container Ship" /><el-option label="散货船" value="Bulk Carrier" /><el-option label="油轮" value="Oil Tanker" /><el-option label="杂货船" value="General Cargo" /></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="所属海运公司" prop="shipping_company_id"><el-select v-model="form.shipping_company_id" filterable style="width: 100%"><el-option v-for="c in companies" :key="c.company_id" :label="c.company_name" :value="c.company_id" /></el-select></el-form-item></el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="最大载重(吨)" prop="max_deadweight_ton"><el-input-number v-model="form.max_deadweight_ton" :min="0" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="总吨位" prop="gross_tonnage"><el-input-number v-model="form.gross_tonnage" :min="0" style="width: 100%" /></el-form-item></el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="集装箱(TEU)" prop="container_teu"><el-input-number v-model="form.container_teu" :min="0" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="航速(节)" prop="speed_knot"><el-input-number v-model="form.speed_knot" :min="0" :precision="1" :step="0.1" style="width: 100%" /></el-form-item></el-col>
        </el-row>
        <el-form-item label="可用状态" prop="is_available">
          <el-radio-group v-model="form.is_available"><el-radio :value="1">可用</el-radio><el-radio :value="0">不可用</el-radio></el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer><el-button @click="dialogVisible = false">取消</el-button><el-button type="primary" :loading="saving" @click="handleSave">{{ isEdit ? '保存' : '添加' }}</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { createVesselApi, updateVesselApi, deleteVesselApi } from '@/api/admin'
import { getVesselListApi, getShippingCompanyListApi } from '@/api/data'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const loading = ref(false); const saving = ref(false); const list = ref([]); const meta = ref({}); const companies = ref([]); const fileInputVessel = ref(null)
const query = reactive({ page: 1, page_size: 10 }); const dialogVisible = ref(false); const isEdit = ref(false)
let editId = null
const form = reactive({ vessel_name: '', imo_number: '', call_sign: '', vessel_type: '', shipping_company_id: null, max_deadweight_ton: 0, gross_tonnage: 0, container_teu: 0, speed_knot: 0, is_available: 1 })

async function loadData() { loading.value = true; try { const res = await getVesselListApi(query); list.value = res.data || []; meta.value = res.meta || {} } catch (e) { ElMessage.error(e.message || '加载失败') } finally { loading.value = false } }
function handleExportVessels() { const token = localStorage.getItem('access_token'); window.open('/api/v1/export/vessels?token=' + token, '_blank') }
function handleImportClick() { fileInputVessel.value.click() }
async function handleImportVessels(e) { const file = e.target.files[0]; if (!file) return; const formData = new FormData(); formData.append('file', file); const token = localStorage.getItem('access_token'); try { await axios.post('/api/v1/import/vessels', formData, { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }); ElMessage.success('导入成功'); loadData() } catch (err) { ElMessage.error(err.response?.data?.message || '导入失败') }; e.target.value = '' }
function resetForm() { Object.assign(form, { vessel_name: '', imo_number: '', call_sign: '', vessel_type: '', shipping_company_id: null, max_deadweight_ton: 0, gross_tonnage: 0, container_teu: 0, speed_knot: 0, is_available: 1 }) }
function openCreate() { isEdit.value = false; editId = null; resetForm(); dialogVisible.value = true }
function openEdit(row) { isEdit.value = true; editId = row.vessel_id; Object.assign(form, { vessel_name: row.vessel_name, imo_number: row.imo_number, call_sign: row.call_sign, vessel_type: row.vessel_type, shipping_company_id: row.shipping_company_id, max_deadweight_ton: row.max_deadweight_ton, gross_tonnage: row.gross_tonnage, container_teu: row.container_teu, speed_knot: row.speed_knot, is_available: row.is_available }); dialogVisible.value = true }
async function handleSave() { saving.value = true; try { if (isEdit.value && editId) { await updateVesselApi(editId, { ...form }); ElMessage.success('更新成功') } else { await createVesselApi({ ...form }); ElMessage.success('添加成功') }; dialogVisible.value = false; await loadData() } catch (e) { ElMessage.error(e.message || '操作失败') } finally { saving.value = false } }
async function handleDelete(row) { try { await ElMessageBox.confirm(`确认删除船舶 "${row.vessel_name}"？`, '提示'); await deleteVesselApi(row.vessel_id); ElMessage.success('已删除'); await loadData() } catch { /* ignore */ } }
onMounted(async () => { await loadData(); try { const res = await getShippingCompanyListApi({ page: 1, page_size: 100 }); companies.value = res.data || [] } catch {} })
</script>
