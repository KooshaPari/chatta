import { s as slot, b as bind_props, e as ensure_array_like } from "../../../chunks/index2.js";
import { f as fallback, e as escape_html, a as attr } from "../../../chunks/attributes.js";
import "@sveltejs/kit/internal";
import "../../../chunks/exports.js";
import "../../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../../chunks/root.js";
import "../../../chunks/state.svelte.js";
function Modal($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let isOpen = fallback($$props["isOpen"], false);
    let closeOnOverlayClick = fallback($$props["closeOnOverlayClick"], true);
    if (isOpen) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="modal-overlay svelte-1bxxaoh" role="dialog" aria-modal="true"><div class="modal-content svelte-1bxxaoh" role="document" tabindex="-1"><!--[-->`);
      slot($$renderer2, $$props, "default", {});
      $$renderer2.push(`<!--]--> <button class="close-button svelte-1bxxaoh" aria-label="Close Modal">×</button></div></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]-->`);
    bind_props($$props, { isOpen, closeOnOverlayClick });
  });
}
function Sidebar($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let isOpen = fallback($$props["isOpen"], false);
    let closeOnOverlayClick = fallback($$props["closeOnOverlayClick"], true);
    if (isOpen) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="sidebar-content svelte-181dlmc" aria-modal="true" role="document" tabindex="-1"><!--[-->`);
      slot($$renderer2, $$props, "default", {});
      $$renderer2.push(`<!--]--> <button class="close-button svelte-181dlmc" aria-label="Close sidebar">×</button></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]-->`);
    bind_props($$props, { isOpen, closeOnOverlayClick });
  });
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let wsChannel = "0000";
    let showEditModal = false;
    let showThreadModal = false;
    let chats = [];
    let messages = [];
    let message = {
      content: ""
    };
    let client;
    function getChatName(chat) {
      if (client.uuid == chat.participants[0].uuid) {
        return chat.participants[1].username;
      } else {
        return chat.participants[0].username;
      }
    }
    $$renderer2.push(`<h1>Chatta!</h1> <div class="chattaApp svelte-23dtxz"><div class="chattaSidebar svelte-23dtxz"><menu class="chattaNav svelte-23dtxz"><li class="svelte-23dtxz"><h2 class="svelte-23dtxz">${escape_html(
      /*
      function closeCall() {
      	onCall = false;
      }
      function Call(caller: User, receiver: User) {
      	onCall = true;
      	console.log("CALL: ", caller, receiver);
      
      	navigator.mediaDevices
      		.getUserMedia({ video: true, audio: true })
      		.then((stream) => {
      			localStream = stream;
      			document.querySelector("#localVideo").srcObject = localStream;
      			peerConnection = new RTCPeerConnection(RTCconfiguration);
      			stream
      				.getTracks()
      				.forEach((track) => peerConnection.addTrack(track, stream));
      			peerConnection.ontrack = (event) => {
      				remoteStream = event.streams[0];
      				document.querySelector("#remoteVideo").srcObject = remoteStream;
      			};
      		});
      	// Init Peer Conection, Handle ICEing, Create and Send Offer Singal
      }
      function handleSignaling(data) {
      	// There are offer answer and candidate signals, offer->answer(acc/deny)
      	//  Based on type create appropriate data obj ands end it to the signal socket(ws server)
      	// candidates iwll be new ice candidates, while answers will be handled in your RTC-SDescr
      	// On Mount ensure that a routine is started for this function.
      }*/
      client?.username
    )}</h2></li>  <li class="svelte-23dtxz">Chats <div class="chattaChats svelte-23dtxz"><!--[-->`);
    const each_array = ensure_array_like(chats);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let chat = each_array[$$index];
      if (chat.type == "thread") {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<button class="chatPill svelte-23dtxz">${escape_html(chat.name)}</button>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]-->-</div></li> <li class="svelte-23dtxz">DMs <div class="chattaChats svelte-23dtxz"><!--[-->`);
    const each_array_1 = ensure_array_like(chats);
    for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
      let chat = each_array_1[$$index_1];
      if (chat.type == "dm") {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<button class="chatPill svelte-23dtxz">${escape_html(getChatName(chat))}</button>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--></div></li> <li class="svelte-23dtxz">Settings-- <ul class="chattaStgsCollapsible svelte-23dtxz"><li class="svelte-23dtxz">Item</li> <li class="svelte-23dtxz">Item</li> <li class="svelte-23dtxz">Item</li> <li class="svelte-23dtxz">Item</li></ul></li> <button class="signOutBtn svelte-23dtxz">signOut</button></menu></div> <div class="chattaRight svelte-23dtxz">`);
    Modal($$renderer2, {
      isOpen: showEditModal,
      children: ($$renderer3) => {
        {
          $$renderer3.push("<!--[-1-->");
        }
        $$renderer3.push(`<!--]-->`);
      },
      $$slots: { default: true }
    });
    $$renderer2.push(`<!----> <div class="dm-window svelte-23dtxz"><div class="chat-window svelte-23dtxz">`);
    if (messages?.length > 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="texts svelte-23dtxz"><!--[-->`);
      const each_array_2 = ensure_array_like(messages);
      for (let index = 0, $$length = each_array_2.length; index < $$length; index++) {
        let msg = each_array_2[index];
        if (msg.channel == wsChannel) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<div class="message svelte-23dtxz"><div class="textCont svelte-23dtxz"><button class="msgSender">${escape_html(msg.sender.username)}:</button> <span class="msgContent">${escape_html(msg.content)}</span></div> <div class="msgActionsCont svelte-23dtxz"><button class="editBtn svelte-23dtxz"><i class="fas fa-solid fa-comments"></i></button> <button class="editBtn svelte-23dtxz"><i class="fas fa-edit"></i></button> <button class="deleteBtn svelte-23dtxz"><i class="fas fa-close"></i></button></div></div>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]-->`);
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    Sidebar($$renderer2, {
      isOpen: showThreadModal,
      children: ($$renderer3) => {
        {
          $$renderer3.push("<!--[-1-->");
        }
        $$renderer3.push(`<!--]-->`);
      },
      $$slots: { default: true }
    });
    $$renderer2.push(`<!----></div></div> <div class="sendContainer svelte-23dtxz"><input${attr("value", message.content)} class="sendBar svelte-23dtxz" placeholder="Type a message..."/> <button class="sendBtn svelte-23dtxz">Send</button></div></div></div>`);
  });
}
export {
  _page as default
};
