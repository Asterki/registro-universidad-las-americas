import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

import { useSelector } from "react-redux";
import type { RootState } from "../../store";

import { Typography } from "antd";
const { Title, Text } = Typography;

import StudentLayout from "../../layouts/Student";
import AccountProfilesFeature from "../../features/account-profiles";
import { FaUser } from "react-icons/fa";

export const Route = createFileRoute("/student/profile")({
  component: RouteComponent,
});

function RouteComponent() {
  const { account } = useSelector((state: RootState) => state.auth);

  const { profile, loading, fetchProfile } =
    AccountProfilesFeature.hooks.useMyProfile();

  useEffect(() => {
    if (account) {
      fetchProfile();
    }
  }, [account]);

  return (
    <StudentLayout selectedPage="profile">
      <div className="mb-4">
        <Title className="flex items-center gap-2">
          <FaUser />
          Mi Perfil
        </Title>
        <Text>
          Visualiza tu información personal y detalles de tu cuenta.
        </Text>
      </div>

      {account && (
        <AccountProfilesFeature.components.ProfileView
          profile={profile}
          loading={loading}
        />
      )}
    </StudentLayout>
  );
}
