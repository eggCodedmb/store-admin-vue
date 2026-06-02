<template>
  <div class="menu-container">
    <!-- 顶部统计 -->
    <div class="stat-cards">
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
          <el-icon size="24"><Operation /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ totalCount }}</span>
          <span class="stat-label">权限总数</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #00b894 0%, #00cec9 100%)">
          <el-icon size="24"><Menu /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ menuCount }}</span>
          <span class="stat-label">菜单</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #fdcb6e 0%, #e17055 100%)">
          <el-icon size="24"><Operation /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ buttonCount }}</span>
          <span class="stat-label">按钮</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #a29bfe 0%, #6c5ce7 100%)">
          <el-icon size="24"><Connection /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ apiCount }}</span>
          <span class="stat-label">接口</span>
        </div>
      </div>
    </div>

    <!-- 主卡片 -->
    <el-card class="table-card" shadow="never">
      <div class="toolbar">
        <el-input
          v-model="searchKey"
          placeholder="搜索名称 / 权限编码"
          prefix-icon="Search"
          clearable
          class="search-input"
        />
        <div class="toolbar-actions">
          <el-button :icon="isExpandAll ? 'FolderOpened' : 'Folder'" @click="toggleExpand">
            {{ isExpandAll ? '全部折叠' : '全部展开' }}
          </el-button>
          <el-button type="primary" round icon="Plus" @click="handleCreate(0)">新增根节点</el-button>
        </div>
      </div>

      <el-table
        v-loading="loading"
        :data="filteredTree"
        row-key="id"
        :default-expand-all="isExpandAll"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        :header-cell-style="{ background: 'var(--el-fill-color-lighter)', color: 'var(--el-text-color-primary)', fontWeight: 600, fontSize: '13px' }"
        :row-style="{ height: '56px' }"
        class="menu-table"
        height="calc(100vh - 420px)"
        style="width: 100%"
      >
        <el-table-column prop="name" label="名称" min-width="200">
          <template #default="{ row }">
            <div class="name-cell">
              <el-icon v-if="row.type === 1" class="name-icon" color="var(--el-color-primary)"><Menu /></el-icon>
              <el-icon v-else-if="row.type === 2" class="name-icon" color="var(--el-color-success)"><Operation /></el-icon>
              <el-icon v-else class="name-icon" color="var(--el-color-warning)"><Connection /></el-icon>
              <span class="name-text">{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="code" label="权限编码" min-width="180">
          <template #default="{ row }">
            <code class="code-text">{{ row.code }}</code>
          </template>
        </el-table-column>

        <el-table-column prop="type" label="类型" width="110" align="center">
          <template #default="{ row }">
            <el-tag
              :type="row.type === 1 ? 'primary' : row.type === 2 ? 'success' : 'warning'"
              effect="dark"
              round
              size="small"
            >
              {{ row.type === 1 ? '菜单' : row.type === 2 ? '按钮' : '接口' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="path" label="路径" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.path" class="path-text">{{ row.path }}</span>
            <span v-else class="empty-text">-</span>
          </template>
        </el-table-column>

        <el-table-column prop="method" label="方法" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.method" effect="plain" round size="small" class="method-tag">
              {{ row.method }}
            </el-tag>
            <span v-else class="empty-text">-</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.type === 1"
              type="primary"
              text
              size="small"
              icon="Plus"
              @click="handleCreate(row.id)"
            >
              子节点
            </el-button>
            <el-button type="primary" text size="small" icon="Edit" @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" text size="small" icon="Delete" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/修改弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'create' ? '新增权限' : '编辑权限'"
      width="560px"
      class="modern-dialog"
      destroy-on-close
    >
      <el-form ref="menuFormRef" :model="menuForm" :rules="rules" label-width="90px" class="dialog-form">
        <el-form-item label="上级节点">
          <el-input :model-value="menuForm.parent_id === 0 ? '根节点' : `#${menuForm.parent_id}`" disabled prefix-icon="Folder" />
        </el-form-item>
        <el-form-item label="名称" prop="name">
          <el-input v-model="menuForm.name" placeholder="请输入名称" prefix-icon="EditPen" />
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-segmented
            v-model="menuForm.type"
            :options="typeOptions"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="权限编码" prop="code">
          <el-input v-model="menuForm.code" placeholder="菜单路径或按钮标识" prefix-icon="Key" />
        </el-form-item>
        <template v-if="menuForm.type === 3">
          <el-form-item label="接口路径" prop="path">
            <el-input v-model="menuForm.path" placeholder="如 /goods、/rbac/role" prefix-icon="Link" />
          </el-form-item>
          <el-form-item label="请求方法" prop="method">
            <el-segmented
              v-model="menuForm.method"
              :options="methodOptions"
              style="width: 100%"
            />
          </el-form-item>
        </template>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false" round>取 消</el-button>
          <el-button type="primary" :loading="submitting" round @click="submitForm">
            {{ dialogType === 'create' ? '立即创建' : '保存修改' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getPermissionList, createPermission, updatePermission, deletePermission } from '../../../api/rbac'

const loading = ref(false)
const menuTree = ref([])
const flatList = ref([])
const dialogVisible = ref(false)
const dialogType = ref('create')
const submitting = ref(false)
const menuFormRef = ref(null)
const searchKey = ref('')
const isExpandAll = ref(true)

const menuForm = ref({ id: null, parent_id: 0, name: '', code: '', type: 1, path: '', method: '' })

const typeOptions = [
  { label: '菜单', value: 1 },
  { label: '按钮', value: 2 },
  { label: '接口', value: 3 }
]
const methodOptions = [
  { label: 'GET', value: 'GET' },
  { label: 'POST', value: 'POST' },
  { label: 'PUT', value: 'PUT' },
  { label: 'PATCH', value: 'PATCH' },
  { label: 'DELETE', value: 'DELETE' }
]

const rules = {
  name: [{ required: true, message: '名称不能为空', trigger: 'blur' }],
  code: [{ required: true, message: '权限编码不能为空', trigger: 'blur' }]
}

// 统计
const totalCount = computed(() => flatList.value.length)
const menuCount = computed(() => flatList.value.filter(i => i.type === 1).length)
const buttonCount = computed(() => flatList.value.filter(i => i.type === 2).length)
const apiCount = computed(() => flatList.value.filter(i => i.type === 3).length)

// 搜索过滤（保留匹配节点及其祖先路径）
const filteredTree = computed(() => {
  if (!searchKey.value) return menuTree.value
  const key = searchKey.value.toLowerCase()
  const matchIds = new Set()
  flatList.value.forEach(item => {
    if (
      (item.name && item.name.toLowerCase().includes(key)) ||
      (item.code && item.code.toLowerCase().includes(key))
    ) {
      matchIds.add(item.id)
      // 向上标记所有祖先
      let pid = item.parent_id
      while (pid && pid !== 0) {
        matchIds.add(pid)
        const parent = flatList.value.find(f => f.id === pid)
        pid = parent ? parent.parent_id : 0
      }
    }
  })
  return filterTree(menuTree.value, matchIds)
})

const filterTree = (nodes, ids) => {
  return nodes
    .filter(n => ids.has(n.id))
    .map(n => ({
      ...n,
      children: n.children ? filterTree(n.children, ids) : []
    }))
}

const toggleExpand = () => {
  // 通过重新设置数据来触发展开/折叠
  isExpandAll.value = !isExpandAll.value
  const data = menuTree.value
  menuTree.value = []
  setTimeout(() => { menuTree.value = data }, 0)
}

const fetchMenus = async () => {
  loading.value = true
  try {
    const res = await getPermissionList()
    flatList.value = res.result || []
    menuTree.value = buildTree(flatList.value)
  } finally {
    loading.value = false
  }
}

const buildTree = (list) => {
  const map = {}
  const result = []
  list.forEach(item => map[item.id] = { ...item, children: [] })
  list.forEach(item => {
    const parent = map[item.parent_id]
    if (parent) parent.children.push(map[item.id])
    else result.push(map[item.id])
  })
  return result
}

const handleCreate = (parentId) => {
  dialogType.value = 'create'
  menuForm.value = { id: null, parent_id: parentId, name: '', code: '', type: 1, path: '', method: '' }
  dialogVisible.value = true
}

const handleEdit = (row) => {
  dialogType.value = 'edit'
  menuForm.value = { ...row }
  dialogVisible.value = true
}

const submitForm = async () => {
  await menuFormRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        if (dialogType.value === 'create') {
          await createPermission(menuForm.value)
          ElMessage.success('创建成功')
        } else {
          await updatePermission(menuForm.value.id, menuForm.value)
          ElMessage.success('修改成功')
        }
        dialogVisible.value = false
        fetchMenus()
      } finally {
        submitting.value = false
      }
    }
  })
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除「${row.name}」吗？如有子节点将一并删除。`, '确认删除', {
    confirmButtonText: '确认删除',
    cancelButtonText: '取消',
    type: 'warning',
    confirmButtonClass: 'el-button--danger'
  }).then(async () => {
    await deletePermission(row.id)
    ElMessage.success('删除成功')
    fetchMenus()
  })
}

onMounted(fetchMenus)
</script>

<style scoped>
.menu-container {
  padding: 20px;
  background-color: var(--el-bg-color-page);
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ---- 统计 ---- */
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
}
.toolbar-actions {
  display: flex;
  gap: 10px;
}
.search-input {
  max-width: 280px;
}
.search-input :deep(.el-input__wrapper) {
  border-radius: 8px;
}

/* ---- 表格 ---- */
.menu-table {
  flex: 1;
  border-radius: 8px;
  overflow: hidden;
}
.menu-table :deep(.el-table__inner-wrapper::before) {
  display: none;
}
.menu-table :deep(.el-table__header th) {
  border-bottom: none !important;
}
.menu-table :deep(.el-table__row:hover > td) {
  background-color: var(--el-fill-color-lighter) !important;
}

/* ---- 名称单元格 ---- */
.name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}
.name-icon {
  flex-shrink: 0;
}
.name-text {
  font-weight: 500;
  color: var(--el-text-color-primary);
}

/* ---- 代码/路径 ---- */
.code-text {
  font-family: 'SF Mono', 'Menlo', monospace;
  font-size: 12px;
  background: var(--el-fill-color-lighter);
  padding: 2px 8px;
  border-radius: 4px;
  color: var(--el-color-primary);
}
.path-text {
  font-family: 'SF Mono', 'Menlo', monospace;
  font-size: 12px;
  color: var(--el-text-color-regular);
}
.method-tag {
  font-family: 'SF Mono', 'Menlo', monospace;
  font-weight: 600;
  font-size: 11px;
}
.empty-text {
  color: var(--el-text-color-placeholder);
  font-size: 13px;
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
.dialog-form :deep(.el-input__wrapper) {
  border-radius: 8px;
}
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* ---- 暗色模式 ---- */
.dark .stat-card {
  background: var(--el-bg-color-overlay);
}
</style>
