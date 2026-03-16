export interface Course {
  id: string;
  name: string;
  value: string;
  description?: string;
  teacher: string;
  url: string;
  price: number;
}

// 定义多个课程的列表
export type CourseList = Course[];


