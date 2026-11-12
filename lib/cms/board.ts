import { cache } from "react";
import { commissionTerms, toBoardTerms } from "../board.ts";
import type { BoardMember, BoardTerm } from "../types.ts";
import { wpRoute } from "./client.ts";

const getBoardTerms = cache(async (): Promise<BoardTerm[]> =>
  toBoardTerms(await wpRoute<unknown>("jac-web/v1/dignatarios")),
);

export const getBoardMembers = cache(async (term: string): Promise<BoardMember[]> =>
  (await getBoardTerms()).find((t) => t.term === term)?.members ?? [],
);

export const getCommissionTerms = cache(async (slug: string): Promise<BoardTerm[]> =>
  commissionTerms(await getBoardTerms(), slug),
);
