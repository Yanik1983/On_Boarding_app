import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'

export type Quality = 'auto' | 'high' | 'ultra'
export type Vec3 = [number, number, number]
/** Camera override, in coordinates local to the current station. */
export interface Focus {
  position: Vec3
  target: Vec3
  /** The point of interest itself (target may be shifted to make room for the panel). */
  center?: Vec3
}
/** Screen area (in CSS pixels) covered by the interface at the top and bottom, on phones. */
export interface ViewInset {
  top: number
  bottom: number
}
export interface QuizResult {
  score: number
  total: number
  passed: boolean
  date: string
}
export type EyeCondition = 'normal' | 'myopia' | 'hyperopia'
export type Rhythm = 'normal' | 'afib' | 'ablated'

export interface LabState {
  demo: string
  eye: EyeCondition
  lensPower: number
  rhythm: Rhythm
  kneeAngle: number
  kneeAuto: boolean
  stage: number
}

interface State {
  // Journey
  stationIds: string[]
  allowFreeOrder: boolean
  preview: boolean
  current: number
  previous: number
  highestUnlocked: number
  completed: string[]
  // Personal progress
  name: string
  checklist: string[]
  quiz: QuizResult | null
  // Settings
  quality: Quality
  reducedMotion: boolean | null
  textOnly: boolean
  // Transient UI
  steps: Record<string, number>
  selection: Record<string, string | null>
  focus: Focus | null
  menuOpen: boolean
  settingsOpen: boolean
  sheetCollapsed: boolean
  viewInset: ViewInset
  toast: string | null
  lab: LabState

  init: (stationIds: string[], options: { allowFreeOrder: boolean; preview?: boolean }) => void
  goTo: (index: number) => void
  next: () => void
  prev: () => void
  completeStation: (id: string) => void
  setStep: (stationId: string, step: number) => void
  select: (key: string, value: string | null) => void
  setFocus: (focus: Focus | null) => void
  setName: (name: string) => void
  toggleChecklist: (id: string) => void
  setQuiz: (result: QuizResult) => void
  setQuality: (quality: Quality) => void
  setReducedMotion: (value: boolean | null) => void
  setTextOnly: (value: boolean) => void
  setMenuOpen: (open: boolean) => void
  setSettingsOpen: (open: boolean) => void
  setSheetCollapsed: (collapsed: boolean) => void
  showToast: (message: string | null) => void
  setViewInset: (inset: ViewInset) => void
  setLab: (patch: Partial<LabState>) => void
  resetProgress: () => void
}

/** localStorage can be unavailable (private windows, blocked site data), so every access is guarded. */
const safeStorage: StateStorage = {
  getItem: (key) => {
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  },
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, value)
    } catch {
      // Progress simply isn't saved.
    }
  },
  removeItem: (key) => {
    try {
      localStorage.removeItem(key)
    } catch {
      // Ignore.
    }
  },
}

const initialLab: LabState = {
  demo: 'optics',
  eye: 'myopia',
  lensPower: 0,
  rhythm: 'normal',
  kneeAngle: 30,
  kneeAuto: true,
  stage: 0,
}

const initialProgress = {
  current: 0,
  previous: 0,
  highestUnlocked: 0,
  completed: [] as string[],
  name: '',
  checklist: [] as string[],
  quiz: null as QuizResult | null,
  steps: {} as Record<string, number>,
}

export function canVisit(state: Pick<State, 'allowFreeOrder' | 'preview' | 'highestUnlocked' | 'stationIds'>, index: number): boolean {
  if (index < 0 || index >= state.stationIds.length) return false
  return state.allowFreeOrder || state.preview || index <= state.highestUnlocked
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      stationIds: [],
      allowFreeOrder: false,
      preview: false,
      ...initialProgress,
      quality: 'high',
      reducedMotion: null,
      textOnly: false,
      selection: {},
      focus: null,
      menuOpen: false,
      settingsOpen: false,
      sheetCollapsed: false,
      viewInset: { top: 0, bottom: 0 },
      toast: null,
      lab: initialLab,

      init: (stationIds, { allowFreeOrder, preview = false }) => {
        const last = Math.max(0, stationIds.length - 1)
        const { current, highestUnlocked, completed } = get()
        set({
          stationIds,
          allowFreeOrder,
          preview,
          highestUnlocked: preview ? last : Math.min(highestUnlocked, last),
          current: Math.min(current, last),
          previous: Math.min(current, last),
          completed: completed.filter((id) => stationIds.includes(id)),
        })
      },
      goTo: (index) => {
        const state = get()
        if (index === state.current || !canVisit(state, index)) return
        set({ previous: state.current, current: index, focus: null, menuOpen: false })
      },
      next: () => get().goTo(get().current + 1),
      prev: () => get().goTo(get().current - 1),
      completeStation: (id) => {
        const { stationIds, completed, highestUnlocked } = get()
        const index = stationIds.indexOf(id)
        if (index < 0) return
        set({
          completed: completed.includes(id) ? completed : [...completed, id],
          highestUnlocked: Math.max(highestUnlocked, Math.min(index + 1, stationIds.length - 1)),
        })
      },
      setStep: (stationId, step) => set((s) => ({ steps: { ...s.steps, [stationId]: step } })),
      select: (key, value) => set((s) => ({ selection: { ...s.selection, [key]: value } })),
      setFocus: (focus) => set({ focus }),
      setName: (name) => set({ name: name.slice(0, 80) }),
      toggleChecklist: (id) =>
        set((s) => ({ checklist: s.checklist.includes(id) ? s.checklist.filter((c) => c !== id) : [...s.checklist, id] })),
      setQuiz: (quiz) => set({ quiz }),
      setQuality: (quality) => set({ quality }),
      setReducedMotion: (reducedMotion) => set({ reducedMotion }),
      setTextOnly: (textOnly) => set({ textOnly }),
      setMenuOpen: (menuOpen) => set({ menuOpen, settingsOpen: false }),
      setSettingsOpen: (settingsOpen) => set({ settingsOpen, menuOpen: false }),
      setSheetCollapsed: (sheetCollapsed) => set({ sheetCollapsed }),
      showToast: (toast) => set({ toast }),
      setViewInset: (viewInset) => {
        const { top, bottom } = get().viewInset
        if (Math.abs(top - viewInset.top) > 0.5 || Math.abs(bottom - viewInset.bottom) > 0.5) set({ viewInset })
      },
      setLab: (patch) => set((s) => ({ lab: { ...s.lab, ...patch } })),
      resetProgress: () =>
        set((s) => ({
          ...initialProgress,
          previous: s.current,
          highestUnlocked: s.preview ? Math.max(0, s.stationIds.length - 1) : 0,
          selection: {},
          focus: null,
          lab: initialLab,
          settingsOpen: false,
        })),
    }),
    {
      name: 'jnj-medtech-onboarding',
      version: 2,
      storage: createJSONStorage(() => safeStorage),
      // v1 defaulted to 'auto', which could render blurry; move those users to the sharp default.
      migrate: (persisted, version) => {
        const state = persisted as { quality?: Quality }
        if (version < 2 && state.quality === 'auto') state.quality = 'high'
        return state as State
      },
      partialize: (s) => ({
        current: s.current,
        highestUnlocked: s.highestUnlocked,
        completed: s.completed,
        name: s.name,
        checklist: s.checklist,
        quiz: s.quiz,
        quality: s.quality,
        reducedMotion: s.reducedMotion,
        textOnly: s.textOnly,
        steps: s.steps,
      }),
    },
  ),
)
