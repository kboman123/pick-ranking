"use client";

import { useCallback, useEffect, useState } from "react";
import {
  isAdminLoggedIn,
  logoutAdmin,
  refreshAdminSession,
} from "@/lib/admin-auth";
import { ADMIN_AUTH_CHANGED_EVENT } from "@/lib/storage-keys";

export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    await refreshAdminSession();
    setIsAdmin(isAdminLoggedIn());
    setReady(true);
  }, []);

  useEffect(() => {
    void refresh();

    function onUpdate() {
      void refresh();
    }

    window.addEventListener(ADMIN_AUTH_CHANGED_EVENT, onUpdate);

    return () => window.removeEventListener(ADMIN_AUTH_CHANGED_EVENT, onUpdate);
  }, [refresh]);

  async function logout() {
    await logoutAdmin();
    await refresh();
  }

  return { isAdmin, ready, logout };
}
