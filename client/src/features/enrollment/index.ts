import api from "./api";
import * as schemas from "../../../../shared/schemas/enrollment";

import * as EnrollmentAPITypes from "../../../../shared/api/enrollment";

// Hooks
import { useEnrollSelf } from "./hooks/useEnrollSelf";
import { useMyEnrollments } from "./hooks/useMyEnrollments";

// Components
import { EnrollSelfForm } from "./components/EnrollSelfForm";
import { MyEnrollmentsTable } from "./components/MyEnrollmentsTable";

export type { EnrollmentAPITypes };
export default {
  api,
  schemas,
  hooks: {
    useEnrollSelf,
    useMyEnrollments,
  },
  components: {
    EnrollSelfForm,
    MyEnrollmentsTable,
  },
};
