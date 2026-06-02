import request from '../utils/request'

export function getNoticeList(params) {
  return request({ url: '/notice/list', method: 'get', params })
}

export function getNoticeDetail(id) {
  return request({ url: `/notice/${id}`, method: 'get' })
}

export function createNotice(data) {
  return request({ url: '/notice', method: 'post', data })
}

export function updateNotice(id, data) {
  return request({ url: `/notice/${id}`, method: 'put', data })
}

export function deleteNotice(id) {
  return request({ url: `/notice/${id}`, method: 'delete' })
}

export function getNoticeIcons() {
  return request({ url: '/notice/icons', method: 'get' })
}

