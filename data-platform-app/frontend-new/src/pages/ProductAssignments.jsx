import { useState, useEffect } from 'react'
import { productAssignmentsAPI, employeesAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { Plus, Edit, Trash2, Search, Filter } from 'lucide-react'

export default function ProductAssignments() {
  const [assignments, setAssignments] = useState([])
  const [employees, setEmployees] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [productFilter, setProductFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const { user } = useAuth()
  const itemsPerPage = 10

  const [formData, setFormData] = useState({
    employee_id: '',
    product_id: '',
    assignment_type: 'Primary',
    level: 'Intermediate',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [assignRes, empRes, prodRes] = await Promise.all([
        productAssignmentsAPI.getAll(),
        employeesAPI.getAll(),
        productAssignmentsAPI.getProducts(),
      ])
      setAssignments(assignRes.data)
      setEmployees(empRes.data)
      setProducts(prodRes.data)
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
        await productAssignmentsAPI.update(editing.id, formData)
      } else {
        await productAssignmentsAPI.create(formData)
      }
      setShowModal(false)
      resetForm()
      loadData()
    } catch (err) {
      alert('Error saving assignment')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) return
    try {
      await productAssignmentsAPI.delete(id)
      loadData()
    } catch (err) {
      alert('Error deleting assignment')
    }
  }

  const resetForm = () => {
    setFormData({
      employee_id: '',
      product_id: '',
      assignment_type: 'Primary',
      level: 'Intermediate',
    })
    setEditing(null)
  }

  const handleEdit = (assign) => {
    setEditing(assign)
    setFormData({
      employee_id: assign.employee_id,
      product_id: assign.product_id,
      assignment_type: assign.assignment_type,
      level: assign.level,
    })
    setShowModal(true)
  }

  // Filter by search term (employee name or ID) AND product filter
  const filteredAssignments = assignments.filter(assign => {
    const matchesSearch = 
      assign.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assign.employee_id?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesProduct = productFilter === '' || assign.product_id === parseInt(productFilter)
    
    return matchesSearch && matchesProduct
  })

  const indexOfLast = currentPage * itemsPerPage
  const indexOfFirst = indexOfLast - itemsPerPage
  const currentItems = filteredAssignments.slice(indexOfFirst, indexOfLast)
  const totalPages = Math.ceil(filteredAssignments.length / itemsPerPage)

  if (loading) return <div className="text-center py-12">Loading...</div>

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Product Assignments ({filteredAssignments.length})</h1>
        {user?.role === 'admin' && (
          <button
            onClick={() => { resetForm(); setShowModal(true) }}
            className="btn-gradient px-6 py-3 rounded-lg text-white font-semibold flex items-center gap-2"
          >
            <Plus size={20} />
            Add Assignment
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by employee name or ID..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1) }}
            className="w-full pl-10 pr-4 py-3 bg-dark-800 border border-white/10 rounded-lg focus:outline-none focus:border-primary-500"
          />
        </div>

        {/* Product Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <select
            value={productFilter}
            onChange={(e) => { setProductFilter(e.target.value); setCurrentPage(1) }}
            className="w-full pl-10 pr-4 py-3 bg-dark-800 border border-white/10 rounded-lg focus:outline-none focus:border-primary-500"
          >
            <option value="">All Products</option>
            {products.map(prod => (
              <option key={prod.product_id} value={prod.product_id}>
                {prod.product_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold">Employee ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Employee Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Product</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Assignment Type</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Level</th>
                {user?.role === 'admin' && (
                  <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {currentItems.length > 0 ? currentItems.map((assign) => (
                <tr key={assign.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-mono text-sm">{assign.employee_id}</td>
                  <td className="px-6 py-4">{assign.full_name}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-medium">
                      {assign.product_name}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      assign.assignment_type === 'Primary' 
                        ? 'bg-blue-500/20 text-blue-400' 
                        : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {assign.assignment_type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      assign.level === 'Expert' ? 'bg-green-500/20 text-green-400' :
                      assign.level === 'Advanced' ? 'bg-blue-500/20 text-blue-400' :
                      assign.level === 'Intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {assign.level}
                    </span>
                  </td>
                  {user?.role === 'admin' && (
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(assign)}
                          className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(assign.id)}
                          className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              )) : (
                <tr>
                  <td colSpan={user?.role === 'admin' ? 6 : 5} className="px-6 py-12 text-center text-gray-400">
                    No assignments found
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

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6">
              {editing ? 'Edit Product Assignment' : 'Add Product Assignment'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Employee</label>
                <select
                  value={formData.employee_id}
                  onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
                  className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-lg focus:outline-none focus:border-primary-500"
                  required
                  disabled={!!editing}
                >
                  <option value="">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp.employee_id} value={emp.employee_id}>
                      {emp.employee_id} - {emp.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Product</label>
                <select
                  value={formData.product_id}
                  onChange={(e) => setFormData({...formData, product_id: e.target.value})}
                  className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-lg focus:outline-none focus:border-primary-500"
                  required
                >
                  <option value="">Select Product</option>
                  {products.map(prod => (
                    <option key={prod.product_id} value={prod.product_id}>
                      {prod.product_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Assignment Type</label>
                <select
                  value={formData.assignment_type}
                  onChange={(e) => setFormData({...formData, assignment_type: e.target.value})}
                  className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-lg focus:outline-none focus:border-primary-500"
                >
                  <option value="Primary">Primary</option>
                  <option value="Secondary">Secondary</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Level</label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData({...formData, level: e.target.value})}
                  className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-lg focus:outline-none focus:border-primary-500"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Expert">Expert</option>
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
