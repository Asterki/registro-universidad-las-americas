import api from "./api";
import * as schemas from "../../../../shared/schemas/requests";

import * as RequestsAPITypes from "../../../../shared/api/requests";

// Hooks
import { useCreateRequest } from "./hooks/useCreateRequest";
import { useMyRequests } from "./hooks/useMyRequests";

// Components
import { CreateRequestForm } from "./components/CreateRequestForm";
import { MyRequestsTable } from "./components/MyRequestsTable";

export type { RequestsAPITypes };
export default {
  api,
  schemas,
  hooks: {
    useCreateRequest,
    useMyRequests,
  },
  components: {
    CreateRequestForm,
    MyRequestsTable,
  },
};
