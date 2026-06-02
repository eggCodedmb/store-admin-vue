import request from '../utils/request'

export function getAddressList(data) {
  return request({ url: '/address/findAll', method: 'post', data })
}

export function deleteAddress(id) {
  return request({ url: `/address/${id}`, method: 'delete' })
}
