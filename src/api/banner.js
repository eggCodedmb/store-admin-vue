import request from '../utils/request'

export function getBannerList(params) {
  return request({ url: '/banners/list', method: 'get', params })
}

export function getBannerDetail(id) {
  return request({ url: `/banners/${id}`, method: 'get' })
}

export function createBanner(data) {
  return request({ url: '/banners', method: 'post', data })
}

export function updateBanner(id, data) {
  return request({ url: `/banners/${id}`, method: 'put', data })
}

export function deleteBanner(id) {
  return request({ url: `/banners/${id}`, method: 'delete' })
}
