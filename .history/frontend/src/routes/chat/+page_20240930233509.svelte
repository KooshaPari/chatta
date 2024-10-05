<script lang="ts">
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import { user } from "../../stores/user";
	let messages = fetch();
	type User = {
		username: string;
		uuid: string;
		//Messages: Message[];
	};

	type Message = {
		UUID: string;
		Content: string;
		SentAt: Date;
		Edited: boolean;
		SenderID: string;
		Sender: User;
	};

	let message: Message = {
		UUID: "",
		Content: "",
		SentAt: new Date(),
		Edited: false,
		SenderID: "",
		Sender: {
			Username: "",
			Password: "",
			UUID: "",
			Messages: [],
		},
	};
	let ws;
	let client: User | null = null;
	onMount(() => {
		const token = localStorage.getItem("token");
		const userString = localStorage.getItem("user");
		if (userString) {
			client = JSON.parse(userString) as User;
		}
		if (!token) {
			goto("/login");
			return;
		}

		// Establish WebSocket connection
		ws = new WebSocket(`ws://localhost:8081/ws?token=${token}`);

		ws.onopen = () => {
			console.log("Connected to Chatta-CMS");
			console.log("User: ", client.username);
		};

		ws.onmessage = (event) => {
			console.log(messages);
			messages = [...messages, event.data];
		};

		ws.onclose = () => {
			console.log("Chatta WebSocket Closed.");
		};
	});

	function sendMessage() {
		if (ws && message.Content.trim() !== "") {
			ws.send(JSON.stringify(message));
			message.Content = "";
		}
	}
</script>

<h1>Chat Room</h1>

<div class="chat-window">
	{#each messages as msg}
		<div class="message">{msg}</div>
	{/each}
</div>

<input bind:value={message.Content} placeholder="Type a message..." />
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
</style>
