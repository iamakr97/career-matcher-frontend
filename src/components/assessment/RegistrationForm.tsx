import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import type { AssessmentParticipant } from '@/types/assessment'

interface Props { busy: boolean; fields: Record<string, string>; onSubmit: (participant: AssessmentParticipant) => void }

export const RegistrationForm = ({ busy, fields, onSubmit }: Props) => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const participant = { name: name.trim(), email: email.trim() }
    const next: Record<string, string> = {}
    if (!participant.name || participant.name.length > 150) next.name = 'Enter a name of up to 150 characters.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(participant.email) || participant.email.length > 254) next.email = 'Enter a valid email address.'
    setErrors(next)
    if (Object.keys(next).length === 0) onSubmit(participant)
  }
  return <section className="mx-auto mt-12 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
    <h1 className="text-2xl font-semibold tracking-tight">Start Assessment</h1>
    <form className="mt-6 grid gap-5" onSubmit={submit} noValidate>
      <label className="grid gap-1.5 text-sm font-medium">Name<input autoComplete="name" required maxLength={150} value={name} onChange={(event) => setName(event.target.value)} aria-invalid={!!(errors.name || fields.name)} className="h-11 rounded-lg border border-slate-300 px-3 outline-none focus-visible:ring-2 focus-visible:ring-teal-700" />{(errors.name || fields.name) && <span className="text-xs text-destructive">{errors.name || fields.name}</span>}</label>
      <label className="grid gap-1.5 text-sm font-medium">Email<input type="email" autoComplete="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} aria-invalid={!!(errors.email || fields.email)} className="h-11 rounded-lg border border-slate-300 px-3 outline-none focus-visible:ring-2 focus-visible:ring-teal-700" />{(errors.email || fields.email) && <span className="text-xs text-destructive">{errors.email || fields.email}</span>}</label>
      <Button type="submit" disabled={busy} className="min-h-11 bg-teal-900 hover:bg-teal-800">{busy ? 'Starting…' : 'Start Assessment'}</Button>
    </form>
  </section>
}
