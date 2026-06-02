<template>
  <div class="goods-container">
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <div class="left">
            <el-input
              v-model="queryParams.name"
              placeholder="搜索商品名称"
              style="width: 200px"
              clearable
              @clear="handleSearch"
              @keyup.enter="handleSearch"
            >
              <template #prefix><el-icon><Search /></el-icon></template>
            </el-input>
            
            <el-select v-model="queryParams.stockFilter" placeholder="库存状态" style="width: 120px; margin-left: 12px" clearable @change="handleSearch">
              <el-option label="库存紧张" value="low" />
              <el-option label="有货" value="in_stock" />
              <el-option label="缺货" value="out_of_stock" />
            </el-select>

                        <el-select v-model="queryParams.storeId" placeholder="所属门店" style="width: 150px; margin-left: 12px" clearable @change="handleSearch">
              <el-option
                v-for="item in storeOptions"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-select>

            <el-select v-model="queryParams.categoryId" placeholder="商品分类" style="width: 150px; margin-left: 12px" clearable @change="handleSearch">
              <el-option 
                v-for="item in categoryOptions" 
                :key="item.id" 
                :label="item.category_name" 
                :value="item.id" 
              />
            </el-select>

            <el-select v-model="queryParams.status" placeholder="商品状态" style="width: 120px; margin-left: 12px" clearable @change="handleSearch">
              <el-option label="上架中" :value="1" />
              <el-option label="已下架" :value="0" />
            </el-select>

            <el-button type="primary" style="margin-left: 12px" @click="handleSearch">查询</el-button>
          </div>
          <div class="right">
            <el-button 
              v-if="selectedIds.length > 0"
              type="success"
              icon="Check"
              plain
              @click="handleBatchStatusChange(1)"
            >
              批量上架
            </el-button>
            <el-button 
              v-if="selectedIds.length > 0"
              type="danger"
              icon="Delete"
              plain
              @click="handleBatchStatusChange(0)"
            >
              批量下架
            </el-button>
            <el-button 
              v-if="userStore.buttons.includes('goods:add_btn')" 
              type="primary" 
              icon="Plus" 
              @click="$router.push('/goods_manage/add')"
            >
              添加商品
            </el-button>
          </div>
        </div>
      </template>

      <el-table 
        v-loading="loading" 
        :data="goodsList" 
        border 
        stripe 
        height="calc(100vh - 280px)"
        style="width: 100%"
        @sort-change="handleSortChange"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column prop="id" label="ID" width="80" align="center" sortable="custom" />
        <el-table-column label="商品图片" width="120" align="center">
          <template #default="scope">
            <el-image
              :src="formatImageUrl(scope.row.goods_img)"
              style="width: 60px; height: 60px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1)"
              fit="cover"
              :preview-src-list="[formatImageUrl(scope.row.goods_img)]"
              preview-teleported
            />
          </template>
        </el-table-column>
        <el-table-column prop="goods_name" label="商品名称" min-width="200" show-overflow-tooltip />
        <el-table-column prop="goods_detail" label="商品详情" min-width="200" show-overflow-tooltip>
          <template #default="scope">
            {{ scope.row.goods_detail || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="商品分类" width="150" align="center">
          <template #default="scope">
            <el-tag 
              v-for="cat in scope.row.categories" 
              :key="cat.id" 
              size="small" 
              style="margin: 2px"
            >
              {{ cat.category_name }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="goods_price" label="售价" width="140" align="center" sortable="custom">
          <template #default="scope">
            <span class="price-tag">¥ {{ Number(scope.row.goods_price).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="goods_num" label="库存" width="120" align="center" sortable="custom">
          <template #default="scope">
            <el-tag :type="scope.row.goods_num < 10 ? 'danger' : 'success'" effect="light">
              {{ scope.row.goods_num }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="scope">
            <el-switch
              v-model="scope.row.status"
              :active-value="1"
              :inactive-value="0"
              :before-change="() => handleBeforeStatusChange(scope.row)"
              @change="() => {}"
            />
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="上架时间" width="180" align="center" sortable="custom">
          <template #default="scope">
            {{ formatTime(scope.row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" align="center" fixed="right">
          <template #default="scope">
            <el-button size="small" type="primary" link icon="View" @click="handleViewDetail(scope.row)">详情</el-button>
            <el-button v-if="userStore.buttons.includes('goods:edit_btn')" size="small" type="primary" link icon="Edit" @click="handleEdit(scope.row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="queryParams.pageNum"
          v-model:page-size="queryParams.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="fetchGoods"
          @current-change="fetchGoods"
        />
      </div>
    </el-card>

    <!-- 商品详情对话框 -->
    <el-dialog
      v-model="detailVisible"
      title="商品详情"
      width="700px"
      destroy-on-close
    >
      <div v-if="detailLoading" v-loading="true" style="height: 300px"></div>
      <div v-else-if="goodsDetail" class="detail-content">
        <div class="detail-header">
          <el-image
            :src="formatImageUrl(goodsDetail.goods_img)"
            style="width: 120px; height: 120px; border-radius: 8px"
            fit="cover"
            :preview-src-list="[formatImageUrl(goodsDetail.goods_img)]"
          />
          <div class="header-info">
            <h3>{{ goodsDetail.goods_name }}</h3>
            <div class="tags">
              <el-tag 
                v-for="cat in goodsDetail.categories" 
                :key="cat.id" 
                size="small"
              >
                {{ cat.category_name }}
              </el-tag>
            </div>
            <p class="price">¥ {{ Number(goodsDetail.goods_price).toFixed(2) }}</p>
          </div>
        </div>

        <el-descriptions :column="2" border style="margin-top: 20px">
          <el-descriptions-item label="商品ID">{{ goodsDetail.id }}</el-descriptions-item>
          <el-descriptions-item label="所属门店">{{ goodsDetail.store?.name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="当前库存">
            <el-tag :type="goodsDetail.goods_num < 10 ? 'danger' : 'success'">
              {{ goodsDetail.goods_num }} 件
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="商品状态">
            <el-tag :type="goodsDetail.status === 1 ? 'success' : 'info'">
              {{ goodsDetail.status === 1 ? '上架中' : '已下架' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatTime(goodsDetail.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ formatTime(goodsDetail.updatedAt) }}</el-descriptions-item>
        </el-descriptions>

        <div v-if="goodsDetail.spec_groups && goodsDetail.spec_groups.length > 0" class="spec-detail">
          <h4 class="section-title">规格参数</h4>
          <div v-for="group in goodsDetail.spec_groups" :key="group.id" class="spec-group">
            <span class="group-name">{{ group.name }}:</span>
            <div class="group-options">
              <el-tag 
                v-for="opt in group.spec_options" 
                :key="opt.id" 
                size="small" 
                effect="plain"
                type="info"
              >
                {{ opt.name }} <span v-if="opt.price_delta > 0">(+¥{{ opt.price_delta }})</span>
              </el-tag>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
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

const handleBatchStatusChange = (status) => {
  const isOff = status === 0
  const actionText = isOff ? '下架' : '上架'
  ElMessageBox.confirm(`确定要批量${actionText}选中的 ${selectedIds.value.length} 个商品吗？`, '提示', {
    type: isOff ? 'warning' : 'info'
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
    
    // 如果不是超级管理员，且没有手动选择门店，则默认过滤当前用户所属的门店
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

const handleSortChange = ({ prop, order }) => {
  queryParams.sortField = prop || 'id'
  queryParams.sortOrder = order === 'ascending' ? 'ASC' : 'DESC'
  fetchGoods()
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

const handleStatusChange = (row) => {
  const isOff = row.status === 1
  const actionText = isOff ? '下架' : '上架'
  ElMessageBox.confirm(`确定要${actionText}该商品吗？`, '提示', {
    type: isOff ? 'warning' : 'info'
  }).then(async () => {
    try {
      if (isOff) {
        await deleteGoods(row.id)
      } else {
        await restoreGoods(row.id)
      }
      ElMessage.success(`商品${actionText}成功`)
      fetchGoods()
    } catch (error) {
      console.error(`${actionText}失败:`, error)
    }
  })
}

const handleDelete = (row) => {
  ElMessageBox.confirm('确定要下架该商品吗？', '警告', { type: 'warning' }).then(async () => {
    await deleteGoods(row.id)
    ElMessage.success('商品下架成功')
    fetchGoods()
  })
}

const formatTime = (time) => dayjs(time).format('YYYY-MM-DD HH:mm')

onMounted(() => {
  fetchGoods()
  fetchCategories();
  fetchStores()
})
</script>

<style scoped>
.goods-container { padding: 24px; background-color: var(--el-bg-color-page); min-height: 100%; display: flex; flex-direction: column; }
.table-card { border-radius: 8px; border: none; box-shadow: 0 4px 12px rgba(0,0,0,0.05); flex: 1; display: flex; flex-direction: column; }
.table-card :deep(.el-card__body) { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.price-tag { color: var(--el-color-danger); font-weight: 700; font-size: 15px; }
.pagination-container { margin-top: 24px; display: flex; justify-content: flex-end; }
:deep(.el-table__row) { height: 80px; }

/* 详情样式 */
.detail-content { padding: 10px 0; }
.detail-header { display: flex; gap: 20px; align-items: flex-start; margin-bottom: 20px; }
.header-info h3 { margin: 0 0 10px 0; font-size: 20px; }
.header-info .tags { margin-bottom: 10px; display: flex; gap: 5px; flex-wrap: wrap; }
.header-info .price { font-size: 24px; color: var(--el-color-danger); font-weight: bold; margin: 0; }
.section-title { margin: 20px 0 10px 0; padding-bottom: 5px; border-bottom: 1px solid var(--el-border-color-lighter); }
.spec-group { margin-bottom: 10px; display: flex; align-items: center; gap: 10px; }
.group-name { font-weight: bold; min-width: 60px; }
.group-options { display: flex; gap: 8px; flex-wrap: wrap; }
</style>
