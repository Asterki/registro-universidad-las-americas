import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useSelector } from "react-redux";

import { Typography } from "antd";
const { Title } = Typography;

import type { RootState } from "../../store";

import InstructorLayout from "../../layouts/Instructor";
import AccountProfilesFeature from "../../features/account-profiles";

export const Route = createFileRoute("/instructor/profile")({
  component: RouteComponent,
});

function RouteComponent() {
  const { account } = useSelector((state: RootState) => state.auth);
  const { profile, loading, fetchProfile } = AccountProfilesFeature.hooks.useMyProfile();

  useEffect(() => {
    if (account) {
      fetchProfile();
    }
  }, [account, fetchProfile]);

  return (
    <InstructorLayout selectedPage="profile">
      <Title level={3}>Mi Perfil</Title>
      <p className="text-gray-500 mb-4">
        Información personal y de cuenta.
      </p>

      <AccountProfilesFeature.components.ProfileView
        profile={profile}
        loading={loading}
      />
    </InstructorLayout>
  );
}
