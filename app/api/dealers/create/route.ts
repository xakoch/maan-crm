import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { Database } from '@/types/database.types'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { username, password, name, city, region, address, owner_name, owner_phone, status } = body

        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            throw new Error('SERVER CONFIGURATION ERROR: Service Role Key is missing.')
        }

        // Initialize admin client
        const supabaseAdmin = createClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // 1. Create Tenant
        const { data: tenant, error: tenantError } = await supabaseAdmin
            .from('tenants')
            .insert([{
                name,
                city,
                region,
                address,
                owner_name,
                owner_phone,
                status
            }])
            .select()
            .single()

        if (tenantError) throw tenantError

        // 2. Create User linked to Tenant
        // Use a dummy email format since username is preferred
        const email = `${username}@maancrm.local`

        const { data: user, error: userError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true,
            user_metadata: {
                full_name: owner_name,
                role: 'dealer', // Backup in metadata
                tenant_id: tenant.id
            }
        })

        if (userError) {
            // Rollback tenant creation
            console.error("User creation failed, rolling back tenant:", userError)
            await supabaseAdmin.from('tenants').delete().eq('id', tenant.id)
            throw new Error(`Failed to create user: ${userError.message}`)
        }

        // 3. Create Public User entry (if not handled by trigger)
        // Check if trigger did it? Usually triggers handle auth.users -> public.users
        // But let's check or try to update it.
        // Assuming we need to insert or update.
        // Best practice: Let's try to update the user if trigger exists, or insert if not.
        // Since we explicitly want to set role to 'dealer' and tenant_id.

        // Wait a bit or try to upsert.
        const { error: profileError } = await supabaseAdmin
            .from('users')
            .upsert({
                id: user.user.id,
                email: email,
                username: username,
                role: 'dealer',
                tenant_id: tenant.id,
                full_name: owner_name,
                phone: owner_phone,
                is_active: true
            })

        if (profileError) {
            console.error("Profile creation failed:", profileError)
            // Non-fatal? The auth user exists. But application logic might fail.
            // Try to delete auth user?
            await supabaseAdmin.auth.admin.deleteUser(user.user.id)
            await supabaseAdmin.from('tenants').delete().eq('id', tenant.id)
            throw new Error(`Failed to create user profile: ${profileError.message}`)
        }

        return NextResponse.json({ success: true, tenant, user })
    } catch (error: any) {
        console.error("Dealer creation error:", error)
        return NextResponse.json({ error: error.message }, { status: 400 })
    }
}
