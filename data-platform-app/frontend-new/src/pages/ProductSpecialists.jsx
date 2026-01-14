import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Search, 
  BarChart3,
  Building2,
  Package,
  User,
  Filter
} from 'lucide-react'

// Use the correct API URL - should match your other pages
//const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://dataplatform.tomodachis.org:2221/api'

const API_BASE_URL = '/api'

export default function ProductSpecialists() {
  const [specialists, setSpecialists] = useState([])
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showDashboard, setShowDashboard] = useState(true)
  const [editingId, setEditingId] = useState(null)
  
  // Filter states
  const [companyFilter, setCompanyFilter] = useState('')
  const [productFilter, setProductFilter] = useState('')
  const [picFilter, setPicFilter] = useState('')
  
  const [formData, setFormData] = useState({
    company: '',
    product: '',
    pic: ''
  })
  const [companies, setCompanies] = useState([])
  const [products, setProducts] = useState([])
  const [pics, setPics] = useState([])

  const { user } = useAuth()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token')
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      const [specialistsRes, dashboardRes, companiesRes, productsRes, picsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/product-specialists`, { headers }),
        fetch(`${API_BASE_URL}/product-specialists/dashboard`, { headers }),
        fetch(`${API_BASE_URL}/product-specialists/companies`, { headers }),
        fetch(`${API_BASE_URL}/product-specialists/products`, { headers }),
        fetch(`${API_BASE_URL}/product-specialists/pics`, { headers })
      ])

      const specialistsData = await specialistsRes.json()
      const dashboardData = await dashboardRes.json()
      const companiesData = await companiesRes.json()
      const productsData = await productsRes.json()
      const picsData = await picsRes.json()

      setSpecialists(specialistsData)
      setDashboard(dashboardData)
      setCompanies(companiesData)
      setProducts(productsData)
      setPics(picsData)
    } catch (error) {
      console.error('Error fetching data:', error)
      alert('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const token = localStorage.getItem('token')
      const url = editingId 
        ? `${API_BASE_URL}/product-specialists/${editingId}`
        : `${API_BASE_URL}/product-specialists`
      
      const response = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        alert(`Product specialist ${editingId ? 'updated' : 'created'} successfully`)
        setShowModal(false)
        resetForm()
        fetchData()
      } else {
        const error = await response.json()
        alert(error.message || 'Failed to save product specialist')
      }
    } catch (error) {
      console.error('Error saving product specialist:', error)
      alert('Failed to save product specialist')
    }
  }

  const handleEdit = (specialist) => {
    setEditingId(specialist.id)
    setFormData({
      company: specialist.company,
      product: specialist.product,
      pic: specialist.pic
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/product-specialists/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        alert('Product specialist deleted successfully')
        fetchData()
      } else {
        alert('Failed to delete product specialist')
      }
    } catch (error) {
      console.error('Error deleting product specialist:', error)
      alert('Failed to delete product specialist')
    }
  }

  const resetForm = () => {
    setFormData({ company: '', product: '', pic: '' })
    setEditingId(null)
  }

  const clearFilters = () => {
    setCompanyFilter('')
    setProductFilter('')
    setPicFilter('')
    setSearchTerm('')
  }

  // Apply all filters
  const filteredSpecialists = specialists.filter(s => {
    const matchesSearch = 
      s.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.pic.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCompany = !companyFilter || s.company === companyFilter
    const matchesProduct = !productFilter || s.product === productFilter
    const matchesPic = !picFilter || s.pic === picFilter
    
    return matchesSearch && matchesCompany && matchesProduct && matchesPic
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Product Specialists</h1>
          <p className="text-gray-400">Manage product specialist assignments</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowDashboard(!showDashboard)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            {showDashboard ? 'Hide' : 'Show'} Dashboard
          </button>
          {user?.role === 'admin' && (
            <button
              onClick={() => {
                resetForm()
                setShowModal(true)
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Assignment
            </button>
          )}
        </div>
      </div>

      {/* Dashboard */}
      {showDashboard && dashboard && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* PIC Statistics */}
          <div className="glass p-6 rounded-xl">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-blue-400" />
              <h3 className="font-semibold text-lg">PIC Statistics</h3>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {dashboard.picStats.map((stat, idx) => (
                <div key={idx} className="border-l-4 border-blue-500 pl-3 py-2 bg-white/5 rounded">
                  <div className="font-medium">{stat.pic}</div>
                  <div className="text-sm text-gray-400">
                    {stat.total_assignments} assignments • {stat.unique_products} products • {stat.unique_companies} companies
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Product Statistics */}
          <div className="glass p-6 rounded-xl">
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-green-400" />
              <h3 className="font-semibold text-lg">Product Statistics</h3>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {dashboard.productStats.map((stat, idx) => (
                <div key={idx} className="border-l-4 border-green-500 pl-3 py-2 bg-white/5 rounded">
                  <div className="font-medium">{stat.product}</div>
                  <div className="text-sm text-gray-400">
                    {stat.company} • {stat.pic_count} PICs
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Company Statistics */}
          <div className="glass p-6 rounded-xl">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-5 h-5 text-purple-400" />
              <h3 className="font-semibold text-lg">Company Statistics</h3>
            </div>
            <div className="space-y-3">
              {dashboard.companyStats.map((stat, idx) => (
                <div key={idx} className="border-l-4 border-purple-500 pl-3 py-2 bg-white/5 rounded">
                  <div className="font-medium">{stat.company}</div>
                  <div className="text-sm text-gray-400">
                    {stat.product_count} products • {stat.total_assignments} assignments
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="glass p-4 rounded-xl">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-5 h-5 text-gray-400" />
          <h3 className="font-semibold">Filters</h3>
          {(companyFilter || productFilter || picFilter || searchTerm) && (
            <button
              onClick={clearFilters}
              className="ml-auto text-sm text-blue-400 hover:text-blue-300"
            >
              Clear All
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Company Filter */}
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-dark-700 border border-white/10 rounded-lg appearance-none"
            >
              <option value="">All Companies</option>
              {companies.map((company, idx) => (
                <option key={idx} value={company}>{company}</option>
              ))}
            </select>
          </div>

          {/* Product Filter */}
          <div className="relative">
            <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-dark-700 border border-white/10 rounded-lg appearance-none"
            >
              <option value="">All Products</option>
              {products.map((product, idx) => (
                <option key={idx} value={product}>{product}</option>
              ))}
            </select>
          </div>

          {/* PIC Filter */}
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={picFilter}
              onChange={(e) => setPicFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-dark-700 border border-white/10 rounded-lg appearance-none"
            >
              <option value="">All PICs</option>
              {pics.map((pic, idx) => (
                <option key={idx} value={pic}>{pic}</option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-dark-700 border border-white/10 rounded-lg"
            />
          </div>
        </div>

        {/* Filter Summary */}
        {(companyFilter || productFilter || picFilter) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {companyFilter && (
              <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                {companyFilter}
                <button onClick={() => setCompanyFilter('')} className="ml-1 hover:text-purple-300">×</button>
              </span>
            )}
            {productFilter && (
              <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs flex items-center gap-1">
                <Package className="w-3 h-3" />
                {productFilter}
                <button onClick={() => setProductFilter('')} className="ml-1 hover:text-green-300">×</button>
              </span>
            )}
            {picFilter && (
              <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs flex items-center gap-1">
                <User className="w-3 h-3" />
                {picFilter}
                <button onClick={() => setPicFilter('')} className="ml-1 hover:text-blue-300">×</button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-400">
        Showing {filteredSpecialists.length} of {specialists.length} assignments
      </div>

      {/* Table */}
      <div className="glass rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-white/5">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold">Company</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Product</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">PIC</th>
              {user?.role === 'admin' && (
                <th className="px-6 py-4 text-right text-sm font-semibold">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredSpecialists.length > 0 ? (
              filteredSpecialists.map((specialist) => (
                <tr key={specialist.id} className="hover:bg-white/5">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{specialist.company}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-gray-400" />
                      <span>{specialist.product}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span>{specialist.pic}</span>
                    </div>
                  </td>
                  {user?.role === 'admin' && (
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleEdit(specialist)}
                          className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(specialist.id)}
                          className="p-2 bg-red-600 hover:bg-red-700 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={user?.role === 'admin' ? 4 : 3} className="px-6 py-12 text-center text-gray-400">
                  No assignments found matching your filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingId ? 'Edit' : 'Add'} Product Specialist
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Company</label>
                <input
                  type="text"
                  list="companies-list"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full px-3 py-2 bg-dark-700 border border-white/10 rounded-lg"
                  required
                />
                <datalist id="companies-list">
                  {companies.map((company, idx) => (
                    <option key={idx} value={company} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Product</label>
                <input
                  type="text"
                  list="products-list"
                  value={formData.product}
                  onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                  className="w-full px-3 py-2 bg-dark-700 border border-white/10 rounded-lg"
                  required
                />
                <datalist id="products-list">
                  {products.map((product, idx) => (
                    <option key={idx} value={product} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">PIC</label>
                <input
                  type="text"
                  list="pics-list"
                  value={formData.pic}
                  onChange={(e) => setFormData({ ...formData, pic: e.target.value })}
                  className="w-full px-3 py-2 bg-dark-700 border border-white/10 rounded-lg"
                  required
                />
                <datalist id="pics-list">
                  {pics.map((pic, idx) => (
                    <option key={idx} value={pic} />
                  ))}
                </datalist>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    resetForm()
                  }}
                  className="px-4 py-2 bg-dark-700 hover:bg-dark-600 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 btn-gradient rounded-lg text-white font-semibold"
                >
                  {editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
