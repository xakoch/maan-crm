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
        const { full_name, email, phone, tenant_id, password, is_active } = formData;

        // 1. Create Auth User
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirm
            user_metadata: { full_name }
        });

        if (authError) throw authError;

        if (!authUser.user) throw new Error("Auth user creation failed");

        // 2. Create Profile in public.users
        const { error: profileError } = await supabase
            .from('users')
            .insert({
                id: authUser.user.id,
                email,
                full_name,
                phone,
                tenant_id,
                role: 'manager',
                is_active,
                // telegram info is filled later by bot
            });

        if (profileError) {
            // Rollback auth user if profile creation fails? 
            // Better to delete auth user to keep clean state
            await supabase.auth.admin.deleteUser(authUser.user.id);
            throw profileError;
        }

        revalidatePath('/dashboard/managers');
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
        // Update basic profile info
        const { error } = await supabase
            .from('users')
            .update({
                full_name: formData.full_name,
                email: formData.email,
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

        revalidatePath('/dashboard/managers');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
