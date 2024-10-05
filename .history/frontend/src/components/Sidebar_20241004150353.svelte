<script>
	import { createEventDispatcher, onMount, onDestroy } from "svelte";
	import { fade, scale } from "svelte/transition";
	import { tick } from "svelte";

	export let isOpen = false;
	export let closeOnOverlayClick = true;

	const dispatch = createEventDispatcher();
	let modalContent;
	let previouslyFocusedElement;

	function closeModal() {
		dispatch("close");
	}

	function handleKeyDown(event) {
		if (event.key === "Escape") {
			closeModal();
		}
	}

	onMount(() => {
		if (isOpen) {
			previouslyFocusedElement = document.activeElement;
			window.addEventListener("keydown", handleKeyDown);
			tick().then(() => {
				modalContent.focus();
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
			class="modal-content"
			aria-modal="true"
			on:click|stopPropagation
			role="document"
			tabindex="-1"
			bind:this={modalContent}
			transition:scale={{ duration: 200 }}
		>
			<slot></slot>
			<button
				class="close-button"
				on:click={closeModal}
				aria-label="Close Modal"
			>
				×
			</button>
		</div>
	</div>
{/if}

<style>
	.modal-content {
		background: #444;
		padding: 1.5rem;
		border-radius: 8px;
		position: relative;
		max-width: 500px;
		width: 100%;
		height: 100%;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
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
