"use client";

import { useEffect, useState } from "react";
import { getWorkspaces } from "@/lib/workspace";
import { setWorkspaceCookie } from "@/lib/cookies";

export default function WorkspaceSwitcher() {
  const [workspaces, setWorkspaces] = useState([]);

  useEffect(() => {
    async function load() {
      const { data } = await getWorkspaces();

      setWorkspaces(data || []);
    }

    load();
  }, []);

  function changeWorkspace(id) {
    setWorkspaceCookie(id);

    window.location.reload();
  }

  return (
    <select
      onChange={(e) => changeWorkspace(e.target.value)}
      className="border rounded px-3 py-2"
    >
      {workspaces.map((workspace) => (
        <option
          key={workspace.id}
          value={workspace.id}
        >
          {workspace.name}
        </option>
      ))}
    </select>
  );
}