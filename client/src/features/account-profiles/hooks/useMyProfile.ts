import { useState, useCallback } from "react";

import { accountProfilesApi } from "../api";
import { App } from "antd";

export function useMyProfile() {
  const { message } = App.useApp();

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchProfile = useCallback(async () => {
    setLoading(true);

    const result = await accountProfilesApi.getMyProfile({});

    if (result.status === "success") {
      setProfile(result.account);
      setLoading(false);
    } else {
      message.error("Error al cargar el perfil.");
      setLoading(false);
    }
  }, [message]);

  return {
    profile,
    loading,
    fetchProfile,
  };
}
