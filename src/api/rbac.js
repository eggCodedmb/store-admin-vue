import request from '../utils/request'

// --- 角色管理 ---
export function getRoleList() {
  return request({ url: '/rbac/role', method: 'get' })
}

export function createRole(data) {
  return request({ url: '/rbac/role', method: 'post', data })
}

export function updateRole(id, data) {
  return request({ url: `/rbac/role/${id}`, method: 'put', data })
}

export function deleteRole(id) {
  return request({ url: `/rbac/role/${id}`, method: 'delete' })
}

export function getRolePermissions(roleId) {
  return request({ url: `/rbac/role/${roleId}/permissions`, method: 'get' })
}

export function assignPermissions(roleId, permissionIds) {
  return request({ url: `/rbac/role/${roleId}/permissions`, method: 'post', data: { permissionIds } })
}

// --- 权限/菜单管理 ---
export function getPermissionList() {
  return request({ url: '/rbac/permission', method: 'get' })
}

export function createPermission(data) {
  return request({ url: '/rbac/permission', method: 'post', data })
}

export function updatePermission(id, data) {
  return request({ url: `/rbac/permission/${id}`, method: 'put', data })
}

export function deletePermission(id) {
  return request({ url: `/rbac/permission/${id}`, method: 'delete' })
}

// --- 用户角色 ---
export function getUserRoles(userId) {
  return request({ url: `/rbac/user/${userId}/roles`, method: 'get' })
}

export function assignUserRoles(userId, roleIds) {
  return request({ url: `/rbac/user/${userId}/roles`, method: 'post', data: { roleIds } })
}
