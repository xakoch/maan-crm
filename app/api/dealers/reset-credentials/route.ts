import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { Database } from '@/types/database.types'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { tenant_id, username, password, owner_name, owner_phone } = body

        if (!tenant_id || !password) {
            return NextResponse.json({ error: "Tenant ID and password are required" }, { status: 400 })
        }

        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            throw new Error('SERVER CONFIGURATION ERROR: Service Role Key is missing.')
        }

        const supabaseAdmin = createClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // 1. Find existing dealer user for this tenant
        const { data: existingUsers, error: searchError } = await supabaseAdmin
            .from('users')
            .select('id, email')
            .eq('tenant_id', tenant_id)
            .eq('role', 'dealer')

        if (searchError) throw searchError

        // Clean up text
        const cleanUsername = username.trim().toLowerCase() // Username in lower case
        const email = `${cleanUsername}@maancrm.local`

        // STRATEGY: DELETE AND RECREATE
        // This ensures email and username allow match perfectly without "email change confirmation" issues.

        if (existingUsers && existingUsers.length > 0) {
            for (const user of existingUsers) {
                // Delete auth user. If public.users has "on delete cascade" FK, it will be deleted too.
                // If not, we might fail to re-create public profile due to PK conflict, so we delete it manually first just in case.

                // Try delete from public first (ignore error if not exists)
                await supabaseAdmin.from('users').delete().eq('id', user.id)

                // Delete from auth
                await supabaseAdmin.auth.admin.deleteUser(user.id)
            }
        }

        // 2. Create NEW user
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true,
            user_metadata: {
                full_name: owner_name,
                role: 'dealer',
                tenant_id: tenant_id,
                username: cleanUsername
            }
        })

        if (createError) throw createError
        if (!newUser.user) throw new Error("Failed to create user object")

        const userId = newUser.user.id

        // 3. Create Public User entry
        // We use upsert to be safe
        const { error: profileError } = await supabaseAdmin
            .from('users')
            .upsert({
                id: userId,
                email: email,
                username: cleanUsername,
                role: 'dealer',
                tenant_id: tenant_id,
                full_name: owner_name,
                phone: owner_phone,
                is_active: true
            })

        if (profileError) {
            console.error("Profile creation failed:", profileError)
            // Rollback auth
            await supabaseAdmin.auth.admin.deleteUser(userId)
            throw new Error(`Failed to create user profile: ${profileError.message}`)
        }

        return NextResponse.json({ success: true, userId, email })
    } catch (error: any) {
        console.error("Credentials reset error:", error)
        return NextResponse.json({ error: error.message }, { status: 400 })
    }
}
