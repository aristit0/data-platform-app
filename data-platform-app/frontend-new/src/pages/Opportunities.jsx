import { useState, useEffect } from 'react'
import { opportunitiesAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { Plus, Edit, Trash2, Filter } from 'lucide-react'

export default function Opportunities() {
  const [opportunities, setOpportunities] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [typeFilter, setTypeFilter] = useState('')
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear())
  const [quarterFilter, setQuarterFilter] = useState('')
  const { user } = useAuth()

  const [formData, setFormData] = useState({
    project_name: '',
    client: '',
    type: 'Implementation',
    year: new Date().getFullYear(),
    quarter: 1,
    actual_status: 'Open',
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

      const opptyRes = await opportunitiesAPI.getAll(params)
      setOpportunities(opptyRes.data)
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
        await opportunitiesAPI.update(editing.oppty_id, formData)
      } else {
        await opportunitiesAPI.create(formData)
      }
      setShowModal(false)
      resetForm()
      loadData()
    } catch (err) {
      alert('Error saving opportunity')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this opportunity?')) return
    try {
      await opportunitiesAPI.delete(id)
      loadData()
    } catch (err) {
      alert('Error deleting opportunity')
    }
  }

  const resetForm = () => {
    setFormData({
      project_name: '',
      client: '',
      type: 'Implementation',
      year: new Date().getFullYear(),
      quarter: 1,
      actual_status: 'Open',
    })
    setEditing(null)
  }

  const handleEdit = (oppty) => {
    setEditing(oppty)
    setFormData({
      project_name: oppty.project_name,
      client: oppty.client,
      type: oppty.type,
      year: oppty.year,
      quarter: oppty.quarter,
      actual_status: oppty.actual_status,
    })
    setShowModal(true)
  }

  if (loading) return <div className="text-center py-12">Loading...</div>

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Opportunities ({opportunities.length})</h1>
        {user?.role === 'admin' && (
          <button
            onClick={() => { resetForm(); setShowModal(true) }}
            className="btn-gradient px-6 py-3 rounded-lg text-white font-semibold flex items-center gap-2"
          >
            <Plus size={20} />
            Add Opportunity
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
              <th className="px-6 py-4 text-left text-sm font-semibold">Customer</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Type</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Year</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Quarter</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
              {user?.role === 'admin' && (
                <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {opportunities.map((oppty) => (
              <tr key={oppty.oppty_id} className="hover:bg-white/5">
                <td className="px-6 py-4 font-medium">{oppty.project_name}</td>
                <td className="px-6 py-4">{oppty.client}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs ${
                    oppty.type === 'Implementation' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
                  }`}>
                    {oppty.type}
                  </span>
                </td>
                <td className="px-6 py-4">{oppty.year}</td>
                <td className="px-6 py-4">Q{oppty.quarter}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    oppty.actual_status === 'Win' ? 'bg-green-500/20 text-green-400' :
                    oppty.actual_status === 'Open' ? 'bg-blue-500/20 text-blue-400' :
                    oppty.actual_status === 'Lose' ? 'bg-red-500/20 text-red-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {oppty.actual_status}
                  </span>
                </td>
                {user?.role === 'admin' && (
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(oppty)} className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDelete(oppty.oppty_id)} className="p-2 bg-red-600 hover:bg-red-700 rounded-lg">
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold mb-6">{editing ? 'Edit' : 'Add'} Opportunity</h3>
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
                <label className="block text-sm font-medium mb-2">Customer</label>
                <input 
                  type="text" 
                  value={formData.client} 
                  onChange={(e) => setFormData({...formData, client: e.target.value})} 
                  className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-lg" 
                  required 
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
                  value={formData.actual_status} 
                  onChange={(e) => setFormData({...formData, actual_status: e.target.value})} 
                  className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-lg"
                >
                  <option value="Open">Open</option>
                  <option value="Win">Win</option>
                  <option value="Lose">Lose</option>
                  <option value="Drop">Drop</option>
                </select>
              </div>
              <div className="flex gap-4 mt-6">
                <button 
                  type="submit" 
                  className="flex-1 btn-gradient py-3 rounded-lg text-white font-semibold"
                >
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
    </div>
  )
}
