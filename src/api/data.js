import request from './request'

export function getCityListApi(params) { return request.get('/cities', { params }) }
export function getPortListApi(params) { return request.get('/ports', { params }) }
export function getPortDetailApi(id) { return request.get(`/ports/${id}`) }
export function getVesselListApi(params) { return request.get('/vessels', { params }) }
export function getVesselDetailApi(id) { return request.get(`/vessels/${id}`) }
export function getLineListApi(params) { return request.get('/shipping-lines', { params }) }
export function getLineDetailApi(id) { return request.get(`/shipping-lines/${id}`) }
export function getLinePortSequenceApi(id) { return request.get(`/shipping-lines/${id}/port-sequence`) }
export function getShippingCompanyListApi(params) { return request.get('/shipping-companies', { params }) }
