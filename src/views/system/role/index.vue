<template>
  <div class="role-container">
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span class="title">角色管理</span>
          <el-button type="primary" icon="Plus" @click="handleCreate">新增角色</el-button>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="roleList"
        border
        stripe
        height="calc(100vh - 200px)"
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="role_name" label="角色名称" min-width="120" />
        <el-table-column prop="role_key" label="权限字符" min-width="120" />
        <el-table-column prop="remark" label="备注" show-overflow-tooltip />
        <el-table-column label="操作" width="280" align="center" fixed="right">
          <template #default="scope">
            <el-button type="primary" link icon="Edit" @click="handleEdit(scope.row)">修改</el-button>
            <el-button type="success" link icon="CircleCheck" @click="handleAssign(scope.row)">分配权限</el-button>
            <el-button type="danger" link icon="Delete" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/修改弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogType === 'create' ? '新增角色' : '修改角色'" width="500px">
      <el-form ref="roleFormRef" :model="roleForm" :rules="rules" label-width="100px" style="padding: 10px 20px">
        <el-form-item label="角色名称" prop="role_name">
          <el-input v-model="roleForm.role_name" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="权限字符" prop="role_key">
          <el-input v-model="roleForm.role_key" placeholder="请输入权限字符" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="roleForm.remark" type="textarea" placeholder="请输入内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>

    <!-- 分配权限弹窗 -->
    <el-dialog v-model="assignVisible" title="分配权限" width="600px" top="10vh" destroy-on-close>
      <div class="permission-tree-container">
        <el-tree
          ref="treeRef"
          :data="permissionTree"
          show-checkbox
          node-key="id"
          :props="{ label: 'name', children: 'children' }"
          default-expand-all
        />
      </div>
      <template #footer>
        <el-button @click="assignVisible = false">取消</el-button>
        <el-button type="primary" :loading="assignLoading" @click="submitAssign">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getRoleList, createRole, updateRole, deleteRole, getPermissionList, getRolePermissions, assignPermissions } from '../../../api/rbac'

const roleList = ref([])
const loading = ref(false)
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
          ElMessage.success('新增成功')
        } else {
          await updateRole(roleForm.id, roleForm)
          ElMessage.success('修改成功')
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
  ElMessageBox.confirm(`是否确认删除角色名称为"${row.role_name}"的数据项?`, '警告', { type: 'warning' }).then(async () => {
    await deleteRole(row.id)
    ElMessage.success('删除成功')
    fetchRoles()
  })
}

// 分配权限
const handleAssign = async (row) => {
  currentRoleId.value = row.id
  assignVisible.value = true
  assignLoading.value = true
  try {
    const [allPerms, rolePerms] = await Promise.all([
      getPermissionList(),
      getRolePermissions(row.id)
    ])
    // 转换为树结构
    permissionTree.value = buildTree(allPerms.result)
    await nextTick()
    // 设置已选中，注意：这里需要过滤掉非叶子节点，或者由后端返回纯叶子节点
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
    ElMessage.success('分配成功')
    assignVisible.value = false
  } finally {
    assignLoading.value = false
  }
}

onMounted(fetchRoles)
</script>

<style scoped>
.role-container { padding: 24px; background-color: var(--el-bg-color-page); min-height: 100%; display: flex; flex-direction: column; }
.table-card { border-radius: 8px; border: none; box-shadow: 0 4px 12px rgba(0,0,0,0.05); flex: 1; display: flex; flex-direction: column; }
.table-card :deep(.el-card__body) { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.card-header .title { font-size: 18px; font-weight: 600; }
.permission-tree-container {
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  padding: 10px;
  height: 300px;
  overflow-y: auto;
  margin: 10px 0;
}
</style>
