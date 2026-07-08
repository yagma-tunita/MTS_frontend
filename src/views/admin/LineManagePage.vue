<template>
  <div class="line-manage-page">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="所有航线" name="all">
        <el-card>
          <template #header><span>航线管理</span><div style="float:right;display:flex;gap:8px"><el-autocomplete v-model="query.keyword" :fetch-suggestions="searchSuggestions" placeholder="搜索航线名称" clearable style="width:200px" @select="onSearchSelect" @keyup.enter="handleSearch" /><el-button size="small" @click="handleSearch">搜索</el-button><el-button size="small" @click="handleExportLines">导出</el-button><el-button size="small" @click="handleImportClick">导入</el-button><el-button size="small" type="primary" @click="openCreate">添加航线</el-button></div><input type="file" ref="fileInputLine" accept=".xlsx" style="display:none" @change="handleImportLines" /></template>
          <el-table :data="list" border stripe v-loading="loading">
            <el-table-column prop="line_id" label="ID" width="60" /><el-table-column prop="line_name" label="航线名称" min-width="180" />
            <el-table-column prop="departure_port_name" label="起运港" width="120" /><el-table-column prop="destination_port_name" label="目的港" width="120" />
            <el-table-column prop="total_distance_nm" label="总距离(海里)" width="130" />
            <el-table-column label="状态" width="90"><template #default="{row}"><el-tag :type="row.line_status===1?'success':(row.line_status===0?'warning':'info')" size="small">{{ {0:'待审核',1:'已启用',2:'已弃用'}[row.line_status]||'-' }}</el-tag></template></el-table-column>
            <el-table-column label="操作" min-width="250">
              <template #default="{ row }">
                <el-button size="small" @click="openEdit(row)">编辑</el-button>
                <el-button v-if="row.line_status===1" size="small" type="danger" @click="handleDeprecate(row)">弃用</el-button>
                <el-button v-if="row.line_status===2" size="small" type="success" @click="handleRestore(row)">恢复</el-button>
                <el-button size="small" type="danger" @click="handleDelete(row)">永久删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-pagination v-if="meta.total" v-model:current-page="query.page" v-model:page-size="query.page_size" :total="meta.total" layout="total, sizes, prev, pager, next" @change="loadData" />
        </el-card>
      </el-tab-pane>
      <el-tab-pane label="待审核" name="pending">
        <el-card>
          <template #header><span>待审核航线</span></template>
          <el-table :data="pendingList" border stripe v-loading="pendingLoading">
            <el-table-column prop="line_name" label="航线名称" min-width="180" />
            <el-table-column label="海运公司" min-width="150"><template #default="{row}">{{ row.shipping_company?.company_name || row.shipping_company_id || '-' }}</template></el-table-column>
            <el-table-column label="起运港" width="120"><template #default="{row}">{{ row.departure_port_name || '-' }}</template></el-table-column>
            <el-table-column label="目的港" width="120"><template #default="{row}">{{ row.destination_port_name || '-' }}</template></el-table-column>
            <el-table-column prop="total_distance_nm" label="距离(海里)" width="110" />
            <el-table-column prop="create_time" label="申请时间" width="170" />
            <el-table-column label="操作" min-width="180">
              <template #default="{ row }">
                <el-button size="small" type="success" @click="handleApprove(row)">通过</el-button>
                <el-button size="small" type="danger" @click="handleReject(row)">拒绝</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-pagination v-if="pendingMeta.total" v-model:current-page="pendingQuery.page" v-model:page-size="pendingQuery.page_size" :total="pendingMeta.total" layout="total, sizes, prev, pager, next" @change="loadPending" />
        </el-card>
      </el-tab-pane>
    </el-tabs>
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑航线' : '添加航线'" width="550px">
      <el-form :model="form" label-width="120px">
        <el-form-item label="航线名称" prop="line_name"><el-input v-model="form.line_name" /></el-form-item>
        <el-form-item label="所属海运公司" prop="shipping_company_id">
          <el-select v-model="form.shipping_company_id" filterable style="width:100%"><el-option v-for="c in companies" :key="c.company_id" :label="c.company_name" :value="c.company_id" /></el-select>
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="起运港名称" prop="departure_port_name"><el-input v-model="form.departure_port_name" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="目的港名称" prop="destination_port_name"><el-input v-model="form.destination_port_name" /></el-form-item></el-col>
        </el-row>
        <el-form-item label="港口顺序(JSON)" prop="port_sequence"><el-input v-model="form.port_sequence" placeholder="港口ID数组，如 [1,2,3]" /></el-form-item>
        <el-row :gutter="16"><el-col :span="12"><el-form-item label="总距离(海里)" prop="total_distance_nm"><el-input-number v-model="form.total_distance_nm" :min="0" :precision="1" style="width:100%" /></el-form-item></el-col></el-row>
        <el-form-item label="描述" prop="description"><el-input v-model="form.description" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="dialogVisible = false">取消</el-button><el-button type="primary" :loading="saving" @click="handleSave">{{ isEdit ? '保存' : '添加' }}</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { createLineApi, updateLineApi, deleteLineApi, getPendingLinesApi, approveLineApi, deprecateLineApi } from '@/api/admin'
