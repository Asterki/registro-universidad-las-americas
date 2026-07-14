import api from "./api";
import * as schemas from "../../../../shared/schemas/academic-history";

import * as AcademicHistoryAPITypes from "../../../../shared/api/academic-history";

// Hooks
import { useAcademicHistory } from "./hooks/useAcademicHistory";

// Components
import { TranscriptView } from "./components/TranscriptView";

export type { AcademicHistoryAPITypes };
export default {
  api,
  schemas,
  hooks: {
    useAcademicHistory,
  },
  components: {
    TranscriptView,
  },
};
