<template>
  <div class="user-manage-container">
    <!-- 顶部统计卡片 -->
    <div class="stat-cards">
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
          <el-icon size="24"><User /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ total }}</span>
          <span class="stat-label">用户总数</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)">
          <el-icon size="24"><UserFilled /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ roleUserCount }}</span>
          <span class="stat-label">已分配角色</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)">
          <el-icon size="24"><OfficeBuilding /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ storeList.length }}</span>
          <span class="stat-label">门店总数</span>
        </div>
      </div>
    </div>

    <!-- 主表格卡片 -->
    <el-card class="table-card" shadow="never">
      <!-- 搜索栏 -->
      <div class="search-bar">
        <div class="search-left">
          <el-input
            v-model="queryParams.user_name"
            placeholder="用户名"
            prefix-icon="User"
            clearable
            class="search-input"
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          />
          <el-input
            v-model="queryParams.nick_name"
            placeholder="昵称"
            prefix-icon="UserFilled"
            clearable
            class="search-input"
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          />
          <el-input
            v-model="queryParams.email"
            placeholder="邮箱"
            prefix-icon="Message"
            clearable
            class="search-input"
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          />
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
        :data="userList"
        :header-cell-style="{ background: 'var(--el-fill-color-lighter)', color: 'var(--el-text-color-primary)', fontWeight: 600, fontSize: '13px' }"
        :row-style="{ height: '72px' }"
        class="user-table"
        height="calc(100vh - 480px)"
        style="width: 100%"
      >
        <el-table-column label="用户信息" min-width="240">
          <template #default="{ row }">
            <div class="user-cell">
              <el-avatar :size="40" :style="{ background: getAvatarColor(row.user_name), flexShrink: 0 }">
                {{ (row.nick_name || row.user_name || '').slice(0, 1) }}
              </el-avatar>
              <div class="user-detail">
                <span class="user-name">{{ row.nick_name || row.user_name }}</span>
                <span class="user-account">@{{ row.user_name }}</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="所属部门" min-width="200">
          <template #default="{ row }">
            <template v-if="row.departments && row.departments.length > 0">
              <el-tag
                v-for="(dept, index) in row.departments.slice(0, 2)"
                :key="dept.id"
                class="dept-tag"
                effect="plain"
                round
                size="small"
              >
                <el-icon class="tag-icon"><OfficeBuilding /></el-icon>
                {{ dept.name }}
              </el-tag>
              <el-popover
                v-if="row.departments.length > 2"
                placement="top"
                trigger="hover"
                width="200"
              >
                <template #reference>
                  <el-tag class="dept-tag" effect="plain" round size="small" type="info">
                    +{{ row.departments.length - 2 }}
                  </el-tag>
                </template>
                <div class="popover-tags">
                  <el-tag
                    v-for="dept in row.departments.slice(2)"
                    :key="dept.id"
                    effect="plain"
                    round
                    size="small"
                    class="mb-1"
                  >
                    {{ dept.name }}
                  </el-tag>
                </div>
              </el-popover>
            </template>
            <span v-else class="empty-text">未分配</span>
          </template>
        </el-table-column>

        <el-table-column prop="email" label="邮箱" min-width="200">
          <template #default="{ row }">
            <span v-if="row.email" class="email-text">
              <el-icon class="email-icon"><Message /></el-icon>
              {{ row.email }}
            </span>
            <span v-else class="empty-text">-</span>
          </template>
        </el-table-column>

        <el-table-column prop="points" label="积分" width="100" align="center">
          <template #default="{ row }">
            <el-tag type="warning" effect="plain" round>{{ row.points || 0 }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="level" label="会员等级" width="120" align="center">
          <template #default="{ row }">
            <el-tag type="success" effect="dark" round>V{{ row.level || 1 }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="角色" min-width="180">
          <template #default="{ row }">
            <template v-if="row.Roles && row.Roles.length > 0">
              <el-tag
                v-for="role in row.Roles"
                :key="role.id"
                class="role-tag"
                effect="dark"
                round
                size="small"
              >
                {{ role.role_name }}
              </el-tag>
            </template>
            <el-tag v-else type="info" effect="plain" round size="small">未分配</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="160" align="center" fixed="right">
          <template #default="{ row }">
            <el-dropdown trigger="click" @command="(cmd) => handleCommand(cmd, row)">
              <el-button class="action-btn" type="primary" plain round size="small">
                操作 <el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="edit" icon="Edit">编辑信息</el-dropdown-item>
                  <el-dropdown-item command="roles" icon="UserFilled">分配角色</el-dropdown-item>
                  <el-dropdown-item command="delete" icon="Delete" divided>删除用户</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <span class="pagination-info">
          共 <b>{{ total }}</b> 条记录，第 {{ queryParams.pageNum }} / {{ Math.ceil(total / queryParams.pageSize) || 1 }} 页
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

    <!-- 新增/修改用户弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'create' ? '新增用户' : '编辑用户'"
      width="520px"
      class="modern-dialog"
      destroy-on-close
    >
      <el-form ref="userFormRef" :model="userForm" :rules="rules" label-width="80px" class="dialog-form">
        <el-form-item label="用户名" prop="user_name">
          <el-input
            v-model="userForm.user_name"
            :disabled="dialogType === 'edit'"
            placeholder="请输入 4-16 位用户名"
            prefix-icon="User"
          />
        </el-form-item>
        <el-form-item label="昵称" prop="nick_name">
          <el-input v-model="userForm.nick_name" placeholder="请输入昵称" prefix-icon="UserFilled" />
        </el-form-item>
        <el-form-item label="部门" prop="store_ids">
          <el-select
            v-model="userForm.store_ids"
            placeholder="请选择所属门店(部门)"
            style="width: 100%"
            clearable
            multiple
            collapse-tags
            collapse-tags-tooltip
          >
            <el-option v-for="item in storeList" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="userForm.email" placeholder="example@domain.com" prefix-icon="Message" />
        </el-form-item>
        <el-form-item label="积分" prop="points" v-if="dialogType === 'edit'">
          <el-input-number v-model="userForm.points" :min="0" placeholder="请输入积分" style="width: 100%" />
        </el-form-item>
        <el-form-item label="等级" prop="level" v-if="dialogType === 'edit'">
          <el-select v-model="userForm.level" placeholder="请选择会员等级" style="width: 100%">
            <el-option v-for="i in 10" :key="i" :label="'V' + i" :value="i" />
          </el-select>
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="dialogType === 'create'">
          <el-input v-model="userForm.password" type="password" show-password placeholder="请输入 6-16 位密码" prefix-icon="Lock" />
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

    <!-- 分配角色弹窗 -->
    <el-dialog
      v-model="roleDialogVisible"
      title="分配角色"
      width="640px"
      class="modern-dialog"
      destroy-on-close
    >
      <div v-loading="roleLoading" class="role-dialog-body">
        <div class="user-info-banner">
          <el-avatar :size="36" :style="{ background: getAvatarColor(currentUser?.user_name) }">
            {{ (currentUser?.nick_name || currentUser?.user_name || '').slice(0, 1) }}
          </el-avatar>
          <div class="banner-text">
            <span class="banner-name">{{ currentUser?.nick_name }}</span>
            <span class="banner-account">@{{ currentUser?.user_name }}</span>
          </div>
        </div>

        <p class="role-section-title">选择角色</p>
        <el-table
          ref="roleTableRef"
          :data="allRoles"
          :header-cell-style="{ background: 'var(--el-fill-color-lighter)', fontWeight: 600 }"
          @selection-change="handleRoleSelectionChange"
          class="role-table"
          max-height="360"
        >
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column prop="role_name" label="角色名称" min-width="140">
            <template #default="{ row }">
              <div class="role-name-cell">
                <el-icon color="var(--el-color-primary)"><UserFilled /></el-icon>
                <span>{{ row.role_name }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="role_key" label="角色标识" min-width="140">
            <template #default="{ row }">
              <el-tag effect="plain" round size="small">{{ row.role_key }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="remark" label="备注" show-overflow-tooltip />
        </el-table>
        <el-empty v-if="allRoles.length === 0" description="暂无可选角色" :image-size="60" />
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="roleDialogVisible = false" round>取 消</el-button>
          <el-button type="primary" :loading="roleSubmitting" round @click="submitRoleAssignment">
            确认分配
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { Refresh, Search } from '@element-plus/icons-vue'
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useUserStore } from '../../store/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getRoleList, getUserRoles, assignUserRoles } from '../../api/rbac'
import { getAllUsers, addUser, updateUser, deleteUser } from '../../api/user'
import { getStoreList } from '../../api/store'

const userStore = useUserStore()
const userList = ref([])
const loading = ref(false)
const total = ref(0)

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  user_name: '',
  nick_name: '',
  email: ''
})

const dialogVisible = ref(false)
const dialogType = ref('create')
const submitting = ref(false)
const userFormRef = ref(null)

const userForm = reactive({
  id: null,
  user_name: '',
  nick_name: '',
  email: '',
  password: '',
  store_ids: [],
  points: 0,
  level: 1
})

// 角色分配相关
const roleDialogVisible = ref(false)
const roleLoading = ref(false)
const roleSubmitting = ref(false)
const allRoles = ref([])
const selectedRoleIds = ref([])
const currentUser = ref(null)
const storeList = ref([])

// 已分配角色的用户数
const roleUserCount = computed(() => {
  return userList.value.filter(u => u.Roles && u.Roles.length > 0).length
})

// 头像颜色生成
const avatarColors = ['#667eea', '#f5576c', '#00b894', '#fdcb6e', '#e17055', '#0984e3', '#6c5ce7', '#00cec9']
const getAvatarColor = (name) => {
  if (!name) return avatarColors[0]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return avatarColors[Math.abs(hash) % avatarColors.length]
}

const rules = {
  user_name: [
    { required: true, message: '用户名不能为空', trigger: 'blur' },
    { min: 4, max: 16, message: '长度在 4 到 16 个字符', trigger: 'blur' }
  ],
  nick_name: [{ required: true, message: '昵称不能为空', trigger: 'blur' }],
  email: [
    { required: true, message: '邮箱不能为空', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '密码不能为空', trigger: 'blur' },
    { min: 6, max: 16, message: '长度在 6 到 16 个字符', trigger: 'blur' }
  ]
}

const fetchUsers = async () => {
  loading.value = true
  try {
    const res = await getAllUsers(queryParams)
    userList.value = res.result.users
    total.value = res.result.total
  } finally {
    loading.value = false
  }
}

const fetchStores = async () => {
  try {
    const res = await getStoreList({ pageNum: 1, pageSize: 1000 })
    storeList.value = res.result.list || []
  } catch (error) {
    console.error('获取门店列表失败:', error)
  }
}

const handleSearch = () => {
  queryParams.pageNum = 1
  fetchUsers()
}

const resetQuery = () => {
  queryParams.user_name = ''
  queryParams.nick_name = ''
  queryParams.email = ''
  queryParams.pageNum = 1
  fetchUsers()
}


const handleSizeChange = (val) => {
  queryParams.pageSize = val
  queryParams.pageNum = 1
  fetchUsers()
}

const handleCurrentChange = (val) => {
  queryParams.pageNum = val
  fetchUsers()
}

// 操作菜单分发
const handleCommand = (cmd, row) => {
  if (cmd === 'edit') handleEdit(row)
  else if (cmd === 'roles') handleAssignRoles(row)
  else if (cmd === 'delete') handleDelete(row)
}

const handleCreate = () => {
  dialogType.value = 'create'
  Object.assign(userForm, { id: null, user_name: '', nick_name: '', email: '', password: '', store_ids: [], points: 0, level: 1 })
  dialogVisible.value = true
}

const handleEdit = (row) => {
  dialogType.value = 'edit'
  Object.assign(userForm, row)
  userForm.store_ids = row.departments ? row.departments.map(d => d.id) : []
  dialogVisible.value = true
}

const roleTableRef = ref(null)

const handleRoleSelectionChange = (selection) => {
  selectedRoleIds.value = selection.map(item => item.id)
}

const handleAssignRoles = async (row) => {
  currentUser.value = row
  roleDialogVisible.value = true
  roleLoading.value = true
  try {
    const [rolesRes, userRolesRes] = await Promise.all([
      getRoleList(),
      getUserRoles(row.id)
    ])
    allRoles.value = rolesRes.result
    const userRoleIds = userRolesRes.result
    selectedRoleIds.value = userRoleIds

    nextTick(() => {
      if (roleTableRef.value) {
        allRoles.value.forEach(role => {
          if (userRoleIds.includes(role.id)) {
            roleTableRef.value.toggleRowSelection(role, true)
          }
        })
      }
    })
  } catch (error) {
    ElMessage.error('获取角色信息失败')
  } finally {
    roleLoading.value = false
  }
}

const submitRoleAssignment = async () => {
  if (!currentUser.value) return
  roleSubmitting.value = true
  try {
    await assignUserRoles(currentUser.value.id, selectedRoleIds.value)
    ElMessage.success('分配角色成功')
    roleDialogVisible.value = false
    fetchUsers()
  } catch (error) {
    ElMessage.error('分配角色失败')
  } finally {
    roleSubmitting.value = false
  }
}

const submitForm = async () => {
  await userFormRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        if (dialogType.value === 'create') {
          await addUser(userForm)
          ElMessage.success('新增用户成功')
        } else {
          await updateUser({
            id: userForm.id,
            nick_name: userForm.nick_name,
            email: userForm.email,
            store_ids: userForm.store_ids,
            points: userForm.points,
            level: userForm.level
          })
          ElMessage.success('修改信息成功')
        }
        dialogVisible.value = false
        fetchUsers()
      } finally {
        submitting.value = false
      }
    }
  })
}

