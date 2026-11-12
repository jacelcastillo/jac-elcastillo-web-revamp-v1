import { cache } from "react";
import { toCommissionsPage } from "../commissions.ts";
import type { CommissionsPage } from "../types.ts";
import { wpRoute } from "./client.ts";

export const getCommissionsPage = cache(async (): Promise<CommissionsPage> =>
  toCommissionsPage(await wpRoute<unknown>("jac-web/v1/comisiones")),
);
