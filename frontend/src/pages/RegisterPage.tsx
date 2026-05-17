import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getApiErrors } from '@/api/errors'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Spinner } from '@/components/ui/Spinner'
import { useToast } from '@/hooks/useToast'
import { useAuthStore } from '@/stores/authStore'

export function RegisterPage() {
  const navigate = useNavigate()
  const register = useAuthStore((s) => s.register)
  const { error: toastError, success: toastSuccess } = useToast()

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await register({
        email: email.trim(),
        password,
        password_confirmation: passwordConfirmation,
        display_name: displayName.trim() || undefined,
      })
      toastSuccess('Account created.')
      navigate('/app', { replace: true })
    } catch (err) {
      getApiErrors(err).forEach((m) => toastError(m))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <h1 className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">Create account</h1>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          Start with email and password. You can refine your profile later.
        </p>
        <Card className="mt-8 p-6">
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label htmlFor="display_name">Display name (optional)</Label>
              <Input
                id="display_name"
                name="display_name"
                autoComplete="name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
              <p className="mt-1.5 text-xs text-neutral-400 dark:text-neutral-500">At least 8 characters.</p>
            </div>
            <div>
              <Label htmlFor="password_confirmation">Confirm password</Label>
              <Input
                id="password_confirmation"
                name="password_confirmation"
                type="password"
                autoComplete="new-password"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner className="size-4 border-2 border-white/40 border-t-white dark:border-neutral-900/30 dark:border-t-neutral-900" />
                  Creating account
                </span>
              ) : (
                'Continue'
              )}
            </Button>
          </form>
        </Card>
        <p className="mt-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-neutral-900 underline-offset-4 hover:underline dark:text-neutral-100">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
