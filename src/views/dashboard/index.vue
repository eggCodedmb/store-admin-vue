<template>
  <div class="dashboard-container">
    <!-- Statistics Cards -->
    <el-row :gutter="20">
      <el-col :span="6" v-for="item in statistics" :key="item.title">
        <el-card shadow="never" class="stat-card" :style="{ backgroundImage: item.gradient }">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-title">{{ item.title }}</div>
              <div class="stat-value">{{ item.value }}</div>
              <div class="stat-footer">
                <span class="trend" :class="item.trend > 0 ? 'up' : 'down'">
                  <el-icon><component :is="item.trend > 0 ? 'CaretTop' : 'CaretBottom'" /></el-icon>
                  {{ Math.abs(item.trend) }}%
                </span>
                <span class="period">较上周</span>
              </div>
            </div>
            <div class="stat-icon-wrapper">
              <el-icon><component :is="item.icon" /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Charts Row -->
    <el-row :gutter="20" class="chart-row">
      <el-col :span="16">
        <el-card shadow="never" header="销售趋势分析">
          <template #header>
            <div class="card-header">
              <span>销售趋势分析</span>
              <el-radio-group v-model="trendTimeRange" size="small">
                <el-radio-button label="7d">近7天</el-radio-button>
                <el-radio-button label="30d">近30天</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <base-chart :option="salesTrendOption" height="350px" />
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never" header="商品分类占比">
          <base-chart :option="categoryPieOption" height="350px" />
        </el-card>
      </el-col>
    </el-row>

    <!-- Bottom Row -->
    <el-row :gutter="20" class="bottom-row">
      <el-col :span="16">
        <el-card shadow="never" header="最新订单">
          <el-table :data="recentOrders" style="width: 100%" size="small">
            <el-table-column prop="orderId" label="订单编号" width="120" />
            <el-table-column prop="customer" label="客户" />
            <el-table-column prop="amount" label="金额">
              <template #default="scope">
                ¥{{ scope.row.amount.toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态">
              <template #default="scope">
                <el-tag :type="getStatusType(scope.row.status)" size="small">
                  {{ scope.row.status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="time" label="下单时间" width="150" />
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never" header="快捷入口">
          <div class="quick-links">
            <div v-for="link in quickLinks" :key="link.name" class="link-item" @click="$router.push(link.path)">
              <div class="link-icon" :style="{ backgroundColor: link.color }">
                <el-icon><component :is="link.icon" /></el-icon>
              </div>
              <span class="link-name">{{ link.name }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { getSummary, getSalesTrend, getCategoryDistribution } from '../../api/statistics'
import { ElMessage } from 'element-plus'
import BaseChart from '../../components/BaseChart.vue'

const trendTimeRange = ref('7d')
const trendData = ref([])
const categoryData = ref([])

const statistics = ref([
  { 
    title: '总商品数', 
    value: '0', 
    icon: 'Goods', 
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
    key: 'totalGoods',
    trend: 12.5
  },
  { 
    title: '今日订单', 
    value: '0', 
    icon: 'List', 
    gradient: 'linear-gradient(135deg, #2af598 0%, #009efd 100%)', 
    key: 'todayOrders',
    trend: -2.4
  },
  { 
    title: '活跃用户', 
    value: '0', 
    icon: 'User', 
    gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)', 
    key: 'activeUsers',
    trend: 8.1
  },
  { 
    title: '月销售额', 
    value: '¥ 0.00', 
    icon: 'Money', 
    gradient: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)', 
    key: 'monthlySales',
    trend: 15.3
  }
])

const salesTrendOption = computed(() => ({
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'shadow' }
  },
  legend: {
    data: ['销售额', '订单量'],
    bottom: 0
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '10%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: trendData.value.map(item => item.date.split('-').slice(1).join('-')),
    axisLine: { lineStyle: { color: '#999' } }
  },
  yAxis: [
    {
      type: 'value',
      name: '销售额',
      axisLine: { show: false },
      splitLine: { lineStyle: { type: 'dashed', color: '#eee' } }
    },
    {
      type: 'value',
      name: '订单量',
      position: 'right',
      axisLine: { show: false },
      splitLine: { show: false }
    }
  ],
  series: [
    {
      name: '销售额',
      type: 'line',
      smooth: true,
      data: trendData.value.map(item => item.sales),
      itemStyle: { color: '#409EFF' },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(64,158,255,0.3)' },
            { offset: 1, color: 'rgba(64,158,255,0)' }
          ]
        }
      }
    },
    {
      name: '订单量',
      type: 'line',
      smooth: true,
      yAxisIndex: 1,
      data: trendData.value.map(item => item.orders),
      itemStyle: { color: '#67C23A' },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(103,194,58,0.3)' },
            { offset: 1, color: 'rgba(103,194,58,0)' }
          ]
        }
      }
    }
  ]
}))

const categoryPieOption = computed(() => ({
  tooltip: {
    trigger: 'item',
    formatter: '{a} <br/>{b}: {c} ({d}%)'
  },
  legend: {
    bottom: '0%',
    left: 'center',
    type: 'scroll'
  },
  series: [
    {
      name: '商品分类',
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: false,
        position: 'center'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: '20',
          fontWeight: 'bold'
        }
      },
      labelLine: {
        show: false
      },
      data: categoryData.value
    }
  ]
}))

