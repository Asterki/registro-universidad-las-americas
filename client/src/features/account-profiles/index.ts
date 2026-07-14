import api from "./api";
import * as AccountProfilesAPITypes from "../../../../shared/api/account-profiles";

import { useMyProfile } from "./hooks/useMyProfile";
import { ProfileView } from "./components/ProfileView";

export type { AccountProfilesAPITypes };
export default {
  api,
  hooks: {
    useMyProfile,
  },
  components: {
    ProfileView,
  },
};
