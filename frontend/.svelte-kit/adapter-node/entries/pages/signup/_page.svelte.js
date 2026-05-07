import { a as attr } from "../../../chunks/attributes.js";
function _page($$renderer) {
  let username = "";
  let password = "";
  $$renderer.push(`<h1>Signup</h1> `);
  {
    $$renderer.push("<!--[-1-->");
  }
  $$renderer.push(`<!--]--> <input${attr("value", username)} placeholder="Username"/> <input type="password"${attr("value", password)} placeholder="Password"/> <button>signup</button>`);
}
export {
  _page as default
};
