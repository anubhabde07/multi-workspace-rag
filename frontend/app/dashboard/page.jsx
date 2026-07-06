"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import WorkspaceSwitcher from "@/components/WorkspaceSwitcher";

export default function Dashboard() {
  const supabase = createClient();

  useEffect(() => {
    async function initializeWorkspace() {
      console.log("Checking workspace...");

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.log("No logged in user");
        return;
      }

      console.log("User:", user.id);

      // Check memberships
      const { data: memberships, error } = await supabase
        .from("workspace_members")
        .select("*")
        .eq("user_id", user.id);

      if (error) {
        console.error("Membership Error:", error);
        return;
      }

      console.log("Memberships:", memberships);

      if (memberships.length === 0) {
        console.log("No workspace found. Creating...");

        const { data, error } = await supabase.rpc("create_workspace", {
          workspace_name: "My Workspace",
        });

        console.log("RPC Data:", data);
        console.log("RPC Error:", error);

        if (error) {
          console.error(error);
          return;
        }

        console.log("Workspace created successfully!");
      } else {
        console.log("Workspace already exists.");
      }
    }

    initializeWorkspace();
  }, []);

  return (
    <div>
      <WorkspaceSwitcher />
      <h1>Dashboard</h1>
    </div>
  );
}