export interface PipelineStage {
    id: string
    slug: string
    title: string
    color: string
    sort_order: number
    crm_type: 'lumara' | 'maan'
    is_system: boolean
    is_final: boolean
    created_at: string
}

export const STAGE_COLOR_MAP: Record<string, string> = {
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-400',
    indigo: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-700 dark:text-indigo-400',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400',
    rose: 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-400',
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400',
    purple: 'bg-purple-500/10 border-purple-500/20 text-purple-700 dark:text-purple-400',
    teal: 'bg-teal-500/10 border-teal-500/20 text-teal-700 dark:text-teal-400',
    orange: 'bg-orange-500/10 border-orange-500/20 text-orange-700 dark:text-orange-400',
    pink: 'bg-pink-500/10 border-pink-500/20 text-pink-700 dark:text-pink-400',
    gray: 'bg-gray-500/10 border-gray-500/20 text-gray-700 dark:text-gray-400',
    cyan: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-700 dark:text-cyan-400',
    yellow: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-700 dark:text-yellow-400',
    red: 'bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400',
    green: 'bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400',
    violet: 'bg-violet-500/10 border-violet-500/20 text-violet-700 dark:text-violet-400',
    sky: 'bg-sky-500/10 border-sky-500/20 text-sky-700 dark:text-sky-400',
}

export const STAGE_COLOR_OPTIONS = Object.keys(STAGE_COLOR_MAP)

export function getStageColorClasses(colorKey: string): string {
    return STAGE_COLOR_MAP[colorKey] || STAGE_COLOR_MAP.gray
}

export function stagesToKanbanColumns(stages: PipelineStage[]) {
    return stages
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(stage => ({
            id: stage.slug,
            title: stage.title,
            color: getStageColorClasses(stage.color),
            is_final: stage.is_final,
        }))
}

// Default fallback stages (used when DB is not yet migrated)
export const DEFAULT_STAGES: { id: string; title: string; color: string; is_final: boolean }[] = [
    { id: 'new', title: 'Новые', color: getStageColorClasses('blue'), is_final: false },
    { id: 'processing', title: 'В работе', color: getStageColorClasses('indigo'), is_final: false },
    { id: 'closed', title: 'Закрыто', color: getStageColorClasses('emerald'), is_final: true },
    { id: 'rejected', title: 'Отказано', color: getStageColorClasses('rose'), is_final: false },
]
