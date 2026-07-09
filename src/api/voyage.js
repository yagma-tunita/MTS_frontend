import request from './request'

export function createVoyageBerthingApi(data) { return request.post('/voyages/berthing', data) }

export function updateBerthingActualTimesApi(id, data) { return request.put(`/berthings/${id}/actual-times`, data) }

export function getVoyageListApi(params) { return request.get('/voyages/my', { params }) }

export function createVoyageApi(data) { return request.post('/voyages', data) }

export function getVoyageGroupsApi(params) { return request.get('/voyages', { params }) }

export function createShippingLineApi(data) { return request.post('/shipping-lines', data) }
