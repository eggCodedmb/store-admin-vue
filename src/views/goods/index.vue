<template>
  <div class="goods-container">
    <!-- 顶部统计卡片 -->
    <div class="stat-cards">
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
          <el-icon size="24"><Goods /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ total }}</span>
          <span class="stat-label">商品总数</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #00b894 0%, #00cec9 100%)">
          <el-icon size="24"><CircleCheck /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ onShelfCount }}</span>
          <span class="stat-label">上架中</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #fdcb6e 0%, #e17055 100%)">
          <el-icon size="24"><WarningFilled /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ lowStockCount }}</span>
          <span class="stat-label">库存紧张</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)">
          <el-icon size="24"><SoldOut /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ outOfStockCount }}</span>
          <span class="stat-label">已缺货</span>
        </div>
      </div>
    </div>

    <!-- 主表格卡片 -->
    <el-card class="table-card" shadow="never">
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <el-input
            v-model="queryParams.name"
            placeholder="搜索商品名称"
            prefix-icon="Search"
            clearable
            class="search-input"
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          />
          <el-select v-model="queryParams.storeId" placeholder="所属门店" clearable @change="handleSearch" class="filter-select">
            <el-option v-for="item in storeOptions" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
          <el-select v-model="queryParams.categoryId" placeholder="商品分类" clearable @change="handleSearch" class="filter-select">
            <el-option v-for="item in categoryOptions" :key="item.id" :label="item.category_name" :value="item.id" />
          </el-select>
          <el-select v-model="queryParams.stockFilter" placeholder="库存状态" clearable @change="handleSearch" class="filter-select filter-sm">
            <el-option label="库存紧张" value="low" />
            <el-option label="有货" value="in_stock" />
            <el-option label="缺货" value="out_of_stock" />
          </el-select>
          <el-select v-model="queryParams.status" placeholder="商品状态" clearable @change="handleSearch" class="filter-select filter-sm">
            <el-option label="上架中" :value="1" />
            <el-option label="已下架" :value="0" />
          </el-select>
        </div>
        <div class="toolbar-right">
          <template v-if="selectedIds.length > 0">
            <el-button type="success" plain round icon="Check" @click="handleBatchStatusChange(1)">
              批量上架 ({{ selectedIds.length }})
            </el-button>
            <el-button type="danger" plain round icon="Delete" @click="handleBatchStatusChange(0)">
              批量下架
            </el-button>
          </template>
          <el-button
            v-if="userStore.buttons.includes('goods:add_btn')"
            type="primary"
            round
            icon="Plus"
            @click="$router.push('/goods_manage/add')"
          >
            添加商品
          </el-button>
        </div>
      </div>

      <!-- 表格 -->
      <el-table
        v-loading="loading"
        :data="goodsList"
        :header-cell-style="{ background: 'var(--el-fill-color-lighter)', color: 'var(--el-text-color-primary)', fontWeight: 600, fontSize: '13px' }"
        :row-style="{ height: '80px' }"
        class="goods-table"
        height="calc(100vh - 480px)"
        style="width: 100%"
        @sort-change="handleSortChange"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" align="center" />

        <el-table-column label="商品信息" min-width="280">
          <template #default="{ row }">
            <div class="goods-cell">
              <el-image
                :src="formatImageUrl(row.goods_img)"
                class="goods-img"
                fit="cover"
                :preview-src-list="[formatImageUrl(row.goods_img)]"
                preview-teleported
              >
                <template #error>
                  <div class="img-placeholder">
                    <el-icon size="20"><Picture /></el-icon>
                  </div>
                </template>
              </el-image>
              <div class="goods-detail">
                <span class="goods-name">{{ row.goods_name }}</span>
                <span class="goods-desc">{{ row.goods_detail || '暂无详情' }}</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="分类" min-width="160">
          <template #default="{ row }">
            <template v-if="row.categories && row.categories.length > 0">
              <el-tag
                v-for="cat in row.categories"
                :key="cat.id"
                class="cat-tag"
                effect="plain"
                round
                size="small"
              >
                {{ cat.category_name }}
              </el-tag>
            </template>
            <span v-else class="empty-text">未分类</span>
          </template>
        </el-table-column>

        <el-table-column prop="goods_price" label="售价" width="130" align="center" sortable="custom">
          <template #default="{ row }">
            <span class="price-text">¥{{ Number(row.goods_price).toFixed(2) }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="goods_num" label="库存" width="110" align="center" sortable="custom">
          <template #default="{ row }">
            <div class="stock-cell">
              <el-tag
                :type="row.goods_num <= 0 ? 'danger' : row.goods_num < 10 ? 'warning' : 'success'"
                effect="dark"
                round
                size="small"
                class="stock-tag"
              >
                {{ row.goods_num <= 0 ? '缺货' : row.goods_num }}
              </el-tag>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              :active-value="1"
              :inactive-value="0"
              :before-change="() => handleBeforeStatusChange(row)"
              inline-prompt
              active-text="上"
              inactive-text="下"
              style="--el-switch-on-color: #00b894; --el-switch-off-color: #dfe6e9"
            />
          </template>
        </el-table-column>

        <el-table-column prop="createdAt" label="上架时间" width="170" align="center" sortable="custom">
          <template #default="{ row }">
            <span class="time-text">{{ formatTime(row.createdAt) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="140" align="center" fixed="right">
          <template #default="{ row }">
            <el-dropdown trigger="click" @command="(cmd) => handleCommand(cmd, row)">
              <el-button class="action-btn" type="primary" plain round size="small">
                操作 <el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="detail" icon="View">查看详情</el-dropdown-item>
                  <el-dropdown-item
                    v-if="userStore.buttons.includes('goods:edit_btn')"
                    command="edit"
                    icon="Edit"
                  >编辑商品</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <span class="pagination-info">
          共 <b>{{ total }}</b> 条记录，已选 <b>{{ selectedIds.length }}</b> 项
        </span>
        <el-pagination
          v-model:current-page="queryParams.pageNum"
          v-model:page-size="queryParams.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="sizes, prev, pager, next"
          :total="total"
          background
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 商品详情弹窗 -->
    <el-dialog
      v-model="detailVisible"
      title="商品详情"
      width="720px"
      class="modern-dialog"
      destroy-on-close
    >
      <div v-if="detailLoading" v-loading="true" style="height: 300px"></div>
      <div v-else-if="goodsDetail" class="detail-content">
        <!-- 头部：图片 + 基础信息 -->
        <div class="detail-header">
          <el-image
            :src="formatImageUrl(goodsDetail.goods_img)"
            class="detail-img"
            fit="cover"
            :preview-src-list="[formatImageUrl(goodsDetail.goods_img)]"
          >
            <template #error>
              <div class="img-placeholder img-placeholder--lg">
                <el-icon size="32"><Picture /></el-icon>
              </div>
            </template>
          </el-image>
          <div class="detail-info">
            <h3 class="detail-name">{{ goodsDetail.goods_name }}</h3>
            <div class="detail-tags">
              <el-tag
                :type="goodsDetail.status === 1 ? 'success' : 'info'"
                effect="dark"
                round
                size="small"
              >
                {{ goodsDetail.status === 1 ? '上架中' : '已下架' }}
              </el-tag>
              <el-tag
                v-for="cat in goodsDetail.categories"
                :key="cat.id"
                effect="plain"
                round
                size="small"
              >
                {{ cat.category_name }}
              </el-tag>
            </div>
            <p class="detail-price">¥{{ Number(goodsDetail.goods_price).toFixed(2) }}</p>
          </div>
        </div>

        <!-- 基础信息网格 -->
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">商品 ID</span>
            <span class="info-value">#{{ goodsDetail.id }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">所属门店</span>
            <span class="info-value">{{ goodsDetail.store?.name || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">当前库存</span>
            <el-tag
              :type="goodsDetail.goods_num <= 0 ? 'danger' : goodsDetail.goods_num < 10 ? 'warning' : 'success'"
              effect="dark"
              round
              size="small"
            >
              {{ goodsDetail.goods_num }} 件
            </el-tag>
          </div>
          <div class="info-item">
            <span class="info-label">创建时间</span>
            <span class="info-value">{{ formatTime(goodsDetail.createdAt) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">更新时间</span>
            <span class="info-value">{{ formatTime(goodsDetail.updatedAt) }}</span>
          </div>
        </div>

        <!-- 规格参数 -->
        <div v-if="goodsDetail.spec_groups && goodsDetail.spec_groups.length > 0" class="spec-section">
          <h4 class="section-title">
            <el-icon><Operation /></el-icon>
            规格参数
          </h4>
          <div v-for="group in goodsDetail.spec_groups" :key="group.id" class="spec-group">
            <span class="spec-group-name">{{ group.name }}</span>
            <div class="spec-options">
              <span v-for="opt in group.spec_options" :key="opt.id" class="spec-option-chip">
                {{ opt.name }}
                <em v-if="opt.price_delta > 0" class="spec-delta">+¥{{ opt.price_delta }}</em>
              </span>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../../store/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getGoodsList, deleteGoods, getGoodsDetail, updateGoods, restoreGoods } from '../../api/goods'
import { getStoreList } from '../../api/store'
import { getCategoryList } from '../../api/category'
import { baseURL } from '../../utils/request'
import dayjs from 'dayjs'

const userStore = useUserStore()
const router = useRouter()
const goodsList = ref([])
const categoryOptions = ref([])
const storeOptions = ref([])
const total = ref(0)
const loading = ref(false)

// 详情相关
const detailVisible = ref(false)
const detailLoading = ref(false)
const goodsDetail = ref(null)

// 批量操作
const selectedIds = ref([])
const handleSelectionChange = (selection) => {
  selectedIds.value = selection.map(item => item.id)
}

// 统计数据（基于当前页）
const onShelfCount = computed(() => goodsList.value.filter(g => g.status === 1).length)
const lowStockCount = computed(() => goodsList.value.filter(g => g.status === 1 && g.goods_num > 0 && g.goods_num < 10).length)
const outOfStockCount = computed(() => goodsList.value.filter(g => g.goods_num <= 0).length)

const handleBatchStatusChange = (status) => {
  const isOff = status === 0
  const actionText = isOff ? '下架' : '上架'
  ElMessageBox.confirm(`确定要批量${actionText}选中的 ${selectedIds.value.length} 个商品吗？`, '提示', {
    type: isOff ? 'warning' : 'info',
    confirmButtonText: '确定',
    cancelButtonText: '取消'
  }).then(async () => {
    try {
      if (isOff) {
        await deleteGoods(selectedIds.value)
      } else {
        await restoreGoods(selectedIds.value)
      }
      ElMessage.success(`批量${actionText}成功`)
      selectedIds.value = []
      fetchGoods()
    } catch (error) {
      console.error(`批量${actionText}失败:`, error)
    }
  })
}

const formatImageUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return baseURL + url
}

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  name: '',
  stockFilter: '',
  status: '',
  categoryId: '',
  storeId: '',
  sortField: 'id',
  sortOrder: 'DESC'
})

const fetchGoods = async () => {
  loading.value = true
  try {
    const res = await getGoodsList(queryParams)
    goodsList.value = res.result.list
    total.value = res.result.total
  } catch (error) {
    console.error('获取商品列表失败:', error)
  } finally {
    loading.value = false
  }
}

const fetchStores = async () => {
  try {
    const res = await getStoreList({ pageNum: 1, pageSize: 1000 })
    storeOptions.value = res.result.list || []

    if (!userStore.roles.includes('admin') && !queryParams.storeId) {
      if (userStore.userInfo && userStore.userInfo.departments && userStore.userInfo.departments.length > 0) {
        queryParams.storeId = userStore.userInfo.departments.map(d => d.id).join(',')
        handleSearch()
      }
    }
  } catch (error) {
    console.error('获取门店列表失败:', error)
  }
}

const fetchCategories = async () => {
  try {
    const res = await getCategoryList()
    categoryOptions.value = res.result
  } catch (error) {
    console.error('获取分类列表失败:', error)
  }
}

const handleSearch = () => {
  queryParams.pageNum = 1
  fetchGoods()
}

const handleSizeChange = () => {
  queryParams.pageNum = 1
  fetchGoods()
}

const handleCurrentChange = () => {
  fetchGoods()
}

const handleSortChange = ({ prop, order }) => {
  queryParams.sortField = prop || 'id'
  queryParams.sortOrder = order === 'ascending' ? 'ASC' : 'DESC'
  fetchGoods()
}

const handleCommand = (cmd, row) => {
  if (cmd === 'detail') handleViewDetail(row)
  else if (cmd === 'edit') handleEdit(row)
}

const handleViewDetail = async (row) => {
  detailVisible.value = true
  detailLoading.value = true
  try {
    const res = await getGoodsDetail(row.id)
    goodsDetail.value = res.result
  } catch (error) {
    ElMessage.error('获取商品详情失败')
  } finally {
    detailLoading.value = false
  }
}

const handleEdit = (row) => {
  router.push(`/goods_manage/edit/${row.id}`)
}

const handleBeforeStatusChange = (row) => {
  const isOff = row.status === 1
  const actionText = isOff ? '下架' : '上架'
  return new Promise((resolve) => {
    ElMessageBox.confirm(`确定要${actionText}该商品吗？`, '提示', {
      type: isOff ? 'warning' : 'info',
      confirmButtonText: '确定',
      cancelButtonText: '取消',
    }).then(async () => {
      try {
        if (isOff) {
          await deleteGoods(row.id)
        } else {
          await restoreGoods(row.id)
        }
        ElMessage.success(`商品${actionText}成功`)
        resolve(true)
      } catch (error) {
        console.error(`${actionText}失败:`, error)
        resolve(false)
      }
    }).catch(() => {
      resolve(false)
    })
  })
}

const formatTime = (time) => dayjs(time).format('YYYY-MM-DD HH:mm')

onMounted(() => {
  fetchGoods()
  fetchCategories()
  fetchStores()
})
</script>

<style scoped>
.goods-container {
  padding: 20px;
  background-color: var(--el-bg-color-page);
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ---- 统计卡片 ---- */
.stat-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: var(--el-bg-color);
  border-radius: 12px;
  padding: 20px 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: box-shadow 0.3s;
}
.stat-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}
.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}
.stat-info {
  display: flex;
  flex-direction: column;
}
.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  line-height: 1.2;
}
.stat-label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
}

