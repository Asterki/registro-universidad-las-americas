import api from "./api";
import * as schemas from "../../../../shared/schemas/campus";

import * as CampusesAPITypes from "../../../../shared/api/campus";
import { Campus } from "@prisma/client";

export interface ListCampus {
  id: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  deleted: boolean;
}

// Hooks
import { useList } from "./hooks/useList";
// import { useCreateModal } from "./hooks/useCreateModal";
// import { useUpdateDrawer } from "./hooks/useUpdateDrawer";

// Components
import { CampusesTable } from "./components/CampusesTable";
// import { UpdateDrawer } from "./components/UpdateModal";
// import { CreateModal } from "./components/CreateModal";

export type { Campus, CampusesAPITypes };
export default {
  api,
  schemas,
  hooks: {
    useList,
    // useUpdateDrawer,
    // useCreateModal,
  },
  components: {
    CampusesTable,
    // UpdateDrawer,
    // CreateModal,
  },
};
