import request from '../utils/request'

export function getCategoryList() {
  return request({
    url: '/category',
    method: 'get'
  })
}

export function createCategory(data) {
  return request({
    url: '/category',
    method: 'post',
    data
  })
}

export function updateCategory(id, data) {
  return request({
    url: `/category/${id}`,
    method: 'put',
    data
  })
}

export function deleteCategory(id) {
  return request({
    url: `/category/${id}`,
    method: 'delete'
  })
}

export function addGoodsToCategory(categoryId, goodsId) {
  return request({
    url: `/category/${categoryId}/goods`,
    method: 'post',
    data: { goodsId }
  })
}

export function removeGoodsFromCategory(categoryId, goodsId) {
  return request({
    url: `/category/${categoryId}/goods`,
    method: 'delete',
    data: { goodsId }
  })
}
