import { cache } from "react";
import { toBoardTerms } from "../board.ts";
import type { BoardMember } from "../types.ts";
import { wpRoute } from "./client.ts";

export const getBoardMembers = cache(async (term: string): Promise<BoardMember[]> => {
  const json = await wpRoute<unknown>("jac-web/v1/dignatarios");
  return toBoardTerms(json).find((t) => t.term === term)?.members ?? [];
});
