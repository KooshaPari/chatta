<script>
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";

	let messages = [];
	let message = "";
	let ws;

	onMount(() => {
		const token = localStorage.getItem("token");
		if (!token) {
			goto("/login");
			return;
		}

		// Establish WebSocket connection
		ws = new WebSocket(`ws://localhost:8080/ws?token=${token}`);

		ws.onopen = () => {
			console.log("Connected to WebSocket server");
		};

		ws.onmessage = (event) => {
			messages = [...messages, event.data];
		};

		ws.onclose = () => {
			console.log("WebSocket connection closed");
		};
	});

	function sendMessage() {
		if (ws && message.trim() !== "") {
			ws.send(message);
			message = "";
		}
	}
</script>

<h1>Chat Room</h1>

<div class="chat-window">
	{#each messages as msg}
		<div class="message">{msg}</div>
	{/each}
</div>

<input bind:value={message} placeholder="Type a message..." />
<button on:click={sendMessage}>Send</button>

<style>
	.chat-window {
		border: 1px solid #ccc;
		height: 300px;
		overflow-y: scroll;
		padding: 10px;
	}

	.message {
		margin-bottom: 10px;
	}
</h1>
