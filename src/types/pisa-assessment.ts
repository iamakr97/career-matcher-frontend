export type PisaAction = 'add' | 'add_condition' | 'add_rule' | 'add_step' | 'assign_group' | 'change_minutes' | 'change_variable' | 'choose' | 'choose_check' | 'choose_rule' | 'clear' | 'connect' | 'delete_step' | 'join_steps' | 'move' | 'move_group' | 'preview' | 'recolour' | 'redo' | 'remove' | 'remove_step' | 'reorder' | 'reorder_steps' | 'repeat' | 'replace' | 'resize' | 'resize_cloth' | 'rotate' | 'set_time' | 'set_water' | 'undo'
export interface PisaPiece { key: string; label: string }
export interface PisaRole { key: string; label: string; choices: PisaPiece[] }
export interface PisaPieceAsset { pieceKey: string; mediaId: string }
export interface PisaBaseline {
  waterSlots?: { group: string; minutes: number }[]
  resourceReturn?: { groups: string[]; tools: string[]; steps: string[]; returnTracking: boolean }
  clothExperiment?: { clothA: PisaCloth; clothB: PisaCloth; check: string; repeats: number }
  generalExperiment?: { kind: 'paper_bridge' | 'toy_car' | 'ice_melting' | 'seed_growth' | 'paper_plane'; bridgeA?: { paperLength: string; weights: number }; bridgeB?: { paperLength: string; weights: number }; surfaceA?: string; surfaceB?: string; startA?: string; startB?: string; iceA?: string; iceB?: string; checkA?: string; checkB?: string; cupA?: { size: string; water: string; light: string }; cupB?: { size: string; water: string; light: string }; planeA?: { paper: string; throw: string; start: string }; planeB?: { paper: string; throw: string; start: string }; check?: string; repeats: number }
  storyRevision?: { story: string; originalEnding: string; lockedFacts: string[] }
}
interface PisaEditorBase { allowedActions: PisaAction[]; constraints?: string[] }
export type PisaEditor =
  | (PisaEditorBase & { kind: 'meaning_builder'; variant: 'meaning_roles_3part_v1'; roles: PisaRole[] })
  | (PisaEditorBase & { kind: 'comic_builder'; variant: 'comic_locked_panels_v1'; pieces: PisaPiece[]; pieceAssets?: PisaPieceAsset[]; actions?: string[]; panelCount: number; lockedPanels: number })
  | (PisaEditorBase & { kind: 'room_layout'; variant: 'paired_visual_layout_v1'; pieces: PisaPiece[]; pieceAssets?: PisaPieceAsset[]; canvasCount: number; lockedLayers: string[] })
  | (PisaEditorBase & { kind: 'sign_designer'; variant: 'sign_asset_palette_v1'; pieces: PisaPiece[]; pieceAssets: PisaPieceAsset[]; canvasCount: number; allowText: boolean; editableCanvas: { width: number; height: number } })
  | (PisaEditorBase & { kind: 'poster_editor'; variant: 'poster_template_v1'; pieces: PisaPiece[]; pieceAssets: PisaPieceAsset[]; protectedText: string[]; baselineId: string; baselineMediaId: string; editableDecorationIds: string[]; baselineLocked: boolean; canvasCount: number })
  | (PisaEditorBase & { kind: 'park_planner'; variant: 'paired_space_plan_locked_v1'; groups: string[]; zones: string[]; times: string[]; rules: string[]; boards: number; lockedLayers: string[] })
  | (PisaEditorBase & { kind: 'shop_flow'; variant: 'social_flow_extended_v1'; participants: string[]; actions: string[]; items: string[]; places: string[]; conditions: string[]; maxSteps: number; minConnectedSteps: number })
  | (PisaEditorBase & { kind: 'water_schedule'; variant: 'timed_allocation_template_v1'; baseline: PisaBaseline; baselineId: string; groupLabels: { code: string; label: string }[]; totalMinutes: number; resourceCount: number; resourceLabel?: string; rules: string[]; originalLocked: boolean })
  | (PisaEditorBase & { kind: 'water_schedule'; variant: 'resource_return_revision_v1'; baseline: PisaBaseline; stepChoices: PisaPiece[]; ruleChoices: string[] })
  | (PisaEditorBase & { kind: 'drying_cause_map'; variant: 'causal_pair_v1'; parts: { cause: PisaPiece[]; changesByCause: { causeKey: string; changes: PisaPiece[] }[]; effect: PisaPiece[] }; links: string[]; outputCount: number })
  | (PisaEditorBase & { kind: 'cloth_experiment'; variant: 'cloth_experiment_v1'; baseline: PisaBaseline; sizes: string[]; cupCounts: number[]; checks: PisaPiece[]; repeatCounts: number[] })
  | (PisaEditorBase & { kind: 'cloth_experiment'; variant: 'general_experiment_v1'; baseline: PisaBaseline; changeChoices: string[]; checks: PisaPiece[]; repeatCounts: number[] })
  | (PisaEditorBase & { kind: 'story_revision_builder'; variant: 'story_revision_v1'; baseline: PisaBaseline; storyPieces: { groups: { key: string; choices: PisaPiece[] }[] }; optionalShortLine: boolean })
  | (PisaEditorBase & { kind: 'investigation_builder'; variant: 'investigation_builder_v1'; lockedQuestion: string; materials: PisaPiece[]; planNodes: string[]; links: string[] })

