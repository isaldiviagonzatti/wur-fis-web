<!--
  PlannerToolbar — plan title, save status, and the plan's file actions:
  start a new plan, open or save a plan file, and export the board. The
  buttons at either end show or hide the library and the detail panel.
-->
<script>
	import FilePlus from '@lucide/svelte/icons/file-plus';
	import FileSpreadsheet from '@lucide/svelte/icons/file-spreadsheet';
	import FolderOpen from '@lucide/svelte/icons/folder-open';
	import Image from '@lucide/svelte/icons/image';
	import PanelLeftClose from '@lucide/svelte/icons/panel-left-close';
	import PanelLeftOpen from '@lucide/svelte/icons/panel-left-open';
	import PanelRightClose from '@lucide/svelte/icons/panel-right-close';
	import PanelRightOpen from '@lucide/svelte/icons/panel-right-open';
	import Save from '@lucide/svelte/icons/save';
	import { Button } from '$lib/components/ui/button';

	let {
		title = $bindable(),
		libraryOpen = $bindable(),
		detailOpen = $bindable(),
		status = '',
		onnew,
		onopen,
		onsave,
		oncsv,
		onpng
	} = $props();

	let confirmingNew = $state(false);
	let fileInput;

	function chooseFile(event) {
		const [file] = event.currentTarget.files;
		event.currentTarget.value = '';
		if (file) onopen(file);
	}
</script>

{#snippet panelToggle(open, label, OpenIcon, CloseIcon, toggle)}
	{@const action = `${open ? 'Hide' : 'Show'} ${label}`}
	<Button
		variant="ghost"
		size="icon-sm"
		class="cursor-pointer text-muted-foreground hover:text-foreground"
		aria-label={action}
		aria-pressed={open}
		title={action}
		onclick={toggle}
	>
		{#if open}<CloseIcon />{:else}<OpenIcon />{/if}
	</Button>
{/snippet}

<div class="flex flex-wrap items-center gap-x-3 gap-y-2 py-2">
	{@render panelToggle(libraryOpen, 'the library', PanelLeftOpen, PanelLeftClose, () => {
		libraryOpen = !libraryOpen;
	})}
	<input
		bind:value={title}
		placeholder="Untitled plan"
		aria-label="Plan title"
		maxlength="80"
		class="h-8 min-w-40 flex-1 rounded-md border border-transparent bg-transparent px-2 text-base font-semibold text-foreground outline-none placeholder:text-muted-foreground hover:border-border focus:border-foreground/40 sm:max-w-md"
	/>
	<span class="text-xs text-muted-foreground">{status}</span>

	<div class="ml-auto flex flex-wrap items-center gap-1">
		{#if confirmingNew}
			<span class="px-1 text-xs text-foreground">Clear the board and start again?</span>
			<Button
				size="sm"
				class="cursor-pointer"
				onclick={() => {
					confirmingNew = false;
					onnew();
				}}>Clear board</Button
			>
			<Button variant="ghost" size="sm" class="cursor-pointer" onclick={() => (confirmingNew = false)}
				>Cancel</Button
			>
		{:else}
			<Button variant="ghost" size="sm" class="cursor-pointer" onclick={() => (confirmingNew = true)}>
				<FilePlus />New
			</Button>
			<Button variant="ghost" size="sm" class="cursor-pointer" onclick={() => fileInput.click()}>
				<FolderOpen />Open
			</Button>
			<Button variant="ghost" size="sm" class="cursor-pointer" onclick={onsave}>
				<Save />Save plan
			</Button>
			<Button variant="outline" size="sm" class="ml-2 cursor-pointer" onclick={onpng}>
				<Image />PNG
			</Button>
			<Button variant="outline" size="sm" class="cursor-pointer" onclick={oncsv}>
				<FileSpreadsheet />CSV
			</Button>
		{/if}
	</div>
	{@render panelToggle(detailOpen, 'details', PanelRightOpen, PanelRightClose, () => {
		detailOpen = !detailOpen;
	})}
	<input
		bind:this={fileInput}
		type="file"
		accept=".json,application/json"
		class="hidden"
		onchange={chooseFile}
	/>
</div>
