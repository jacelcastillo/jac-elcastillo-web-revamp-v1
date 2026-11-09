import { cache } from "react";
import { toProjectsPage } from "../projects.ts";
import type { ProjectsPage } from "../types.ts";
import { wpRoute } from "./client.ts";

export const getProjectsPage = cache(async (): Promise<ProjectsPage> =>
  toProjectsPage(await wpRoute<unknown>("jac-web/v1/proyectos")),
);
