import axios from 'axios'

const API_BASE_URL = 'https://dataplatform.tomodachis.org:2221/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data),
  getUsers: () => api.get('/auth/users'),
  getPendingUsers: () => api.get('/auth/pending-users'),
  approveUser: (userId, status) => api.put(`/auth/users/${userId}/approve`, { status }),
  updateUserRole: (userId, role) => api.put(`/auth/users/${userId}/role`, { role }),
}

export const dashboardAPI = {
  getSummary: (params) => api.get('/dashboard/summary', { params }),
  getOpportunitiesChart: (params) => api.get('/dashboard/opportunities-chart', { params }),
  getEmployeesByPosition: () => api.get('/dashboard/employees-by-position'),
  getProductAssignmentsChart: () => api.get('/dashboard/product-assignments-chart'),
  getMiniPocWinners: () => api.get('/dashboard/mini-poc-winners'),
  getQuarterlyTrends: (params) => api.get('/dashboard/quarterly-trends', { params }),
}

export const employeesAPI = {
  getAll: () => api.get('/employees'),
  create: (data) => api.post('/employees', data),
  update: (id, data) => api.put(`/employees/${id}`, data),
  delete: (id) => api.delete(`/employees/${id}`),
}

export const projectsAPI = {
  getAll: (params) => api.get('/projects', { params }),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
}

export const opportunitiesAPI = {
  getAll: (params) => api.get('/opportunities', { params }),
  create: (data) => api.post('/opportunities', data),
  update: (id, data) => api.put(`/opportunities/${id}`, data),
  delete: (id) => api.delete(`/opportunities/${id}`),
}

export const certificationsAPI = {
  getAll: (params) => api.get('/certifications', { params }),
  getStats: (params) => api.get('/certifications/stats', { params }),
  create: (data) => api.post('/certifications', data),
  update: (id, data) => api.put(`/certifications/${id}`, data),
  delete: (id) => api.delete(`/certifications/${id}`),
}

export const employeeCertificationsAPI = {
  getAll: (params) => api.get('/employee-certifications', { params }),
  getExpiring: () => api.get('/employee-certifications/expiring'),
  create: (data) => api.post('/employee-certifications', data),
  update: (id, data) => api.put(`/employee-certifications/${id}`, data),
  updateStatus: (id, status) => api.patch(`/employee-certifications/${id}/status`, { status }),
  delete: (id) => api.delete(`/employee-certifications/${id}`),
}

export const productAssignmentsAPI = {
  getAll: () => api.get('/product-assignments'),
  getProducts: () => api.get('/product-assignments/products'),
  getByEmployee: (employeeId) => api.get(`/product-assignments/employee/${employeeId}`),
  create: (data) => api.post('/product-assignments', data),
  update: (id, data) => api.put(`/product-assignments/${id}`, data),
  delete: (id) => api.delete(`/product-assignments/${id}`),
}

export const miniPocsAPI = {
  getAll: () => api.get('/mini-pocs'),
  getDetails: (pocCode) => api.get(`/mini-pocs/${pocCode}`),
  create: (data) => api.post('/mini-pocs', data),
  update: (pocCode, data) => api.put(`/mini-pocs/${pocCode}`, data),
  delete: (pocCode) => api.delete(`/mini-pocs/${pocCode}`),
  addTeamMember: (pocCode, data) => api.post(`/mini-pocs/${pocCode}/teams`, data),
  updateTeamMember: (teamId, data) => api.put(`/mini-pocs/teams/${teamId}`, data),
  deleteTeamMember: (teamId) => api.delete(`/mini-pocs/teams/${teamId}`),
}

export const leavesAPI = {
  getAll: (params) => api.get('/leaves', { params }),
  getStats: (params) => api.get('/leaves/stats', { params }),
  create: (data) => api.post('/leaves', data),
  update: (id, data) => api.put(`/leaves/${id}`, data),
  updateStatus: (id, status) => api.patch(`/leaves/${id}/status`, { status }),
  delete: (id) => api.delete(`/leaves/${id}`),
}

// ✅ TASKS API - ADD THIS!
export const tasksAPI = {
  getAll: (params) => api.get('/tasks', { params }),
  getStats: (params) => api.get('/tasks/stats', { params }),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  archive: (id) => api.patch(`/tasks/${id}/archive`),
  unarchive: (id) => api.patch(`/tasks/${id}/unarchive`),
  delete: (id) => api.delete(`/tasks/${id}`),
}

export default api
