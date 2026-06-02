<template>
  <div class="address-container">
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <div class="left">
            <el-input
              v-model="queryParams.consignee"
              placeholder="搜索收货人"
              style="width: 200px"
              clearable
              @clear="handleSearch"
              @keyup.enter="handleSearch"
            />
            <el-button type="primary" style="margin-left: 12px" @click="handleSearch">查询</el-button>
          </div>
        </div>
      </template>

      <el-table 
        v-loading="loading" 
        :data="addressList" 
        border 
        stripe 
        height="calc(100vh - 240px)"
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="consignee" label="收货人" width="120" align="center" />
        <el-table-column prop="phone" label="联系电话" width="150" align="center" />
        <el-table-column prop="address" label="详细地址" min-width="250" show-overflow-tooltip />
        <el-table-column label="状态" width="120" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.is_default ? 'success' : 'info'">
              {{ scope.row.is_default ? '默认' : '普通' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180" align="center">
          <template #default="scope">
            {{ formatTime(scope.row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" align="center" fixed="right">
          <template #default="scope">
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
          @size-change="fetchAddresses"
          @current-change="fetchAddresses"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getAddressList, deleteAddress } from '../../api/address'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'

const addressList = ref([])
const total = ref(0)
const loading = ref(false)

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  consignee: ''
})

const fetchAddresses = async () => {
  loading.value = true
  try {
    const res = await getAddressList(queryParams)
    addressList.value = res.result.list
    total.value = res.result.total
  } catch (error) {
    console.error('获取地址列表失败:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  queryParams.pageNum = 1
  fetchAddresses()
}

const formatTime = (time) => dayjs(time).format('YYYY-MM-DD HH:mm')

const handleDelete = (row) => {
  ElMessageBox.confirm('确定要删除该收货地址吗？', '警告', { type: 'warning' }).then(async () => {
    await deleteAddress(row.id)
    ElMessage.success('删除成功')
    fetchAddresses()
  })
}

onMounted(fetchAddresses)
</script>

<style scoped>
.address-container { padding: 24px; background-color: var(--el-bg-color-page); min-height: 100%; display: flex; flex-direction: column; }
.table-card { border-radius: 8px; border: none; box-shadow: 0 4px 12px rgba(0,0,0,0.05); flex: 1; display: flex; flex-direction: column; }
.table-card :deep(.el-card__body) { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.pagination-container { margin-top: 24px; display: flex; justify-content: flex-end; }
</style>
