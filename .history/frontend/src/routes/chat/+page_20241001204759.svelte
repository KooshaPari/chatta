<script lang="ts">
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import { user } from "../../stores/user";
	let messages = [];
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
	onMount(async () => {
		const token = localStorage.getItem("token");
		const userString = localStorage.getItem("user");
		if (userString) {
			client = JSON.parse(userString) as User;
		}
		if (!token) {
			goto("/login");
			return;
		}
		const response = await fetch("http://localhost:8081/messages");

		if (response.ok) {
			const data = await response.json();
			messages = data;
		}

		// Establish WebSocket connection
		ws = new WebSocket(`ws://localhost:8081/ws?token=${token}`);

		ws.onopen = () => {
			console.log("Connected to Chatta-CMS");
			console.log("User: ", client.username);
		};

		ws.onmessage = (event) => {
			console.log("EVENT: ", JSON.parse(event.data));
			let msg = JSON.parse(event.data) as Message;
			//console.log("ARR: ", messages);
			messages = [...messages, msg];
		};

		ws.onclose = () => {
			console.log("Chatta WebSocket Closed.");
		};
	});
	//console.log("ARR", messages);
	function sendMessage() {
		if (ws && message.Content.trim() !== "") {
			console.log("MSG PRESEND: ", message);
			ws.send(JSON.stringify(message));
			message.Content = "";
		}
	}
</script>

<h1>Chat Room</h1>

<div class="chat-window">
	{#each messages as msg}
		<div class="message">
			{msg.sender.username}: {msg.content}
			<button class="editBtn"
				><svg
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M12 2l2 20 20 2-20 2-2 20-2-20-20-2 20-2z"></path>
				</svg></button
			>
		</div>
	{/each}
</div>

<input bind:value={message.Content} placeholder="Type a message..." />
<button on:click={sendMessage}>Send</button>

<style>
	.chat-window {
		border: 1px solid #ccc;
		height: 80%;
		display: flex;
		flex-direction: column;
		overflow-y: scroll;
		padding: 1%;
		justify-content: flex-end;
	}
	.editBtn {
		color: #fff;
		height: 2.5em;
		width: 5em;
		border: none;
		background-color: #999;
		border-radius: 2em;
	}
	.message {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 10%;
		justify-content: space-between;
		margin-bottom: 10px;
		background-color: #dddddd;
		border-radius: 20px;
		padding: 1%;
	}
</style>
