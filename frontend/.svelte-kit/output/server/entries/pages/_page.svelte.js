import { e as ensure_array_like } from "../../chunks/index2.js";
import { e as escape_html, a as attr } from "../../chunks/attributes.js";
import "@sveltejs/kit/internal";
import "../../chunks/exports.js";
import "../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../chunks/root.js";
import "../../chunks/state.svelte.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let messages = [];
    let message = "";
    $$renderer2.push(`<h1>Chat Room</h1> <div class="chat-window svelte-1uha8ag"><!--[-->`);
    const each_array = ensure_array_like(messages);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let msg = each_array[$$index];
      $$renderer2.push(`<div class="message svelte-1uha8ag">${escape_html(msg)}</div>`);
    }
    $$renderer2.push(`<!--]--></div> <input${attr("value", message)} placeholder="Type a message..."/> <button>Send</button>`);
  });
}
export {
  _page as default
};
