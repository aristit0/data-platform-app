import { useState, useEffect } from 'react'
import { tasksAPI } from '../services/api'
import { employeesAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { Plus, Edit, Trash2, Archive, CheckCircle, Clock, Calendar, Search, Filter } from 'lucide-react'

export default function TaskManagement() {
  const [tasks, setTasks] = useState([])
  const [stats, setStats] = useState({ total: 0, plan: 0, in_progress: 0, completed: 0, overdue: 0 })
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [viewArchived, setViewArchived] = useState(false)
  const { user } = useAuth()

  // Filters & Pagination
  const [employees, setEmployees] = useState([])
  const [statusFilter, setStatusFilter] = useState('')
  const [employeeFilter, setEmployeeFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 })

  const [formData, setFormData] = useState({
    employee_id: '',
    client_name: '',
    project_name: '',
    task_detail: '',
    due_date: '',
    status: 'Plan',
  })

  // Load employees first
  useEffect(() => {
    loadEmployees()
  }, [])

  // Set employee_id when user and employees are loaded
  useEffect(() => {
    if (user?.employee_id && employees.length > 0) {
      // Check if user's employee_id exists in employees list
      const userExists = employees.find(emp => emp.employee_id === user.employee_id)
      if (userExists && !formData.employee_id) {
        setFormData(prev => ({
          ...prev,
          employee_id: user.employee_id
        }))
      }
    }
  }, [user, employees])

  useEffect(() => {
    if (employees.length > 0) {
      loadData()
    }
  }, [currentPage, statusFilter, employeeFilter, viewArchived, searchTerm, employees])

  const loadEmployees = async () => {
    try {
      const response = await employeesAPI.getAll()
      console.log('Employees API Response:', response)
      
      // Handle different response structures
      let employeesData = []
      if (response.data) {
        // Check if data is nested
        if (Array.isArray(response.data.data)) {
          employeesData = response.data.data
        } else if (Array.isArray(response.data)) {
          employeesData = response.data
        }
      }
      
      console.log('Parsed Employees Data:', employeesData)
      setEmployees(employeesData)
    } catch (err) {
      console.error('Error loading employees:', err)
      setEmployees([])
    }
  }

  const loadData = async () => {
    try {
      const params = {
        page: currentPage,
        limit: 10,
        archived: viewArchived,
      }
      
      // Non-admin users only see their own tasks
      if (user?.role !== 'admin') {
        params.employee_id = user?.employee_id
      } else if (employeeFilter) {
        // Admin can filter by employee
        params.employee_id = employeeFilter
      }
      
      if (statusFilter) params.status = statusFilter
      if (searchTerm) params.search = searchTerm

      const [tasksRes, statsRes] = await Promise.all([
        tasksAPI.getAll(params),
        tasksAPI.getStats(user?.role !== 'admin' ? { employee_id: user?.employee_id } : employeeFilter ? { employee_id: employeeFilter } : {})
      ])
      
      // Axios returns data in response.data
      const tasksData = tasksRes.data?.data || tasksRes.data || []
      const paginationData = tasksRes.data?.pagination || { 
        page: currentPage, 
        limit: 10, 
        total: 0, 
        totalPages: 1 
      }
      const statsData = statsRes.data || { 
        total: 0, 
        plan: 0, 
        in_progress: 0, 
        completed: 0, 
        overdue: 0 
      }
      
      setTasks(tasksData)
      setPagination(paginationData)
      setStats(statsData)
    } catch (err) {
      console.error('Error loading data:', err)
      // Set safe defaults on error
      setTasks([])
      setPagination({ page: 1, limit: 10, total: 0, totalPages: 1 })
      setStats({ total: 0, plan: 0, in_progress: 0, completed: 0, overdue: 0 })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // For non-admin users, ensure employee_id is set from user
    const submitData = {
      ...formData,
      employee_id: user?.role === 'admin' ? formData.employee_id : (formData.employee_id || user?.employee_id)
    }
    
    // Validate employee_id
    if (!submitData.employee_id) {
      console.error('Missing employee_id:', { user, formData, submitData })
      alert('Employee ID is required. Please contact admin if this issue persists.')
      return
    }
    
    console.log('Submitting task data:', submitData)
    
    try {
      if (editing) {
        await tasksAPI.update(editing.task_id, submitData)
        alert('Task updated successfully!')
      } else {
        await tasksAPI.create(submitData)
        alert('Task created successfully!')
      }
      setShowModal(false)
      resetForm()
      loadData()
    } catch (err) {
      console.error('Error saving task:', err)
      alert('Error saving task: ' + (err.response?.data?.message || err.message))
    }
  }

  const handleEdit = (task) => {
    setEditing(task)
    setFormData({
      employee_id: task.employee_id,
      client_name: task.client_name,
      project_name: task.project_name,
      task_detail: task.task_detail,
      due_date: task.due_date?.split('T')[0] || '',
      status: task.status,
    })
    setShowModal(true)
  }

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await tasksAPI.update(taskId, { status: newStatus })
      
      // If status changed to Completed, ask if want to archive
      if (newStatus === 'Completed') {
        if (window.confirm('Task completed! Do you want to archive this task?')) {
          await tasksAPI.archive(taskId)
        }
      }
      
      loadData()
    } catch (err) {
      alert('Error updating status')
    }
  }

  const handleDelete = async (taskId) => {
    if (!window.confirm('Delete this task?')) return
    try {
      await tasksAPI.delete(taskId)
      loadData()
    } catch (err) {
      alert('Error deleting task')
    }
  }

  const handleArchive = async (taskId) => {
    if (!window.confirm('Archive this task?')) return
    try {
      await tasksAPI.archive(taskId)
      loadData()
    } catch (err) {
      alert('Error archiving task')
    }
  }

  const handleUnarchive = async (taskId) => {
    try {
      await tasksAPI.unarchive(taskId)
      loadData()
    } catch (err) {
      alert('Error unarchiving task')
    }
  }

  const resetForm = () => {
    setFormData({
      employee_id: user?.employee_id || '',
      client_name: '',
      project_name: '',
      task_detail: '',
      due_date: '',
      status: 'Plan',
    })
    setEditing(null)
  }

  const isOverdue = (dueDate, status) => {
    if (status === 'Completed') return false
    return new Date(dueDate) < new Date()
  }

  // Get employee name helper
  const getEmployeeName = (employeeId) => {
    const employee = employees.find(emp => emp.employee_id === employeeId)
    return employee ? employee.full_name : employeeId
  }

  if (loading) return <div className="text-center py-12">Loading...</div>

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Task Management</h1>
        <button
          onClick={() => { resetForm(); setShowModal(true) }}
          className="btn-gradient px-6 py-3 rounded-lg text-white font-semibold flex items-center gap-2"
        >
          <Plus size={20} />
          Add Task
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div className="glass rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400">Total Tasks</span>
            <CheckCircle className="text-purple-400" size={24} />
          </div>
          <div className="text-3xl font-bold">{stats.total || 0}</div>
        </div>
        <div className="glass rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400">Plan</span>
            <Clock className="text-gray-400" size={24} />
          </div>
          <div className="text-3xl font-bold">{stats.plan || 0}</div>
        </div>
        <div className="glass rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400">On Progress</span>
            <Clock className="text-blue-400" size={24} />
          </div>
          <div className="text-3xl font-bold text-blue-400">{stats.in_progress || 0}</div>
        </div>
        <div className="glass rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400">Completed</span>
            <CheckCircle className="text-green-400" size={24} />
          </div>
          <div className="text-3xl font-bold text-green-400">{stats.completed || 0}</div>
        </div>
        <div className="glass rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400">Overdue</span>
            <Calendar className="text-red-400" size={24} />
          </div>
          <div className="text-3xl font-bold text-red-400">{stats.overdue || 0}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass rounded-xl p-6 mb-6">
        <div className="flex flex-wrap gap-4">
          {/* Archive Toggle */}
          <button
            onClick={() => { setViewArchived(!viewArchived); setCurrentPage(1) }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewArchived 
                ? 'bg-yellow-600 text-white' 
                : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
            }`}
          >
            {viewArchived ? 'View Active' : 'View Archived'}
          </button>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1) }}
            className="px-4 py-2 bg-dark-700 border border-white/10 rounded-lg"
          >
            <option value="">All Status</option>
            <option value="Plan">Plan</option>
            <option value="On Progress">On Progress</option>
            <option value="Completed">Completed</option>
          </select>

          {/* Employee Filter - Admin Only */}
          {user?.role === 'admin' && (
            <select
              value={employeeFilter}
              onChange={(e) => { setEmployeeFilter(e.target.value); setCurrentPage(1) }}
              className="px-4 py-2 bg-dark-700 border border-white/10 rounded-lg"
            >
              <option value="">All Employees</option>
              {employees.map(emp => (
                <option key={emp.employee_id} value={emp.employee_id}>
                  {emp.full_name}
                </option>
              ))}
            </select>
          )}

          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1) }}
              className="w-full px-4 py-2 bg-dark-700 border border-white/10 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold">Employee</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Client</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Project</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Task Detail</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Due Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {tasks.length > 0 ? tasks.map((task) => (
                <tr key={task.task_id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium">{getEmployeeName(task.employee_id)}</div>
                    <div className="text-xs text-gray-400">{task.employee_id}</div>
                  </td>
                  <td className="px-6 py-4">{task.client_name}</td>
                  <td className="px-6 py-4">{task.project_name}</td>
                  <td className="px-6 py-4">
                    <div className="max-w-xs truncate text-gray-300">{task.task_detail}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className={isOverdue(task.due_date, task.status) ? 'text-red-400' : 'text-gray-400'} />
                      <span className={isOverdue(task.due_date, task.status) ? 'text-red-400 font-semibold' : ''}>
                        {new Date(task.due_date).toLocaleDateString('en-GB')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {!viewArchived ? (
                      <select
                        value={task.status}
                        onChange={(e) => handleStatusChange(task.task_id, e.target.value)}
                        className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                          task.status === 'Completed' ? 'bg-green-500/20 text-green-400' :
                          task.status === 'On Progress' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}
                      >
                        <option value="Plan">Plan</option>
                        <option value="On Progress">On Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400">
                        {task.status}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {!viewArchived ? (
                        <>
                          <button
                            onClick={() => handleEdit(task)}
                            className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          {task.status === 'Completed' && (
                            <button
                              onClick={() => handleArchive(task.task_id)}
                              className="p-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg"
                              title="Archive"
                            >
                              <Archive size={16} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(task.task_id)}
                            className="p-2 bg-red-600 hover:bg-red-700 rounded-lg"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleUnarchive(task.task_id)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm"
                        >
                          Unarchive
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-400">
                    {viewArchived ? 'No archived tasks' : 'No tasks found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination?.totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 p-4 border-t border-white/10">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-dark-700 rounded-lg disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-400">
              Page {currentPage} of {pagination?.totalPages || 1} ({pagination?.total || 0} tasks)
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(pagination?.totalPages || 1, p + 1))}
              disabled={currentPage >= (pagination?.totalPages || 1)}
              className="px-4 py-2 bg-dark-700 rounded-lg disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6">{editing ? 'Edit' : 'Add'} Task</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Employee Selection */}
              {user?.role === 'admin' ? (
                <div>
                  <label className="block text-sm font-medium mb-2">Employee *</label>
                  <select
                    value={formData.employee_id}
                    onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
                    className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-lg focus:outline-none focus:border-primary-500"
                    required
                  >
                    <option value="">Select Employee</option>
                    {employees.map(emp => (
                      <option key={emp.employee_id} value={emp.employee_id}>
                        {emp.full_name} ({emp.employee_id})
                      </option>
                    ))}
                  </select>
                </div>
              ) : user?.employee_id ? (
                <div>
                  <label className="block text-sm font-medium mb-2">Employee</label>
                  <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <p className="text-sm text-blue-400">
                      Task for: <span className="font-semibold">{getEmployeeName(user?.employee_id) || user?.employee_id}</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Employee ID: {formData.employee_id || user?.employee_id}</p>
                  </div>
                  {/* Ensure employee_id is set */}
                  <input type="hidden" name="employee_id" value={formData.employee_id || user?.employee_id} />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium mb-2">Employee ID *</label>
                  <div className="space-y-2">
                    <select
                      value={formData.employee_id}
                      onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
                      className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-lg focus:outline-none focus:border-primary-500"
                      required
                    >
                      <option value="">Select Your Employee ID</option>
                      {employees.map(emp => (
                        <option key={emp.employee_id} value={emp.employee_id}>
                          {emp.full_name} ({emp.employee_id})
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-yellow-400">
                      ⚠️ Your account is not linked to an employee ID. Please select your ID from the list above.
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Client Name *</label>
                  <input
                    type="text"
                    value={formData.client_name}
                    onChange={(e) => setFormData({...formData, client_name: e.target.value})}
                    className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-lg focus:outline-none focus:border-primary-500"
                    placeholder="e.g., Bank ABC"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Project Name *</label>
                  <input
                    type="text"
                    value={formData.project_name}
                    onChange={(e) => setFormData({...formData, project_name: e.target.value})}
                    className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-lg focus:outline-none focus:border-primary-500"
                    placeholder="e.g., Data Migration"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Task Detail *</label>
                <textarea
                  value={formData.task_detail}
                  onChange={(e) => setFormData({...formData, task_detail: e.target.value})}
                  className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-lg focus:outline-none focus:border-primary-500"
                  rows="3"
                  placeholder="Describe the task in detail..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Due Date *</label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                    className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-lg focus:outline-none focus:border-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-lg focus:outline-none focus:border-primary-500"
                  >
                    <option value="Plan">Plan</option>
                    <option value="On Progress">On Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  type="submit"
                  className="flex-1 btn-gradient py-3 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity"
                >
                  {editing ? 'Update' : 'Create'} Task
                </button>
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm() }}
                  className="flex-1 py-3 bg-dark-700 hover:bg-dark-600 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
