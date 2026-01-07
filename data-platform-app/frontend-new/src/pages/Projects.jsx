import { useState, useEffect } from 'react'
import { projectsAPI, employeesAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { Plus, Edit, Trash2, Filter, Users, X, UserPlus } from 'lucide-react'

export default function Projects() {
  const [projects, setProjects] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showAssignmentModal, setShowAssignmentModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [selectedProject, setSelectedProject] = useState(null)
  const [typeFilter, setTypeFilter] = useState('')
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear())
  const [quarterFilter, setQuarterFilter] = useState('')
  const { user } = useAuth()

  const [formData, setFormData] = useState({
    project_name: '',
    type: 'Implementation',
    client: '',
    year: new Date().getFullYear(),
    quarter: 1,
    status: 'On Progress',
  })

  const [assignmentFormData, setAssignmentFormData] = useState({
    employee_id: '',
    custom_name: '',
    role: 'Developer',
    allocation_percentage: 100
  })

  useEffect(() => {
    loadData()
  }, [typeFilter, yearFilter, quarterFilter])

  const loadData = async () => {
    try {
      const params = {}
      if (yearFilter) params.year = yearFilter
      if (quarterFilter) params.quarter = quarterFilter
      if (typeFilter) params.type = typeFilter

      const [projRes, empRes] = await Promise.all([
        projectsAPI.getAll(params),
        employeesAPI.getAll()
      ])
      setProjects(projRes.data)
      setEmployees(empRes.data)
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editing) {
        await projectsAPI.update(editing.project_id, formData)
      } else {
        await projectsAPI.create(formData)
      }
      setShowModal(false)
      resetForm()
      loadData()
    } catch (err) {
      alert('Error saving project')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project?')) return
    try {
      await projectsAPI.delete(id)
      loadData()
    } catch (err) {
      alert('Error deleting project')
    }
  }

  const resetForm = () => {
    setFormData({
      project_name: '',
      type: 'Implementation',
      client: '',
      year: new Date().getFullYear(),
      quarter: 1,
      status: 'On Progress',
    })
    setEditing(null)
  }

  const handleEdit = (proj) => {
    setEditing(proj)
    setFormData({
      project_name: proj.project_name,
      type: proj.type,
      client: proj.client || '',
      year: proj.year,
      quarter: proj.quarter,
      status: proj.status,
    })
    setShowModal(true)
  }

  const openAssignmentModal = async (project) => {
    setSelectedProject(project)
    try {
      // Load project assignments
      const response = await projectsAPI.getAssignments(project.project_id)
      setSelectedProject({
        ...project,
        assignments: response.data || []
      })
    } catch (err) {
      console.error('Error loading assignments:', err)
      setSelectedProject({
        ...project,
        assignments: []
      })
    }
    setShowAssignmentModal(true)
  }

  const handleAddAssignment = async (e) => {
    e.preventDefault()
    try {
      // Validate: must have either employee_id or custom_name
      if (!assignmentFormData.employee_id && !assignmentFormData.custom_name.trim()) {
        alert('Please select an employee or enter a custom name')
        return
      }

      await projectsAPI.addAssignment(selectedProject.project_id, assignmentFormData)
      // Reload assignments
      const response = await projectsAPI.getAssignments(selectedProject.project_id)
      setSelectedProject({
        ...selectedProject,
        assignments: response.data || []
      })
      setAssignmentFormData({
        employee_id: '',
        custom_name: '',
        role: 'Developer',
        allocation_percentage: 100
      })
      loadData() // Refresh main list
    } catch (err) {
      alert('Error adding assignment')
    }
  }

  const handleRemoveAssignment = async (assignmentId) => {
    if (!window.confirm('Remove this assignment?')) return
    try {
      await projectsAPI.removeAssignment(assignmentId)
      // Reload assignments
      const response = await projectsAPI.getAssignments(selectedProject.project_id)
      setSelectedProject({
        ...selectedProject,
        assignments: response.data || []
      })
      loadData() // Refresh main list
    } catch (err) {
      alert('Error removing assignment')
    }
  }

  const getEmployeeName = (empId, customName) => {
    // If custom name exists, use it
    if (customName) return customName
    // Otherwise look up employee
    const emp = employees.find(e => e.employee_id === empId)
    return emp ? emp.full_name : empId
  }

  if (loading) return <div className="text-center py-12">Loading...</div>

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Projects ({projects.length})</h1>
        {user?.role === 'admin' && (
          <button
            onClick={() => { resetForm(); setShowModal(true) }}
            className="btn-gradient px-6 py-3 rounded-lg text-white font-semibold flex items-center gap-2"
          >
            <Plus size={20} />
            Add Project
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-dark-800 border border-white/10 rounded-lg"
          >
            <option value="">All Types</option>
            <option value="Implementation">Implementation</option>
            <option value="Maintenance">Maintenance</option>
          </select>
        </div>

        <div>
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="w-full px-4 py-3 bg-dark-800 border border-white/10 rounded-lg"
          >
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <div>
          <select
            value={quarterFilter}
            onChange={(e) => setQuarterFilter(e.target.value)}
            className="w-full px-4 py-3 bg-dark-800 border border-white/10 rounded-lg"
          >
            <option value="">All Quarters</option>
            {[1,2,3,4].map(q => <option key={q} value={q}>Q{q}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="glass rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-white/5">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold">Project Name</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Client</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Type</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Year</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Quarter</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Team</th>
              {user?.role === 'admin' && (
                <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {projects.map((proj) => (
              <tr key={proj.project_id} className="hover:bg-white/5">
                <td className="px-6 py-4 font-medium">{proj.project_name}</td>
                <td className="px-6 py-4 text-gray-400">{proj.client || '-'}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs ${
                    proj.type === 'Implementation' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
                  }`}>
                    {proj.type}
                  </span>
                </td>
                <td className="px-6 py-4">{proj.year}</td>
                <td className="px-6 py-4">Q{proj.quarter}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs ${
                    proj.status === 'Done' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {proj.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => openAssignmentModal(proj)}
                    className="flex items-center gap-2 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm"
                  >
                    <Users size={16} />
                    <span>{proj.assignment_count || 0}</span>
                  </button>
                </td>
                {user?.role === 'admin' && (
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(proj)} className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDelete(proj.project_id)} className="p-2 bg-red-600 hover:bg-red-700 rounded-lg">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Project Form Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold mb-6">{editing ? 'Edit' : 'Add'} Project</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Project Name</label>
                <input 
                  type="text" 
                  value={formData.project_name} 
                  onChange={(e) => setFormData({...formData, project_name: e.target.value})} 
                  className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-lg" 
                  required 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Client</label>
                <input 
                  type="text" 
                  value={formData.client} 
                  onChange={(e) => setFormData({...formData, client: e.target.value})} 
                  className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-lg" 
                  placeholder="Client name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Type</label>
                <select 
                  value={formData.type} 
                  onChange={(e) => setFormData({...formData, type: e.target.value})} 
                  className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-lg"
                >
                  <option value="Implementation">Implementation</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Year</label>
                  <input 
                    type="number" 
                    value={formData.year} 
                    onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})} 
                    className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-lg" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Quarter</label>
                  <select 
                    value={formData.quarter} 
                    onChange={(e) => setFormData({...formData, quarter: parseInt(e.target.value)})} 
                    className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-lg"
                  >
                    {[1,2,3,4].map(q => <option key={q} value={q}>Q{q}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <select 
                  value={formData.status} 
                  onChange={(e) => setFormData({...formData, status: e.target.value})} 
                  className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-lg"
                >
                  <option value="On Progress">On Progress</option>
                  <option value="Done">Done</option>
                </select>
              </div>

              <div className="flex gap-4 mt-6">
                <button type="submit" className="flex-1 btn-gradient py-3 rounded-lg text-white font-semibold">
                  {editing ? 'Update' : 'Save'}
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

      {/* Assignment Modal */}
      {showAssignmentModal && selectedProject && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-bold">{selectedProject.project_name}</h3>
                <p className="text-gray-400 text-sm mt-1">Team Assignments</p>
              </div>
              <button 
                onClick={() => setShowAssignmentModal(false)}
                className="p-2 hover:bg-white/10 rounded-lg"
              >
                <X size={24} />
              </button>
            </div>

            {/* Add Assignment Form */}
            {user?.role === 'admin' && (
              <form onSubmit={handleAddAssignment} className="mb-6 p-4 bg-dark-800 rounded-lg border border-white/10">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <UserPlus size={20} />
                  Add Team Member
                </h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Select Employee</label>
                      <select
                        value={assignmentFormData.employee_id}
                        onChange={(e) => setAssignmentFormData({
                          ...assignmentFormData, 
                          employee_id: e.target.value,
                          custom_name: '' // Clear custom name when selecting employee
                        })}
                        className="w-full px-4 py-2 bg-dark-700 border border-white/10 rounded-lg"
                        disabled={assignmentFormData.custom_name.trim() !== ''}
                      >
                        <option value="">-- Select from list --</option>
                        {employees.map(emp => (
                          <option key={emp.employee_id} value={emp.employee_id}>
                            {emp.full_name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Or Enter Custom Name</label>
                      <input
                        type="text"
                        value={assignmentFormData.custom_name}
                        onChange={(e) => setAssignmentFormData({
                          ...assignmentFormData,
                          custom_name: e.target.value,
                          employee_id: '' // Clear employee when entering custom name
                        })}
                        placeholder="e.g., External Consultant"
                        className="w-full px-4 py-2 bg-dark-700 border border-white/10 rounded-lg"
                        disabled={assignmentFormData.employee_id !== ''}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Role</label>
                      <select
                        value={assignmentFormData.role}
                        onChange={(e) => setAssignmentFormData({...assignmentFormData, role: e.target.value})}
                        className="w-full px-4 py-2 bg-dark-700 border border-white/10 rounded-lg"
                      >
                        <option value="Developer">Developer</option>
                        <option value="Tech Lead">Tech Lead</option>
                        <option value="Project Manager">Project Manager</option>
                        <option value="QA">QA</option>
                        <option value="DevOps">DevOps</option>
                        <option value="Analyst">Analyst</option>
                        <option value="Data Engineer">Data Engineer</option>
                        <option value="Software Engineer">Software Engineer</option>
                        <option value="Bigdata Engineer">Bigdata Engineer</option>
                        <option value="Cloud Engineer">Cloud Engineer</option>
                        <option value="ML Engineer">ML Engineer</option>
                        <option value="AI Engineer">AI Engineer</option>
                        <option value="Business Analyst">Business Analyst</option>
                        <option value="Technical Writer">Technical Writer</option>
                        <option value="BI Engineer">BI Engineer</option>
                        <option value="Backend Engineer">Backend Engineer</option>
                        <option value="Frontend Engineer">Frontend Engineer</option>
                        <option value="Fullstack Engineer">Fullstack Engineer</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Allocation (%)</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={assignmentFormData.allocation_percentage}
                        onChange={(e) => setAssignmentFormData({...assignmentFormData, allocation_percentage: parseInt(e.target.value) || 0})}
                        className="w-full px-4 py-2 bg-dark-700 border border-white/10 rounded-lg"
                        required
                      />
                    </div>
                  </div>
                </div>
                <button 
                  type="submit" 
                  className="mt-4 px-6 py-2 btn-gradient rounded-lg text-white font-semibold"
                >
                  Add to Team
                </button>
              </form>
            )}

            {/* Current Assignments */}
            <div>
              <h4 className="font-semibold mb-4">Current Team ({selectedProject.assignments?.length || 0})</h4>
              {selectedProject.assignments && selectedProject.assignments.length > 0 ? (
                <div className="space-y-3">
                  {selectedProject.assignments.map((assignment) => (
                    <div 
                      key={assignment.assignment_id} 
                      className="flex items-center justify-between p-4 bg-dark-800 rounded-lg border border-white/10"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center font-semibold">
                          {getEmployeeName(assignment.employee_id, assignment.custom_name).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{getEmployeeName(assignment.employee_id, assignment.custom_name)}</p>
                          {assignment.custom_name ? (
                            <p className="text-sm text-purple-400">Custom Member</p>
                          ) : (
                            <p className="text-sm text-gray-400">{assignment.employee_id}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">{assignment.role}</p>
                          <p className="text-xs text-gray-400">{assignment.allocation_percentage}% allocation</p>
                        </div>
                        {user?.role === 'admin' && (
                          <button
                            onClick={() => handleRemoveAssignment(assignment.assignment_id)}
                            className="p-2 bg-red-600 hover:bg-red-700 rounded-lg"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Users size={48} className="mx-auto mb-2 opacity-50" />
                  <p>No team members assigned yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