import { getLineListApi, getShippingCompanyListApi } from '@/api/data'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const activeTab = ref('all')
const loading = ref(false); const saving = ref(false); const list = ref([]); const meta = ref({}); const companies = ref([]); const fileInputLine = ref(null); const searchOptions = ref([])
const query = reactive({ page: 1, page_size: 10, keyword: '' }); const dialogVisible = ref(false); const isEdit = ref(false)
const pendingList = ref([]); const pendingMeta = ref({}); const pendingLoading = ref(false)
const pendingQuery = reactive({ page: 1, page_size: 10 })
let editId = null
const form = reactive({ line_name: '', shipping_company_id: null, departure_port_name: '', destination_port_name: '', port_sequence: '', total_distance_nm: 0, description: '' })

async function loadData() { loading.value = true; try { const res = await getLineListApi(query); list.value = res.data || []; meta.value = res.meta || {} } catch (e) { ElMessage.error(e.message||'加载失败') } finally { loading.value = false } }
function handleSearch() { query.page = 1; loadData() }
function handleExportLines() { const token = localStorage.getItem('access_token'); window.open('/api/v1/export/shipping-lines?token='+token,'_blank') }
function handleImportClick() { fileInputLine.value.click() }
async function handleImportLines(e) { const file = e.target.files[0]; if (!file) return; const fd = new FormData(); fd.append('file',file); const token = localStorage.getItem('access_token'); try { await axios.post('/api/v1/import/shipping-lines',fd,{headers:{'Authorization':`Bearer ${token}`,'Content-Type':'multipart/form-data'}}); ElMessage.success('导入成功'); loadData() } catch(err) { ElMessage.error(err.response?.data?.message||'导入失败') }; e.target.value='' }
function resetForm() { Object.assign(form,{line_name:'',shipping_company_id:null,departure_port_name:'',destination_port_name:'',port_sequence:'',total_distance_nm:0,description:''}) }
function openCreate() { isEdit.value=false; editId=null; resetForm(); dialogVisible.value=true }
function openEdit(row) { isEdit.value=true; editId=row.line_id; form.line_name=row.line_name; form.shipping_company_id=row.shipping_company_id; form.departure_port_name=row.departure_port_name; form.destination_port_name=row.destination_port_name; form.port_sequence=row.port_sequence||''; form.total_distance_nm=row.total_distance_nm; form.description=row.description||''; dialogVisible.value=true }
async function handleSave() { saving.value=true; try { const p={line_name:form.line_name,shipping_company_id:form.shipping_company_id,departure_port_name:form.departure_port_name,destination_port_name:form.destination_port_name,port_sequence:form.port_sequence||undefined,total_distance_nm:form.total_distance_nm,description:form.description||undefined}; if(isEdit.value&&editId){await updateLineApi(editId,p);ElMessage.success('更新成功')}else{await createLineApi(p);ElMessage.success('添加成功')}; dialogVisible.value=false; await loadData() } catch(e) { ElMessage.error(e.message||'操作失败') } finally { saving.value=false } }
async function handleDelete(row) { try { await ElMessageBox.confirm(`确认永久删除航线 "${row.line_name}"？`,'提示'); await deleteLineApi(row.line_id); ElMessage.success('已删除'); await loadData() } catch{/*ignore*/} }
async function handleDeprecate(row) { try { await ElMessageBox.confirm(`确认弃用航线 "${row.line_name}"？弃用后可重新申请。`,'提示'); await deprecateLineApi(row.line_id); ElMessage.success('已弃用'); await loadData() } catch{/*ignore*/} }
async function handleRestore(row) { try { await approveLineApi(row.line_id); ElMessage.success('已恢复'); await loadData() } catch(e) { ElMessage.error(e.message||'操作失败') } }
async function loadPending() { pendingLoading.value=true; try { const res=await getPendingLinesApi(pendingQuery); pendingList.value=res.data||[]; pendingMeta.value=res.meta||{} } catch(e) { ElMessage.error(e.message||'加载失败') } finally { pendingLoading.value=false } }
async function handleApprove(row) { try { await approveLineApi(row.line_id); ElMessage.success('已通过'); await loadPending(); await loadData() } catch(e) { ElMessage.error(e.message||'操作失败') } }
async function handleReject(row) { try { await ElMessageBox.confirm(`确认拒绝航线 "${row.line_name}"？`,'提示'); await deprecateLineApi(row.line_id); ElMessage.success('已拒绝'); await loadPending(); await loadData() } catch{/*ignore*/} }
async function loadSearchOptions() { try { const res=await getLineListApi({page:1,page_size:200}); searchOptions.value=(res.data||[]).map(l=>({value:l.line_name})) } catch{} }
function searchSuggestions(queryString,cb) { const r=queryString?searchOptions.value.filter(s=>s.value.includes(queryString)):searchOptions.value; cb(r) }
function onSearchSelect(item) { query.keyword=item.value; handleSearch() }
onMounted(async()=>{ await loadData(); try { const res=await getShippingCompanyListApi({page:1,page_size:100}); companies.value=res.data||[] } catch{/*ignore*/}; loadSearchOptions() })
</script>
