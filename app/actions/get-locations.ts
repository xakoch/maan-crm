'use server'

import { createClient } from "@supabase/supabase-js";

export async function getDealerLocationsAction() {
    try {
        // Use Service Role key to bypass RLS for public form data
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data, error } = await supabase
            .from("tenants")
            .select("city, region")
            .eq("status", "active");

        if (error) {
            console.error("Error fetching locations:", error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error("Server action error:", error);
        return [];
    }
}
