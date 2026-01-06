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

  // Set employee_id when user loads or changes
  useEffect(() => {
    if (user?.employee_id && !formData.employee_id) {
      setFormData(prev => ({
        ...prev,
        employee_id: user.employee_id
      }))
    }
  }, [user])

  useEffect(() => {
    loadEmployees()
  }, [])

  useEffect(() => {
    loadData()
  }, [currentPage, statusFilter, employeeFilter, viewArchived, searchTerm])

  const loadEmployees = async () => {
    try {
      const response = await employeesAPI.getAll()
      // Axios returns data in response.data
      setEmployees(response.data?.data || response.data || [])
    } catch (err) {
      console.error('Error loading employees:', err)
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
    try {
      if (editing) {
        await tasksAPI.update(editing.task_id, formData)
      } else {
        await tasksAPI.create(formData)
      }
      setShowModal(false)
      resetForm()
      loadData()
    } catch (err) {
      alert('Error saving task')
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

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="glass rounded-xl p-4">
          <p className="text-sm text-gray-400 mb-1">Total Tasks</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="glass rounded-xl p-4">
          <p className="text-sm text-gray-400 mb-1">Plan</p>
          <p className="text-2xl font-bold text-gray-400">{stats.plan}</p>
        </div>
        <div className="glass rounded-xl p-4">
          <p className="text-sm text-gray-400 mb-1">In Progress</p>
          <p className="text-2xl font-bold text-blue-400">{stats.in_progress}</p>
        </div>
        <div className="glass rounded-xl p-4">
          <p className="text-sm text-gray-400 mb-1">Completed</p>
          <p className="text-2xl font-bold text-green-400">{stats.completed}</p>
        </div>
        <div className="glass rounded-xl p-4">
          <p className="text-sm text-gray-400 mb-1">Overdue</p>
          <p className="text-2xl font-bold text-red-400">{stats.overdue}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search client, project, task, or employee..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1) }}
            className="w-full pl-10 pr-4 py-3 bg-dark-800 border border-white/10 rounded-lg"
          />
        </div>

        {/* Employee Filter - Admin Only */}
        {user?.role === 'admin' && (
          <select
            value={employeeFilter}
            onChange={(e) => { setEmployeeFilter(e.target.value); setCurrentPage(1) }}
            className="px-4 py-3 bg-dark-800 border border-white/10 rounded-lg"
          >
            <option value="">All Employees</option>
            {employees.map(emp => (
              <option key={emp.employee_id} value={emp.employee_id}>
                {emp.full_name}
              </option>
            ))}
          </select>
        )}

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1) }}
          className="px-4 py-3 bg-dark-800 border border-white/10 rounded-lg"
        >
          <option value="">All Status</option>
          <option value="Plan">Plan</option>
          <option value="On Progress">On Progress</option>
          <option value="Completed">Completed</option>
        </select>

        {/* Archive Toggle */}
        <button
          onClick={() => { setViewArchived(!viewArchived); setCurrentPage(1) }}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            viewArchived 
              ? 'bg-yellow-600 text-white' 
              : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
          }`}
        >
          <Archive size={20} className="inline mr-2" />
          {viewArchived ? 'Viewing Archived' : 'View Archive'}
        </button>
      </div>

      {/* Tasks List */}
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
                <tr key={task.task_id} className="hover:bg-white/5">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium">{task.employee_name}</p>
                      <p className="text-xs text-gray-400">{task.employee_id}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">{task.client_name}</td>
                  <td className="px-6 py-4">{task.project_name}</td>
                  <td className="px-6 py-4">
                    <p className="max-w-xs truncate" title={task.task_detail}>
                      {task.task_detail}
                    </p>
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
                    className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-lg"
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
              ) : (
                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-sm text-blue-400">
                    Task for: <span className="font-semibold">{user?.name || user?.employee_id}</span>
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Client Name</label>
                  <input
                    type="text"
                    value={formData.client_name}
                    onChange={(e) => setFormData({...formData, client_name: e.target.value})}
                    className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-lg"
                    placeholder="e.g., Bank ABC"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Project Name</label>
                  <input
                    type="text"
                    value={formData.project_name}
                    onChange={(e) => setFormData({...formData, project_name: e.target.value})}
                    className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-lg"
                    placeholder="e.g., Data Migration"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Task Detail</label>
                <textarea
                  value={formData.task_detail}
                  onChange={(e) => setFormData({...formData, task_detail: e.target.value})}
                  className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-lg"
                  rows="3"
                  placeholder="Describe the task in detail..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Due Date</label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                    className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-lg"
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
                  className="flex-1 btn-gradient py-3 rounded-lg text-white font-semibold"
                >
                  {editing ? 'Update' : 'Create'} Task
                </button>
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm() }}
                  className="flex-1 py-3 bg-dark-700 hover:bg-dark-600 rounded-lg"
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