export interface PisaPose { x: number; y: number; width: number; height: number; rotationDeg: number; color?: string }
export interface PisaPlacedPiece extends PisaPose { instanceId: string; pieceKey: string; zIndex: number }
export interface PisaCanvasState { objects: PisaPlacedPiece[] }
export interface PisaComicPanel { index: 3 | 4; objects: PisaPlacedPiece[]; actions: { actorInstanceId: string; action: string; targetInstanceId?: string }[] }
export interface PisaSpacePlan { assignments: { group: string; zone: string; time: string }[]; rules: string[] }
export interface PisaFlowStep { id: string; participant: string; action: string; item?: string; place: string; condition?: string }
export interface PisaEdge { from: string; to: string; link?: string }
export interface PisaPlanNode { id: string; nodeKey: string; materialKeys: string[] }
export interface PisaCauseChain { causeKey: string; changeKey: string; effectKey: string; link: string }
export interface PisaCloth { size: string; cups: number }
export interface PisaTurn { group: string; minutes: number }
export type PisaPair<T> = [T, T]
export type PisaResponse =
  | { variant: 'meaning_roles_3part_v1'; ideas: PisaPair<Record<string, string>> }
  | { variant: 'comic_locked_panels_v1'; panels: PisaPair<PisaComicPanel>; shortLine?: string }
  | { variant: 'paired_visual_layout_v1'; layouts: PisaPair<PisaCanvasState> }
  | { variant: 'sign_asset_palette_v1'; sign: PisaCanvasState }
  | { variant: 'poster_template_v1'; final: PisaCanvasState }
  | { variant: 'paired_space_plan_locked_v1'; plans: PisaPair<PisaSpacePlan> }
  | { variant: 'social_flow_extended_v1'; steps: PisaFlowStep[]; edges: PisaEdge[] }
  | { variant: 'timed_allocation_template_v1'; turns: PisaTurn[]; rule?: string }
  | { variant: 'resource_return_revision_v1'; steps: string[]; rule?: string }
  | { variant: 'causal_pair_v1'; reasons: PisaPair<PisaCauseChain> }
  | { variant: 'cloth_experiment_v1'; clothA: PisaCloth; clothB: PisaCloth; check: string; repeats: number }
  | { variant: 'general_experiment_v1'; changes: string[]; check: string; repeats: number }
  | { variant: 'story_revision_v1'; choices: Record<string, string>; shortLine?: string }
  | { variant: 'investigation_builder_v1'; materialKeys: string[]; nodes: PisaPlanNode[]; edges: PisaEdge[] }
