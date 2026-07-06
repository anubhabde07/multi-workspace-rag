"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import WorkspaceSwitcher from "@/components/WorkspaceSwitcher";
import DocumentUpload from "@/components/DocumentUpload";
import {
  getWorkspaceCookie,
  setWorkspaceCookie,
} from "@/lib/cookies";

export default function Dashboard() {
  const supabase = createClient();

  const [workspaceId, setWorkspaceId] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initialize() {
      // Get current session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setLoading(false);
        return;
      }

      setAccessToken(session.access_token);

      const user = session.user;

      // Get all workspaces
      const { data: memberships, error } = await supabase
        .from("workspace_members")
        .select("workspace_id")
        .eq("user_id", user.id);

      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }

      // Create default workspace if user has none
      if (memberships.length === 0) {
        const { error } = await supabase.rpc("create_workspace", {
          workspace_name: "My Workspace",
        });

        if (error) {
          console.error(error);
          setLoading(false);
          return;
        }

        const { data } = await supabase
          .from("workspace_members")
          .select("workspace_id")
          .eq("user_id", user.id);

        if (data.length > 0) {
          setWorkspaceCookie(data[0].workspace_id);
          setWorkspaceId(data[0].workspace_id);
        }
      } else {
        let active = getWorkspaceCookie();

        if (!active) {
          active = memberships[0].workspace_id;
          setWorkspaceCookie(active);
        }

        setWorkspaceId(active);
      }

      setLoading(false);
    }

    initialize();
  }, []);

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="p-8">
      <WorkspaceSwitcher />

      <h1 className="mt-6 mb-6 text-2xl font-bold">
        Dashboard
      </h1>

      {workspaceId && accessToken && (
        <DocumentUpload
          workspaceId={workspaceId}
          accessToken={accessToken}
        />
      )}
    </div>
  );
}