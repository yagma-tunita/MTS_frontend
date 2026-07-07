<template>
  <div>
    <div class="page-title">工作台</div>
    <div class="page-desc">欢迎回来，{{ userName }}</div>

    <el-row :gutter="16" style="margin: 16px 0">
      <el-col :span="4" v-for="item in statCards" :key="item.label">
        <div class="stat-card">
          <div class="stat-body">
            <div class="stat-value">{{ item.value }}</div>
            <div class="stat-label">{{ item.label }}</div>
          </div>
          <div class="stat-icon-wrap" :style="{ background: item.color + '1a', color: item.color }">
            <el-icon :size="22"><component :is="item.icon" /></el-icon>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-card>
      <template #header>管理导航</template>
      <el-row :gutter="16">
        <el-col :span="6" v-for="card in navCards" :key="card.path">
          <div class="nav-card" @click="$router.push(card.path)">
            <el-icon :size="28" :color="card.color"><component :is="card.icon" /></el-icon>
            <div class="nav-card-title">{{ card.title }}</div>
            <div class="nav-card-desc">{{ card.desc }}</div>
          </div>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getShipperListApi, getShippingListApi } from '@/api/admin'
import { getPortListApi, getVesselListApi, getCityListApi, getLineListApi } from '@/api/data'
import { User, Van, Monitor, MapLocation, Ship, Connection, Box, OfficeBuilding } from '@element-plus/icons-vue'

const userName = ref(localStorage.getItem('user_name') || '管理员')
const statCards = ref([
  { label: '货主数量', value: 0, icon: User, color: '#1a5276' },
  { label: '海运公司数', value: 0, icon: Van, color: '#722ed1' },
  { label: '城市数量', value: 0, icon: OfficeBuilding, color: '#f5222d' },
  { label: '港口数量', value: 0, icon: MapLocation, color: '#52c41a' },
  { label: '船舶数量', value: 0, icon: Ship, color: '#faad14' },
  { label: '航线数量', value: 0, icon: Connection, color: '#13c2c2' }
])
const navCards = [
  { title: '货主管理', desc: '查看和管理货主公司', path: '/admin/shipper', icon: User, color: '#1a5276' },
  { title: '海运公司管理', desc: '查看和管理海运公司', path: '/admin/shipping', icon: Van, color: '#722ed1' },
  { title: '管理员管理', desc: '管理后台管理员账户', path: '/admin/admin/list', icon: Monitor, color: '#faad14' },
  { title: '港口管理', desc: '管理港口基础数据', path: '/admin/port', icon: MapLocation, color: '#52c41a' },
  { title: '船舶管理', desc: '管理船舶注册信息', path: '/admin/vessel', icon: Ship, color: '#ff4d4f' },
  { title: '航线管理', desc: '管理航线配置', path: '/admin/line', icon: Connection, color: '#13c2c2' },
  { title: '货物管理', desc: '查看所有货物记录', path: '/admin/cargo', icon: Box, color: '#eb2f96' },
  { title: '城市管理', desc: '管理城市基础数据', path: '/admin/city', icon: OfficeBuilding, color: '#f5222d' }
]

async function loadStats() {
  try {
    const [sr, shr, cr, pr, vr, lr] = await Promise.all([
      getShipperListApi({ page: 1, page_size: 1 }), getShippingListApi({ page: 1, page_size: 1 }),
      getCityListApi({ page: 1, page_size: 1 }), getPortListApi({ page: 1, page_size: 1 }),
      getVesselListApi({ page: 1, page_size: 1 }), getLineListApi({ page: 1, page_size: 1 })
    ])
    statCards.value[0].value = sr.meta?.total || 0; statCards.value[1].value = shr.meta?.total || 0
    statCards.value[2].value = cr.meta?.total || 0; statCards.value[3].value = pr.meta?.total || 0
    statCards.value[4].value = vr.meta?.total || 0; statCards.value[5].value = lr.meta?.total || 0
  } catch {}
}
onMounted(loadStats)
</script>

<style scoped>
.page-title { font-size: 16px; font-weight: 600; color: #262626; }
.page-desc { font-size: 13px; color: #8c8c8c; margin-top: 4px; }
.stat-card { background: #fff; border: 1px solid #e8e8e8; padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; }
.stat-value { font-size: 28px; font-weight: 700; color: #262626; }
.stat-label { font-size: 13px; color: #8c8c8c; margin-top: 4px; }
.stat-icon-wrap { width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.nav-card { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 24px 12px; border: 1px solid #e8e8e8; cursor: pointer; transition: all 0.2s; margin-bottom: 16px; }
.nav-card:hover { border-color: #1a5276; }
.nav-card-title { font-size: 14px; font-weight: 600; color: #262626; margin-top: 10px; }
.nav-card-desc { font-size: 12px; color: #8c8c8c; margin-top: 4px; }
</style>
