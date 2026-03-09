'use server';

import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/database.types";
import { revalidatePath } from "next/cache";

// Server Action for creating/updating managers securely
export async function createManagerAction(formData: any) {
    const supabase = createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    try {
        const { full_name, username, email, phone, tenant_id, password, is_active } = formData;

        // Generate email for Supabase Auth (uses username@maancrm.local if no email)
        const authEmail = email && email.trim() ? email.trim() : `${username.trim().toLowerCase()}@maancrm.local`;

        // 1. Create Auth User
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
            email: authEmail,
            password,
            email_confirm: true,
            user_metadata: { full_name }
        });

        if (authError) throw authError;

        if (!authUser.user) throw new Error("Auth user creation failed");

        // 2. Create Profile in public.users
        const { error: profileError } = await supabase
            .from('users')
            .insert({
                id: authUser.user.id,
                email: authEmail,
                username: username.trim().toLowerCase(),
                full_name,
                phone,
                tenant_id,
                role: 'manager',
                is_active,
            });

        if (profileError) {
            // Rollback auth user if profile creation fails? 
            // Better to delete auth user to keep clean state
            await supabase.auth.admin.deleteUser(authUser.user.id);
            throw profileError;
        }

        revalidatePath('/lumara/dashboard/managers');
        revalidatePath('/maan/dashboard/managers');
        return { success: true };

    } catch (error: any) {
        console.error("Create manager error:", error);
        return { success: false, error: error.message };
    }
}

export async function updateManagerAction(id: string, formData: any) {
    const supabase = createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    try {
        const { error } = await supabase
            .from('users')
            .update({
                full_name: formData.full_name,
                username: formData.username?.trim().toLowerCase() || null,
                phone: formData.phone,
                tenant_id: formData.tenant_id,
                is_active: formData.is_active,
                telegram_username: formData.telegram_username || null
            })
            .eq('id', id);

        if (error) throw error;

        // Note: Changing email in Auth is harder (requires confirmation), 
        // so for now we only update public profile or assume email doesn't change often.
        // If password update is needed, it should be a separate function.

        revalidatePath('/lumara/dashboard/managers');
        revalidatePath('/maan/dashboard/managers');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
