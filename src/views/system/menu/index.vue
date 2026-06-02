<template>
  <div class="menu-container">
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span class="title">菜单权限管理</span>
          <el-button type="primary" icon="Plus" @click="handleCreate(0)">新增根节点</el-button>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="menuTree"
        row-key="id"
        border
        default-expand-all
        height="calc(100vh - 200px)"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
      >
        <el-table-column prop="name" label="名称" min-width="180" />
        <el-table-column prop="code" label="权限编码" min-width="150" />
        <el-table-column prop="type" label="类型" width="100" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.type === 1 ? 'primary' : (scope.row.type === 2 ? 'success' : 'info')">
              {{ scope.row.type === 1 ? '菜单' : (scope.row.type === 2 ? '按钮' : '接口') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="path" label="路径" min-width="150" show-overflow-tooltip />
        <el-table-column prop="method" label="方法" width="100" align="center">
          <template #default="scope">
            <el-tag v-if="scope.row.method" effect="plain">{{ scope.row.method }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" align="center" fixed="right">
          <template #default="scope">
            <el-button type="primary" link icon="Plus" @click="handleCreate(scope.row.id)" v-if="scope.row.type === 1">新增</el-button>
            <el-button type="primary" link icon="Edit" @click="handleEdit(scope.row)">修改</el-button>
            <el-button type="danger" link icon="Delete" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/修改弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogType === 'create' ? '新增权限' : '修改权限'" width="600px">
      <el-form ref="menuFormRef" :model="menuForm" :rules="rules" label-width="100px" style="padding: 10px 20px">
        <el-form-item label="上级ID">
          <el-input v-model="menuForm.parent_id" disabled />
        </el-form-item>
        <el-form-item label="名称" prop="name">
          <el-input v-model="menuForm.name" placeholder="请输入名称" />
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-radio-group v-model="menuForm.type">
            <el-radio :label="1">菜单</el-radio>
            <el-radio :label="2">按钮</el-radio>
            <el-radio :label="3">接口</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="权限编码" prop="code">
          <el-input v-model="menuForm.code" placeholder="菜单路径或按钮标识" />
        </el-form-item>
        <template v-if="menuForm.type === 3">
          <el-form-item label="接口路径" prop="path">
            <el-input v-model="menuForm.path" placeholder="API路径" />
          </el-form-item>
          <el-form-item label="请求方法" prop="method">
            <el-select v-model="menuForm.method" placeholder="选择方法" style="width: 100%">
              <el-option label="GET" value="GET" />
              <el-option label="POST" value="POST" />
              <el-option label="PUT" value="PUT" />
              <el-option label="PATCH" value="PATCH" />
              <el-option label="DELETE" value="DELETE" />
            </el-select>
          </el-form-item>
        </template>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getPermissionList, createPermission, updatePermission, deletePermission } from '../../../api/rbac'

const loading = ref(false)
const menuTree = ref([])
const dialogVisible = ref(false)
const dialogType = ref('create')
const submitting = ref(false)
const menuFormRef = ref(null)

const menuForm = ref({ id: null, parent_id: 0, name: '', code: '', type: 1, path: '', method: '' })
const rules = {
  name: [{ required: true, message: '名称不能为空', trigger: 'blur' }],
  code: [{ required: true, message: '权限编码不能为空', trigger: 'blur' }]
}

const fetchMenus = async () => {
  loading.value = true
  try {
    const res = await getPermissionList()
    menuTree.value = buildTree(res.result)
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
          ElMessage.success('新增成功')
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
  ElMessageBox.confirm(`是否确认删除名称为"${row.name}"的数据项?`, '警告', { type: 'warning' }).then(async () => {
    await deletePermission(row.id)
    ElMessage.success('删除成功')
    fetchMenus()
  })
}

onMounted(fetchMenus)
</script>

<style scoped>
.menu-container { padding: 24px; background-color: var(--el-bg-color-page); min-height: 100%; display: flex; flex-direction: column; }
.table-card { border-radius: 8px; border: none; box-shadow: 0 4px 12px rgba(0,0,0,0.05); flex: 1; display: flex; flex-direction: column; }
.table-card :deep(.el-card__body) { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.card-header .title { font-size: 18px; font-weight: 600; }
</style>
