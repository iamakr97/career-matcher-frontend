import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import type { AssessmentParticipant } from '@/types/assessment'

const ageGroups = ['Under 10', '10-12', '13-15', '16-18', '19+']
interface Props { busy: boolean; pending: boolean; fields: Record<string, string>; onSubmit: (participant: AssessmentParticipant) => void }
export const RegistrationForm = ({ busy, pending, fields, onSubmit }: Props) => {
  const [values, setValues] = useState({ name: '', email: '', phone: '', class: '', ageGroup: '', gender: '', location: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const update = (field: keyof typeof values, value: string) => setValues((old) => ({ ...old, [field]: value }))
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const next: Record<string, string> = {}
    const name = values.name.trim().replace(/\s+/g, ' ')
    const email = values.email.trim().toLowerCase()
    const phone = values.phone.trim()
    const location = values.location.trim().replace(/\s+/g, ' ')
    const grade = Number(values.class)
    if (!name || name.length > 150) next.name = 'Enter a name of up to 150 characters.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) next.email = 'Enter a valid email address.'
    if (!/^\+[1-9][0-9]{7,14}$/.test(phone)) next.phone = 'Use international format, including + and country code.'
    if (!Number.isInteger(grade) || grade < 1 || grade > 12) next.class = 'Choose a class from 1 to 12.'
    if (!ageGroups.includes(values.ageGroup) || values.ageGroup.length > 80) next.ageGroup = 'Choose an available age group.'
    if (values.gender !== 'male' && values.gender !== 'female') next.gender = 'Choose an option.'
    if (!location || location.length > 200) next.location = 'Enter a location of up to 200 characters.'
    setErrors(next)
    if (Object.keys(next).length || (values.gender !== 'male' && values.gender !== 'female')) return
    onSubmit({ name, email, phone, class: grade, ageGroup: values.ageGroup, gender: values.gender, location })
  }
  const input = (field: keyof typeof values, label: string, type = 'text', helper?: string, autoComplete?: string) => <label className="grid gap-1 text-sm font-medium" key={field}>{label}<input name={field} type={type} autoComplete={autoComplete} value={values[field]} onChange={(event) => update(field, event.target.value)} disabled={busy || (pending && !!fields._freeze)} required className="h-10 rounded-lg border border-input bg-background px-3 focus-visible:outline-2 focus-visible:outline-primary" aria-invalid={!!(errors[field] || fields[field])} />{helper && <span className="text-xs text-muted-foreground">{helper}</span>}{(errors[field] || fields[field]) && <span className="text-xs text-destructive">{errors[field] || fields[field]}</span>}</label>
  return <section className="rounded-xl border bg-card p-5 shadow-sm sm:p-8"><h2 className="text-xl font-semibold">{pending ? 'Continue registration' : 'Start your assessment'}</h2><p className="mt-2 text-sm text-muted-foreground">Your responses will guide a personalized assessment report. {pending && 'Retry using the same details and access saved in this tab.'}</p><form onSubmit={submit} className="mt-6 grid gap-5 sm:grid-cols-2">{input('name', 'Name', 'text', undefined, 'name')}{input('email', 'Email', 'email', undefined, 'email')}{input('phone', 'Phone', 'tel', 'Use +<country code><number>.', 'tel')}<label className="grid gap-1 text-sm font-medium">Class<select name="class" value={values.class} onChange={(event) => update('class', event.target.value)} disabled={busy} required className="h-10 rounded-lg border border-input bg-background px-3"><option value="">Choose class</option>{Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}</option>)}</select>{(errors.class || fields.class) && <span className="text-xs text-destructive">{errors.class || fields.class}</span>}</label><label className="grid gap-1 text-sm font-medium">Age group<select name="ageGroup" value={values.ageGroup} onChange={(event) => update('ageGroup', event.target.value)} disabled={busy} required className="h-10 rounded-lg border border-input bg-background px-3"><option value="">Choose age group</option>{ageGroups.map((item) => <option key={item} value={item}>{item}</option>)}</select>{(errors.ageGroup || fields.ageGroup) && <span className="text-xs text-destructive">{errors.ageGroup || fields.ageGroup}</span>}</label><label className="grid gap-1 text-sm font-medium">Gender<select name="gender" value={values.gender} onChange={(event) => update('gender', event.target.value)} disabled={busy} required className="h-10 rounded-lg border border-input bg-background px-3"><option value="">Choose an option</option><option value="male">Male</option><option value="female">Female</option></select>{(errors.gender || fields.gender) && <span className="text-xs text-destructive">{errors.gender || fields.gender}</span>}</label><div className="sm:col-span-2">{input('location', 'Location', 'text', 'A general location is sufficient.', 'address-level2')}</div><div className="sm:col-span-2"><Button type="submit" disabled={busy}>{pending ? 'Retry registration' : 'Start assessment'}</Button></div></form></section>
}
