<script>
	export let chatName;
	export let onCall;
	export let onVideo;
</script>

<div class="top-bar">
	<h3>{chatName}</h3>
	<button on:click={onCall}>Call</button>
</div>

<style>
	.top-bar {
		display: flex;
		justify-content: space-between;
		padding: 10px;
		background-color: #f3f3f3;
		border-bottom: 1px solid #ddd;
	}

	h3 {
		margin: 0;
	}
</style>
