import request from '../utils/request'

export function getCommonSpecs() {
  return request({
    url: '/specs',
    method: 'get'
  })
}

export function createCommonSpec(data) {
  return request({
    url: '/specs',
    method: 'post',
    data
  })
}

export function deleteCommonSpec(id) {
  return request({
    url: `/specs/${id}`,
    method: 'delete'
  })
}

export function updateCommonSpec(id, data) {
  return request({
    url: `/specs/${id}`,
    method: 'put',
    data
  })
}
