'use server'

import { createClient } from "@supabase/supabase-js"
import { Database } from "@/types/database.types"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

function getAdminClient() {
    return createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

async function requireSuperAdmin() {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Не авторизован")

    const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single()

    if (profile?.role !== "super_admin") throw new Error("Доступ запрещен")
}

// ============================================
// Form Configs
// ============================================

export async function getFormConfigs() {
    const supabase = getAdminClient()
    const { data, error } = await supabase
        .from('form_configs')
        .select('*')
        .order('created_at', { ascending: true })

    if (error) throw error
    return data
}

export async function createFormConfig(formData: {
    slug: string
    title_ru: string
    title_uz: string
    subtitle_ru?: string
    subtitle_uz?: string
    crm_type: 'lumara' | 'maan'
    enabled_fields: string[]
    is_active: boolean
}) {
    await requireSuperAdmin()
    const supabase = getAdminClient()

    const { error } = await supabase
        .from('form_configs')
        .insert(formData)

    if (error) return { success: false, error: error.message }
    revalidatePath('/dashboard/settings')
    return { success: true }
}

export async function updateFormConfig(id: string, formData: {
    slug?: string
    title_ru?: string
    title_uz?: string
    subtitle_ru?: string | null
    subtitle_uz?: string | null
    crm_type?: 'lumara' | 'maan'
    enabled_fields?: string[]
    is_active?: boolean
}) {
    await requireSuperAdmin()
    const supabase = getAdminClient()

    const { error } = await supabase
        .from('form_configs')
        .update(formData)
        .eq('id', id)

    if (error) return { success: false, error: error.message }
    revalidatePath('/dashboard/settings')
    return { success: true }
}

export async function deleteFormConfig(id: string) {
    await requireSuperAdmin()
    const supabase = getAdminClient()

    const { error } = await supabase
        .from('form_configs')
        .delete()
        .eq('id', id)

    if (error) return { success: false, error: error.message }
    revalidatePath('/dashboard/settings')
    return { success: true }
}

// ============================================
// Regions
// ============================================

export async function getRegions() {
    const supabase = getAdminClient()
    const { data, error } = await supabase
        .from('regions')
        .select('*')
        .order('sort_order', { ascending: true })

    if (error) throw error
    return data
}

export async function createRegion(formData: {
    slug: string
    name_ru: string
    name_uz: string
    is_active: boolean
    has_districts: boolean
    sort_order?: number
}) {
    await requireSuperAdmin()
    const supabase = getAdminClient()

    const { error } = await supabase
        .from('regions')
        .insert(formData)

    if (error) return { success: false, error: error.message }
    revalidatePath('/dashboard/settings')
    return { success: true }
}

export async function updateRegion(id: string, formData: {
    slug?: string
    name_ru?: string
    name_uz?: string
    is_active?: boolean
    has_districts?: boolean
    sort_order?: number
}) {
    await requireSuperAdmin()
    const supabase = getAdminClient()

    const { error } = await supabase
        .from('regions')
        .update(formData)
        .eq('id', id)

    if (error) return { success: false, error: error.message }
    revalidatePath('/dashboard/settings')
    return { success: true }
}

// ============================================
// Cities
// ============================================

export async function getCities() {
    const supabase = getAdminClient()
    const { data, error } = await supabase
        .from('cities')
        .select('*')
        .order('sort_order', { ascending: true })

    if (error) throw error
    return data
}

export async function createCity(formData: {
    name_ru: string
    name_uz: string
    region: string
    is_active: boolean
    sort_order?: number
}) {
    await requireSuperAdmin()
    const supabase = getAdminClient()

    const { error } = await supabase
        .from('cities')
        .insert(formData)

    if (error) return { success: false, error: error.message }
    revalidatePath('/dashboard/settings')
    return { success: true }
}

export async function updateCity(id: string, formData: {
    name_ru?: string
    name_uz?: string
    region?: string
    is_active?: boolean
    sort_order?: number
}) {
    await requireSuperAdmin()
    const supabase = getAdminClient()

    const { error } = await supabase
        .from('cities')
        .update(formData)
        .eq('id', id)

    if (error) return { success: false, error: error.message }
    revalidatePath('/dashboard/settings')
    return { success: true }
}

export async function deleteCity(id: string) {
    await requireSuperAdmin()
    const supabase = getAdminClient()

    const { error } = await supabase
        .from('cities')
        .delete()
        .eq('id', id)

    if (error) return { success: false, error: error.message }
    revalidatePath('/dashboard/settings')
    return { success: true }
}

// ============================================
// Pipeline Stages
// ============================================

export async function getPipelineStages(crmType?: 'lumara' | 'maan') {
    const supabase = getAdminClient()
    let query = supabase
        .from('pipeline_stages')
        .select('*')
        .order('sort_order', { ascending: true })

    if (crmType) {
        query = query.eq('crm_type', crmType)
    }

    const { data, error } = await query
    if (error) throw error
    return data
}

export async function createPipelineStage(formData: {
    slug: string
    title: string
    color: string
    sort_order: number
    crm_type: 'lumara' | 'maan'
    is_system?: boolean
    is_final?: boolean
}) {
    await requireSuperAdmin()
    const supabase = getAdminClient()

    const { error } = await supabase
        .from('pipeline_stages')
        .insert({
            ...formData,
            is_system: formData.is_system || false,
            is_final: formData.is_final || false,
        })

    if (error) return { success: false, error: error.message }
    revalidatePath('/dashboard/settings')
    revalidatePath('/dashboard/leads')
    revalidatePath('/dashboard/maan')
    return { success: true }
}

export async function updatePipelineStage(id: string, formData: {
    slug?: string
    title?: string
    color?: string
    sort_order?: number
    is_final?: boolean
}) {
    await requireSuperAdmin()
    const supabase = getAdminClient()

    const { error } = await supabase
        .from('pipeline_stages')
        .update(formData)
        .eq('id', id)

    if (error) return { success: false, error: error.message }
    revalidatePath('/dashboard/settings')
    revalidatePath('/dashboard/leads')
    revalidatePath('/dashboard/maan')
    return { success: true }
}

export async function deletePipelineStage(id: string) {
    await requireSuperAdmin()
    const supabase = getAdminClient()

    // Prevent deleting system stages
    const { data: stage } = await supabase
        .from('pipeline_stages')
        .select('is_system, slug, crm_type')
        .eq('id', id)
        .single()

    if (stage?.is_system) {
        return { success: false, error: "Нельзя удалить системный этап" }
    }

    // Check if any leads use this status
    const { count } = await supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('status', stage?.slug || '')

    if (count && count > 0) {
        return { success: false, error: `Нельзя удалить: ${count} заявок используют этот статус` }
    }

    const { error } = await supabase
        .from('pipeline_stages')
        .delete()
        .eq('id', id)

    if (error) return { success: false, error: error.message }
    revalidatePath('/dashboard/settings')
    revalidatePath('/dashboard/leads')
    revalidatePath('/dashboard/maan')
    return { success: true }
}

export async function reorderPipelineStages(orderedIds: string[]) {
    await requireSuperAdmin()
    const supabase = getAdminClient()

    const updates = orderedIds.map((id, index) =>
        supabase
            .from('pipeline_stages')
            .update({ sort_order: index })
            .eq('id', id)
    )

    const results = await Promise.all(updates)
    const failed = results.find(r => r.error)
    if (failed?.error) return { success: false, error: failed.error.message }

    revalidatePath('/dashboard/settings')
    revalidatePath('/dashboard/leads')
    revalidatePath('/dashboard/maan')
    return { success: true }
}

// ============================================
// Public: get active form config by slug
// ============================================

export async function getFormConfigBySlug(slug: string) {
    const supabase = getAdminClient()
    const { data, error } = await supabase
        .from('form_configs')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single()

    if (error) return null
    return data
}

export async function getActiveRegionsAndCities() {
    const supabase = getAdminClient()

    const [regionsResult, citiesResult] = await Promise.all([
        supabase
            .from('regions')
            .select('*')
            .eq('is_active', true)
            .order('sort_order', { ascending: true }),
        supabase
            .from('cities')
            .select('*')
            .eq('is_active', true)
            .order('sort_order', { ascending: true }),
    ])

    return {
        regions: regionsResult.data || [],
        cities: citiesResult.data || [],
    }
}