const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定要删除用户「${row.nick_name || row.user_name}」吗？删除后将无法恢复。`,
    '确认删除',
    {
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
      type: 'warning',
      confirmButtonClass: 'el-button--danger'
    }
  ).then(async () => {
    try {
      await deleteUser(row.id)
      ElMessage.success('用户已删除')
      fetchUsers()
    } catch (error) {
      console.error(error)
    }
  })
}

onMounted(() => {
  fetchUsers()
  fetchStores()
})
</script>

<style scoped>
.user-manage-container {
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
  grid-template-columns: repeat(3, 1fr);
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

/* ---- 搜索栏 ---- */
.search-bar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
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
  flex-shrink: 0;
}
.search-input {
  max-width: 200px;
}
.search-input :deep(.el-input__wrapper) {
  border-radius: 8px;
}
.search-input :deep(.el-input__wrapper:hover),
.search-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--el-color-primary) inset;
}

/* ---- 表格 ---- */
.user-table {
  flex: 1;
  border-radius: 8px;
  overflow: hidden;
}
.user-table :deep(.el-table__inner-wrapper::before) {
  display: none;
}
.user-table :deep(.el-table__header th) {
  border-bottom: none !important;
}
.user-table :deep(.el-table__row) {
  transition: background-color 0.2s;
}
.user-table :deep(.el-table__row:hover > td) {
  background-color: var(--el-fill-color-lighter) !important;
}

/* ---- 用户信息单元格 ---- */
.user-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}
.user-detail {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.user-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.user-account {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  line-height: 1.4;
}

/* ---- 部门标签 ---- */
.dept-tag {
  margin-right: 6px;
  margin-bottom: 2px;
}
.dept-tag .tag-icon {
  margin-right: 2px;
  font-size: 12px;
}

/* ---- 邮箱 ---- */
.email-text {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--el-text-color-regular);
}
.email-icon {
  font-size: 14px;
  color: var(--el-text-color-placeholder);
}

/* ---- 角色标签 ---- */
.role-tag {
  margin-right: 6px;
  margin-bottom: 2px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  border: none !important;
  color: #fff !important;
}

/* ---- 空状态文字 ---- */
.empty-text {
  color: var(--el-text-color-placeholder);
  font-size: 13px;
}

/* ---- 操作按钮 ---- */
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
.dialog-form {
  padding: 0;
}
.dialog-form :deep(.el-input__wrapper),
.dialog-form :deep(.el-select .el-input__wrapper) {
  border-radius: 8px;
}
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* ---- 角色弹窗 ---- */
.role-dialog-body {
  min-height: 200px;
}
.user-info-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--el-fill-color-lighter);
  padding: 12px 16px;
  border-radius: 10px;
  margin-bottom: 20px;
}
.banner-text {
  display: flex;
  flex-direction: column;
}
.banner-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.banner-account {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}
.role-section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0 0 12px;
}
.role-table {
  border-radius: 8px;
  overflow: hidden;
}
.role-name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

/* ---- Popover ---- */
.popover-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.mb-1 {
  margin-bottom: 4px;
}

/* ---- 暗色模式适配 ---- */
.dark .stat-card {
  background: var(--el-bg-color-overlay);
}
</style>
