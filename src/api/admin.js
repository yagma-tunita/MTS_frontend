import request from './request'

export function getAdminListApi(params) { return request.get('/admin/list', { params }) }
export function adminRegisterApi(data) { return request.post('/admin/register', data) }
export function adminChangePasswordApi(id, data) { return request.post(`/admin/password/${id}`, data) }

export function getShipperListApi(params) { return request.get('/admin/shipper/list', { params }) }
export function updateShipperApi(id, data) { return request.post(`/admin/shipper/${id}/update`, data) }
export function deleteShipperApi(id) { return request.post(`/admin/shipper/${id}/delete`) }

export function getShippingListApi(params) { return request.get('/admin/shipping/list', { params }) }
export function updateShippingApi(id, data) { return request.post(`/admin/shipping/${id}/update`, data) }
export function deleteShippingApi(id) { return request.post(`/admin/shipping/${id}/delete`) }

export function createPortApi(data) { return request.post('/admin/ports', data) }
export function updatePortApi(id, data) { return request.put(`/admin/ports/${id}`, data) }
export function deletePortApi(id) { return request.delete(`/admin/ports/${id}`) }

export function createVesselApi(data) { return request.post('/admin/vessels', data) }
export function updateVesselApi(id, data) { return request.put(`/admin/vessels/${id}`, data) }
export function deleteVesselApi(id) { return request.delete(`/admin/vessels/${id}`) }

export function createLineApi(data) { return request.post('/admin/shipping-lines', data) }
export function updateLineApi(id, data) { return request.put(`/admin/shipping-lines/${id}`, data) }
export function deleteLineApi(id) { return request.delete(`/admin/shipping-lines/${id}`) }

export function getCargoListApi(params) { return request.get('/admin/cargo/list', { params }) }
export function createCargoApi(data) { return request.post('/admin/cargo/create', data) }
export function deleteCargoApi(id) { return request.delete(`/admin/cargo/${id}`) }

export function createCityApi(data) { return request.post('/admin/cities', data) }
export function updateCityApi(id, data) { return request.put(`/admin/cities/${id}`, data) }
export function deleteCityApi(id) { return request.delete(`/admin/cities/${id}`) }
