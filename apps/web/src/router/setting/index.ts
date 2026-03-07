import Layout from "@/layout/index.vue";

export default [
  {
    path: "/setting",
    component: Layout,
    children: [
      {
        path: "index",
        component: () => import("@/views/Setting/index.vue"),
      },
    ],
  },
];
