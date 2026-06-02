<template>
  <div class="user-manage-container">
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span class="title">用户管理</span>
          <el-button
            type="primary"
            icon="Plus"
            @click="handleCreate"
          >
            新增用户
          </el-button>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="userList"
        border
        stripe
        height="calc(100vh - 300px)"
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="user_name" label="用户名" min-width="120" align="center" />
        <el-table-column prop="nick_name" label="昵称" min-width="120" align="center" />
        <el-table-column label="所属部门" min-width="220" align="center">
          <template #default="scope">
            <template v-if="scope.row.departments && scope.row.departments.length > 0">
              <el-tag
                v-for="(dept, index) in scope.row.departments.slice(0, 2)"
                :key="dept.id"
                type="info"
                effect="plain"
                class="mr-1"
                size="small"
              >
                {{ dept.name }}
              </el-tag>
              <el-popover
                v-if="scope.row.departments.length > 2"
                placement="top"
                trigger="hover"
                width="200"
              >
                <template #reference>
                  <el-tag type="info" effect="plain" size="small">
                    +{{ scope.row.departments.length - 2 }}
                  </el-tag>
                </template>
                <div class="dept-popover-content">
                  <el-tag
                    v-for="dept in scope.row.departments.slice(2)"
                    :key="dept.id"
                    type="info"
                    effect="plain"
                    class="mb-1 mr-1"
                    size="small"
                  >
                    {{ dept.name }}
                  </el-tag>
                </div>
              </el-popover>
            </template>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="email" label="邮箱" min-width="180" align="center" />
        <el-table-column label="角色" min-width="180" align="center">
          <template #default="scope">
            <el-tag
              v-for="role in scope.row.Roles"
              :key="role.id"
              size="small"
              type="success"
              style="margin-right: 5px"
            >
              {{ role.role_name }}
            </el-tag>
            <el-tag v-if="!scope.row.Roles || scope.row.Roles.length === 0" type="info" size="small">未分配</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" align="center" fixed="right">
          <template #default="scope">
            <el-button
              type="primary"
              link
              icon="Edit"
              @click="handleEdit(scope.row)"
            >
              修改
            </el-button>
            <el-button
              type="success"
              link
              icon="UserFilled"
              @click="handleAssignRoles(scope.row)"
            >
              权限分配
            </el-button>
            <el-button
              type="danger"
              link
              icon="Delete"
              @click="handleDelete(scope.row)"
            >
              删除
            </el-button>
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
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 分配权限弹窗 -->
    <el-dialog v-model="roleDialogVisible" title="分配权限 (分配角色)" width="600px" destroy-on-close>
      <div v-loading="roleLoading" style="padding: 10px 20px">
        <div class="user-info-brief">
          <p><strong>当前用户：</strong>{{ currentUser?.user_name }} ({{ currentUser?.nick_name }})</p>
        </div>
        <div style="margin-top: 20px">
          <p style="margin-bottom: 10px; font-weight: bold; font-size: 14px; color: var(--el-text-color-regular)">选择角色</p>
          <el-table
            ref="roleTableRef"
            :data="allRoles"
            @selection-change="handleRoleSelectionChange"
            style="width: 100%"
            max-height="400"
            border
          >
            <el-table-column type="selection" width="55" align="center" />
            <el-table-column prop="role_name" label="角色名称" min-width="120" />
            <el-table-column prop="role_key" label="角色标识" min-width="120" />
            <el-table-column prop="remark" label="备注" show-overflow-tooltip />
          </el-table>
          <el-empty v-if="allRoles.length === 0" description="暂无角色可选" :image-size="60" />
        </div>
      </div>
      <template #footer>
        <el-button @click="roleDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="roleSubmitting" @click="submitRoleAssignment">确定</el-button>
      </template>
    </el-dialog>

    <!-- 新增/修改用户弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogType === 'create' ? '新增用户' : '修改用户'" width="500px">
      <el-form ref="userFormRef" :model="userForm" :rules="rules" label-width="100px" style="padding: 10px 20px">
        <el-form-item label="用户名" prop="user_name">
          <el-input v-model="userForm.user_name" :disabled="dialogType === 'edit'" placeholder="4-16位字符" />
        </el-form-item>
        <el-form-item label="昵称" prop="nick_name">
          <el-input v-model="userForm.nick_name" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="所属部门" prop="store_ids">
          <el-select
            v-model="userForm.store_ids"
            placeholder="请选择所属门店(部门)"
            style="width: 100%"
            clearable
            multiple
            collapse-tags
            collapse-tags-tooltip
          >
            <el-option
              v-for="item in storeList"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="userForm.email" placeholder="example@domain.com" />
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="dialogType === 'create'">
          <el-input v-model="userForm.password" type="password" show-password placeholder="6-16位字符" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
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
  user_name: ''
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
  store_ids: []
})

// 角色分配相关
const roleDialogVisible = ref(false)
const roleLoading = ref(false)
const roleSubmitting = ref(false)
const allRoles = ref([])
const selectedRoleIds = ref([])
const currentUser = ref(null)
const storeList = ref([])

const rules = {
  user_name: [{ required: true, message: '用户名不能为空', trigger: 'blur' }, { min: 4, max: 16, message: '长度在 4 到 16 个字符', trigger: 'blur' }],
  nick_name: [{ required: true, message: '昵称不能为空', trigger: 'blur' }],
  email: [{ required: true, message: '邮箱不能为空', trigger: 'blur' }, { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }],
  password: [{ required: true, message: '密码不能为空', trigger: 'blur' }, { min: 6, max: 16, message: '长度在 6 到 16 个字符', trigger: 'blur' }]
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

const handleSizeChange = (val) => {
  queryParams.pageSize = val
  fetchUsers()
}

const handleCurrentChange = (val) => {
  queryParams.pageNum = val
  fetchUsers()
}

const handleCreate = () => {
  dialogType.value = 'create'
  Object.assign(userForm, { id: null, user_name: '', nick_name: '', email: '', password: '', store_ids: [] })
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

    // 设置表格初始选中状态
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
            store_ids: userForm.store_ids
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
  ElMessageBox.confirm(`确定要删除用户 "${row.user_name}" 吗？此操作不可撤销。`, '警告', {
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await deleteUser(row.id)
      ElMessage.success('删除用户成功')
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
.user-manage-container { padding: 24px; background-color: var(--el-bg-color-page); min-height: 100%; display: flex; flex-direction: column; }
.table-card { border-radius: 8px; border: none; box-shadow: 0 4px 12px rgba(0,0,0,0.05); flex: 1; display: flex; flex-direction: column; }
.table-card :deep(.el-card__body) { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.card-header .title { font-size: 18px; font-weight: 600; }
.user-info-brief {
  background: var(--el-bg-color-page);
  padding: 12px 16px;
  border-radius: 4px;
  margin-bottom: 20px;
}
.user-info-brief p {
  margin: 0;
  font-size: 14px;
  color: var(--el-text-color-regular);
}
.mr-1 { margin-right: 4px; }
.mb-1 { margin-bottom: 4px; }
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
.dept-popover-content {
  display: flex;
  flex-wrap: wrap;
}
</style>
