import Layout from "@/layout/index.vue";

export default [
  {
    path: "/courses",
    component: Layout,
    children: [
      {
        path: "index",
        component: () => import("@/views/Course/index.vue"),
      },
    ],
  },
];
