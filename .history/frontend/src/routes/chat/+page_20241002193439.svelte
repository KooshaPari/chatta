<script lang="ts">
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import { faEdit } from "@fortawesome/free-solid-svg-icons";
	import { user } from "../../stores/user";
	import Modal from "../../components/Modal.svelte";
	import { fly, fade } from "svelte/transition";
	let showEditModal = false;
	let selectedMessage: Message | null = null;
	function openEditModal(msg: Message) {
		if (msg.SenderID !== client?.uuid) {
			console.log("Invalid Request.");
		} else {
			selectedMessage = { ...msg };
			console.log("ON OPEN: ", selectedMessage);
			showEditModal = true;
		}
	}

	function closeEditModal() {
		console.log("ON CLOSE: ", selectedMessage);
		showEditModal = false;
		selectedMessage = null;
	}
	function deleteMsg(msg: Message) {
		//	console.log("ON CLOSE: ", selectedMessage);
		if (msg.SenderID !== client?.uuid) {
			console.log("Invalid Request.");
		} else if (ws && msg) {
			msg.Deleted = true;
			ws.send(JSON.stringify(msg));
		}
	}
	let messages: Message[] = [];
	type User = {
		Username: string;
		UUID: string;
		//Messages: Message[];
	};

	type Message = {
		UUID: string;
		Content: string;
		SentAt: Date;
		Edited: boolean;
		Deleted: boolean;
		SenderID: string;
		Sender: User;
	};

	let message: Message = {
		UUID: "",
		Content: "",
		SentAt: new Date(),
		Edited: false,
		Delted: false,
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
			if (msg.deleted == true) {
				messages = messages.filter((oldmsg) => oldmsg.uuid !== msg.uuid);
			} else if (msg.edited == true) {
				let index = -1;
				index = messages.findIndex((oldmsg) => oldmsg.uuid === msg.uuid);
				//console.log("IND: ", index);
				if (index !== -1) {
					// Update the message content
					messages[index] = { ...msg };
					messages = [...messages];
				}
			} else {
				//console.log("ARR: ", messages);
				messages = [...messages, msg];
			}
		};

		ws.onclose = () => {
			console.log("Chatta WebSocket Closed.");
		};
	});
	//console.log("ARR", messages);
	function sendMessage() {
		if (ws && message.Content.trim() !== "") {
			//console.log("MSG PRESEND: ", message);
			message.Edited = false;
			message.Deleted = false;
			ws.send(JSON.stringify(message));
			message.Content = "";
		}
	}
	function editMessage() {
		if (selectedMessage.SenderID !== client?.uuid) {
			console.log("Invalid Request.");
		}
		if (ws && selectedMessage) {
			selectedMessage.Edited = true;
			ws.send(JSON.stringify(selectedMessage));
		}
		closeEditModal();
	}
</script>

<h1>Chatta!</h1>
<Modal isOpen={showEditModal} on:close={closeEditModal}>
	{#if selectedMessage}
		<h2>Edit Message</h2>
		<input
			bind:value={selectedMessage.content}
			placeholder="Type a message..."
		/>
		<button on:click={editMessage}>Save</button>
	{/if}
</Modal>
<div class="chat-window">
	{#each messages as msg, index}
		<div
			class="message"
			in:fly={{ y: -200, duration: 1000 }}
			out:fly={{ x: 200, duration: 1000 }}
		>
			{msg.sender.username}: {msg.content}
			<div class="msgActionsCont">
				<button on:click={() => openEditModal(msg)} class="editBtn"
					><i class="fas fa-edit"></i></button
				>
				<button on:click={() => deleteMsg(msg)} class="deleteBtn"
					><i class="fas fa-close"></i></button
				>
			</div>
		</div>
	{/each}
</div>
<div class="sendContainer">
	<input
		bind:value={message.Content}
		class="sendBar"
		placeholder="Type a message..."
	/>
	<button class="sendBtn" on:click={sendMessage}>Send</button>
</div>

<style>
	.sendContainer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1%;
		color: #000;
		height: 3.75vw;
		border: none;
		background-color: #999;
		border-radius: 4em;
		cursor: pointer;
		transition: 0.5s ease-in-out;
	}
	.sendBar {
		border: none;
		background-color: #999;
		color: #000;
		width: 80%;
		padding-inline: 1vw;
		font-size: 14px;
		height: 100%;
		border-radius: 4em;
		cursor: pointer;
		transition: 0.5s ease-in-out;
	}
	.sendBar::placeholder {
		color: #000;
		transition: 0.5s ease-in-out;
	}
	.sendBtn {
		width: 15%;
		padding-inline: 0;
		border: none;
		background-color: #333;
		color: #aaa;
		border-radius: 20px;
		height: 75%;
	}
	.sendBar:hover::placeholder {
		transition: 0.5s ease-in-out;
		color: #fff;
	}
	.sendBar:hover {
		background-color: #333;
		color: #fff;
		box-shadow: 10px rgba(0, 0, 0, 0.4);
	}

	.chat-window {
		border: 1px solid #ccc;
		height: 65vh;
		display: flex;
		flex-direction: column;
		overflow-y: scroll;
		padding: 1%;
		justify-content: flex-end;
	}
	.msgActionsCont button {
		color: #fff;
		height: 2.5em;
		width: 5em;
		border: none;
		background-color: #999;
		border-radius: 2em;
		cursor: pointer;
		transition: 0.5s ease-in-out;
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
		transition: 0.5s ease-in-out;
	}
	.editBtn:hover {
		background-color: #555;
		transform: scale(1.05);
	}
	.editBtn:active {
		transition: 0.25s ease-in-out;
		background-color: #222;
		transform: scale(0.9);
	}
	.deleteBtn:hover {
		background-color: #f77;
		transform: scale(1.05);
	}
	.deleteBtn:active {
		transition: 0.25s ease-in-out;
		background-color: #a22;
		transform: scale(0.9);
	}
</style>
