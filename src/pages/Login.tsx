import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ErrorText, inputCls } from '../components/ui'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(username, password)
      navigate('/products')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-xl p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-slate-800 mb-1">PetStore Pro</h1>
        <p className="text-sm text-slate-500 mb-6">Sign in to continue</p>
        <ErrorText message={error} />
        <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
        <input className={`${inputCls} mb-4`} value={username} onChange={(e) => setUsername(e.target.value)} autoFocus />
        <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
        <input className={`${inputCls} mb-6`} type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="w-full px-4 py-2 rounded-md text-sm font-medium bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-50" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
        <p className="mt-4 text-xs text-slate-400 text-center">
          Demo users: <code>a</code> (employee), <code>aa</code> (manager), <code>aaa</code> (DevOps).
          Password: <code>a</code> for each.
        </p>
      </form>
    </div>
  )
}
