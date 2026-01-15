import { Database } from 'lucide-react'
import { CheckSquare, Package } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { 
  LayoutDashboard, Users, Briefcase, Award, 
  FolderKanban, Trophy, Calendar, LogOut, Settings, ChevronLeft, ChevronRight
} from 'lucide-react'
import logo from '../assets/logo.png'

export default function Sidebar({ isOpen, onToggle }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/employees', icon: Users, label: 'Employees' },
    { path: '/projects', icon: FolderKanban, label: 'Projects' },
    { path: '/opportunities', icon: Briefcase, label: 'Opportunities' },
    { path: '/certifications', icon: Award, label: 'Certifications' },
    { path: '/product-assignments', icon: Settings, label: 'Product Assignments' },
    { path: '/product-specialists', icon: Package, label: 'Product Specialists' },
    { path: '/assets', icon: Database, label: 'Asset Management' },
    { path: '/mini-pocs', icon: Trophy, label: 'Mini POCs' },
    { path: '/leaves', icon: Calendar, label: 'Leave Management' },
    { path: '/tasks', label: 'Task Management', icon: CheckSquare },
    { path: '/knowledge-base', label: 'Knowledge Based', icon: CheckSquare },
  ]

  // Add User Management for admin
  if (user?.role === 'admin') {
    menuItems.splice(2, 0, { 
      path: '/users', 
      icon: Users, 
      label: 'User Management' 
    })
  }

  const handleLogoClick = () => {
    navigate('/dashboard')
  }

  return (
    <aside className={`fixed left-0 top-0 h-screen bg-dark-800 border-r border-white/10 transition-all duration-300 z-50 ${isOpen ? 'w-64' : 'w-20'}`}>
      {/* Header with Logo - Clickable */}
      <div 
        className="p-6 border-b border-white/10 cursor-pointer hover:bg-white/5 transition-all"
        onClick={handleLogoClick}
        title="Go to Dashboard"
      >
        <div className="flex items-center gap-3 mb-2">
          <img 
            src={logo} 
            alt="TOMODACHI Logo" 
            className={`transition-all ${isOpen ? 'w-10 h-10' : 'w-8 h-8 mx-auto'}`}
          />
          {isOpen && (
            <h1 className="font-bold bg-gradient-to-r from-primary-500 to-purple-500 bg-clip-text text-transparent text-2xl">
              TOMODACHI
            </h1>
          )}
        </div>
        {isOpen && <p className="text-sm text-gray-400 mt-1 ml-13">Data Platform</p>}
      </div>

      {/* Menu */}
      <nav className="p-4 space-y-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 220px)' }}>
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive 
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/50' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
              title={!isOpen ? item.label : ''}
            >
              <Icon size={20} />
              {isOpen && <span className="font-medium">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10 bg-dark-800">
        {isOpen ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 px-4 py-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-600 to-purple-600 flex items-center justify-center font-bold flex-shrink-0">
                {user?.role === 'admin' ? 'A' : 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user?.email === 'admin@dataplatform.com' ? 'Admin' : user?.full_name || user?.email}
                </p>
                <p className="text-xs text-gray-400">
                  {user?.role === 'admin' ? 'System Administrator' : 'User'}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-all"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        ) : (
          <button
            onClick={logout}
            className="w-full flex items-center justify-center p-3 bg-red-600 hover:bg-red-700 rounded-lg transition-all"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        )}
      </div>

      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-6 bg-dark-700 border border-white/10 rounded-full p-1.5 hover:bg-dark-600 transition-all z-10"
        title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>
    </aside>
  )
}
