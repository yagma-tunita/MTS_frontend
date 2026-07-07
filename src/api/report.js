import request from './request'

export function getOrderStatsApi(params) { return request.get('/reports/orders', { params }) }
export function getVoyageUtilizationApi(params) { return request.get('/reports/voyage-utilization', { params }) }
