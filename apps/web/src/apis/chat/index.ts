import { aiApi, type Response } from "..";
import {
  type ChatModelList,
  type ChatMessageList,
  type ChatRoleType,
} from "@en/common/chat";

export const getChatModelList = async () => {
  return (await aiApi.get("/prompt/list")) as Response<ChatModelList>;
};

export const getChatHistory = async (userId: string, role: ChatRoleType) => {
  return (await aiApi.get(
    `/chat?userId=${userId}&role=${role}`,
  )) as Response<ChatMessageList>;
};
