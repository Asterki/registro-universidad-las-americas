import api from "./api";
import * as schemas from "../../../../shared/schemas/period";

import * as PeriodsAPITypes from "../../../../shared/api/period";

export interface ListPeriod {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  active: boolean;
  deleted: boolean;
}

// Hooks
import { usePeriodList } from "./hooks/usePeriodList";
import { useCreatePeriodModal } from "./hooks/useCreatePeriodModal";
import { useUpdatePeriodDrawer } from "./hooks/useUpdatePeriodDrawer";

// Components
import { PeriodsTable } from "./components/PeriodsTable";
import { UpdatePeriodDrawer } from "./components/UpdatePeriodDrawer";
import { CreatePeriodModal } from "./components/CreatePeriodModal";

export type { PeriodsAPITypes };
export default {
  api,
  schemas,
  hooks: {
    usePeriodList,
    useCreatePeriodModal,
    useUpdatePeriodDrawer,
  },
  components: {
    PeriodsTable,
    UpdatePeriodDrawer,
    CreatePeriodModal,
  },
};
