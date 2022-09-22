import routes from "./routes.js";
import VueRouter from "vue-router";
import Vue from "vue";
Vue.use(VueRouter);
const router = new VueRouter({
  // 4. 内部提供了 history 模式的实现。为了简单起见，我们在这里使用 hash 模式。
  routes, // `routes: routes` 的缩写
});
export default router;
