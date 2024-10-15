// Move Imports to a lib.svelte
// Move webRTC to a libfile
// Chats should be their own page rather than a JS state change
// move all functions not used directly and exclusively by /chat to its own lib defs,
// this incl functions that perform MORE than an API caller
// Streamline objects, encapsulate and seperate User / Client structs as well as msg/chat to enhance security/encapsulation
//Clean up code/CSS, create responsivity, 
<script lang="ts">
	import { onMount } from "svelte";
	import { goto, replaceState } from "$app/navigation";
	import { faEdit } from "@fortawesome/free-solid-svg-icons";
	import { user } from "../../stores/user";
	import { Modal, Sidebar } from "../../components";
	import { fly, fade } from "svelte/transition";
	import StatusBar from "../../components/StatusBar.svelte";
	import VideoModal from "../../components/VideoModal.svelte";
	const RTCconfiguration = {
		iceServers: [{ urls: "stun:stun.l.google.com:19302" }], // Free STUN server
	};
	let onCall = false;
	let wsChannel = "0000";
	let showEditModal = false;
	let showThreadModal = false;
	let currentChat: Chat | null = null;
	let selectedMessage: Message | null = null;
	let receiver: User;
	let localStream;
	let remoteStream;
	let peerConnection;
	let signalingSocket;
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
	function openThreadModal(msg: Message) {
		if (showThreadModal) {
			if (selectedMessage?.uuid != msg.uuid) {
				selectedMessage = msg;
			} else {
				showThreadModal = false;
			}
		} else {
			selectedMessage = { ...msg };
			showThreadModal = true;
		}
	}
	function closeThreadModal() {
		showThreadModal = false;
		goto("/chat", { replaceState: true });
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

	function signOut() {
		localStorage.removeItem("token");
		localStorage.removeItem("user");
		user.set(null);
		goto("/login");
	}
	let chats: Chat[] = [];
	let messages: Message[] = [];
	type User = {
		Username: string;
		UUID: string;
		//Messages: Message[];
	};

	type Message = {
		UUID: string;
		Content: string;
		Channel: string;
		SentAt: Date;
		Edited: boolean;
		Deleted: boolean;
		SenderID: string;
		Sender: User;
	};
	type Chat = {
		UUID: string;
		Name: string;
		Type: string;
		Messages: Message[];
		Participants: User[];
	};
	let message: Message = {
		UUID: "",
		Content: "",
		Channel: "0000",
		SentAt: new Date(),
		Edited: false,
		Deleted: false,
		SenderID: "",
		Sender: {
			Username: "",
			UUID: "",
		},
	};
	let ws;
	let client: User;

	onMount(async () => {
		wsChannel = "0000";
		const token = localStorage.getItem("token");
		const userString = localStorage.getItem("user");
		if (!userString || !token) {
			goto("/login");
		}
		if (userString) {
			client = JSON.parse(userString) as User;
		}
		if (!token) {
			goto("/login");
			return;
		}
		const msgresponse = await fetch("http://localhost:8081/messages");

		if (msgresponse.ok) {
			const data = await msgresponse.json();
			messages = data;
		}
		const chatresponse = await fetch("http://localhost:8081/chats");
		if (chatresponse.ok) {
			const data = await chatresponse.json();
			chats = data;
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
			if (msg.channel == wsChannel) {
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
					console.log("ARR: ", messages);
					messages = [...messages, msg];
				}
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
			message.Channel = wsChannel;
			ws.send(JSON.stringify(message));
			message.Content = "";
		}
	}
	async function switchChannel(chat: Chat) {
		wsChannel = chat.uuid;

		const newmessages = await fetch(`http://localhost:8081/chats/${chat.uuid}`);

		if (newmessages.ok) {
			const data = await newmessages.json();

			messages = data.messages;
		}
		currentChat = chat;
	}
	async function directMessage(sender: User) {
		// check for an existing chatDM first, (figure out how to actually do this)
		const newDM: Chat = {
			UUID: "",
			Name: sender.Username,
			Type: "dm",
			Messages: [],
			Participants: [client, sender],
		};
		let response = await fetch("http://localhost:8081/dm", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(newDM),
		});
		let finalDM = await response.json();
		// if it doesnt exist make a new one
		// create a new chat object with appropriate type, send to backend
		//and ensure it is associated excl with both users
		// else just switch to that
		//switchChannel(finalDM.uuid);
		console.log("DM: ", finalDM);
		wsChannel = finalDM.uuid;
		messages = finalDM.messages;
		receiver = sender;
		currentChat = finalDM;
	}
	function getChatName(chat: Chat) {
		if (client.uuid == chat.participants[0].uuid) {
			return chat.participants[1].username;
		} else {
			return chat.participants[0].username;
		}
	}
	function createThread() {
		if (ws && selectedMessage) {
			let newChat: chat = {
				UUID: "",
				Name: selectedMessage.content,
				Type: "thread",
				Messages: [selectedMessage],
			};

			// api post to /thread?
			console.log(newChat);
			const token = localStorage.getItem("token");

			fetch("http://localhost:8081/thread", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(newChat),
			})
				.then((response) => response.json())
				.then((data) => console.log(data))
				.catch((error) => console.error(error));
			closeThreadModal();

			/**DO NOT WEBSOCKET THIS**/
			/**SEND API REQUEST ESTABLISHING THREAD WS HUB & APPROPRIATE CLIENTS THEN
			 * SEND MESSAGE NOTIFYING CLIENT FRONTENDS OF NEWLY AVAILABLE HUB VIA MAIN WS**/
			/** EACH THREAD HAS A UUID THAT WILL NEED TO BE ATTACHED TO THE CHATS OBJECT WITH
			 * ID INDICATING TYPE OF CHAT(THREAD,GC,DM)
			 */
		}
	}
	function editMessage() {
		if (selectedMessage.SenderID !== client?.uuid) {
			console.log("Invalid Request.");
		} else if (ws && selectedMessage) {
			selectedMessage.Edited = true;
			ws.send(JSON.stringify(selectedMessage));
		}
		closeEditModal();
	}
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
	}
