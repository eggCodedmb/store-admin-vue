import request from '../utils/request'

export function getStoreList(params) {
  return request({
    url: '/store/list',
    method: 'get',
    params
  })
}

export function getStoreAllList(params) {
  return request({
    url: '/store/all',
    method: 'get',
    params
  })
}

export function getStoreMapList() {
  return request({
    url: '/store/map-list',
    method: 'get'
  })
}

export function getStoreDetail(id) {
  return request({
    url: `/store/detail/${id}`,
    method: 'get'
  })
}

export function createStore(data) {
  return request({
    url: '/store',
    method: 'post',
    data
  })
}

export function updateStore(id, data) {
  return request({
    url: '/store/' + id,
    method: 'put',
    data
  })
}

export function deleteStore(id) {
  return request({
    url: '/store/' + id,
    method: 'delete'
  })
}