const recentOrders = ref([
  { orderId: 'ORD001', customer: '张三', amount: 299.00, status: '已支付', time: '2026-06-01 10:23:45' },
  { orderId: 'ORD002', customer: '李四', amount: 129.50, status: '待发货', time: '2026-06-01 11:05:12' },
  { orderId: 'ORD003', customer: '王五', amount: 88.00, status: '已收货', time: '2026-06-01 09:15:30' },
  { orderId: 'ORD004', customer: '赵六', amount: 1599.00, status: '待支付', time: '2026-05-31 22:45:10' },
  { orderId: 'ORD005', customer: '孙七', amount: 45.00, status: '已取消', time: '2026-05-31 20:12:00' }
])

const quickLinks = [
  { name: '发布商品', icon: 'Plus', color: '#409EFF', path: '/goods_manage/add' },
  { name: '订单审核', icon: 'Checked', color: '#67C23A', path: '/order_manage' },
  { name: '用户管理', icon: 'User', color: '#E6A23C', path: '/user_manage' },
  { name: '系统公告', icon: 'Bell', color: '#F56C6C', path: '/system/notice' },
  { name: '规格配置', icon: 'Operation', color: '#909399', path: '/goods_manage/spec' },
  { name: '分类管理', icon: 'Menu', color: '#409EFF', path: '/category_manage' }
]

const getStatusType = (status) => {
  const map = {
    '已支付': 'success',
    '待发货': 'warning',
    '已收货': 'info',
    '待支付': 'primary',
    '已取消': 'danger'
  }
  return map[status] || ''
}

const loading = ref(false)

const fetchStatistics = async () => {
  loading.value = true
  try {
    const res = await getSummary()
    const data = res.result
    statistics.value.forEach(item => {
      if (item.key === 'monthlySales') {
        item.value = `¥ ${data[item.key].toLocaleString(undefined, { minimumFractionDigits: 2 })}`
      } else {
        item.value = data[item.key].toLocaleString()
      }
    })
  } catch (error) {
    console.error('Fetch statistics failed', error)
    // ElMessage.error('获取统计数据失败')
  } finally {
    loading.value = false
  }
}

const fetchTrendData = async () => {
  try {
    const days = trendTimeRange.value === '7d' ? 7 : 30
    const res = await getSalesTrend({ days })
    trendData.value = res.result
  } catch (error) {
    console.error('Fetch trend data failed', error)
  }
}

const fetchCategoryDistribution = async () => {
  try {
    const res = await getCategoryDistribution()
    categoryData.value = res.result
  } catch (error) {
    console.error('Fetch category distribution failed', error)
  }
}

watch(trendTimeRange, () => {
  fetchTrendData()
})

onMounted(() => {
  fetchStatistics()
  fetchTrendData()
  fetchCategoryDistribution()
})
</script>

<style scoped>
.dashboard-container { 
  padding: 20px; 
  background-color: var(--el-bg-color-page); 
  flex: 1; 
  overflow-y: auto; 
  overflow-x: hidden; 
  box-sizing: border-box;
}

.stat-card { border: none; color: #fff; position: relative; min-height: 120px; display: flex; align-items: center; border-radius: 12px; }
.stat-content { display: flex; justify-content: space-between; align-items: center; width: 100%; padding: 20px; box-sizing: border-box; position: relative; z-index: 1; }
.stat-info { flex: 1; overflow: hidden; }
.stat-title { font-size: 14px; opacity: 0.9; margin-bottom: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.stat-value { font-size: 28px; font-weight: bold; margin-bottom: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.stat-footer { font-size: 12px; display: flex; align-items: center; gap: 5px; white-space: nowrap; }
.trend { display: flex; align-items: center; font-weight: bold; }
.trend.up { color: #fff; }
.trend.down { color: #fff; opacity: 0.8; }
.period { opacity: 0.7; }
.stat-icon-wrapper { font-size: 56px; opacity: 0.2; position: absolute; right: -10px; top: 10px; transform: rotate(15deg); pointer-events: none; }

.chart-row, .bottom-row { margin-top: 20px; }

.el-card { border-radius: 12px; border: none; box-shadow: 0 4px 12px rgba(0,0,0,0.05) !important; }

.card-header { display: flex; justify-content: space-between; align-items: center; }

.quick-links { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
.link-item { display: flex; flex-direction: column; align-items: center; cursor: pointer; transition: all 0.3s; padding: 10px; border-radius: 8px; }
.link-item:hover { background-color: var(--el-fill-color-light); transform: translateY(-5px); }
.link-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; justify-content: center; align-items: center; color: #fff; font-size: 22px; margin-bottom: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
.link-name { font-size: 13px; color: var(--el-text-color-regular); }

:deep(.el-card__header) { border-bottom: 1px solid var(--el-border-color-light); padding: 15px 20px; font-weight: bold; font-size: 16px; }
</style>
