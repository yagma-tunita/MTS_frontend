<template>
  <div>
    <div class="page-title">航次管理</div>
    <div class="page-desc">查看和管理所有航次（按航线+船舶+日期分组）</div>
    <el-card style="margin-top:16px">
      <el-table :data="list" v-loading="loading" stripe style="width:100%" @expand-change="onExpandChange" row-key="rowKey">
        <el-table-column type="expand">
          <template #default="{ row }">
            <div style="padding:8px 20px">
              <el-descriptions :column="3" border size="small">
                <el-descriptions-item label="航线">{{ row.line_name }}</el-descriptions-item>
                <el-descriptions-item label="船舶">{{ row.vessel_name }}</el-descriptions-item>
                <el-descriptions-item label="停靠港数">{{ row.port_count }}</el-descriptions-item>
              </el-descriptions>
              <el-table :data="row._stops || []" stripe size="small" style="width:100%;margin-top:8px">
                <el-table-column label="顺序" width="60"><template #default="{ $index }"><strong>{{ $index + 1 }}</strong></template></el-table-column>
                <el-table-column label="港口类型" width="100">
                  <template #default="{ $index }">
                    <el-tag v-if="$index === 0" type="primary" size="small">起始港</el-tag>
                    <el-tag v-else-if="$index === row._stops.length - 1" type="warning" size="small">目的港</el-tag>
                    <el-tag v-else type="info" size="small">途经</el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="港口" min-width="140" prop="port_name" />
                <el-table-column label="计划到达" width="160"><template #default="{ row: stop }">{{ formatTime(stop.planned_arrival_time) }}</template></el-table-column>
                <el-table-column label="计划离港" width="160"><template #default="{ row: stop }">{{ formatTime(stop.planned_departure_time) }}</template></el-table-column>
                <el-table-column label="实际到达" width="160"><template #default="{ row: stop }">{{ formatTime(stop.actual_arrival_time) }}</template></el-table-column>
                <el-table-column label="实际离港" width="160"><template #default="{ row: stop }">{{ formatTime(stop.actual_departure_time) }}</template></el-table-column>
                <el-table-column label="操作" width="140" fixed="right">
                  <template #default="{ row: stop }">
                    <el-button size="small" @click="openUpdate(stop)">更新时间</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="航线名称" min-width="160"><template #default="{ row }">{{ row.line_name }}</template></el-table-column>
        <el-table-column label="船舶名称" min-width="140"><template #default="{ row }">{{ row.vessel_name }}</template></el-table-column>
        <el-table-column label="启航日期" width="120"><template #default="{ row }">{{ row.voyage_date }}</template></el-table-column>
        <el-table-column label="停靠港数" width="90" prop="port_count" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="toggleExpand(row)">查看详情</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && list.length === 0" description="暂无航次记录" />
      <el-pagination v-if="meta.total" v-model:current-page="query.page" v-model:page-size="query.page_size" :total="meta.total" layout="total, sizes, prev, pager, next" @change="loadData" />
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
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getVoyageGroupsApi } from '@/api/voyage'
import request from '@/api/request'

const loading = ref(false)
const saving = ref(false)
const list = ref([])
const meta = ref({})
const query = reactive({ page: 1, page_size: 10 })
const dialogVisible = ref(false)
const editForm = ref({ berthing_id: null, actual_arrival_time: null, actual_departure_time: null })

const formatTime = t => t ? String(t).slice(0, 19).replace('T', ' ') : '-'

async function loadData() {
  loading.value = true
  try {
    const res = await getVoyageGroupsApi(query)
    const rows = res.data || []
    list.value = rows.map(r => ({ ...r, _stops: r.port_stops || [], rowKey: `${r.line_id}-${r.vessel_id}-${r.voyage_date}` }))
    meta.value = res.meta || {}
  } catch { list.value = [] }
  finally { loading.value = false }
}

function toggleExpand(row) {
  // Toggle through expand
}

function onExpandChange(row, expandedRows) {
  // Data already loaded in _stops
}

function openUpdate(stop) {
  editForm.value = {
    berthing_id: stop.berthing_id,
    actual_arrival_time: stop.actual_arrival_time || null,
    actual_departure_time: stop.actual_departure_time || null
  }
  dialogVisible.value = true
}

async function handleSave() {
  saving.value = true
  try {
    await request.put(`/berthings/${editForm.value.berthing_id}/actual-times`, {
      actual_arrival_time: editForm.value.actual_arrival_time || null,
      actual_departure_time: editForm.value.actual_departure_time || null
    })
    ElMessage.success('更新成功')
    dialogVisible.value = false
    loadData()
  } catch (e) {
    ElMessage.error(e.message || '更新失败')
  } finally {
    saving.value = false
  }
}

onMounted(loadData)
</script>
