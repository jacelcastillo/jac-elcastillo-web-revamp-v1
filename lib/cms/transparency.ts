import { cache } from "react";
import { toTransparencyPage } from "../transparency.ts";
import type { TransparencyPage } from "../types.ts";
import { wpRoute } from "./client.ts";

export const getTransparencyPage = cache(async (): Promise<TransparencyPage> =>
  toTransparencyPage(await wpRoute<unknown>("jac-web/v1/transparencia")),
);
