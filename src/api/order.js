import request from './request'

export function createOrderApi(data) { return request.post('/orders', data) }
export function getOrderListApi(params) { return request.get('/orders', { params }) }
export function getOrderDetailApi(id) { return request.get(`/orders/${id}`) }
export function cancelOrderApi(id) { return request.post(`/orders/${id}/cancel`) }
export function updateOrderStatusApi(id, status) { return request.put(`/orders/${id}/status`, { status }) }
export function getOrderTrackingApi(id) { return request.get(`/orders/${id}/tracking`) }
export function payOrderApi(id) { return request.post(`/orders/${id}/pay`) }
export function getVoyageRecommendApi(params) { return request.get('/voyages/recommend', { params }) }
