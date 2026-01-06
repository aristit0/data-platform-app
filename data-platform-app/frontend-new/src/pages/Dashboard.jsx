import { useState, useEffect } from 'react'
import { dashboardAPI } from '../services/api'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [opptyChart, setOpptyChart] = useState([])
  const [empChart, setEmpChart] = useState([])
  const [productChart, setProductChart] = useState([])
  const [pocWinners, setPocWinners] = useState([])
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(new Date().getFullYear())
  const [quarter, setQuarter] = useState('')

  useEffect(() => {
    loadData()
  }, [year, quarter])

  const loadData = async () => {
    try {
      const params = { year }
      if (quarter) params.quarter = quarter

      const [summaryRes, opptyRes, empRes, prodRes, pocRes] = await Promise.all([
        dashboardAPI.getSummary(params),
        dashboardAPI.getOpportunitiesChart(params),
        dashboardAPI.getEmployeesByPosition(),
        dashboardAPI.getProductAssignmentsChart(),
        dashboardAPI.getMiniPocWinners(),
      ])

      setSummary(summaryRes.data)
      
      // Format opportunities chart
      setOpptyChart(opptyRes.data.labels.map((label, i) => ({
        name: label,
        count: opptyRes.data.datasets[0].data[i]
      })))
      
      // Format employees chart
      setEmpChart(empRes.data.labels.map((label, i) => ({
        name: label,
        count: empRes.data.datasets[0].data[i]
      })))
      
      // Format product chart
      setProductChart(prodRes.data.labels.map((label, i) => ({
        name: label,
        employees: prodRes.data.datasets[0].data[i]
      })))
      
      setPocWinners(pocRes.data)
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const COLORS = { Open: '#10b981', Lose: '#ef4444', Drop: '#f59e0b', Win: '#3b82f6' }
  const POSITION_COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b']

  if (loading) return <div className="text-center py-12">Loading...</div>

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex gap-4">
          <select value={year} onChange={(e) => setYear(e.target.value)} className="px-4 py-2 bg-dark-700 border border-white/10 rounded-lg">
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={quarter} onChange={(e) => setQuarter(e.target.value)} className="px-4 py-2 bg-dark-700 border border-white/10 rounded-lg">
            <option value="">All Quarters</option>
            {[1,2,3,4].map(q => <option key={q} value={q}>Q{q}</option>)}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="glass rounded-xl p-6">
          <p className="text-gray-400 text-sm mb-2">Active Employees</p>
          <p className="text-3xl font-bold">{summary?.employees || 0}</p>
        </div>
        <div className="glass rounded-xl p-6">
          <p className="text-gray-400 text-sm mb-2">Active Projects</p>
          <p className="text-3xl font-bold">{summary?.projects?.reduce((s, p) => s + (p.status === 'On Progress' ? p.count : 0), 0) || 0}</p>
        </div>
        <div className="glass rounded-xl p-6">
          <p className="text-gray-400 text-sm mb-2">Open Opportunities</p>
          <p className="text-3xl font-bold">{summary?.opportunities?.find(o => o.actual_status === 'Open')?.count || 0}</p>
        </div>
        <div className="glass rounded-xl p-6">
          <p className="text-gray-400 text-sm mb-2">Active Certifications</p>
          <p className="text-3xl font-bold">{summary?.certifications?.find(c => c.status_final === 'On Progress')?.count || 0}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Opportunities */}
        <div className="glass rounded-xl p-6">
          <h3 className="text-xl font-semibold mb-4">Opportunities by Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={opptyChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip contentStyle={{backgroundColor:'#1e293b',border:'1px solid #374151',borderRadius:'8px'}} />
              <Bar dataKey="count" radius={[8,8,0,0]}>
                {opptyChart.map((e, i) => <Cell key={i} fill={COLORS[e.name] || '#3b82f6'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Employees */}
        <div className="glass rounded-xl p-6">
          <h3 className="text-xl font-semibold mb-4">Employees by Position</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={empChart} cx="50%" cy="50%" labelLine={false} label={({name,percent})=>`${name}: ${(percent*100).toFixed(0)}%`} outerRadius={100} dataKey="count">
                {empChart.map((e, i) => <Cell key={i} fill={POSITION_COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{backgroundColor:'#1e293b',border:'1px solid #374151',borderRadius:'8px'}} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Products */}
        <div className="glass rounded-xl p-6">
          <h3 className="text-xl font-semibold mb-4">Product Assignments</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={productChart} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis type="number" stroke="#9ca3af" />
              <YAxis dataKey="name" type="category" width={100} stroke="#9ca3af" />
              <Tooltip contentStyle={{backgroundColor:'#1e293b',border:'1px solid #374151',borderRadius:'8px'}} />
              <Bar dataKey="employees" fill="#3b82f6" radius={[0,8,8,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* POC Winners */}
        <div className="glass rounded-xl p-6">
          <h3 className="text-xl font-semibold mb-4">Mini POC Winners</h3>
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {pocWinners.map((poc) => (
              <div key={poc.pocCode} className="bg-white/5 rounded-lg p-4">
                <p className="font-semibold text-sm">{poc.pocCode}</p>
                <p className="text-gray-400 text-sm mt-1">{poc.useCase}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-yellow-400">🏆</span>
                  <span className="text-sm">{poc.winner}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
