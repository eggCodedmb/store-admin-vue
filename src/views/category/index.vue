<template>
  <div class="category-container">
    <!-- 顶部操作栏 -->
    <div class="action-bar">
      <div class="search-box">
        <el-input
          v-model="searchQuery"
          placeholder="搜索分类名称..."
          prefix-icon="Search"
          clearable
          class="search-input"
        />
      </div>
      <el-button type="primary" icon="Plus" size="large" @click="handleCreate">
        新增分类
      </el-button>
    </div>

    <!-- 卡片列表容器 -->
    <el-scrollbar v-loading="loading">
      <draggable
        v-if="filteredCategories.length > 0"
        v-model="categoryList"
        class="category-grid"
        item-key="id"
        handle=".category-icon"
        @end="handleDragEnd"
        :animation="300"
      >
        <template #item="{ element: item }">
          <el-card
            class="category-card"
            shadow="hover"
          >
            <div class="card-content">
              <div class="category-icon" style="cursor: move;">
                <el-icon :size="32"><CollectionTag /></el-icon>
              </div>
              <div class="category-info">
                <div class="category-name">{{ item.category_name }}</div>
                <div class="category-meta">
                  <el-tag size="small" type="info" effect="light">
                    排序: {{ item.order_num }}
                  </el-tag>
                  <span class="create-time">{{ formatTime(item.createdAt) }}</span>
                </div>
              </div>
            </div>
            <div class="card-actions">
              <el-tooltip content="编辑" placement="top">
                <el-button
                  type="primary"
                  circle
                  icon="Edit"
                  @click="handleEdit(item)"
                />
              </el-tooltip>
              <el-tooltip content="删除" placement="top">
                <el-button
                  type="danger"
                  circle
                  icon="Delete"
                  @click="handleDelete(item)"
                />
              </el-tooltip>
            </div>
          </el-card>
        </template>
      </draggable>
      
      <!-- 无数据展示 -->
      <el-empty
        v-else
        description="暂无分类数据"
        :image-size="200"
        class="empty-state"
      />
    </el-scrollbar>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'create' ? '新增分类' : '编辑分类'"
      width="460px"
      destroy-on-close
      class="category-dialog"
    >
      <el-form
        ref="categoryFormRef"
        :model="categoryForm"
        :rules="rules"
        label-position="top"
        style="padding: 0 10px"
      >
        <el-form-item label="分类名称" prop="category_name">
          <el-input
            v-model="categoryForm.category_name"
            placeholder="例如：生鲜蔬菜、数码配件"
            maxlength="20"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="显示排序" prop="order_num">
          <el-input-number
            v-model="categoryForm.order_num"
            :min="0"
            controls-position="right"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="submitForm">
            确定
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import draggable from 'vuedraggable'
import { getCategoryList, createCategory, updateCategory, deleteCategory } from '../../api/category'
import dayjs from 'dayjs'

const categoryList = ref([])
const loading = ref(false)
const searchQuery = ref('')
const dialogVisible = ref(false)
const dialogType = ref('create')
const submitting = ref(false)
const categoryFormRef = ref(null)

const categoryForm = reactive({
  id: null,
  category_name: '',
  order_num: 0
})

const rules = {
  category_name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  order_num: [
    { required: true, message: '请输入排序号', trigger: 'blur' }
  ]
}

// 过滤后的分类列表
const filteredCategories = computed(() => {
  if (!searchQuery.value) return categoryList.value
  return categoryList.value.filter(item => 
    item.category_name.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

const fetchCategories = async () => {
  loading.value = true
  try {
    const res = await getCategoryList()
    categoryList.value = res.result || []
  } catch (error) {
    console.error('获取分类失败:', error)
  } finally {
    loading.value = false
  }
}

const handleDragEnd = async () => {
  loading.value = true
  try {
    // 根据新顺序更新所有受影响的 order_num
    const updatePromises = categoryList.value.map((item, index) => {
      const newOrder = index + 1 // 或者其他排序逻辑
      if (item.order_num !== newOrder) {
        return updateCategory(item.id, { 
          category_name: item.category_name,
          order_num: newOrder 
        })
      }
      return null
    }).filter(p => p !== null)

    if (updatePromises.length > 0) {
      await Promise.all(updatePromises)
      ElMessage.success('排序已更新')
      await fetchCategories()
    }
  } catch (error) {
    ElMessage.error('更新排序失败')
    await fetchCategories()
  } finally {
    loading.value = false
  }
}

const handleCreate = () => {
  dialogType.value = 'create'
  categoryForm.id = null
  categoryForm.category_name = ''
  categoryForm.order_num = 0
  dialogVisible.value = true
}

const handleEdit = (row) => {
  dialogType.value = 'edit'
  categoryForm.id = row.id
  categoryForm.category_name = row.category_name
  categoryForm.order_num = row.order_num || 0
  dialogVisible.value = true
}

const submitForm = async () => {
  if (!categoryFormRef.value) return
  await categoryFormRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        const payload = { 
          category_name: categoryForm.category_name,
          order_num: categoryForm.order_num
        }
        if (dialogType.value === 'create') {
          await createCategory(payload)
          ElMessage.success('新增分类成功')
        } else {
          await updateCategory(categoryForm.id, payload)
          ElMessage.success('修改分类成功')
        }
        dialogVisible.value = false
        fetchCategories()
      } finally {
        submitting.value = false
      }
    }
  })
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除分类 "${row.category_name}" 吗？`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
    buttonSize: 'default'
  }).then(async () => {
    try {
      await deleteCategory(row.id)
      ElMessage.success('删除成功')
      fetchCategories()
    } catch (error) {
      console.error('删除失败:', error)
    }
  })
}

const formatTime = (time) => {
  if (!time) return ''
  return dayjs(time).format('YYYY-MM-DD')
}

onMounted(fetchCategories)
</script>

<style scoped>
.category-container {
  padding: 24px;
  background-color: var(--el-bg-color-page);
  min-height: calc(100vh - 60px);
  display: flex;
  flex-direction: column;
}

.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  background-color: var(--el-bg-color);
  padding: 16px 20px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.search-box {
  flex: 1;
  max-width: 400px;
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 8px;
  box-shadow: 0 0 0 1px var(--el-border-color) inset;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  padding-bottom: 20px;
}

.category-card {
  border-radius: 12px;
  border: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.category-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08);
}

.card-content {
  display: flex;
  align-items: center;
  padding: 8px 0;
}

.category-icon {
  width: 56px;
  height: 56px;
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  border-radius: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 16px;
  flex-shrink: 0;
}

.category-info {
  flex: 1;
  overflow: hidden;
}

.category-name {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.category-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.create-time {
  opacity: 0.8;
}

.card-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-lighter);
  justify-content: flex-end;
}

.empty-state {
  margin-top: 100px;
}

/* 弹窗样式优化 */
.category-dialog :deep(.el-dialog) {
  border-radius: 16px;
}

.category-dialog :deep(.el-dialog__header) {
  margin-right: 0;
  padding: 20px 24px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.category-dialog :deep(.el-dialog__title) {
  font-weight: 600;
}

.category-dialog :deep(.el-dialog__body) {
  padding: 24px;
}

.category-dialog :deep(.el-form-item__label) {
  font-weight: 500;
  margin-bottom: 8px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 响应式调整 */
@media screen and (max-width: 480px) {
  .category-grid {
    grid-template-columns: 1fr;
  }
  
  .action-bar {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .search-box {
    max-width: none;
  }
}
</style>
