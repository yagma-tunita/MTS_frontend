import request from './request'

export function getNotificationListApi(params) { return request.get('/notifications', { params }) }
export function markNotificationReadApi(id) { return request.put(`/notifications/${id}/read`) }
export function sendNotificationApi(data) { return request.post('/admin/notifications', data) }
