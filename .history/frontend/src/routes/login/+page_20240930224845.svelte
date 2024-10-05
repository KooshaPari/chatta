<script>
	let username = "";
	let password = "";
	import { user } from "../../stores/user";
	let error = "";

	async function login() {
		const response = await fetch("http://localhost:8081/login", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ username, password }),
		});

		const data = await response.json();

		if (response.ok) {
			// Save the token and redirect to chat
			localStorage.setItem("token", data.token);
			user.set(data.user);
			console.log("LOGGING USER: ", $user.username);
			//window.location.href = "/chat";
		} else {
			error = data.error;
		}
	}
</script>

<h1>Login</h1>

{#if error}
	<p style="color: red;">{error}</p>
{/if}

<input bind:value={username} placeholder="Username" />
<input type="password" bind:value={password} placeholder="Password" />
<button on:click={login}>Login</button>
<a href="/signup"><button>signup</button></a>
