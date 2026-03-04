import { serverApi } from "..";
import type { Response } from "../index";
import type { WordQuery, Word } from "@en/common/word";

export const getWordBookList = (
  params: WordQuery,
): Promise<Response<{ total: number; list: Word[] }>> => {
  return serverApi.get("/word-book", {
    params,
  });
};