</script>

<h1>Chatta!</h1>

<div class="chattaApp">
	<div class="chattaSidebar">
		<menu class="chattaNav">
			<!-- Username / Account Details / At the Top in a little box-->
			<li><h2>{client?.username}</h2></li>
			<!-- Sidebar - Chats / DMs / Settings / Sign Out -->
			<!--Collapsible Chats List-->
			<li>
				Chats
				<div class="chattaChats">
					{#each chats as chat}
						{#if chat.type == "thread"}
							<button on:click={() => switchChannel(chat)} class="chatPill"
								>{chat.name}</button
							>
						{/if}
					{/each}-
				</div>
			</li>

			<li>
				DMs
				<div class="chattaChats">
					{#each chats as chat}
						{#if chat.type == "dm"}<button
								on:click={() => switchChannel(chat)}
								class="chatPill">{getChatName(chat)}</button
							>
						{/if}
					{/each}
				</div>
			</li>
			<!--Collapsible Settings-->
			<li>
				Settings--
				<ul class="chattaStgsCollapsible">
					<li>Item</li>
					<li>Item</li>
					<li>Item</li>
					<li>Item</li>
				</ul>
			</li>
			<!--Sign Out -->
			<button on:click={signOut} class="signOutBtn">signOut</button>
		</menu>
	</div>
	<div class="chattaRight">
		<Modal isOpen={showEditModal} on:close={closeEditModal}>
			{#if selectedMessage}
				<div
					class="threadSidebar"
					in:fly={{ x: 200, duration: 500 }}
					out:fly={{ x: -200, duration: 500 }}
				>
					<h2>Edit Message</h2>
					<input
						bind:value={selectedMessage.content}
						placeholder="Type a message..."
						on:keydown={(event) => {
							if (event.key === "Enter") {
								editMessage();
							}
						}}
					/>
					<button on:click={editMessage}>Save</button>
				</div>
			{/if}
		</Modal>

		<div class="dm-window">
			{#if currentChat && (currentChat.type === "dm" || currentChat.type === "gc")}
				<StatusBar onCall={Call()} onVideo={Call()} chatName="Test" />
			{/if}
			<div class="chat-window">
				<VideoModal isOpen={onCall} on:close={closeCall()}
					><h1>Video Call</h1>
					<video id="localVideo" autoplay playsinline></video>
					<video id="remoteVideo" autoplay playsinline></video>

					<button on:click={() => Call(client, receiver)}>Start Call</button>
				</VideoModal>
				{#if messages?.length > 0}
					<div class="texts">
						{#each messages as msg, index}
							{#if msg.channel == wsChannel}
								<div
									class="message"
									in:fly={{ y: -200, duration: 1000 }}
									out:fly={{ x: 200, duration: 1000 }}
								>
									<div class="textCont">
										<button
											on:click={() => {
												if (client.uuid !== msg.sender.uuid) {
													directMessage(msg.sender);
												}
											}}
											class="msgSender">{msg.sender.username}:</button
										>
										<span class="msgContent">{msg.content}</span>
									</div>
									<div class="msgActionsCont">
										<button
											on:click={() => openThreadModal(msg)}
											class="editBtn"
											><i class="fas fa-solid fa-comments"></i></button
										>
										<button on:click={() => openEditModal(msg)} class="editBtn"
											><i class="fas fa-edit"></i></button
										>
										<button on:click={() => deleteMsg(msg)} class="deleteBtn"
											><i class="fas fa-close"></i></button
										>
									</div>
								</div>
							{/if}
						{/each}
					</div>
				{/if}
				<Sidebar isOpen={showThreadModal} on:close={closeThreadModal}>
					{#if selectedMessage}
						<div class="threadSidebarCont">
							<div class="threadCreateCont">
								<h2>Create Thread</h2>
								<p>Thread Name</p>
								<input
									bind:value={selectedMessage.content}
									placeholder="Type a message..."
								/>
								<button on:click={createThread}>Create</button>
							</div>
						</div>
					{/if}
				</Sidebar>
			</div>
		</div>

		<div class="sendContainer">
			<input
				bind:value={message.Content}
				class="sendBar"
				placeholder="Type a message..."
				on:keydown={(event) => {
					if (event.key === "Enter") {
						sendMessage();
					}
				}}
			/>
			<button class="sendBtn" on:click={sendMessage}>Send</button>
		</div>
	</div>
</div>

<style>
	video {
		width: 400px;
		height: 300px;
		background-color: black;
	}
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
		height: 100%;
		cursor: pointer;
		transition: 0.5s ease-in-out;
	}
	.sendBtn:hover {
		background-color: #363;
		color: #fff;
		box-shadow: 10px rgba(0, 0, 0, 0.4);
		transform: scale(1.05);
	}
	.sendBtn:active {
		background-color: #030;
		transition: 0.5s ease-in-out;
		transform: scale(0.95);
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
		height: 100%;

		overflow-y: scroll;
		justify-content: flex-end;

		display: flex;
		flex-direction: row;
	}
	.dm-window {
		border: 5px solid #ccc;
		height: 65vh;
		display: flex;
		flex-direction: column;
		overflow-y: scroll;
		justify-content: flex-end;
		border-radius: 40px;

		margin: 10px;
	}
	.texts {
		height: 100%;
		width: 100%;
		display: flex;
		flex-direction: column;
		overflow-y: scroll;
		justify-content: flex-end;
		padding: 10px;
	}
	.chat-button {
		background-color: #333;
		color: #aaa;
		border-radius: 0 20px;
	}

	.msgActionsCont {
		width: 35%;
	}
	.textCont {
		width: 65%;
	}
	.msgActionsCont button {
		color: #fff;
		height: 2.5em;
		width: 30%;
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
		width: 100%;
		transition: 0.5s ease-in-out;
	}
	.editBtn:hover {
		background-color: #555;
		transform: scale(1.05);
	}
	.chattaApp {
		display: flex;
		flex-direction: row;
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
	.chattaRight {
		width: 85%;
	}
	.chattaSidebar {
		width: 15%;
	}
	.threadSidebarCont {
		display: flex;
		height: 100%;
		width: 100%;
		flex-direction: column;
		justify-content: space-between;
		align-items: flex-start;
	}
	.deleteBtn:active {
		transition: 0.25s ease-in-out;
		background-color: #a22;
		transform: scale(0.9);
	}
	.chatPill {
		background-color: #777;
		border-radius: 20px;
		width: 70%;
		border: none;
		margin: 5%;
		transition: 0.5s ease-in-out;
	}
	.chatPill:hover {
		transform: scale(1.05);
		background-color: #555;
	}
	.chatPill:active {
		transform: scale(0.9);
		background-color: #333;
		transition: 0.5s ease-in-out;
	}

	.chattaNav * {
		list-style-type: none;
		width: 100%;
	}
	.chattaNav {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		justify-content: flex-start;
		padding-inline-start: 0;
		padding: 1%;
	}
</style>
