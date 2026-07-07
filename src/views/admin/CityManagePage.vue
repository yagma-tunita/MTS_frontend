<template>
  <div class="city-manage-page">
    <el-card>
      <template #header><span>城市管理</span><el-button size="small" type="primary" style="float: right" @click="openCreate">添加城市</el-button></template>
      <div style="margin-bottom: 12px; display: flex; gap: 8px">
        <el-input v-model="searchName" placeholder="城市名称" clearable style="width: 200px" @clear="handleSearch" @keyup.enter="handleSearch" />
        <el-button type="primary" @click="handleSearch">搜索</el-button>
      </div>
      <el-table :data="list" border stripe v-loading="loading">
        <el-table-column prop="city_id" label="ID" width="60" />
        <el-table-column prop="city_name" label="城市名称" min-width="150" />
        <el-table-column prop="country" label="国家" width="150" />
        <el-table-column prop="country_code" label="国家代码" width="100" />
        <el-table-column prop="timezone" label="时区" width="160" />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }"><el-button size="small" @click="openEdit(row)">编辑</el-button><el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button></template>
        </el-table-column>
      </el-table>
      <el-pagination v-if="meta.total" v-model:current-page="query.page" v-model:page-size="query.page_size" :total="meta.total" layout="total, sizes, prev, pager, next" @change="loadData" />
    </el-card>
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑城市' : '添加城市'" width="500px">
      <el-form :model="form" label-width="110px">
        <el-form-item label="城市名称" prop="city_name"><el-input v-model="form.city_name" /></el-form-item>
        <el-form-item label="国家" prop="country"><el-input v-model="form.country" /></el-form-item>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="国家代码" prop="country_code"><el-input v-model="form.country_code" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="时区" prop="timezone"><el-input v-model="form.timezone" /></el-form-item></el-col>
        </el-row>
      </el-form>
      <template #footer><el-button @click="dialogVisible = false">取消</el-button><el-button type="primary" :loading="saving" @click="handleSave">{{ isEdit ? '保存' : '添加' }}</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { createCityApi, updateCityApi, deleteCityApi } from '@/api/admin'
import { getCityListApi } from '@/api/data'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false); const saving = ref(false); const list = ref([]); const meta = ref({})
const query = reactive({ page: 1, page_size: 10 }); const dialogVisible = ref(false); const isEdit = ref(false); const searchName = ref('')
let editId = null
const form = reactive({ city_name: '', country: '', country_code: '', timezone: '' })

async function loadData() { loading.value = true; try { const res = await getCityListApi(query); list.value = res.data || []; meta.value = res.meta || {} } catch (e) { ElMessage.error(e.message || '加载失败') } finally { loading.value = false } }
function handleSearch() { query.page = 1; query.city_name = searchName.value || undefined; loadData() }
function resetForm() { Object.assign(form, { city_name: '', country: '', country_code: '', timezone: '' }) }
function openCreate() { isEdit.value = false; editId = null; resetForm(); dialogVisible.value = true }
function openEdit(row) { isEdit.value = true; editId = row.city_id; form.city_name = row.city_name; form.country = row.country || ''; form.country_code = row.country_code || ''; form.timezone = row.timezone || ''; dialogVisible.value = true }
async function handleSave() { saving.value = true; try { if (isEdit.value && editId) { await updateCityApi(editId, { city_name: form.city_name, country: form.country, country_code: form.country_code, timezone: form.timezone }); ElMessage.success('更新成功') } else { await createCityApi({ city_name: form.city_name, country: form.country, country_code: form.country_code, timezone: form.timezone }); ElMessage.success('添加成功') }; dialogVisible.value = false; await loadData() } catch (e) { ElMessage.error(e.message || '操作失败') } finally { saving.value = false } }
async function handleDelete(row) { try { await ElMessageBox.confirm(`确认删除城市 "${row.city_name}"？`, '提示'); await deleteCityApi(row.city_id); ElMessage.success('已删除'); await loadData() } catch { /* ignore */ } }
onMounted(loadData)
</script>
