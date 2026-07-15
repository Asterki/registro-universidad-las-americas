import api from "./api";
import * as schemas from "../../../../shared/schemas/faculties";

import * as FacultiesAPITypes from "../../../../shared/api/faculties";

export interface ListFaculty {
  id: string;
  name: string;
  code: string;
  dean: string;
  campusId: string;
  deleted: boolean;
}

// Hooks
import { useList } from "./hooks/useList";
import { useCreateModal } from "./hooks/useCreateModal";
import { useUpdateDrawer } from "./hooks/useUpdateDrawer";

// Components
import { FacultiesTable } from "./components/FacultiesTable";
import { UpdateDrawer } from "./components/UpdateDrawer";
import { CreateModal } from "./components/CreateModal";

export type { FacultiesAPITypes };
export default {
  api,
  schemas,
  hooks: {
    useList,
    useCreateModal,
    useUpdateDrawer,
  },
  components: {
    FacultiesTable,
    UpdateDrawer,
    CreateModal,
  },
};
