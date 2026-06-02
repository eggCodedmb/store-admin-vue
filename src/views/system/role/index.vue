<template>
  <div class="role-container">
    <!-- 顶部统计 -->
    <div class="stat-cards">
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
          <el-icon size="24"><Avatar /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ roleList.length }}</span>
          <span class="stat-label">角色总数</span>
        </div>
      </div>
    </div>

    <!-- 主表格卡片 -->
    <el-card class="table-card" shadow="never">
      <div class="toolbar">
        <el-input
          v-model="searchKey"
          placeholder="搜索角色名称 / 权限字符"
          prefix-icon="Search"
          clearable
          class="search-input"
        />
        <el-button type="primary" round icon="Plus" @click="handleCreate">新增角色</el-button>
      </div>

      <el-table
        v-loading="loading"
        :data="filteredRoles"
        :header-cell-style="{ background: 'var(--el-fill-color-lighter)', color: 'var(--el-text-color-primary)', fontWeight: 600, fontSize: '13px' }"
        :row-style="{ height: '68px' }"
        class="role-table"
        height="calc(100vh - 400px)"
        style="width: 100%"
      >
        <el-table-column label="角色信息" min-width="220">
          <template #default="{ row }">
            <div class="role-cell">
              <div class="role-avatar" :style="{ background: getRoleColor(row.role_name) }">
                <el-icon size="18" color="#fff"><Avatar /></el-icon>
              </div>
              <div class="role-detail">
                <span class="role-name">{{ row.role_name }}</span>
                <span class="role-key">{{ row.role_key }}</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="remark" label="备注" min-width="200">
          <template #default="{ row }">
            <span v-if="row.remark" class="remark-text">{{ row.remark }}</span>
            <span v-else class="empty-text">暂无备注</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="280" align="center" fixed="right">
          <template #default="{ row }">
            <div class="action-group">
              <el-button type="primary" plain round size="small" icon="Edit" @click="handleEdit(row)">
                编辑
              </el-button>
              <el-button type="success" plain round size="small" icon="CircleCheck" @click="handleAssign(row)">
                分配权限
              </el-button>
              <el-button type="danger" plain round size="small" icon="Delete" @click="handleDelete(row)">
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/修改弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'create' ? '新增角色' : '编辑角色'"
      width="520px"
      class="modern-dialog"
      destroy-on-close
    >
      <el-form ref="roleFormRef" :model="roleForm" :rules="rules" label-width="90px" class="dialog-form">
        <el-form-item label="角色名称" prop="role_name">
          <el-input v-model="roleForm.role_name" placeholder="请输入角色名称" prefix-icon="UserFilled" />
        </el-form-item>
        <el-form-item label="权限字符" prop="role_key">
          <el-input v-model="roleForm.role_key" placeholder="如 admin、editor" prefix-icon="Key" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="roleForm.remark" type="textarea" :rows="3" placeholder="请输入角色备注说明" />
        </el-form-item>
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

    <!-- 分配权限弹窗 -->
    <el-dialog
      v-model="assignVisible"
      title="分配权限"
      width="600px"
      class="modern-dialog"
      destroy-on-close
      top="8vh"
    >
      <div v-loading="assignLoading" class="assign-body">
        <div class="assign-hint">
          <el-icon><InfoFilled /></el-icon>
          <span>勾选需要分配给该角色的菜单和权限，子节点会随父节点联动</span>
        </div>
        <div class="permission-tree-container">
          <el-tree
            ref="treeRef"
            :data="permissionTree"
            show-checkbox
            node-key="id"
            :props="{ label: 'name', children: 'children' }"
            default-expand-all
            class="perm-tree"
          />
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="assignVisible = false" round>取 消</el-button>
          <el-button type="primary" :loading="assignLoading" round @click="submitAssign">确认分配</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getRoleList, createRole, updateRole, deleteRole, getPermissionList, getRolePermissions, assignPermissions } from '../../../api/rbac'

const roleList = ref([])
const loading = ref(false)
const searchKey = ref('')
const dialogVisible = ref(false)
const dialogType = ref('create')
const submitting = ref(false)
const roleFormRef = ref(null)

const roleForm = reactive({ id: null, role_name: '', role_key: '', remark: '' })
const rules = {
  role_name: [{ required: true, message: '角色名称不能为空', trigger: 'blur' }],
  role_key: [{ required: true, message: '权限字符不能为空', trigger: 'blur' }]
}

const assignVisible = ref(false)
const assignLoading = ref(false)
const currentRoleId = ref(null)
const permissionTree = ref([])
const treeRef = ref(null)

const filteredRoles = computed(() => {
  if (!searchKey.value) return roleList.value
  const key = searchKey.value.toLowerCase()
  return roleList.value.filter(r =>
    (r.role_name && r.role_name.toLowerCase().includes(key)) ||
    (r.role_key && r.role_key.toLowerCase().includes(key))
  )
})

