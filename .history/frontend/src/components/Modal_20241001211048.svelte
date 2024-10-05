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
		class="modal-overlay"
		on:click={() => closeOnOverlayClick && closeModal()}
		role="dialog"
		aria-modal="true"
		transition:fade={{ duration: 200 }}
	>
		<div
			class="modal-content"
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
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.25);
		backdrop-filter: blur(2.5px);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000;
	}

	.modal-content {
		background: white;
		padding: 1.5rem;
		border-radius: 8px;
		position: relative;
		max-width: 500px;
		width: 90%;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
		outline: none;
	}
	.close-button:hover {
		background-color: #ddd;

		transform: scale(1.025);
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
		border: 2px solid #555;
		border-radius: 50%;
		width: 25px;
		height: 25px;
		font-size: 1.5rem;
		cursor: pointer;
		transition: 0.125s ease-in-out;
	}

	/* Transition classes can be customized if needed */
</style>
