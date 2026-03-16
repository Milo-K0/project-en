import Layout from "@/layout/index.vue";

export default [
  {
    path: "/chat",
    component: Layout,
    children: [
      {
        path: "index",
        component: () => import("@/views/Chat/index.vue"),
      },
    ],
  },
];
