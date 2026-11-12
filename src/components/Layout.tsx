import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', roles: ['MANAGER', 'DEVOPS'] },
  { to: '/products', label: 'Products', roles: ['EMPLOYEE', 'MANAGER', 'DEVOPS'] },
  { to: '/inventory', label: 'Inventory', roles: ['EMPLOYEE', 'MANAGER', 'DEVOPS'] },
  { to: '/sales', label: 'Sales', roles: ['EMPLOYEE', 'MANAGER', 'DEVOPS'] },
  { to: '/alerts', label: 'Alerts', roles: ['EMPLOYEE', 'MANAGER', 'DEVOPS'] },
  { to: '/audit-logs', label: 'Audit Logs', roles: ['MANAGER'] },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <aside className="w-56 bg-slate-900 text-white flex flex-col">
        <div className="px-5 py-5 text-xl font-bold">PetStore Pro</div>
        <nav className="flex-1 px-3 space-y-1">
          {navItems
            .filter((item) => user && item.roles.includes(user.role))
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-md text-sm font-medium ${
                    isActive ? 'bg-sky-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
        </nav>
        <div className="p-4 border-t border-slate-700 text-sm">
          <div className="font-medium">{user?.fullName}</div>
          <div className="text-slate-400 mb-3">{user?.role}</div>
          <button
            onClick={handleLogout}
            className="w-full px-3 py-1.5 rounded bg-slate-700 hover:bg-slate-600 text-left"
          >
            Log out
          </button>
        </div>
      </aside>
      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
