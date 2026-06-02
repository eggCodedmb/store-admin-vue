import request from '../utils/request'

/**
 * 获取所有用户 (带分页和搜索)
 */
export function getAllUsers(data) {
  return request({
    url: '/user/all',
    method: 'post',
    data
  })
}

/**
 * 新增用户
 */
export function addUser(data) {
  return request({
    url: '/user/add',
    method: 'post',
    data
  })
}

/**
 * 修改用户信息
 */
export function updateUser(data) {
  return request({
    url: '/user/change-user',
    method: 'patch',
    data
  })
}

/**
 * 删除用户
 */
export function deleteUser(id) {
  return request({
    url: `/user/${id}`,
    method: 'delete'
  })
}
