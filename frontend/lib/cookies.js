export function setWorkspaceCookie(workspaceId) {
  document.cookie = `workspace_id=${workspaceId}; path=/; max-age=31536000`;
}


export function getWorkspaceCookie() {
  const cookies = document.cookie.split(";");

  for (const cookie of cookies) {
    const [key, value] = cookie.trim().split("=");

    if (key === "workspace_id") {
      return value;
    }
  }

  return null;
}