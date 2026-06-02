<template>
  <div class="order-container">
    <!-- 统计卡片 -->
    <div class="stats-row">
      <div
        v-for="item in statsCards"
        :key="item.label"
        class="stat-card"
        :class="{ active: queryParams.state === item.value && item.value !== null, 'stat-all': item.value === null }"
        @click="filterByStat(item.value)"
      >
        <div class="stat-icon" :style="{ background: item.bg }">
          <el-icon :size="20" :color="item.color"><component :is="item.icon" /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-count">{{ item.count }}</span>
          <span class="stat-label">{{ item.label }}</span>
        </div>
      </div>
    </div>

    <!-- 主内容卡片 -->
    <el-card class="table-card" shadow="never">
      <!-- 搜索栏 -->
      <div class="search-bar">
        <div class="search-left">
          <el-input
            v-model="queryParams.order_number"
            placeholder="输入订单号搜索..."
            prefix-icon="Search"
            clearable
            class="search-input"
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          />
          <el-select v-model="queryParams.state" placeholder="订单状态" clearable class="filter-select" @change="handleSearch">
            <el-option label="待支付" :value="0" />
            <el-option label="已支付" :value="1" />
            <el-option label="待收货" :value="2" />
            <el-option label="已完成" :value="3" />
            <el-option label="已取消" :value="4" />
          </el-select>
          <el-select v-model="queryParams.order_type" placeholder="订单类型" clearable class="filter-select" @change="handleSearch">
            <el-option label="自提" :value="1" />
            <el-option label="外卖" :value="2" />
          </el-select>
        </div>
        <div class="search-right">
          <el-button :icon="Refresh" circle @click="resetQuery" />
          <el-button type="primary" @click="handleSearch">
            <el-icon class="el-icon--left"><Search /></el-icon>查询
          </el-button>
        </div>
      </div>

      <!-- 表格 -->
      <el-table
        v-loading="loading"
        :data="orderList"
        class="modern-table"
        :header-cell-style="{ background: 'var(--el-fill-color-lighter)', color: 'var(--el-text-color-primary)', fontWeight: 600, fontSize: '13px' }"
        :row-class-name="tableRowClassName"
        height="calc(100vh - 360px)"
        style="width: 100%"
      >
        <el-table-column label="订单信息" min-width="220">
          <template #default="scope">
            <div class="order-info-cell">
              <div class="order-number">{{ scope.row.order_number }}</div>
              <div class="order-time">{{ formatTime(scope.row.createdAt) }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="下单用户" width="140" align="center">
          <template #default="scope">
            <div class="user-cell">
              <el-avatar :size="26" :src="formatImageUrl(scope.row.user?.avatar)" class="user-avatar">
                {{ (scope.row.user?.nick_name || scope.row.user?.user_name || '?')[0] }}
              </el-avatar>
              <span class="user-name">{{ scope.row.user?.nick_name || scope.row.user?.user_name || '未知用户' }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="类型" width="90" align="center">
          <template #default="scope">
            <div class="type-badge" :class="scope.row.order_type === 1 ? 'type-pickup' : 'type-delivery'">
              <el-icon :size="13"><Location v-if="scope.row.order_type === 1" /><Van v-else /></el-icon>
              <span>{{ scope.row.order_type === 1 ? '自提' : '外卖' }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="商品" min-width="240">
          <template #default="scope">
            <div class="goods-preview">
              <div v-for="(item, index) in getItems(scope.row)" :key="index" class="goods-item-row">
                <span class="goods-item-name">{{ item.product?.goods_name || '未知商品' }}</span>
                <el-tag v-if="item.specs" size="small" type="info" effect="plain" class="spec-mini-tag">{{ item.specs }}</el-tag>
                <span class="goods-item-qty">×{{ item.quantity }}</span>
              </div>
              <div v-if="getItems(scope.row).length === 0" class="empty-goods">暂无商品</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="金额" width="110" align="right">
          <template #default="scope">
            <span class="price-cell">¥{{ scope.row.total_price }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="110" align="center">
          <template #default="scope">
            <div class="status-badge" :class="'status-' + scope.row.state">
              <span class="status-dot" />
              <span>{{ getStatusLabel(scope.row.state) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" align="center" fixed="right" class-name="action-col">
          <template #default="scope">
            <div class="action-btns">
              <el-tooltip content="查看详情" placement="top" :show-after="300">
                <el-button type="primary" :icon="View" circle size="small" @click="handleDetail(scope.row)" />
              </el-tooltip>
              <el-tooltip v-if="scope.row.state === 1" content="确认发货" placement="top" :show-after="300">
                <el-button type="success" :icon="Position" circle size="small" @click="handleShip(scope.row)" />
              </el-tooltip>
              <el-tooltip content="删除订单" placement="top" :show-after="300">
                <el-button type="danger" :icon="Delete" circle size="small" @click="handleDelete(scope.row)" />
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="queryParams.pageNum"
          v-model:page-size="queryParams.pageSize"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          background
          @size-change="fetchOrders"
          @current-change="fetchOrders"
        />
      </div>
    </el-card>

    <!-- 订单详情弹窗 -->
    <el-drawer
      v-model="detailVisible"
      title=""
      size="680px"
      direction="rtl"
      destroy-on-close
      class="order-drawer"
    >
      <template #header>
        <div class="drawer-header">
          <div class="drawer-title-area">
            <span class="drawer-title">订单详情</span>
            <span class="drawer-order-no">{{ currentOrder?.order_number }}</span>
          </div>
          <el-tag v-if="currentOrder" :type="getStatusType(currentOrder.state)" effect="dark" round size="large">
            {{ getStatusLabel(currentOrder.state) }}
          </el-tag>
        </div>
      </template>

      <div v-if="currentOrder" class="drawer-body">
        <!-- 订单进度 -->
        <div class="progress-card">
          <el-steps :active="getStepActive(currentOrder)" finish-status="success" align-center>
            <el-step title="下单" :description="formatTime(currentOrder.createdAt)" />
            <el-step title="支付" :description="currentOrder.pay_time ? formatTime(currentOrder.pay_time) : '—'" />
            <el-step title="发货" :description="currentOrder.ship_time ? formatTime(currentOrder.ship_time) : '—'" />
            <el-step title="完成" :description="currentOrder.finish_time ? formatTime(currentOrder.finish_time) : '—'" />
          </el-steps>
        </div>

        <!-- 信息区块 -->
        <div class="info-grid">
          <div class="info-block">
            <div class="block-title">
              <el-icon><User /></el-icon>收货信息
            </div>
            <div class="info-row">
              <span class="info-label">收货人</span>
              <span class="info-value">{{ currentOrder.address?.consignee || currentOrder.consignee || '—' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">联系电话</span>
              <span class="info-value">{{ currentOrder.address?.phone || currentOrder.address_phone || '—' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">收货地址</span>
              <span class="info-value text-ellipsis">{{ currentOrder.address?.address || currentOrder.full_address || '—' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">下单用户</span>
              <span class="info-value">{{ currentOrder.user?.nick_name || currentOrder.user?.user_name || '未知' }}</span>
            </div>
            <div v-if="currentOrder.remark" class="info-row">
              <span class="info-label">备注</span>
              <span class="info-value remark">{{ currentOrder.remark }}</span>
            </div>
          </div>
          <div class="info-block">
            <div class="block-title">
              <el-icon><CreditCard /></el-icon>支付信息
            </div>
            <div class="info-row">
              <span class="info-label">下单时间</span>
              <span class="info-value">{{ formatTime(currentOrder.createdAt) }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">支付时间</span>
              <span class="info-value">{{ currentOrder.pay_time ? formatTime(currentOrder.pay_time) : '未付款' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">支付方式</span>
              <span class="info-value pay-method">
                <span class="pay-icon" :class="currentOrder.pay_type === 1 ? 'wechat' : 'alipay'" />
                {{ currentOrder.pay_type === 1 ? '微信支付' : '支付宝' }}
              </span>
            </div>
            <div class="info-row">
              <span class="info-label">支付金额</span>
              <span class="info-value price-highlight">¥{{ currentOrder.total_price || '0.00' }}</span>
            </div>
          </div>
        </div>

        <!-- 商品清单 -->
        <div class="goods-block">
          <div class="block-title">
            <el-icon><ShoppingCart /></el-icon>商品清单
          </div>
          <div class="goods-list">
            <div v-for="(item, index) in currentOrder.displayItems" :key="index" class="goods-row">
              <el-image
                :src="getProductImage(item)"
                class="goods-thumb"
                fit="cover"
                :preview-src-list="[getProductImage(item)]"
                preview-teleported
              >
                <template #error>
                  <div class="image-placeholder"><el-icon><Picture /></el-icon></div>
                </template>
              </el-image>
              <div class="goods-meta">
                <div class="goods-name">{{ item.product?.goods_name || item.goods?.goods_name || item.goods_name || '—' }}</div>
                <div class="goods-spec" v-if="item.specs || item.spec_value">
                  <el-tag size="small" effect="plain">{{ item.specs || item.spec_value }}</el-tag>
                </div>
              </div>
              <div class="goods-price-info">
                <span class="unit-price">¥{{ item.price || '0.00' }}</span>
                <span class="qty">×{{ item.quantity }}</span>
                <span class="line-total">¥{{ ((item.price || 0) * (item.quantity || 0)).toFixed(2) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 价格汇总 -->
        <div class="total-block">
          <div class="total-row">
            <span>商品小计</span><span>¥{{ currentOrder.total_price || '0.00' }}</span>
          </div>
          <div class="total-row">
            <span>运费</span><span>¥{{ currentOrder.shipping_fee || '0.00' }}</span>
          </div>
          <el-divider />
          <div class="total-row final">
            <span>实付款</span>
            <span class="final-price">¥{{ currentOrder.total_price || '0.00' }}</span>
          </div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { getOrderList, updateOrderStatus, deleteOrder, getOrderDetail } from '../../api/order'
import { ElMessage, ElMessageBox } from 'element-plus'
import { baseURL } from '../../utils/request'
import { Search, Refresh, View, Position, Delete, Location, Van, User, CreditCard, ShoppingCart, Picture } from '@element-plus/icons-vue'
import dayjs from 'dayjs'

const orderList = ref([])
const total = ref(0)
const loading = ref(false)
const detailVisible = ref(false)
const currentOrder = ref(null)

const formatImageUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return baseURL + url
}

const getProductImage = (row) => {
  const img = row.product?.goods_img || row.goods?.goods_img || row.goods_img
  return formatImageUrl(img)
}

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  order_number: '',
  state: null,
  order_type: null
})

// 统计数据
const statusCounts = ref({ 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 })

const statsCards = computed(() => [
  { label: '全部订单', value: null, count: total.value, icon: 'Document', color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
  { label: '待支付', value: 0, count: statusCounts.value[0], icon: 'Clock', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  { label: '已支付', value: 1, count: statusCounts.value[1], icon: 'SuccessFilled', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  { label: '待收货', value: 2, count: statusCounts.value[2], icon: 'Van', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  { label: '已完成', value: 3, count: statusCounts.value[3], icon: 'CircleCheck', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
  { label: '已取消', value: 4, count: statusCounts.value[4], icon: 'CircleClose', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
])

const filterByStat = (val) => {
  queryParams.state = val
  queryParams.pageNum = 1
  fetchOrders()
}

const getItems = (row) => {
  return row.order_items || row.orderItems || row.items || []
}

const fetchOrders = async () => {
  loading.value = true
  try {
    const res = await getOrderList(queryParams)
    orderList.value = res.result.list
    total.value = res.result.total
    // 如果后端返回了各状态统计
    if (res.result.statusCounts) {
      statusCounts.value = res.result.statusCounts
    } else {
      fetchStatusCounts()
    }
  } catch (error) {
    console.error('获取订单列表失败:', error)
  } finally {
    loading.value = false
  }
}

const fetchStatusCounts = async () => {
  try {
    const promises = [0, 1, 2, 3, 4].map(s =>
      getOrderList({ pageNum: 1, pageSize: 1, state: s }).then(res => ({
        state: s,
        count: res.result.total || 0
      }))
    )
    const results = await Promise.all(promises)
    results.forEach(r => { statusCounts.value[r.state] = r.count })
  } catch {
    // silent
  }
}

const resetQuery = () => {
  queryParams.order_number = ''
  queryParams.state = null
  queryParams.order_type = null
  queryParams.pageNum = 1
  fetchOrders()
}

const handleSearch = () => {
  queryParams.pageNum = 1
  fetchOrders()
}

const getStatusLabel = (state) => {
  const labels = { 0: '待支付', 1: '已支付', 2: '待收货', 3: '已完成', 4: '已取消' }
  return labels[state] || '未知'
}

const getStatusType = (state) => {
  const types = { 0: 'warning', 1: 'success', 2: '', 3: 'info', 4: 'danger' }
  return types[state] || ''
}

const getStepActive = (order) => {
  if (order.state === 4) return 0
  return order.state + 1
}

const tableRowClassName = ({ row }) => {
  if (row.state === 4) return 'row-cancelled'
  return ''
}

const formatTime = (time) => {
  if (!time) return ''
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

const handleDetail = async (row) => {
  try {
    const res = await getOrderDetail(row.id)
    const detailData = res.result || {}
    currentOrder.value = { ...row }
    for (const key in detailData) {
      if (detailData[key] !== null && detailData[key] !== undefined) {
        currentOrder.value[key] = detailData[key]
      }
    }
    const items = currentOrder.value.orderItems || currentOrder.value.order_items || currentOrder.value.items
    currentOrder.value.displayItems = Array.isArray(items) ? items : []
    detailVisible.value = true
  } catch (error) {
    console.error('获取订单详情失败:', error)
    currentOrder.value = { ...row, displayItems: [] }
    detailVisible.value = true
    ElMessage.warning('获取详细信息失败，已显示基本信息')
  }
}

const handleShip = (row) => {
  ElMessageBox.confirm('确定要对该订单进行发货处理吗？', '发货确认', {
    confirmButtonText: '确认发货',
    cancelButtonText: '取消',
    type: 'info',
  }).then(async () => {
    await updateOrderStatus(row.id, 2)
    ElMessage.success('发货成功')
    fetchOrders()
  })
}

const handleDelete = (row) => {
  ElMessageBox.confirm('确定要删除该订单吗？此操作不可恢复。', '删除确认', {
    confirmButtonText: '确认删除',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    await deleteOrder(row.id)
    ElMessage.success('删除成功')
    fetchOrders()
  })
}

onMounted(fetchOrders)
</script>

<style scoped>
.order-container {
  padding: 20px;
  background-color: var(--el-bg-color-page);
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 统计卡片 */
.stats-row {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
}
.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 18px;
  background: var(--el-bg-color);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.25s ease;
  border: 2px solid transparent;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}
.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
.stat-card.active {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.stat-info {
  display: flex;
  flex-direction: column;
}
.stat-count {
  font-size: 20px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  line-height: 1.2;
}
.stat-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
}

/* 主卡片 */
.table-card {
  flex: 1;
  border-radius: 12px;
  border: none;
  overflow: hidden;
}
.table-card :deep(.el-card__body) {
  padding: 16px 20px 20px;
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* 搜索栏 */
.search-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 10px;
}
.search-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.search-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
.search-input {
  width: 240px;
}
.search-input :deep(.el-input__wrapper) {
  border-radius: 8px;
  background: var(--el-fill-color-lighter);
  box-shadow: none;
}
.search-input :deep(.el-input__wrapper:hover),
.search-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--el-color-primary) inset;
}
.filter-select {
  width: 130px;
}
.filter-select :deep(.el-input__wrapper) {
  border-radius: 8px;
  background: var(--el-fill-color-lighter);
  box-shadow: none;
}

/* 表格 */
.modern-table {
  border-radius: 8px;
  overflow: hidden;
  flex: 1;
}
.modern-table :deep(.el-table__inner-wrapper) {
  border-radius: 8px;
}
.modern-table :deep(.el-table__row) {
  transition: background-color 0.2s;
}
.modern-table :deep(.el-table__row:hover > td) {
  background-color: var(--el-color-primary-light-9) !important;
}
.modern-table :deep(.row-cancelled) {
  opacity: 0.55;
}
.modern-table :deep(td.el-table__cell) {
  border-bottom: 1px solid var(--el-border-color-lighter);
  padding: 12px 0;
}

/* 订单信息单元格 */
.order-info-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.order-number {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  font-family: 'SF Mono', 'Menlo', 'Consolas', monospace;
  letter-spacing: 0.3px;
}
.order-time {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

/* 类型徽章 */
.user-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
}
.user-avatar {
  flex-shrink: 0;
  background: var(--el-color-primary-light-5);
  color: var(--el-color-primary);
  font-size: 12px;
  font-weight: 600;
}
.user-name {
  font-size: 13px;
  color: var(--el-text-color-primary);
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.type-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}
.type-pickup {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}
.type-delivery {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

/* 商品预览 */
.goods-preview {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.goods-item-row {
  display: flex;
  align-items: center;
  gap: 6px;
  line-height: 1.5;
}
.goods-item-name {
  font-size: 13px;
  color: var(--el-text-color-primary);
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.spec-mini-tag {
  transform: scale(0.9);
  font-size: 10px;
}
.goods-item-qty {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  font-weight: 500;
}
.empty-goods {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  font-style: italic;
}

/* 金额 */
.price-cell {
  font-size: 15px;
  font-weight: 700;
  color: var(--el-color-danger);
  font-family: 'SF Mono', 'Menlo', 'Consolas', monospace;
}

/* 状态徽章 */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}
.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}
.status-0 {
  background: rgba(245, 158, 11, 0.1);
  color: #d97706;
}
.status-0 .status-dot { background: #f59e0b; }
.status-1 {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
}
.status-1 .status-dot { background: #10b981; }
.status-2 {
  background: rgba(59, 130, 246, 0.1);
  color: #2563eb;
}
.status-2 .status-dot { background: #3b82f6; }
.status-3 {
  background: rgba(139, 92, 246, 0.1);
  color: #7c3aed;
}
.status-3 .status-dot { background: #8b5cf6; }
.status-4 {
  background: rgba(239, 68, 68, 0.08);
  color: #dc2626;
}
.status-4 .status-dot { background: #ef4444; }

/* 操作按钮 */
.action-btns {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

/* 分页 */
.pagination-wrap {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
.pagination-wrap :deep(.el-pagination) {
  --el-pagination-bg-color: transparent;
}

/* ============ 抽屉详情 ============ */
.order-drawer :deep(.el-drawer__header) {
  margin-bottom: 0;
  padding: 16px 24px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.order-drawer :deep(.el-drawer__body) {
  padding: 0;
  background: var(--el-fill-color-blank);
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}
.drawer-title-area {
  display: flex;
  align-items: baseline;
  gap: 10px;
}
.drawer-title {
  font-size: 17px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}
.drawer-order-no {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  font-family: 'SF Mono', 'Menlo', 'Consolas', monospace;
}

.drawer-body {
  padding: 20px 24px 40px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 进度卡片 */
.progress-card {
  background: linear-gradient(135deg, var(--el-color-primary-light-9), var(--el-fill-color-lighter));
  border-radius: 12px;
  padding: 28px 20px;
}

/* 信息网格 */
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.info-block {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  padding: 18px;
}
.block-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 14px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.block-title .el-icon {
  color: var(--el-color-primary);
}
.info-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 6px 0;
  font-size: 13px;
}
.info-label {
  color: var(--el-text-color-secondary);
  flex-shrink: 0;
  min-width: 60px;
}
.info-value {
  color: var(--el-text-color-primary);
  text-align: right;
  max-width: 200px;
  word-break: break-all;
}
.info-value.text-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.info-value.remark {
  color: var(--el-color-warning);
  font-style: italic;
}
.price-highlight {
  font-size: 18px;
  font-weight: 700;
  color: var(--el-color-danger);
  font-family: 'SF Mono', 'Menlo', 'Consolas', monospace;
}
.pay-method {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.pay-icon {
  display: inline-block;
  width: 16px;
  height: 16px;
  border-radius: 4px;
}
.pay-icon.wechat {
  background: #07C160;
}
.pay-icon.alipay {
  background: #1677FF;
}

/* 商品清单 */
.goods-block {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  padding: 18px;
}
.goods-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.goods-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--el-fill-color-lighter);
  transition: background 0.2s;
}
.goods-row:hover {
  background: var(--el-fill-color-light);
}
.goods-thumb {
  width: 56px;
  height: 56px;
  border-radius: 8px;
  flex-shrink: 0;
  background: var(--el-fill-color);
}
.image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-placeholder);
  font-size: 20px;
}
.goods-meta {
  flex: 1;
  min-width: 0;
}
.goods-meta .goods-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.goods-meta .goods-spec {
  margin-top: 4px;
}
.goods-price-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  flex-shrink: 0;
}
.unit-price {
  font-size: 13px;
  color: var(--el-text-color-regular);
}
.qty {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.line-total {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

/* 汇总 */
.total-block {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  padding: 18px 20px;
}
.total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
  font-size: 13px;
  color: var(--el-text-color-regular);
}
.total-row.final {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  padding-top: 4px;
}
.final-price {
  font-size: 22px;
  font-weight: 800;
  color: var(--el-color-danger);
  font-family: 'SF Mono', 'Menlo', 'Consolas', monospace;
}
.total-block :deep(.el-divider--horizontal) {
  margin: 10px 0;
  border-color: var(--el-border-color-lighter);
}

/* 响应式 */
@media (max-width: 1200px) {
  .stats-row {
    grid-template-columns: repeat(3, 1fr);
  }
  .info-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 768px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
  .search-bar {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
