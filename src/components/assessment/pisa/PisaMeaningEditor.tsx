import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { validPisaOutput } from '@/lib/pisa-contract'
import type { AssessmentOperationIntent } from '@/types/assessment'
import type { PisaEditor, PisaResponse } from '@/types/pisa-assessment'

interface Props {
  editor: Extract<PisaEditor, { variant: 'meaning_roles_3part_v1' }>
  draft: PisaResponse | null
  busy: boolean
  locked: boolean
  onOperation: (intent: AssessmentOperationIntent) => void
}
export const PisaMeaningEditor = ({ editor, draft, busy, locked, onOperation }: Props) => {
  const initial: [Record<string, string>, Record<string, string>] = draft?.variant === 'meaning_roles_3part_v1' ? draft.ideas : [{}, {}]
  const [ideas, setIdeas] = useState<[Record<string, string>, Record<string, string>]>(initial)
  const output: PisaResponse = { variant: 'meaning_roles_3part_v1', ideas }
  const canSave = validPisaOutput(output, editor)
  const canSubmit = validPisaOutput(output, editor, true)
  const change = (index: 0 | 1, role: string, choice: string) => setIdeas((previous) => {
    const next: [Record<string, string>, Record<string, string>] = [{ ...previous[0] }, { ...previous[1] }]
    if (choice) next[index][role] = choice
    else delete next[index][role]
    return next
  })
  return <div className="grid gap-5">
    {editor.constraints?.length ? <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">{editor.constraints.map((item, index) => <li key={index}>{item}</li>)}</ul> : null}
    {([0, 1] as const).map((index) => <fieldset key={index} disabled={busy || locked} className="min-w-0 rounded-lg border p-4"><legend className="px-1 font-semibold">Idea {index + 1}</legend><div className="grid gap-4">{editor.roles.map((role) => <label key={role.key} className="grid gap-1 text-sm font-medium">{role.label}<select className="min-h-11 w-full rounded-lg border bg-background px-3" value={ideas[index][role.key] ?? ''} onChange={(event) => change(index, role.key, event.target.value)}><option value="">Choose an option</option>{role.choices.map((choice) => <option key={choice.key} value={choice.key}>{choice.label}</option>)}</select></label>)}</div></fieldset>)}
    <p className="text-sm text-muted-foreground">Choose a response for every role in both ideas before submitting. You can save a partial selection as a draft.</p>
    <div className="flex flex-wrap gap-2"><Button type="button" variant="outline" disabled={busy || locked || !canSave} onClick={() => onOperation({ operation: 'draft', response: { kind: 'constructed_activity', output } })}>Save draft</Button><Button type="button" disabled={busy || locked || !canSubmit} onClick={() => onOperation({ operation: 'submit', response: { kind: 'constructed_activity', output } })}>Submit response</Button></div>
  </div>
}