const roleColors = ['#667eea', '#f5576c', '#00b894', '#fdcb6e', '#e17055', '#0984e3', '#6c5ce7', '#00cec9']
const getRoleColor = (name) => {
  if (!name) return roleColors[0]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return roleColors[Math.abs(hash) % roleColors.length]
}

const fetchRoles = async () => {
  loading.value = true
  try {
    const res = await getRoleList()
    roleList.value = res.result
  } finally {
    loading.value = false
  }
}

const handleCreate = () => {
  dialogType.value = 'create'
  Object.assign(roleForm, { id: null, role_name: '', role_key: '', remark: '' })
  dialogVisible.value = true
}

const handleEdit = (row) => {
  dialogType.value = 'edit'
  Object.assign(roleForm, row)
  dialogVisible.value = true
}

const submitForm = async () => {
  await roleFormRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        if (dialogType.value === 'create') {
          await createRole(roleForm)
          ElMessage.success('角色创建成功')
        } else {
          await updateRole(roleForm.id, roleForm)
          ElMessage.success('角色更新成功')
        }
        dialogVisible.value = false
        fetchRoles()
      } finally {
        submitting.value = false
      }
    }
  })
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除角色「${row.role_name}」吗？删除后不可恢复。`, '确认删除', {
    confirmButtonText: '确认删除',
    cancelButtonText: '取消',
    type: 'warning',
    confirmButtonClass: 'el-button--danger'
  }).then(async () => {
    await deleteRole(row.id)
    ElMessage.success('角色已删除')
    fetchRoles()
  })
}

const handleAssign = async (row) => {
  currentRoleId.value = row.id
  assignVisible.value = true
  assignLoading.value = true
  try {
    const [allPerms, rolePerms] = await Promise.all([
      getPermissionList(),
      getRolePermissions(row.id)
    ])
    permissionTree.value = buildTree(allPerms.result)
    await nextTick()
    treeRef.value.setCheckedKeys(rolePerms.result)
  } finally {
    assignLoading.value = false
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

const submitAssign = async () => {
  assignLoading.value = true
  try {
    const keys = treeRef.value.getCheckedKeys()
    const halfKeys = treeRef.value.getHalfCheckedKeys()
    await assignPermissions(currentRoleId.value, [...keys, ...halfKeys])
    ElMessage.success('权限分配成功')
    assignVisible.value = false
  } finally {
    assignLoading.value = false
  }
}

onMounted(fetchRoles)
</script>

<style scoped>
.role-container {
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
  grid-template-columns: repeat(1, 1fr);
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
.search-input {
  max-width: 300px;
}
.search-input :deep(.el-input__wrapper) {
  border-radius: 8px;
}

/* ---- 表格 ---- */
.role-table {
  flex: 1;
  border-radius: 8px;
  overflow: hidden;
}
.role-table :deep(.el-table__inner-wrapper::before) {
  display: none;
}
.role-table :deep(.el-table__header th) {
  border-bottom: none !important;
}
.role-table :deep(.el-table__row:hover > td) {
  background-color: var(--el-fill-color-lighter) !important;
}

/* ---- 角色信息单元格 ---- */
.role-cell {
  display: flex;
  align-items: center;
  gap: 14px;
}
.role-avatar {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.role-detail {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.role-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.role-key {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  margin-top: 2px;
}

/* ---- 备注 ---- */
.remark-text {
  font-size: 13px;
  color: var(--el-text-color-regular);
}
.empty-text {
  color: var(--el-text-color-placeholder);
  font-size: 13px;
}

/* ---- 操作按钮组 ---- */
.action-group {
  display: flex;
  gap: 8px;
  justify-content: center;
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
.dialog-form :deep(.el-input__wrapper),
.dialog-form :deep(.el-textarea__inner) {
  border-radius: 8px;
}
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* ---- 分配权限 ---- */
.assign-body {
  min-height: 200px;
}
.assign-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: var(--el-color-primary-light-9);
  border-radius: 8px;
  font-size: 13px;
  color: var(--el-text-color-regular);
  margin-bottom: 16px;
}
.assign-hint .el-icon {
  color: var(--el-color-primary);
  flex-shrink: 0;
}
.permission-tree-container {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  padding: 12px;
  max-height: 400px;
  overflow-y: auto;
}
.perm-tree :deep(.el-tree-node__content) {
  height: 36px;
  border-radius: 6px;
  margin-bottom: 2px;
}
.perm-tree :deep(.el-tree-node__content:hover) {
  background-color: var(--el-fill-color-lighter);
}

/* ---- 暗色模式 ---- */
.dark .stat-card {
  background: var(--el-bg-color-overlay);
}
</style>
