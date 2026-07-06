import { createClient } from "@/lib/supabase/client";

export async function getWorkspaces() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("workspaces")
    .select("id, name")
    .order("created_at");

  return { data, error };
}