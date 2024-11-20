<script>
	export let data;
	export const prerender = true;
</script>

<nav>
	<a href="/">Home</a>
	<a href="/chat">Chat</a>
	<a href="/login">Auth</a>
</nav>

<slot />
