<script>
	let username = "";
	let password = "";
	let error = "";

	async function login() {
		const response = await fetch(
			"https://great-awfully-prawn.ngrok-free.app/login",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ username, password }),
			}
		);

		const data = await response.json();

		if (response.ok) {
			// Save the token and redirect to chat
			localStorage.setItem("token", data.token);
			window.location.href = "/chat";
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
<button on:click={signup}>signup</button>
