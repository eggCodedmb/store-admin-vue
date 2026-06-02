<template>
  <div class="order-container">
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <div class="left">
            <el-input
              v-model="queryParams.order_number"
              placeholder="搜索订单号"
              style="width: 200px"
              clearable
              @clear="handleSearch"
              @keyup.enter="handleSearch"
            />
            <el-select v-model="queryParams.state" placeholder="订单状态" style="width: 120px; margin-left: 12px" clearable @change="handleSearch">
              <el-option label="待支付" :value="0" />
              <el-option label="已支付" :value="1" />
              <el-option label="待收货" :value="2" />
              <el-option label="已完成" :value="3" />
              <el-option label="已取消" :value="4" />
            </el-select>
            <el-select v-model="queryParams.order_type" placeholder="订单类型" style="width: 120px; margin-left: 12px" clearable @change="handleSearch">
              <el-option label="自提" :value="1" />
              <el-option label="外卖" :value="2" />
            </el-select>
            <el-button type="primary" style="margin-left: 12px" @click="handleSearch">查询</el-button>
          </div>
        </div>
      </template>

      <el-table 
        v-loading="loading" 
        :data="orderList" 
        border 
        stripe 
        height="calc(100vh - 240px)"
        style="width: 100%"
      >
        <el-table-column prop="order_number" label="订单编号" min-width="180" align="center" />
        <el-table-column label="订单类型" width="100" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.order_type === 1 ? 'success' : 'warning'" effect="plain">
              {{ scope.row.order_type === 1 ? '自提' : '外卖' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="商品内容" min-width="250">
          <template #default="scope">
            <div v-for="(item, index) in (scope.row.order_items || scope.row.orderItems || [])" :key="index" class="item-summary">
              <span class="item-name">{{ item.product?.goods_name || '未知商品' }}</span>
              <el-tag v-if="item.specs" size="small" type="info" class="item-spec">{{ item.specs }}</el-tag>
              <span class="item-qty">x{{ item.quantity }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="total_price" label="订单总价" width="120" align="center">
          <template #default="scope">
            <span style="color: var(--el-color-danger); font-weight: bold">¥ {{ scope.row.total_price }}</span>
          </template>
        </el-table-column>
        <el-table-column label="订单状态" width="120" align="center">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.state)">{{ getStatusLabel(scope.row.state) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="下单时间" width="180" align="center">
          <template #default="scope">
            {{ formatTime(scope.row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" align="center" fixed="right">
          <template #default="scope">
            <el-button size="small" type="primary" link icon="View" @click="handleDetail(scope.row)">详情</el-button>
            <el-button v-if="scope.row.state === 1" size="small" type="success" link icon="Position" @click="handleShip(scope.row)">发货</el-button>
            <el-button size="small" type="danger" link icon="Delete" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="queryParams.pageNum"
          v-model:page-size="queryParams.pageSize"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          :total="total"
          @size-change="fetchOrders"
          @current-change="fetchOrders"
        />
      </div>
    </el-card>

    <!-- 订单详情弹窗 -->
    <el-dialog 
      v-model="detailVisible" 
      title="订单详情" 
      width="1000px" 
      destroy-on-close
      align-center
      class="modern-dialog"
    >
      <el-scrollbar max-height="70vh">
        <div v-if="currentOrder" class="order-detail-container">
          <!-- 顶部核心信息概览 -->
          <div class="detail-header">
            <div class="header-main">
              <span class="order-no">订单号：{{ currentOrder.order_number || '---' }}</span>
              <el-tag :type="currentOrder.order_type === 1 ? 'success' : 'warning'" effect="dark" size="small" class="type-tag">
                {{ currentOrder.order_type === 1 ? '自提' : '外卖' }}
              </el-tag>
            </div>
            <div class="header-status">
              <el-tag :type="getStatusType(currentOrder.state)" effect="light" size="large">
                {{ getStatusLabel(currentOrder.state) }}
              </el-tag>
            </div>
          </div>

          <!-- 订单进度 -->
          <div class="section-card status-section">
            <el-steps :active="currentOrder.state + 1" finish-status="success" align-center size="small">
              <el-step title="待支付" :description="formatTime(currentOrder.createdAt)" />
              <el-step title="已支付" :description="currentOrder.pay_time ? formatTime(currentOrder.pay_time) : ''" />
              <el-step title="已发货" :description="currentOrder.ship_time ? formatTime(currentOrder.ship_time) : ''" />
              <el-step title="已完成" :description="currentOrder.finish_time ? formatTime(currentOrder.finish_time) : ''" />
            </el-steps>
          </div>

          <el-row :gutter="24">
            <!-- 左侧：用户信息与物流 -->
            <el-col :span="14">
              <div class="section-card">
                <div class="card-title">收货与用户信息</div>
                <el-descriptions :column="1" class="clean-descriptions">
                  <el-descriptions-item label="收货人">
                    <span class="bold-text">{{ currentOrder.address?.consignee || currentOrder.consignee || '---' }}</span>
                  </el-descriptions-item>
                  <el-descriptions-item label="联系电话">{{ currentOrder.address?.phone || currentOrder.address_phone || '---' }}</el-descriptions-item>
                  <el-descriptions-item label="收货地址">
                    <span class="text-secondary">{{ currentOrder.address?.address || currentOrder.full_address || '---' }}</span>
                  </el-descriptions-item>
                  <el-descriptions-item label="下单用户">{{ currentOrder.user?.username || currentOrder.username || '未知' }} (ID: {{ currentOrder.user_id }})</el-descriptions-item>
                  <el-descriptions-item label="用户备注">
                    <span class="remark-text">{{ currentOrder.remark || '无备注' }}</span>
                  </el-descriptions-item>
                </el-descriptions>
              </div>
            </el-col>

            <!-- 右侧：付款与基础信息 -->
            <el-col :span="10">
              <div class="section-card">
                <div class="card-title">付款信息</div>
                <el-descriptions :column="1" class="clean-descriptions">
                  <el-descriptions-item label="下单时间">{{ formatTime(currentOrder.createdAt) }}</el-descriptions-item>
                  <el-descriptions-item label="付款时间">{{ currentOrder.pay_time ? formatTime(currentOrder.pay_time) : '未付款' }}</el-descriptions-item>
                  <el-descriptions-item label="支付方式">
                    <el-icon v-if="currentOrder.pay_type === 1" color="#07C160" style="vertical-align: middle; margin-right: 4px"><ChatDotRound /></el-icon>
                    <el-icon v-else color="#1677FF" style="vertical-align: middle; margin-right: 4px"><Wallet /></el-icon>
                    {{ currentOrder.pay_type === 1 ? '微信支付' : '支付宝支付' }}
                  </el-descriptions-item>
                  <el-descriptions-item label="支付金额">
                    <span class="price-large">¥ {{ currentOrder.total_price || '0.00' }}</span>
                  </el-descriptions-item>
                </el-descriptions>
              </div>
            </el-col>
          </el-row>

          <!-- 商品清单 -->
          <div class="section-card goods-section">
            <div class="card-title">商品清单</div>
            <el-table :data="currentOrder.displayItems" border stripe class="modern-table">
              <el-table-column label="商品" min-width="300">
                <template #default="scope">
                  <div class="goods-info">
                    <el-image 
                      :src="getProductImage(scope.row)" 
                      class="goods-img"
                      fit="cover" 
                      :preview-src-list="[getProductImage(scope.row)]"
                      preview-teleported
                    />
                    <div class="goods-detail">
                      <div class="goods-name">{{ scope.row.product?.goods_name || scope.row.goods?.goods_name || scope.row.goods_name || '---' }}</div>
                    </div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="规格" width="180" align="center">
                <template #default="scope">
                  <el-tag v-if="scope.row.specs || scope.row.spec_value" size="small" type="info" effect="light" class="modern-spec-tag">
                    {{ scope.row.specs || scope.row.spec_value }}
                  </el-tag>
                  <span v-else class="text-secondary">标准规格</span>
                </template>
              </el-table-column>
              <el-table-column prop="price" label="单价" width="120" align="center">
                <template #default="scope">¥ {{ scope.row.price || '0.00' }}</template>
              </el-table-column>
              <el-table-column prop="quantity" label="数量" width="100" align="center" />
              <el-table-column label="小计" width="120" align="center">
                <template #default="scope">
                  <span class="subtotal-bold">¥ {{ ((scope.row.price || 0) * (scope.row.quantity || 0)).toFixed(2) }}</span>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <!-- 价格结算汇总 -->
          <div class="summary-card">
            <div class="summary-line">
              <span>商品小计</span>
              <span>¥ {{ currentOrder.total_price || '0.00' }}</span>
            </div>
            <div class="summary-line">
              <span>运费</span>
              <span>¥ {{ currentOrder.shipping_fee || '0.00' }}</span>
            </div>
            <el-divider />
            <div class="summary-line total">
              <span>实付款</span>
              <span class="total-price">¥ {{ currentOrder.total_price || '0.00' }}</span>
            </div>
          </div>
        </div>
      </el-scrollbar>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getOrderList, updateOrderStatus, deleteOrder, getOrderDetail } from '../../api/order'
import { ElMessage, ElMessageBox } from 'element-plus'
import { baseURL } from '../../utils/request'
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

const fetchOrders = async () => {
  loading.value = true
  try {
    const res = await getOrderList(queryParams)
    orderList.value = res.result.list
    total.value = res.result.total
  } catch (error) {
    console.error('获取订单列表失败:', error)
  } finally {
    loading.value = false
  }
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
  const types = { 0: 'warning', 1: 'success', 2: 'primary', 3: 'info', 4: 'danger' }
  return types[state] || ''
}

const formatTime = (time) => dayjs(time).format('YYYY-MM-DD HH:mm')

const handleDetail = async (row) => {
  try {
    const res = await getOrderDetail(row.id)
    const detailData = res.result || {}
    
    // 合并数据，优先使用详情接口的数据，但保留列表中的基本数据
    currentOrder.value = { ...row }
    for (const key in detailData) {
      if (detailData[key] !== null && detailData[key] !== undefined) {
        currentOrder.value[key] = detailData[key]
      }
    }
    
    // 兼容多种商品列表字段名
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
  ElMessageBox.confirm('确定要对该订单进行发货处理吗？', '发货确认').then(async () => {
    await updateOrderStatus(row.id, 2)
    ElMessage.success('发货成功')
    fetchOrders()
  })
}

const handleDelete = (row) => {
  ElMessageBox.confirm('确定要删除该订单吗？', '警告', { type: 'warning' }).then(async () => {
    await deleteOrder(row.id)
    ElMessage.success('删除成功')
    fetchOrders()
  })
}

onMounted(fetchOrders)
</script>

<style scoped>
.order-container { padding: 24px; background-color: var(--el-bg-color-page); min-height: 100%; display: flex; flex-direction: column; }
.table-card { border-radius: 8px; border: none; box-shadow: 0 4px 12px rgba(0,0,0,0.05); flex: 1; display: flex; flex-direction: column; }
.table-card :deep(.el-card__body) { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.pagination-container { margin-top: 24px; display: flex; justify-content: flex-end; }

/* 商品简述样式 */
.item-summary { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.item-summary:last-child { margin-bottom: 0; }
.item-name { font-size: 13px; color: var(--el-text-color-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 160px; }
.item-spec { font-size: 11px; border-radius: 4px; }
.item-qty { font-size: 12px; color: var(--el-text-color-secondary); font-weight: 500; }

/* 现代详情样式 */
.modern-dialog :deep(.el-dialog__body) { padding: 0; }
.order-detail-container { padding: 24px; background-color: var(--el-bg-color); }

/* 头部概览 */
.detail-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; background-color: var(--el-fill-color-light); border-radius: 12px; margin-bottom: 24px; border: 1px solid var(--el-border-color-light); }
.header-main { display: flex; align-items: center; gap: 12px; }
.order-no { font-size: 18px; font-weight: 600; color: var(--el-text-color-primary); }
.type-tag { border-radius: 4px; }

/* 卡片式区块 */
.section-card { background: var(--el-bg-color); border: 1px solid var(--el-border-color-lighter); border-radius: 12px; padding: 20px; margin-bottom: 24px; transition: all 0.3s ease; }
.section-card:hover { border-color: var(--el-color-primary-light-5); box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
.card-title { font-size: 15px; font-weight: 600; color: var(--el-text-color-primary); margin-bottom: 16px; display: flex; align-items: center; }
.card-title::before { content: ''; width: 4px; height: 16px; background-color: var(--el-color-primary); border-radius: 2px; margin-right: 8px; }

/* 状态进度 */
.status-section { padding: 30px 20px; background: linear-gradient(to right, var(--el-fill-color-blank), var(--el-fill-color-light)); }

/* 详情列表定制 */
.clean-descriptions :deep(.el-descriptions__label) { color: var(--el-text-color-secondary); font-weight: normal; width: 100px; }
.clean-descriptions :deep(.el-descriptions__content) { color: var(--el-text-color-primary); }
.bold-text { font-weight: 600; color: var(--el-text-color-primary); }
.text-secondary { color: var(--el-text-color-regular); font-size: 13px; line-height: 1.6; }
.remark-text { color: var(--el-color-warning); font-style: italic; }
.price-large { font-size: 20px; font-weight: bold; color: var(--el-color-danger); font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }

/* 商品表格 */
.goods-section { padding: 0; overflow: hidden; }
.goods-section .card-title { padding: 20px 20px 0; }
.modern-table { border: none !important; margin-top: 12px; }
.modern-table :deep(th.el-table__cell) { background-color: var(--el-fill-color-light); font-weight: 600; }
.goods-info { display: flex; align-items: center; gap: 12px; padding: 4px 0; }
.goods-img { width: 56px; height: 56px; border-radius: 8px; flex-shrink: 0; box-shadow: 0 2px 6px rgba(0,0,0,0.05); }
.goods-detail { flex: 1; }
.goods-name { font-size: 14px; font-weight: 500; color: var(--el-text-color-primary); margin-bottom: 4px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.goods-spec { font-size: 12px; color: var(--el-text-color-secondary); }
.subtotal-bold { font-weight: 600; color: var(--el-text-color-primary); }

/* 结算卡片 */
.summary-card { background-color: var(--el-fill-color-light); border-radius: 12px; padding: 24px; display: flex; flex-direction: column; align-items: flex-end; gap: 12px; border: 1px solid var(--el-border-color-light); }
.summary-line { display: flex; justify-content: space-between; width: 240px; font-size: 14px; color: var(--el-text-color-regular); }
.summary-line.total { margin-top: 4px; align-items: baseline; }
.summary-line.total span:first-child { font-size: 16px; font-weight: 600; color: var(--el-text-color-primary); }
.total-price { font-size: 26px; font-weight: bold; color: var(--el-color-danger); }
.summary-card :deep(.el-divider--horizontal) { margin: 12px 0; border-top-color: var(--el-border-color); }
</style>
