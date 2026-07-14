import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

import { useSelector } from "react-redux";
import type { RootState } from "../../store";

import { Typography } from "antd";
const { Title, Text } = Typography;

import StudentLayout from "../../layouts/Student";
import AcademicHistoryFeature from "../../features/academic-history";
import { FaGraduationCap } from "react-icons/fa";

export const Route = createFileRoute("/student/academic-history")({
  component: RouteComponent,
});

function RouteComponent() {
  const { account } = useSelector((state: RootState) => state.auth);

  const { history, summary, loading, fetchHistory } =
    AcademicHistoryFeature.hooks.useAcademicHistory();

  useEffect(() => {
    if (account) {
      fetchHistory({});
    }
  }, [account]);

  return (
    <StudentLayout selectedPage="academic-history">
      <div className="mb-4">
        <Title className="flex items-center gap-2">
          <FaGraduationCap />
          Historial Académico
        </Title>
        <Text>
          Consulta tu expediente académico completo, incluyendo créditos
          cursados y promedio general.
        </Text>
      </div>

      {account && (
        <AcademicHistoryFeature.components.TranscriptView
          history={history}
          summary={summary}
          loading={loading}
        />
      )}
    </StudentLayout>
  );
}
