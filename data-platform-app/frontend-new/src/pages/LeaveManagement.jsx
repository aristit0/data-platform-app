import { useState, useEffect } from 'react'
import { leavesAPI, employeesAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { Plus, CheckCircle, XCircle, Trash2, Calendar, Eye } from 'lucide-react'

export default function LeaveManagement() {
  const [leaves, setLeaves] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showReasonModal, setShowReasonModal] = useState(false)
  const [selectedLeave, setSelectedLeave] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('approved')
  const { user } = useAuth()
  const itemsPerPage = 10

  const [formData, setFormData] = useState({
    employee_id: user?.email === 'admin@dataplatform.com' ? '' : user?.employee_id || '',
    leave_type: 'Annual Leave',
    start_date: '',
    end_date: '',
    total_days: 0,
    replacement_employee_id: '',
    reason: '',
  })

  useEffect(() => {
    loadData()
  }, [statusFilter])

  const loadData = async () => {
    try {
      const params = { year: new Date().getFullYear() }
      if (statusFilter) params.status = statusFilter
      
      const [leavesRes, empRes] = await Promise.all([
        leavesAPI.getAll(params),
        employeesAPI.getAll()
      ])
      
      // Handle different response structures for employees
      let employeesData = []
      if (empRes.data) {
        if (Array.isArray(empRes.data.data)) {
          employeesData = empRes.data.data
        } else if (Array.isArray(empRes.data)) {
          employeesData = empRes.data
        }
      }
      
      setLeaves(leavesRes.data || [])
      setEmployees(employeesData)
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Helper function to get employee name from ID
  const getEmployeeName = (employeeId) => {
    if (!employeeId) return '-'
    const employee = employees.find(emp => emp.employee_id === employeeId)
    return employee ? employee.full_name : employeeId
  }

  const calculateDays = (start, end) => {
    if (!start || !end) return 0
    const startDate = new Date(start)
    const endDate = new Date(end)
    const diffTime = Math.abs(endDate - startDate)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    return diffDays
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // For non-admin users, ensure employee_id is set from user
    const submitData = {
      ...formData,
      employee_id: user?.role === 'admin' ? formData.employee_id : (formData.employee_id || user?.employee_id),
      total_days: calculateDays(formData.start_date, formData.end_date),
      status: 'pending'
    }
    
    // Validate employee_id
    if (!submitData.employee_id) {
      console.error('Missing employee_id:', { user, formData, submitData })
      alert('Employee ID is required. Please contact admin if this issue persists.')
      return
    }
    
    console.log('Submitting leave data:', submitData)
    
    try {
      await leavesAPI.create(submitData)
      setShowModal(false)
      resetForm()
      loadData()
      alert('Leave request submitted successfully!')
    } catch (err) {
      console.error('Error submitting:', err)
      alert('Error submitting leave request: ' + (err.response?.data?.message || err.message))
    }
  }

  const handleApprove = async (id) => {
    if (!window.confirm('Approve this leave request?')) return
    try {
      // Update the leave with approved status
      await leavesAPI.update(id, { status: 'approved' })
      loadData()
      alert('Leave request approved!')
    } catch (err) {
      console.error('Error approving:', err)
      alert('Error approving leave')
    }
  }

  const handleReject = async (id) => {
    if (!window.confirm('Reject this leave request?')) return
    try {
      // Update the leave with rejected status
      await leavesAPI.update(id, { status: 'rejected' })
      loadData()
      alert('Leave request rejected')
    } catch (err) {
      console.error('Error rejecting:', err)
      alert('Error rejecting leave')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this leave record?')) return
    try {
      await leavesAPI.delete(id)
      loadData()
      alert('Leave record deleted')
    } catch (err) {
      alert('Error deleting leave')
    }
  }

  const handleViewReason = (leave) => {
    setSelectedLeave(leave)
    setShowReasonModal(true)
  }

  const resetForm = () => {
    setFormData({
      employee_id: user?.email === 'admin@dataplatform.com' ? '' : user?.employee_id || '',
      leave_type: 'Annual Leave',
      start_date: '',
      end_date: '',
      total_days: 0,
      replacement_employee_id: '',
      reason: '',
    })
  }

  // Sort by start_date DESC (newest first)
  const sortedLeaves = [...leaves].sort((a, b) => 
    new Date(b.start_date) - new Date(a.start_date)
  )

  const indexOfLast = currentPage * itemsPerPage
  const indexOfFirst = indexOfLast - itemsPerPage
  const currentItems = sortedLeaves.slice(indexOfFirst, indexOfLast)
  const totalPages = Math.ceil(sortedLeaves.length / itemsPerPage)

  if (loading) return <div className="text-center py-12">Loading...</div>

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Leave Management</h1>
        <button
          onClick={() => { resetForm(); setShowModal(true) }}
          className="btn-gradient px-6 py-3 rounded-lg text-white font-semibold flex items-center gap-2"
        >
          <Plus size={20} />
          Request Leave
        </button>
      </div>

      {/* Status Filter */}
      <div className="mb-6 flex gap-4">
        <button
          onClick={() => { setStatusFilter('approved'); setCurrentPage(1) }}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            statusFilter === 'approved' 
              ? 'bg-green-600 text-white' 
              : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
          }`}
        >
          Approved Leaves
        </button>
        {user?.role === 'admin' && (
          <button
            onClick={() => { setStatusFilter('pending'); setCurrentPage(1) }}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === 'pending' 
                ? 'bg-yellow-600 text-white' 
                : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
            }`}
          >
            Pending Requests
          </button>
        )}
        <button
          onClick={() => { setStatusFilter(''); setCurrentPage(1) }}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            statusFilter === '' 
              ? 'bg-blue-600 text-white' 
              : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
          }`}
        >
          All Leaves
        </button>
      </div>

      {/* Table */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold">Employee</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Type</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Start Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">End Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Days</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Replacement</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Reason</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                {user?.role === 'admin' && (
                  <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {currentItems.length > 0 ? currentItems.map((leave) => (
                <tr key={leave.leave_id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium">{getEmployeeName(leave.employee_id)}</div>
                    <div className="text-sm text-gray-400">{leave.employee_id}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400">
                      {leave.leave_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300">
                    {new Date(leave.start_date).toLocaleDateString('en-GB')}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300">
                    {new Date(leave.end_date).toLocaleDateString('en-GB')}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold">{leave.total_days} days</span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {leave.replacement_employee_id ? (
                      <div>
                        <div className="font-medium text-gray-300">
                          {getEmployeeName(leave.replacement_employee_id)}
                        </div>
                        <div className="text-xs text-gray-400">{leave.replacement_employee_id}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleViewReason(leave)}
                      className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                      title="View Reason"
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      leave.status === 'approved' ? 'bg-green-500/20 text-green-400' : 
                      leave.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {leave.status}
                    </span>
                  </td>
                  {user?.role === 'admin' && (
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {leave.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(leave.leave_id)}
                              className="p-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                              title="Approve"
                            >
                              <CheckCircle size={16} />
                            </button>
                            <button
                              onClick={() => handleReject(leave.leave_id)}
                              className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                              title="Reject"
                            >
                              <XCircle size={16} />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDelete(leave.leave_id)}
                          className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              )) : (
                <tr>
                  <td colSpan={user?.role === 'admin' ? 9 : 8} className="px-6 py-12 text-center text-gray-400">
                    No leave records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 p-4 border-t border-white/10">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-dark-700 rounded-lg disabled:opacity-50 hover:bg-dark-600 transition-colors"
            >
              Previous
            </button>
            <span className="text-sm text-gray-400">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-dark-700 rounded-lg disabled:opacity-50 hover:bg-dark-600 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Request Leave Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass rounded-2xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6">Request Leave</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
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
                      Request for: <span className="font-semibold">{getEmployeeName(user?.employee_id) || user?.employee_id}</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Employee ID: {user?.employee_id}</p>
                  </div>
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

              <div>
                <label className="block text-sm font-medium mb-2">Leave Type</label>
                <select
                  value={formData.leave_type}
                  onChange={(e) => setFormData({...formData, leave_type: e.target.value})}
                  className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-lg focus:outline-none focus:border-primary-500"
                >
                  <option value="Annual Leave">Annual Leave</option>
                  <option value="Sick Leave">Sick Leave</option>
                  <option value="Emergency Leave">Emergency Leave</option>
                  <option value="Unpaid Leave">Unpaid Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Start Date *</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                    className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-lg focus:outline-none focus:border-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">End Date *</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                    className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-lg focus:outline-none focus:border-primary-500"
                    required
                  />
                </div>
              </div>

              {formData.start_date && formData.end_date && (
                <div className="p-4 bg-blue-500/10 border border-blue-500/50 rounded-lg">
                  <p className="text-sm text-blue-400">
                    Total Days: <span className="font-bold">{calculateDays(formData.start_date, formData.end_date)}</span>
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Replacement Employee (Optional)</label>
                <select
                  value={formData.replacement_employee_id}
                  onChange={(e) => setFormData({...formData, replacement_employee_id: e.target.value})}
                  className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-lg focus:outline-none focus:border-primary-500"
                >
                  <option value="">Select Replacement</option>
                  {employees.filter(e => e.employee_id !== formData.employee_id).map(emp => (
                    <option key={emp.employee_id} value={emp.employee_id}>
                      {emp.full_name} ({emp.employee_id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Reason *</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-lg focus:outline-none focus:border-primary-500"
                  rows="3"
                  placeholder="Enter reason for leave..."
                  required
                />
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  type="submit"
                  className="flex-1 btn-gradient py-3 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity"
                >
                  Submit Request
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

      {/* View Reason Modal */}
      {showReasonModal && selectedLeave && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass rounded-2xl p-8 max-w-lg w-full">
            <h3 className="text-2xl font-bold mb-6">Leave Reason</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Employee</label>
                <p className="text-lg font-semibold">{getEmployeeName(selectedLeave.employee_id)}</p>
                <p className="text-sm text-gray-400">{selectedLeave.employee_id}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Leave Type</label>
                <p className="text-lg">{selectedLeave.leave_type}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Start Date</label>
                  <p>{new Date(selectedLeave.start_date).toLocaleDateString('en-GB')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">End Date</label>
                  <p>{new Date(selectedLeave.end_date).toLocaleDateString('en-GB')}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Reason</label>
                <div className="p-4 bg-dark-700 rounded-lg border border-white/10">
                  <p className="text-gray-200 whitespace-pre-wrap">{selectedLeave.reason || 'No reason provided'}</p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => setShowReasonModal(false)}
                className="w-full py-3 bg-dark-700 hover:bg-dark-600 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
