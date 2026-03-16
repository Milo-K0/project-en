import { serverApi, type Response } from "..";
import type { CourseList } from "@en/common/course";

export const getCourseList = async () =>
  serverApi.get("/course/list") as Promise<Response<CourseList>>;
