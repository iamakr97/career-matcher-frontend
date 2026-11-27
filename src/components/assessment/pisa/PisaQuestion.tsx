import { useState } from 'react'
import { AssessmentMedia } from '@/components/assessment/AssessmentMedia'
import { PisaMeaningEditor } from '@/components/assessment/pisa/PisaMeaningEditor'
import { Button } from '@/components/ui/button'
import type { AssessmentConstructedInteractionDto, AssessmentOperationIntent, AssessmentQuestionDto } from '@/types/assessment'

interface Props {
  question: AssessmentQuestionDto
  interaction: AssessmentConstructedInteractionDto
  busy: boolean
  locked: boolean
  onOperation: (intent: AssessmentOperationIntent) => void
  onCheck: () => void
}
export const PisaQuestion = ({ question, interaction, busy, locked, onOperation, onCheck }: Props) => {
  const [pendingMedia, setPendingMedia] = useState(() => [...new Set(question.presentation.media.map((item) => item.mediaId))])
  const [failedMedia, setFailedMedia] = useState<string[]>([])
  const [practiceTouched, setPracticeTouched] = useState(false)
  const mediaAvailability = (id: string, ready: boolean) => {
    setPendingMedia((old) => ready ? old.filter((item) => item !== id) : old.includes(id) ? old : [...old, id])
    setFailedMedia((old) => ready ? old.filter((item) => item !== id) : old.includes(id) ? old : [...old, id])
  }
  const interrupt = (event: string) => onOperation({ operation: 'interrupt', reason: 'Issued activity cannot be completed', observation: { technicalEvents: [event] } })
  if (question.currentStep === 'media') return <div className="grid gap-4">
    {question.presentation.media.length ? question.presentation.media.map((item) => <AssessmentMedia key={item.mediaId} media={item} onAvailability={mediaAvailability} />) : <p role="alert">This media step has no issued resources. Check again or report the unavailable activity.</p>}
    {failedMedia.length > 0 && <p role="alert" className="text-sm text-destructive">Some issued media could not be loaded. Retry the media before continuing.</p>}
    <div className="flex flex-wrap gap-2"><Button type="button" disabled={busy || locked || question.presentation.media.length === 0 || pendingMedia.length > 0} onClick={() => onOperation({ operation: 'step', observation: { mediaLoaded: true } })}>Continue</Button><Button type="button" variant="outline" disabled={busy} onClick={onCheck}>Check again</Button>{question.allowedOperations.includes('interrupt') && (failedMedia.length > 0 || question.presentation.media.length === 0) && <Button type="button" variant="outline" disabled={busy || locked} onClick={() => interrupt(failedMedia.length ? 'media_load_failed' : 'media_contract_missing')}>Report technical problem</Button>}</div>
  </div>
  if (question.currentStep === 'practice') return interaction.editor.variant === 'meaning_roles_3part_v1' && interaction.editor.roles[0]?.choices.length ? <div className="grid gap-3"><p>Try choosing an issued role option. This practice choice will not be copied into your response.</p><label className="grid gap-1 text-sm">{interaction.editor.roles[0].label}<select className="min-h-11 rounded-lg border bg-background px-3" defaultValue="" disabled={busy || locked} onChange={(event) => setPracticeTouched(!!event.target.value)}><option value="">Choose an option</option>{interaction.editor.roles[0].choices.map((choice) => <option key={choice.key} value={choice.key}>{choice.label}</option>)}</select></label><Button type="button" disabled={busy || locked || !practiceTouched} onClick={() => onOperation({ operation: 'step', observation: { practiceCompleted: true } })}>Finish practice</Button></div> : <div role="alert" className="grid gap-3"><p>This practice step needs reviewed controls that are not available for this editor.</p><Button variant="outline" type="button" disabled={busy} onClick={onCheck}>Check again</Button>{question.allowedOperations.includes('interrupt') && <Button variant="outline" type="button" disabled={busy || locked} onClick={() => interrupt('practice_controls_missing')}>Report technical problem</Button>}</div>
  if (question.currentStep !== 'editor') return <div role="alert">This issued activity step is unsupported. <Button variant="outline" type="button" onClick={onCheck}>Check again</Button></div>
  if (interaction.editor.variant === 'meaning_roles_3part_v1') return <PisaMeaningEditor editor={interaction.editor} draft={interaction.draft} busy={busy} locked={locked} onOperation={onOperation} />
  return <div role="alert" className="grid gap-3"><p>This issued editor variant does not have a learner control yet. Your assessment remains saved.</p><div><Button variant="outline" type="button" disabled={busy} onClick={onCheck}>Check again</Button>{question.allowedOperations.includes('interrupt') && <Button variant="outline" type="button" className="ml-2" disabled={busy || locked} onClick={() => interrupt('editor_unavailable')}>Report technical problem</Button>}</div></div>
}
