import { useState, useEffect } from 'react'
import { certificationsAPI, employeeCertificationsAPI, employeesAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { Plus, Edit, Trash2, AlertCircle, Search } from 'lucide-react'

export default function Certifications() {
  const [activeTab, setActiveTab] = useState('active')
  const [activeCerts, setActiveCerts] = useState([])
  const [planCerts, setPlanCerts] = useState([])
  const [expiringCerts, setExpiringCerts] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [editing, setEditing] = useState(null)
  
  // Get current quarter
  const getCurrentQuarter = () => {
    const month = new Date().getMonth() + 1
    if (month <= 3) return 'Q1'
    if (month <= 6) return 'Q2'
    if (month <= 9) return 'Q3'
    return 'Q4'
  }

  // Search & Filters - Default to current year and quarter
  const [activeSearch, setActiveSearch] = useState('')
  const [planSearch, setPlanSearch] = useState('')
  const [planYearFilter, setPlanYearFilter] = useState(new Date().getFullYear().toString())
  const [planQuarterFilter, setPlanQuarterFilter] = useState(getCurrentQuarter())
  
  // Pagination for Active
  const [activePage, setActivePage] = useState(1)
  const itemsPerPage = 10
  
  const { user } = useAuth()

  // Active Certifications Form - matches employee_certification table
  const [activeFormData, setActiveFormData] = useState({
    employee_id: '',
    name: '',
    product: '',
    certification: '',
    start_date: '',
    end_date: '',
    status: 'Active',
  })

  // Plan Form - matches certification_plan table
  const [planFormData, setPlanFormData] = useState({
    planning_year: new Date().getFullYear(),
    planning_quarter: 'Q1',
    name: '',
    certification: '',
    schedule_1: '',
    result_1: 'On Progress',
    schedule_2: '',
    result_2: 'On Progress',
    schedule_3: '',
    result_3: 'On Progress',
    status_final: 'On Progress',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const year = new Date().getFullYear()
      const [activeRes, planRes, expiringRes, empRes] = await Promise.all([
        employeeCertificationsAPI.getAll({ status: 'Active' }),
        certificationsAPI.getAll({ year }),
        employeeCertificationsAPI.getExpiring(),
        employeesAPI.getAll(),
      ])
      
      setActiveCerts(activeRes.data || [])
      setPlanCerts(planRes.data || [])
      
      // Filter expiring - remove renewed ones
      const expiring = (expiringRes.data || []).filter(cert => {
        if (!cert.end_date) return false
        return !(activeRes.data || []).some(active => 
          active.employee_id === cert.employee_id && 
          active.certification === cert.certification &&
          active.start_date && cert.end_date &&
          new Date(active.start_date) > new Date(cert.end_date)
        )
      })
      setExpiringCerts(expiring)
      
      setEmployees(empRes.data || [])
    } catch (err) {
      console.error('Error:', err)
      setActiveCerts([])
      setPlanCerts([])
      setExpiringCerts([])
      setEmployees([])
    } finally {
      setLoading(false)
    }
  }

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    try {
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return '-'
      return date.toLocaleDateString('en-GB')
    } catch {
      return '-'
    }
  }

  // Active Cert Handlers
  const handleActiveSubmit = async (e) => {
    e.preventDefault()
    try {
      // Get employee name from dropdown
      const emp = employees.find(e => e.employee_id === activeFormData.employee_id)
      const submitData = {
        ...activeFormData,
        name: emp ? emp.full_name : activeFormData.name
      }
      
      if (editing) {
        await employeeCertificationsAPI.update(editing.cert_id, submitData)
      } else {
        await employeeCertificationsAPI.create(submitData)
      }
      setShowModal(false)
      resetActiveForm()
      loadData()
    } catch (err) {
      alert('Error saving certification')
    }
  }

  const handleActiveEdit = (cert) => {
    setEditing(cert)
    setActiveFormData({
      employee_id: cert.employee_id,
      name: cert.name,
      product: cert.product,
      certification: cert.certification,
      start_date: cert.start_date?.split('T')[0] || '',
      end_date: cert.end_date?.split('T')[0] || '',
      status: cert.status,
    })
    setShowModal(true)
  }

  const handleActiveDelete = async (id) => {
    if (!window.confirm('Delete this certification?')) return
    try {
      await employeeCertificationsAPI.delete(id)
      loadData()
    } catch (err) {
      alert('Error deleting certification')
    }
  }

  const handleStatusChange = async (id, newStatus) => {
    try {
      await employeeCertificationsAPI.updateStatus(id, newStatus)
      loadData()
    } catch (err) {
      alert('Error updating status')
    }
  }

  const resetActiveForm = () => {
    setActiveFormData({
      employee_id: '',
      name: '',
      product: '',
      certification: '',
      start_date: '',
      end_date: '',
      status: 'Active',
    })
    setEditing(null)
  }

  // Plan Handlers
  const handlePlanSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editing) {
        await certificationsAPI.update(editing.plan_id, planFormData)
      } else {
        await certificationsAPI.create(planFormData)
      }
      setShowPlanModal(false)
      resetPlanForm()
      loadData()
    } catch (err) {
      alert('Error saving plan')
    }
  }

  const handlePlanEdit = (plan) => {
    setEditing(plan)
    setPlanFormData({
      planning_year: plan.planning_year,
      planning_quarter: plan.planning_quarter,
      name: plan.name,
      certification: plan.certification,
      schedule_1: plan.schedule_1?.split('T')[0] || '',
      result_1: plan.result_1 || 'On Progress',
      schedule_2: plan.schedule_2?.split('T')[0] || '',
      result_2: plan.result_2 || 'On Progress',
      schedule_3: plan.schedule_3?.split('T')[0] || '',
      result_3: plan.result_3 || 'On Progress',
      status_final: plan.status_final,
    })
    setShowPlanModal(true)
  }

  const handlePlanDelete = async (id) => {
    if (!window.confirm('Delete this plan?')) return
    try {
      await certificationsAPI.delete(id)
      loadData()
    } catch (err) {
      alert('Error deleting plan')
    }
  }

  const resetPlanForm = () => {
    setPlanFormData({
      planning_year: new Date().getFullYear(),
      planning_quarter: 'Q1',
      name: '',
      certification: '',
      schedule_1: '',
      result_1: 'On Progress',
      schedule_2: '',
      result_2: 'On Progress',
      schedule_3: '',
      result_3: 'On Progress',
      status_final: 'On Progress',
    })
    setEditing(null)
  }

  // Filter Active
  const filteredActive = activeCerts.filter(cert => {
    const search = activeSearch.toLowerCase()
    return cert.name?.toLowerCase().includes(search) || cert.product?.toLowerCase().includes(search)
  })

  // Pagination
  const activeIndexLast = activePage * itemsPerPage
  const activeIndexFirst = activeIndexLast - itemsPerPage
  const currentActiveItems = filteredActive.slice(activeIndexFirst, activeIndexLast)
  const activeTotalPages = Math.ceil(filteredActive.length / itemsPerPage)

  // Filter Plan
  const filteredPlan = planCerts.filter(plan => {
    const search = planSearch.toLowerCase()
    const matchesSearch = plan.name?.toLowerCase().includes(search) || plan.certification?.toLowerCase().includes(search)
    const matchesYear = !planYearFilter || plan.planning_year === parseInt(planYearFilter)
    const matchesQuarter = !planQuarterFilter || plan.planning_quarter === planQuarterFilter
    return matchesSearch && matchesYear && matchesQuarter
  })

  if (loading) return <div className="text-center py-12">Loading...</div>

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Certifications</h1>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-white/10">
        <button onClick={() => setActiveTab('active')} className={`px-6 py-3 font-medium ${activeTab === 'active' ? 'border-b-2 border-primary-500 text-primary-400' : 'text-gray-400'}`}>
          Active Certifications ({filteredActive.length})
        </button>
        <button onClick={() => setActiveTab('plan')} className={`px-6 py-3 font-medium ${activeTab === 'plan' ? 'border-b-2 border-primary-500 text-primary-400' : 'text-gray-400'}`}>
          Certification Plans ({filteredPlan.length})
        </button>
        <button onClick={() => setActiveTab('expiring')} className={`px-6 py-3 font-medium ${activeTab === 'expiring' ? 'border-b-2 border-primary-500 text-primary-400' : 'text-gray-400'}`}>
          Expiring This Year ({expiringCerts.length})
        </button>
      </div>

      {/* ACTIVE TAB */}
      {activeTab === 'active' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input type="text" placeholder="Search by name or product..." value={activeSearch} onChange={(e) => { setActiveSearch(e.target.value); setActivePage(1) }} className="w-full pl-10 pr-4 py-3 bg-dark-800 border border-white/10 rounded-lg" />
            </div>
            {user?.role === 'admin' && (
              <button onClick={() => { resetActiveForm(); setShowModal(true) }} className="btn-gradient px-6 py-3 rounded-lg flex items-center gap-2">
                <Plus size={20} />
                Add Certification
              </button>
            )}
          </div>

          <div className="glass rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-4 text-left">Employee</th>
                  <th className="px-6 py-4 text-left">Product</th>
                  <th className="px-6 py-4 text-left">Certification</th>
                  <th className="px-6 py-4 text-left">Start Date</th>
                  <th className="px-6 py-4 text-left">End Date</th>
                  <th className="px-6 py-4 text-left">Status</th>
                  {user?.role === 'admin' && <th className="px-6 py-4 text-left">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {currentActiveItems.length > 0 ? currentActiveItems.map((cert) => (
                  <tr key={cert.cert_id} className="hover:bg-white/5">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium">{cert.name}</p>
                        <p className="text-xs text-gray-400">{cert.employee_id}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">{cert.product}</td>
                    <td className="px-6 py-4">{cert.certification}</td>
                    <td className="px-6 py-4 text-sm">{formatDate(cert.start_date)}</td>
                    <td className="px-6 py-4 text-sm">{formatDate(cert.end_date)}</td>
                    <td className="px-6 py-4">
                      {user?.role === 'admin' ? (
                        <select value={cert.status} onChange={(e) => handleStatusChange(cert.cert_id, e.target.value)} className="px-3 py-1 bg-dark-700 border border-white/10 rounded-lg text-sm">
                          <option value="Active">Active</option>
                          <option value="Not Active">Not Active</option>
                        </select>
                      ) : (
                        <span className={`px-3 py-1 rounded-full text-xs ${cert.status === 'Active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{cert.status}</span>
                      )}
                    </td>
                    {user?.role === 'admin' && (
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button onClick={() => handleActiveEdit(cert)} className="p-2 bg-blue-600 rounded-lg"><Edit size={16} /></button>
                          <button onClick={() => handleActiveDelete(cert.cert_id)} className="p-2 bg-red-600 rounded-lg"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                )) : (
                  <tr><td colSpan={user?.role === 'admin' ? 7 : 6} className="px-6 py-12 text-center text-gray-400">No certifications found</td></tr>
                )}
              </tbody>
            </table>

            {activeTotalPages > 1 && (
              <div className="flex justify-center items-center gap-4 p-4 border-t border-white/10">
                <button onClick={() => setActivePage(p => Math.max(1, p - 1))} disabled={activePage === 1} className="px-4 py-2 bg-dark-700 rounded-lg disabled:opacity-50">Previous</button>
                <span className="text-sm">Page {activePage} of {activeTotalPages}</span>
                <button onClick={() => setActivePage(p => Math.min(activeTotalPages, p + 1))} disabled={activePage === activeTotalPages} className="px-4 py-2 bg-dark-700 rounded-lg disabled:opacity-50">Next</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PLAN TAB */}
      {activeTab === 'plan' && (
        <div>
          <div className="flex justify-between items-center mb-4 gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input type="text" placeholder="Search by name or certification..." value={planSearch} onChange={(e) => setPlanSearch(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-dark-800 border border-white/10 rounded-lg" />
            </div>
            <div className="flex gap-4">
              <select value={planYearFilter} onChange={(e) => setPlanYearFilter(e.target.value)} className="px-4 py-3 bg-dark-800 border border-white/10 rounded-lg">
                <option value="">All Years</option>
                {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <select value={planQuarterFilter} onChange={(e) => setPlanQuarterFilter(e.target.value)} className="px-4 py-3 bg-dark-800 border border-white/10 rounded-lg">
                <option value="">All Quarters</option>
                <option value="Q1">Q1</option>
                <option value="Q2">Q2</option>
                <option value="Q3">Q3</option>
                <option value="Q4">Q4</option>
              </select>
            </div>
            {user?.role === 'admin' && (
              <button onClick={() => { resetPlanForm(); setShowPlanModal(true) }} className="btn-gradient px-6 py-3 rounded-lg flex items-center gap-2">
                <Plus size={20} />
                Add Plan
              </button>
            )}
          </div>

          <div className="glass rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-4 text-left">Employee</th>
                  <th className="px-6 py-4 text-left">Certification</th>
                  <th className="px-6 py-4 text-left">Year</th>
                  <th className="px-6 py-4 text-left">Quarter</th>
                  <th className="px-6 py-4 text-left">Status</th>
                  {user?.role === 'admin' && <th className="px-6 py-4 text-left">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredPlan.length > 0 ? filteredPlan.map((plan) => (
                  <tr key={plan.plan_id} className="hover:bg-white/5">
                    <td className="px-6 py-4">{plan.name}</td>
                    <td className="px-6 py-4">{plan.certification}</td>
                    <td className="px-6 py-4">{plan.planning_year}</td>
                    <td className="px-6 py-4">{plan.planning_quarter}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs ${plan.status_final === 'Pass' ? 'bg-green-500/20 text-green-400' : plan.status_final === 'Fail' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                        {plan.status_final}
                      </span>
                    </td>
                    {user?.role === 'admin' && (
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button onClick={() => handlePlanEdit(plan)} className="p-2 bg-blue-600 rounded-lg"><Edit size={16} /></button>
                          <button onClick={() => handlePlanDelete(plan.plan_id)} className="p-2 bg-red-600 rounded-lg"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                )) : (
                  <tr><td colSpan={user?.role === 'admin' ? 6 : 5} className="px-6 py-12 text-center text-gray-400">No plans found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EXPIRING TAB */}
      {activeTab === 'expiring' && (
        <div>
          {expiringCerts.length > 0 ? (
            <div className="glass rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-4 text-left">Employee</th>
                    <th className="px-6 py-4 text-left">Product</th>
                    <th className="px-6 py-4 text-left">Certification</th>
                    <th className="px-6 py-4 text-left">Expiry Date</th>
                    <th className="px-6 py-4 text-left">Days Left</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {expiringCerts.map((cert) => {
                    const endDate = cert.end_date ? new Date(cert.end_date) : null
                    const daysLeft = endDate && !isNaN(endDate.getTime()) ? Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24)) : 0
                    return (
                      <tr key={cert.cert_id} className="hover:bg-white/5">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium">{cert.name}</p>
                            <p className="text-xs text-gray-400">{cert.employee_id}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">{cert.product}</td>
                        <td className="px-6 py-4">{cert.certification}</td>
                        <td className="px-6 py-4 text-sm">{formatDate(cert.end_date)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <AlertCircle size={16} className={daysLeft < 30 ? 'text-red-400' : 'text-yellow-400'} />
                            <span className={`font-semibold ${daysLeft < 30 ? 'text-red-400' : 'text-yellow-400'}`}>
                              {daysLeft} days
                            </span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="glass rounded-xl p-12 text-center"><p className="text-gray-400">No certifications expiring this year</p></div>
          )}
        </div>
      )}

      {/* Active Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold mb-6">{editing ? 'Edit' : 'Add'} Certification</h3>
            <form onSubmit={handleActiveSubmit} className="space-y-4">
              <div>
                <label className="block text-sm mb-2">Employee</label>
                <select value={activeFormData.employee_id} onChange={(e) => setActiveFormData({...activeFormData, employee_id: e.target.value})} className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-lg" required>
                  <option value="">Select</option>
                  {employees.map(emp => <option key={emp.employee_id} value={emp.employee_id}>{emp.full_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-2">Product</label>
                <input type="text" value={activeFormData.product} onChange={(e) => setActiveFormData({...activeFormData, product: e.target.value})} className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm mb-2">Certification</label>
                <input type="text" value={activeFormData.certification} onChange={(e) => setActiveFormData({...activeFormData, certification: e.target.value})} className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-lg" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2">Start Date</label>
                  <input type="date" value={activeFormData.start_date} onChange={(e) => setActiveFormData({...activeFormData, start_date: e.target.value})} className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-lg" required />
                </div>
                <div>
                  <label className="block text-sm mb-2">End Date (Optional)</label>
                  <input type="date" value={activeFormData.end_date} onChange={(e) => setActiveFormData({...activeFormData, end_date: e.target.value})} className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-lg" />
                </div>
              </div>
              <div className="flex gap-4 mt-6">
                <button type="submit" className="flex-1 btn-gradient py-3 rounded-lg">{editing ? 'Update' : 'Save'}</button>
                <button type="button" onClick={() => { setShowModal(false); resetActiveForm() }} className="flex-1 py-3 bg-dark-700 rounded-lg">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Plan Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6">{editing ? 'Edit' : 'Add'} Plan</h3>
            <form onSubmit={handlePlanSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2">Year</label>
                  <input type="number" value={planFormData.planning_year} onChange={(e) => setPlanFormData({...planFormData, planning_year: parseInt(e.target.value)})} className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-lg" required />
                </div>
                <div>
                  <label className="block text-sm mb-2">Quarter</label>
                  <select value={planFormData.planning_quarter} onChange={(e) => setPlanFormData({...planFormData, planning_quarter: e.target.value})} className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-lg">
                    <option value="Q1">Q1</option>
                    <option value="Q2">Q2</option>
                    <option value="Q3">Q3</option>
                    <option value="Q4">Q4</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm mb-2">Name</label>
                <input type="text" value={planFormData.name} onChange={(e) => setPlanFormData({...planFormData, name: e.target.value})} className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm mb-2">Certification</label>
                <input type="text" value={planFormData.certification} onChange={(e) => setPlanFormData({...planFormData, certification: e.target.value})} className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-lg" required />
              </div>

              <div className="space-y-3 border-t border-white/10 pt-4">
                <h4 className="font-semibold">Attempt 1</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm mb-2">Schedule</label><input type="date" value={planFormData.schedule_1} onChange={(e) => setPlanFormData({...planFormData, schedule_1: e.target.value})} className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-lg" /></div>
                  <div><label className="block text-sm mb-2">Result</label><select value={planFormData.result_1} onChange={(e) => setPlanFormData({...planFormData, result_1: e.target.value})} className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-lg"><option value="On Progress">On Progress</option><option value="PASS">PASS</option><option value="FAIL">FAIL</option></select></div>
                </div>
              </div>

              <div className="space-y-3 border-t border-white/10 pt-4">
                <h4 className="font-semibold">Attempt 2</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm mb-2">Schedule</label><input type="date" value={planFormData.schedule_2} onChange={(e) => setPlanFormData({...planFormData, schedule_2: e.target.value})} className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-lg" /></div>
                  <div><label className="block text-sm mb-2">Result</label><select value={planFormData.result_2} onChange={(e) => setPlanFormData({...planFormData, result_2: e.target.value})} className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-lg"><option value="On Progress">On Progress</option><option value="PASS">PASS</option><option value="FAIL">FAIL</option></select></div>
                </div>
              </div>

              <div className="space-y-3 border-t border-white/10 pt-4">
                <h4 className="font-semibold">Attempt 3</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm mb-2">Schedule</label><input type="date" value={planFormData.schedule_3} onChange={(e) => setPlanFormData({...planFormData, schedule_3: e.target.value})} className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-lg" /></div>
                  <div><label className="block text-sm mb-2">Result</label><select value={planFormData.result_3} onChange={(e) => setPlanFormData({...planFormData, result_3: e.target.value})} className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-lg"><option value="On Progress">On Progress</option><option value="PASS">PASS</option><option value="FAIL">FAIL</option></select></div>
                </div>
              </div>

              <div>
                <label className="block text-sm mb-2">Final Status</label>
                <select value={planFormData.status_final} onChange={(e) => setPlanFormData({...planFormData, status_final: e.target.value})} className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-lg">
                  <option value="On Progress">On Progress</option>
                  <option value="Pass">Pass</option>
                  <option value="Fail">Fail</option>
                </select>
              </div>

              <div className="flex gap-4 mt-6">
                <button type="submit" className="flex-1 btn-gradient py-3 rounded-lg">{editing ? 'Update' : 'Save'}</button>
                <button type="button" onClick={() => { setShowPlanModal(false); resetPlanForm() }} className="flex-1 py-3 bg-dark-700 rounded-lg">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
