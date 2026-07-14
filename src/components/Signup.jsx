import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import API from '../api'
import { saveAuthSession } from '../utils/auth'
import AuthLayout from './AuthLayout'

const Signup = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [secretKeyword, setSecretKeyword] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSending, setOtpSending] = useState(false)
  const [otpCooldown, setOtpCooldown] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const navigate = useNavigate()

  React.useEffect(() => {
    let timer
    if (otpCooldown > 0) {
      timer = setTimeout(() => setOtpCooldown(otpCooldown - 1), 1000)
    }
    return () => clearTimeout(timer)
  }, [otpCooldown])

  const sendOtp = async () => {
    if (!email.trim()) {
      setError('Please enter your email first')
      setTimeout(() => setError(''), 3000)
      return
    }
    setError('')
    setSuccess('')
    try {
      setOtpSending(true)
      const res = await API.post('/auth/send-signup-otp', {
        email: email.trim(),
      })
      setOtpCooldown(90) // 1 minute 30 seconds
      setSuccess(res.data.message || 'OTP sent successfully')
      setTimeout(() => setSuccess(''), 5000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP')
      setTimeout(() => setError(''), 3000)
    } finally {
      setOtpSending(false)
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!name.trim() || !email.trim() || !password.trim() || !secretKeyword.trim() || !otp.trim()) {
      setError('All fields are required')
      setTimeout(() => setError(''), 3000)
      return
    }

    if (password.trim().length < 4) {
      setError('Password must be at least 4 characters')
      setTimeout(() => setError(''), 3000)
      return
    }

    try {
      setLoading(true)
      const res = await API.post('/auth/signup', {
        name: name.trim(),
        email: email.trim(),
        password,
        secretKeyword: secretKeyword.trim(),
        otp: otp.trim(),
      })

      saveAuthSession(res.data)
      navigate('/todolist')
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to create account')
      setTimeout(() => setError(''), 3000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      eyebrow="Create Account"
      title="Build your workspace"
      description="Create your account in one centered vertical layout and go straight into the dashboard, where creating users and assigning tasks works in the same flow."
      footer={
        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/" className="font-semibold text-slate-900 hover:underline">
            Login here
          </Link>
        </p>
      }
    >
      <div className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-slate-400">
          Create Account
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">Create your account</h1>
        <p className="mt-2 text-sm text-slate-500">Create an account to manage your own tasks.</p>
      </div>

      {error && (
        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-600">
          {success}
        </div>
      )}

      <form className="mt-6 space-y-5" onSubmit={submit} autoComplete="off">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Full name</label>
          <input
            type="text"
            placeholder="Enter your full name"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-800 outline-none transition focus:border-slate-400 focus:bg-white"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Email</label>
          <div className="flex gap-2">
            <input
              type="email"
              autoComplete="off"
              placeholder="Enter your email address"
              className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-800 outline-none transition focus:border-slate-400 focus:bg-white"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button
              type="button"
              disabled={otpSending || otpCooldown > 0}
              onClick={sendOtp}
              className="rounded-2xl bg-slate-900 px-4 py-3.5 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70 whitespace-nowrap"
            >
              {otpSending ? 'Sending...' : otpCooldown > 0 ? `Resend in ${Math.floor(otpCooldown / 60)}:${String(otpCooldown % 60).padStart(2, '0')}` : 'Send OTP'}
            </button>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Password</label>
          <input
            type="password"
            autoComplete="new-password"
            placeholder="Create a password (min 4 characters)"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-800 outline-none transition focus:border-slate-400 focus:bg-white"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">One-Time Password (OTP)</label>
          <input
            type="text"
            placeholder="Enter 6-digit OTP"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-800 outline-none transition focus:border-slate-400 focus:bg-white"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Security Keyword</label>
          <input
            type="password"
            placeholder="Enter a recovery keyword"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-800 outline-none transition focus:border-slate-400 focus:bg-white"
            value={secretKeyword}
            onChange={(e) => setSecretKeyword(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-slate-900 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>
    </AuthLayout>
  )
}

export default Signup
