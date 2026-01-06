
import { useState, useEffect } from 'react'
import { miniPocsAPI, employeesAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { Plus, Edit, Trash2, Users, ChevronDown, ChevronUp } from 'lucide-react'

export default function MiniPOCs() {
  const [pocs, setPocs] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showTeamModal, setShowTeamModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [expandedPoc, setExpandedPoc] = useState(null)
  const [selectedPocTeams, setSelectedPocTeams] = useState([])
  const { user } = useAuth()

  const [formData, setFormData] = useState({
    poc_code: '',
    use_case: '',
    start_date: '',
    end_date: '',
    status: 'Planned',
    winner_team: '',
    second_team: '',
    third_team: '',
  })

  const [teamFormData, setTeamFormData] = useState({
    poc_code: '',
    employee_id: '',
    name: '',
    team_name: 'Team 1',
    role_name: 'Peserta',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [pocsRes, empRes] = await Promise.all([
        miniPocsAPI.getAll(),
        employeesAPI.getAll()
      ])
      setPocs(pocsRes.data || [])
      setEmployees(empRes.data || [])
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadTeamMembers = async (pocCode) => {
    try {
      const response = await miniPocsAPI.getDetails(pocCode)
      setSelectedPocTeams(response.data.teams || [])
    } catch (err) {
      console.error('Error loading team members:', err)
      setSelectedPocTeams([])
    }
  }

  const handleExpandPoc = async (pocCode) => {
    if (expandedPoc === pocCode) {
      setExpandedPoc(null)
      setSelectedPocTeams([])
    } else {
      setExpandedPoc(pocCode)
      await loadTeamMembers(pocCode)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editing) {
        await miniPocsAPI.update(editing.poc_code, formData)
      } else {
        await miniPocsAPI.create(formData)
      }
      setShowModal(false)
      resetForm()
      loadData()
    } catch (err) {
      alert('Error saving POC')
    }
  }

  const handleDelete = async (code) => {
    if (!window.confirm('Delete this Mini POC?')) return
    try {
      await miniPocsAPI.delete(code)
      loadData()
    } catch (err) {
      alert('Error deleting POC')
    }
  }

  const resetForm = () => {
    setFormData({
      poc_code: '',
      use_case: '',
      start_date: '',
      end_date: '',
      status: 'Planned',
      winner_team: '',
      second_team: '',
      third_team: '',
    })
    setEditing(null)
  }

  const handleEdit = (poc) => {
    setEditing(poc)
    setFormData({
      poc_code: poc.poc_code,
      use_case: poc.use_case,
      start_date: poc.start_date?.split('T')[0] || '',
      end_date: poc.end_date?.split('T')[0] || '',
      status: poc.status,
      winner_team: poc.winner_team || '',
      second_team: poc.second_team || '',
      third_team: poc.third_team || '',
    })
    setShowModal(true)
  }

  // Team Management
  const handleAddTeamMember = (pocCode) => {
    setTeamFormData({
      poc_code: pocCode,
      employee_id: '',
      name: '',
      team_name: 'Team 1',
      role_name: 'Peserta',
    })
    setShowTeamModal(true)
  }

  const handleTeamSubmit = async (e) => {
    e.preventDefault()
    try {
      // Get employee name
      const emp = employees.find(e => e.employee_id === teamFormData.employee_id)
      const submitData = {
        ...teamFormData,
        name: emp ? emp.full_name : teamFormData.name
      }
      
      await miniPocsAPI.addTeamMember(teamFormData.poc_code, submitData)
      setShowTeamModal(false)
      loadTeamMembers(teamFormData.poc_code)
    } catch (err) {
      alert('Error adding team member')
    }
  }

  const handleDeleteTeamMember = async (teamId, pocCode) => {
    if (!window.confirm('Remove this team member?')) return
    try {
      await miniPocsAPI.deleteTeamMember(teamId)
      loadTeamMembers(pocCode)
    } catch (err) {
      alert('Error removing team member')
    }
  }

  // Group teams
  const groupByTeam = (teams) => {
    const grouped = {}
    teams.forEach(member => {
      if (!grouped[member.team_name]) {
        grouped[member.team_name] = []
      }
      grouped[member.team_name].push(member)
    })
    return grouped
  }

  if (loading) return <div className="text-center py-12">Loading...</div>

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Mini POCs ({pocs.length})</h1>
        {user?.role === 'admin' && (
          <button
            onClick={() => { resetForm(); setShowModal(true) }}
            className="btn-gradient px-6 py-3 rounded-lg text-white font-semibold flex items-center gap-2"
          >
            <Plus size={20} />
            Add Mini POC
          </button>
        )}
      </div>

      {/* POC List */}
      <div className="space-y-4">
        {pocs.map((poc) => {
          const isExpanded = expandedPoc === poc.poc_code
          const teamsGrouped = isExpanded ? groupByTeam(selectedPocTeams) : {}
          
          return (
            <div key={poc.poc_id} className="glass rounded-xl overflow-hidden">
              {/* POC Header */}
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <h3 className="text-xl font-bold">{poc.poc_code}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        poc.status === 'Done' ? 'bg-green-500/20 text-green-400' :
                        poc.status === 'On Progress' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {poc.status}
                      </span>
                    </div>
                    
                    <p className="text-gray-300 mb-3">{poc.use_case}</p>
                    
                    {poc.start_date && poc.end_date && (
                      <p className="text-sm text-gray-400 mb-3">
                        Period: {new Date(poc.start_date).toLocaleDateString('en-GB')} - {new Date(poc.end_date).toLocaleDateString('en-GB')}
                      </p>
                    )}

                    {/* Winners */}
                    {(poc.winner_team || poc.second_team || poc.third_team) && (
                      <div className="flex flex-wrap gap-4 mt-3">
                        {poc.winner_team && (
                          <div className="flex items-center gap-2 bg-yellow-500/10 px-4 py-2 rounded-lg">
                            <span className="text-2xl">🥇</span>
                            <div>
                              <p className="text-xs text-gray-400">Winner</p>
                              <p className="font-semibold text-yellow-400">{poc.winner_team}</p>
                            </div>
                          </div>
                        )}
                        {poc.second_team && (
                          <div className="flex items-center gap-2 bg-gray-500/10 px-4 py-2 rounded-lg">
                            <span className="text-2xl">🥈</span>
                            <div>
                              <p className="text-xs text-gray-400">2nd Place</p>
                              <p className="font-medium">{poc.second_team}</p>
                            </div>
                          </div>
                        )}
                        {poc.third_team && (
                          <div className="flex items-center gap-2 bg-orange-500/10 px-4 py-2 rounded-lg">
                            <span className="text-2xl">🥉</span>
                            <div>
                              <p className="text-xs text-gray-400">3rd Place</p>
                              <p className="font-medium text-orange-400">{poc.third_team}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleExpandPoc(poc.poc_code)}
                      className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                      title="View Teams"
                    >
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                    {user?.role === 'admin' && (
                      <>
                        <button onClick={() => handleEdit(poc)} className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => handleDelete(poc.poc_code)} className="p-2 bg-red-600 hover:bg-red-700 rounded-lg">
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Team Members (Expanded) */}
              {isExpanded && (
                <div className="border-t border-white/10 p-6 bg-white/5">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-semibold flex items-center gap-2">
                      <Users size={20} />
                      Team Members ({selectedPocTeams.length})
                    </h4>
                    {user?.role === 'admin' && (
                      <button
                        onClick={() => handleAddTeamMember(poc.poc_code)}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-semibold"
                      >
                        + Add Member
                      </button>
                    )}
                  </div>

                  {Object.keys(teamsGrouped).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {Object.entries(teamsGrouped).map(([teamName, members]) => (
                        <div key={teamName} className="bg-dark-800 rounded-lg p-4">
                          <h5 className="font-semibold mb-3 text-primary-400">{teamName}</h5>
                          <div className="space-y-2">
                            {members.map((member) => (
                              <div key={member.id} className="flex items-center justify-between bg-dark-700 rounded-lg p-3">
                                <div>
                                  <p className="font-medium text-sm">{member.name}</p>
                                  <p className="text-xs text-gray-400">{member.employee_id}</p>
                                  <p className="text-xs text-blue-400">{member.role_name}</p>
                                </div>
                                {user?.role === 'admin' && (
                                  <button
                                    onClick={() => handleDeleteTeamMember(member.id, poc.poc_code)}
                                    className="p-1 text-red-400 hover:text-red-300"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-400 py-8">No team members added yet</p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* POC Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6">{editing ? 'Edit' : 'Add'} Mini POC</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">POC Code</label>
                  <input type="text" value={formData.poc_code} onChange={(e) => setFormData({...formData, poc_code: e.target.value})} className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-lg" placeholder="e.g., Mini-POC-3" required disabled={!!editing} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-lg">
                    <option value="Planned">Planned</option>
                    <option value="On Progress">On Progress</option>
                    <option value="Done">Done</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Use Case</label>
                <textarea value={formData.use_case} onChange={(e) => setFormData({...formData, use_case: e.target.value})} className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-lg" rows="2" required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Start Date</label>
                  <input type="date" value={formData.start_date} onChange={(e) => setFormData({...formData, start_date: e.target.value})} className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">End Date</label>
                  <input type="date" value={formData.end_date} onChange={(e) => setFormData({...formData, end_date: e.target.value})} className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-lg" />
                </div>
              </div>

              <div className="border-t border-white/10 pt-4 mt-4">
                <h4 className="font-semibold mb-4">Winners</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm mb-2">🥇 1st Place</label>
                    <input type="text" value={formData.winner_team} onChange={(e) => setFormData({...formData, winner_team: e.target.value})} className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-lg" placeholder="Team 1" />
                  </div>
                  <div>
                    <label className="block text-sm mb-2">🥈 2nd Place</label>
                    <input type="text" value={formData.second_team} onChange={(e) => setFormData({...formData, second_team: e.target.value})} className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-lg" placeholder="Team 2" />
                  </div>
                  <div>
                    <label className="block text-sm mb-2">🥉 3rd Place</label>
                    <input type="text" value={formData.third_team} onChange={(e) => setFormData({...formData, third_team: e.target.value})} className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-lg" placeholder="Team 3" />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button type="submit" className="flex-1 btn-gradient py-3 rounded-lg text-white font-semibold">{editing ? 'Update' : 'Save'}</button>
                <button type="button" onClick={() => { setShowModal(false); resetForm() }} className="flex-1 py-3 bg-dark-700 hover:bg-dark-600 rounded-lg">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Team Member Modal */}
      {showTeamModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold mb-6">Add Team Member</h3>
            <form onSubmit={handleTeamSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Employee</label>
                <select value={teamFormData.employee_id} onChange={(e) => setTeamFormData({...teamFormData, employee_id: e.target.value})} className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-lg" required>
                  <option value="">Select Employee</option>
                  {employees.map(emp => <option key={emp.employee_id} value={emp.employee_id}>{emp.employee_id} - {emp.full_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Team</label>
                <select value={teamFormData.team_name} onChange={(e) => setTeamFormData({...teamFormData, team_name: e.target.value})} className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-lg">
                  <option value="Team 1">Team 1</option>
                  <option value="Team 2">Team 2</option>
                  <option value="Team 3">Team 3</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Role</label>
                <input type="text" value={teamFormData.role_name} onChange={(e) => setTeamFormData({...teamFormData, role_name: e.target.value})} className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-lg" placeholder="e.g., Lead, Backend, Data Engineer" required />
              </div>
              <div className="flex gap-4 mt-6">
                <button type="submit" className="flex-1 btn-gradient py-3 rounded-lg text-white font-semibold">Add</button>
                <button type="button" onClick={() => setShowTeamModal(false)} className="flex-1 py-3 bg-dark-700 hover:bg-dark-600 rounded-lg">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
