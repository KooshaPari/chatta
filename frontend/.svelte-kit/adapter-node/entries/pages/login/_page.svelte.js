import { a as attr } from "../../../chunks/attributes.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let username = "";
    let password = "";
    $$renderer2.push(`<h1>Login</h1> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <input${attr("value", username)} placeholder="Username"/> <input type="password"${attr("value", password)} placeholder="Password"/> <button>Login</button> <a href="/signup"><button>signup</button></a>`);
  });
}
export {
  _page as default
};
