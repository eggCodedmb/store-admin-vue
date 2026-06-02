import request from '../utils/request'

export function getGoodsList(params) {
  return request({
    url: '/goods',
    method: 'get',
    params
  })
}

export function createGoods(data) {
  return request({
    url: '/goods',
    method: 'post',
    data
  })
}

export function getGoodsById(id) {
  return request({
    url: `/goods/product/${id}`,
    method: 'get'
  })
}

export function getGoodsDetail(id) {
  return request({
    url: `/goods/detail/${id}`,
    method: 'get'
  })
}

export function updateGoods(id, data) {
  return request({
    url: `/goods/${id}`,
    method: 'put',
    data
  })
}

export function deleteGoods(id) {
  return request({
    url: '/goods/off',
    method: 'post',
    data: { id }
  })
}

export function restoreGoods(id) {
  return request({
    url: '/goods/on',
    method: 'post',
    data: { id }
  })
}
