import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Employees from './pages/Employees'
import UserManagement from './pages/UserManagement'
import Projects from './pages/Projects'
import Opportunities from './pages/Opportunities'
import Certifications from './pages/Certifications'
import ProductAssignments from './pages/ProductAssignments'
import MiniPOCs from './pages/MiniPOCs'
import LeaveManagement from './pages/LeaveManagement'
import TaskManagement from './pages/TaskManagement'
import Layout from './components/Layout'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="employees" element={<Employees />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="projects" element={<Projects />} />
            <Route path="opportunities" element={<Opportunities />} />
            <Route path="certifications" element={<Certifications />} />
            <Route path="product-assignments" element={<ProductAssignments />} />
            <Route path="mini-pocs" element={<MiniPOCs />} />
            <Route path="leaves" element={<LeaveManagement />} />
            <Route path="tasks" element={<TaskManagement />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
