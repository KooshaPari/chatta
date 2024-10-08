<script>
	import { createEventDispatcher, onMount, onDestroy } from "svelte";
	import { fade, scale, fly } from "svelte/transition";
	import { tick } from "svelte";

	export let isOpen = false;
	export let closeOnOverlayClick = true;

	const dispatch = createEventDispatcher();
	let sidebarContent;
	let previouslyFocusedElement;

	function closesidebar() {
		dispatch("close");
	}

	function handleKeyDown(event) {
		if (event.key === "Escape") {
			closesidebar();
		}
	}

	onMount(() => {
		if (isOpen) {
			previouslyFocusedElement = document.activeElement;
			window.addEventListener("keydown", handleKeyDown);
			tick().then(() => {
				sidebarContent.focus();
			});
		}
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
			if (previouslyFocusedElement) {
				previouslyFocusedElement.focus();
			}
		};
	});
</script>

{#if isOpen}
	<div
		class="sidebar-content"
		aria-modal="true"
		on:click|stopPropagation
		role="document"
		tabindex="-1"
		bind:this={sidebarContent}
		transition:fly={{ x: 200, duration: 750 }}
	>
		<slot></slot>
		<button class="close-button" on:click={closesidebar} aria-label="Close sidebar">
			×
		</button>
	</div>
{/if}

<style>
	.sidebar-content {
		background: #444;
		padding-inline: 5%;

		border-radius: 8px;
		position: relative;
		max-width: 500px;
		width: 15%;
		height: 100%;
		box-shadow: -10px 0 10px rgba(0, 0, 0, 0.1);
		outline: none;
	}
	.close-button:hover {
		background-color: #ddd;

		transform: scale(1.05);
	}
	.close-button:active {
		background-color: #999;
		transform: scale(0.9);
	}
	.close-button {
		position: absolute;
		top: 0.5rem;
		right: 0.75rem;
		display: flex;
		justify-content: center;
		text-align: center;
		align-items: center;
		background: transparent;
		border-radius: 50%;
		border: none;
		width: 25px;
		height: 25px;
		font-size: 1.5rem;
		cursor: pointer;
		transition: 0.125s ease-in-out;
	}

	/* Transition classes can be customized if needed */
</style>
