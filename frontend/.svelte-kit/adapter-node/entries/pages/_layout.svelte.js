import { s as slot, b as bind_props } from "../../chunks/index2.js";
function _layout($$renderer, $$props) {
  let data = $$props["data"];
  const prerender = true;
  $$renderer.push(`<nav><a href="/">Home</a> <a href="/chat">Chat</a> <a href="/login">Auth</a></nav> <!--[-->`);
  slot($$renderer, $$props, "default", {});
  $$renderer.push(`<!--]-->`);
  bind_props($$props, { data, prerender });
}
export {
  _layout as default
};
