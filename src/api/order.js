import request from '../utils/request'

export function getOrderList(data) {
  return request({ url: '/order', method: 'post', data })
}

export function updateOrderStatus(id, status) {
  return request({ url: `/order/${id}`, method: 'patch', data: { state: status } })
}

export function deleteOrder(id) {
  return request({ url: `/order/${id}`, method: 'delete' })
}

export function getOrderDetail(id) {
  return request({ url: `/order/${id}`, method: 'get' })
}