/* ---- 主卡片 ---- */
.table-card {
  flex: 1;
  border-radius: 12px;
  border: none;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.table-card :deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 20px;
}

/* ---- 工具栏 ---- */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.toolbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}
.search-input {
  width: 220px;
}
.search-input :deep(.el-input__wrapper) {
  border-radius: 8px;
}
.filter-select {
  width: 140px;
}
.filter-select :deep(.el-input__wrapper) {
  border-radius: 8px;
}
.filter-sm {
  width: 120px;
}

/* ---- 表格 ---- */
.goods-table {
  flex: 1;
  border-radius: 8px;
  overflow: hidden;
}
.goods-table :deep(.el-table__inner-wrapper::before) {
  display: none;
}
.goods-table :deep(.el-table__header th) {
  border-bottom: none !important;
}
.goods-table :deep(.el-table__row:hover > td) {
  background-color: var(--el-fill-color-lighter) !important;
}

/* ---- 商品信息单元格 ---- */
.goods-cell {
  display: flex;
  align-items: center;
  gap: 14px;
}
.goods-img {
  width: 64px;
  height: 64px;
  border-radius: 10px;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
.img-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-fill-color-lighter);
  border-radius: 10px;
  color: var(--el-text-color-placeholder);
}
.img-placeholder--lg {
  border-radius: 12px;
}
.goods-detail {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 4px;
}
.goods-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.goods-desc {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ---- 分类标签 ---- */
.cat-tag {
  margin-right: 6px;
  margin-bottom: 2px;
}

/* ---- 价格 ---- */
.price-text {
  font-size: 15px;
  font-weight: 700;
  color: var(--el-color-danger);
}

/* ---- 库存 ---- */
.stock-tag {
  min-width: 52px;
  text-align: center;
}

/* ---- 时间 ---- */
.time-text {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

/* ---- 空状态 ---- */
.empty-text {
  color: var(--el-text-color-placeholder);
  font-size: 13px;
}

/* ---- 操作 ---- */
.action-btn {
  font-weight: 500;
}

/* ---- 分页 ---- */
.pagination-container {
  margin-top: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.pagination-info {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.pagination-info b {
  color: var(--el-color-primary);
}

/* ---- 弹窗 ---- */
.modern-dialog :deep(.el-dialog) {
  border-radius: 16px;
}
.modern-dialog :deep(.el-dialog__header) {
  padding: 20px 24px 16px;
  margin-right: 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.modern-dialog :deep(.el-dialog__title) {
  font-size: 16px;
  font-weight: 600;
}
.modern-dialog :deep(.el-dialog__body) {
  padding: 24px;
}
.modern-dialog :deep(.el-dialog__footer) {
  padding: 16px 24px 20px;
  border-top: 1px solid var(--el-border-color-lighter);
}

/* ---- 详情弹窗 ---- */
.detail-content {
  padding: 4px 0;
}
.detail-header {
  display: flex;
  gap: 20px;
  align-items: flex-start;
  margin-bottom: 24px;
}
.detail-img {
  width: 120px;
  height: 120px;
  border-radius: 12px;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
.detail-info {
  flex: 1;
  min-width: 0;
}
.detail-name {
  margin: 0 0 10px;
  font-size: 20px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}
.detail-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}
.detail-price {
  font-size: 28px;
  font-weight: 700;
  color: var(--el-color-danger);
  margin: 0;
}

/* ---- 信息网格 ---- */
.info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  background: var(--el-fill-color-lighter);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
}
.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.info-label {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}
.info-value {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

/* ---- 规格参数 ---- */
.spec-section {
  margin-top: 4px;
}
.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0 0 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.spec-group {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 14px;
}
.spec-group-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-regular);
  min-width: 60px;
  padding-top: 4px;
}
.spec-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.spec-option-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  background: var(--el-fill-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 20px;
  font-size: 13px;
  color: var(--el-text-color-regular);
}
.spec-delta {
  font-style: normal;
  font-size: 12px;
  color: var(--el-color-danger);
  font-weight: 600;
}

/* ---- 暗色模式 ---- */
.dark .stat-card {
  background: var(--el-bg-color-overlay);
}
</style>
