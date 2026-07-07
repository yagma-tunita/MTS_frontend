<template>
  <div class="admin-list-page">
    <el-card>
      <template #header><span>管理员列表</span><div style="float: right; display: flex; gap: 8px"><el-autocomplete v-model="query.keyword" :fetch-suggestions="searchSuggestions" placeholder="搜索用户名/姓名" clearable style="width: 200px" @select="onSearchSelect" @keyup.enter="handleSearch" /><el-button size="small" @click="handleSearch">搜索</el-button><el-button size="small" type="primary" @click="openCreate">创建管理员</el-button></div></template>
      <el-table :data="list" border stripe v-loading="loading">
        <el-table-column prop="admin_id" label="ID" width="60" /><el-table-column prop="username" label="用户名" width="150" />
        <el-table-column prop="real_name" label="姓名" width="120" />
        <el-table-column label="角色" width="100"><template #default="{ row }">{{ row.role === 1 ? '超级管理员' : '普通管理员' }}</template></el-table-column>
        <el-table-column prop="create_time" label="创建时间" width="180" />
      </el-table>
      <el-pagination v-if="meta.total" v-model:current-page="query.page" v-model:page-size="query.page_size" :total="meta.total" layout="total, sizes, prev, pager, next" @change="loadData" />
    </el-card>
    <el-dialog v-model="createVisible" title="创建管理员" width="450px">
      <el-form :model="createForm" label-width="100px">
        <el-form-item label="用户名" prop="username"><el-input v-model="createForm.username" /></el-form-item>
        <el-form-item label="密码" prop="password"><el-input v-model="createForm.password" type="password" show-password /></el-form-item>
        <el-form-item label="姓名" prop="real_name"><el-input v-model="createForm.real_name" /></el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="createForm.role" style="width: 100%"><el-option label="超级管理员" :value="1" /><el-option label="普通管理员" :value="2" /></el-select>
        </el-form-item>
      </el-form>
      <template #footer><el-button @click="createVisible = false">取消</el-button><el-button type="primary" :loading="creating" @click="handleCreate">创建</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getAdminListApi, adminRegisterApi } from '@/api/admin'
import { ElMessage } from 'element-plus'

const loading = ref(false); const creating = ref(false); const list = ref([]); const meta = ref({}); const searchOptions = ref([])
const query = reactive({ page: 1, page_size: 10, keyword: '' }); const createVisible = ref(false)
const createForm = reactive({ username: '', password: '', real_name: '', role: 2 })

async function loadData() { loading.value = true; try { const res = await getAdminListApi(query); list.value = res.data || []; meta.value = res.meta || {} } catch (e) { ElMessage.error(e.message || '加载失败') } finally { loading.value = false } }
function handleSearch() { query.page = 1; loadData() }
function openCreate() { createForm.username = ''; createForm.password = ''; createForm.real_name = ''; createForm.role = 2; createVisible.value = true }
async function handleCreate() { if (!createForm.username || !createForm.password) { ElMessage.warning('请填写用户名和密码'); return }; creating.value = true; try { await adminRegisterApi({ ...createForm }); ElMessage.success('创建成功'); createVisible.value = false; await loadData() } catch (e) { ElMessage.error(e.message || '创建失败') } finally { creating.value = false } }
async function loadSearchOptions() { try { const res = await getAdminListApi({ page: 1, page_size: 200 }); searchOptions.value = (res.data || []).map(a => ({ value: a.username })) } catch {} }
function searchSuggestions(queryString, cb) { const r = queryString ? searchOptions.value.filter(s => s.value.includes(queryString)) : searchOptions.value; cb(r) }
function onSearchSelect(item) { query.keyword = item.value; handleSearch() }
onMounted(() => { loadData(); loadSearchOptions() })
</script>
