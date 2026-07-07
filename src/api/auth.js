import request from './request'

export function loginApi(data) { return request.post('/auth/login', data) }
export function shipperRegisterApi(data) { return request.post('/shipper/register', data) }
export function shippingRegisterApi(data) { return request.post('/shipping/register', data) }
export function getCurrentUserApi() { return request.get('/auth/me') }
export function shipperChangePasswordApi(id, data) { return request.post(`/shipper/password/${id}`, data) }
export function shippingChangePasswordApi(id, data) { return request.post(`/shipping/password/${id}`, data) }
