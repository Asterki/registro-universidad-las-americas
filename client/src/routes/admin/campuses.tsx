import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { useTranslation } from "react-i18next";

import { useSelector } from "react-redux";
import type { RootState } from "../../store";

import { App, Button, Input, Typography, Switch } from "antd";
const { Title, Text } = Typography;

import AdminPageLayout from "../../layouts/Admin";
import { FaBuilding, FaPlus, FaUserShield } from "react-icons/fa";

import CampusesFeature from "../../features/campuses";
import roles from "client/src/features/roles";

export const Route = createFileRoute("/admin/campuses")({
  component: RouteComponent,
});

function RouteComponent() {
  const { account } = useSelector((state: RootState) => state.auth);

  const navigate = useNavigate();
  const { message, modal } = App.useApp();

  const { t: tPage } = useTranslation(["pages"], {
    keyPrefix: "admin.campuses",
  });
  const { t: tCommon } = useTranslation(["common"]);

  const { campuses, campusesListState, fetchCampuses } =
    CampusesFeature.hooks.useList({});


  useEffect(() => {
    if (!account) return; // Admin layout will handle this
    if (
      !account.data.role.permissions.includes("campuses:read") &&
      !account.data.role.permissions.includes("*")
    ) {
      message.error(tPage("error-messages:forbidden"));
      navigate({ to: "/admin" });
      return;
    } else {
      (async () => {
        await fetchCampuses({ count: 50, page: 0 });
      })();
    }
  }, [account]);

  return (
    <AdminPageLayout selectedPage="institution-campuses">
      <div className="mb-2">
        {tCommon("loggedInAs", {
          name: account?.profile.name,
          email: account?.email.value,
        })}
      </div>

      <Title className="flex items-center gap-2">
        <FaBuilding />
        Campuses
      </Title>

      <Text>
        Maneja los campus de la institución, incluyendo su nombre, dirección y ciudad.
      </Text>

      <div className="my-2 flex items-center gap-2">
        <Button
          variant="solid"
          type="primary"
          disabled={
            !account ||
            !(
              account?.data.role.permissions.includes("*") ||
              account?.data.role.permissions.includes("campuses:create")
            )
          }
          onClick={() => {
            // openCreateAccountRoleModal();
          }}
          icon={<FaPlus />}
        >
          Crear Campus
        </Button>
      </div>

      {/* Search */}
      <div className="flex gap-2 items-center">
        <Input.Search
          type="text"
          variant="outlined"
          allowClear
          onSearch={(query) => {
            fetchCampuses({
              search: {
                query: query.trim(),
                searchIn: ["name"],
              },
              count: 50,
              page: 0,
            });
          }}
          loading={campusesListState.loading}
          enterButton={tCommon("search")}
          placeholder={tPage("searchPlaceholder")}
        />
      </div>

      {account && (
        <CampusesFeature.components.CampusesTable
          fetchCampuses={fetchCampuses}
          campuses={campuses}
          campusesListState={campusesListState}
          onRestore={(campus) => {
            modal.confirm({
              title: tPage("modals.restore.title"),
              content: tPage("modals.restore.content", {
                name: campus.name,
              }),
              // onOk: () => handleRestoreAccountRole(accRole.id),
            });
          }}
          onUpdate={(campus) => {
            // openUpdateAccountRoleDrawer(accRole.id);
          }}
          onDelete={(campus) => {
            modal.confirm({
              title: tPage("modals.delete.title"),
              content: tPage("modals.delete.content", {
                name: campus.name,
              }),
              // onOk: () => handleDeleteAccountRole(campus.id),
            });
          }}
        />
      )}

      <div className="flex mt-4 gap-2 items-center">
        <Switch
          id="page-show-deleted"
          checked={campusesListState.includeDeleted}
          onChange={(value) => {
            fetchCampuses({
              includeDeleted: value,
            });
          }}
        />

        <label htmlFor="page-show-deleted">{tPage("showDeleted")}</label>
      </div>
    </AdminPageLayout>
  );
}

