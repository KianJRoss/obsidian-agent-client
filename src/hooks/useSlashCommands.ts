import { useState, useCallback } from "react";
import type { SlashCommand } from "../domain/models/chat-session";

const FALLBACK_SLASH_COMMANDS: SlashCommand[] = [
	{
		name: "status",
		description: "Show session id, mode, model, and preflight state.",
	},
	{
		name: "fork",
		description: "Fork current session and switch to the new branch.",
	},
	{
		name: "resume",
		description: "Resume a previous session (for example: /resume latest).",
	},
	{
		name: "sessions",
		description: "List available sessions with id and updated time.",
	},
	{
		name: "capabilities",
		description: "Show supported tools, modes, and operational features.",
	},
	{
		name: "sync",
		description: "Run sync workflows (Moodle/Cengage/Notion/calendar).",
		hint: "mode[,mode2,...] [flags=...]",
	},
	{ name: "sync full", description: "Run full Moodle + Cengage sync." },
	{ name: "sync moodle", description: "Run Moodle-only sync." },
	{ name: "sync cengage", description: "Run Cengage/WebAssign-only sync." },
	{ name: "sync webassign", description: "Alias of Cengage-only sync." },
	{ name: "sync zotero", description: "Run Zotero-only sync." },
	{ name: "sync discovery", description: "Run discovery sync." },
	{ name: "sync notion_refresh", description: "Refresh Notion -> Obsidian status." },
	{ name: "sync update_dates", description: "Push vault dates to Notion." },
	{ name: "sync full_auto", description: "Full sync + maintenance pipeline." },
	{ name: "sync moodle_auto", description: "Moodle sync + maintenance pipeline." },
	{ name: "sync calendar_dry", description: "Preview calendar writes." },
	{ name: "sync calendar_write", description: "Write calendar events." },
	{ name: "sync calendar_auth", description: "Run calendar OAuth/auth flow." },
	{
		name: "focus",
		description: "Run focus workflows such as todo/recovery/relations.",
		hint: "action[,action2,...] [course_id]",
	},
	{ name: "focus recovery", description: "Run recovery queue." },
	{ name: "focus todo", description: "Build TODO for focus course." },
	{ name: "focus relations", description: "Refresh assignment relations." },
	{
		name: "maintenance",
		description: "Run maintenance bundles and targeted maintenance actions.",
		hint: "action[,action2,...] [flags=...]",
	},
	{ name: "maintenance bundle", description: "Run the default maintenance bundle." },
	{
		name: "cleanup",
		description: "Run cleanup actions for vault and integrations.",
		hint: "action[,action2,...] [confirm=<token>]",
	},
	{ name: "cleanup all", description: "Run the standard cleanup bundle." },
	{ name: "cleanup vault", description: "Run vault cleanup only." },
	{ name: "cleanup reclass_dry", description: "Preview AI reclassification." },
	{ name: "cleanup reclass_live", description: "Apply AI reclassification (write)." },
	{ name: "cleanup notion", description: "Run Notion cleanup actions." },
	{
		name: "diagnostics",
		description: "Run diagnostics and inspection checks.",
		hint: "mode[,mode2,...] [flags=...]",
	},
	{ name: "diagnostics auth_test", description: "Run auth diagnostic checks." },
	{ name: "diagnostics inspect_notion", description: "Inspect Notion integration." },
	{ name: "diagnostics inspect_obsidian", description: "Inspect Obsidian integration." },
	{ name: "diagnostics full_inspection", description: "Run full diagnostics bundle." },
	{
		name: "triage",
		description: "Run triage workflows and summarize priorities.",
	},
	{
		name: "memory",
		description: "Inspect or add persistent memory facts for ACP.",
	},
	{
		name: "subagents",
		description: "Configure or run ACP sub-agent strategy.",
	},
	{
		name: "feedback-loop",
		description: "Configure iterative planning/execution feedback loop.",
	},
	{
		name: "feedback",
		description: "Save model/runtime feedback to improve future runs.",
	},
];

const PINNED_COMMAND_ORDER = [
	"status",
	"fork",
	"resume",
	"sessions",
	"capabilities",
] as const;

function commandOrderScore(commandName: string): number {
	const idx = PINNED_COMMAND_ORDER.indexOf(
		commandName.toLowerCase() as (typeof PINNED_COMMAND_ORDER)[number],
	);
	return idx >= 0 ? idx : PINNED_COMMAND_ORDER.length + 1000;
}

function compareSlashCommands(a: SlashCommand, b: SlashCommand): number {
	const orderDelta = commandOrderScore(a.name) - commandOrderScore(b.name);
	if (orderDelta !== 0) {
		return orderDelta;
	}
	return a.name.localeCompare(b.name);
}

function getEffectiveCommands(availableCommands: SlashCommand[]): SlashCommand[] {
	const source =
		availableCommands.length > 0
			? [...availableCommands, ...FALLBACK_SLASH_COMMANDS]
			: FALLBACK_SLASH_COMMANDS;
	const byName = new Map<string, SlashCommand>();
	for (const command of source) {
		const key = command.name.trim().toLowerCase();
		if (!key || byName.has(key)) {
			continue;
		}
		byName.set(key, command);
	}
	return Array.from(byName.values()).sort(compareSlashCommands);
}

function getMatchRank(command: SlashCommand, query: string): number {
	if (!query) {
		return 0;
	}
	const name = command.name.toLowerCase();
	const description = command.description.toLowerCase();
	if (name.startsWith(query)) {
		return 0;
	}
	if (name.includes(query)) {
		return 1;
	}
	if (description.includes(query)) {
		return 2;
	}
	return 99;
}

interface ActiveSlashToken {
	start: number;
	end: number;
	query: string;
}

function getActiveSlashToken(
	input: string,
	cursorPosition: number,
): ActiveSlashToken | null {
	const boundedCursor = Math.max(0, Math.min(cursorPosition, input.length));
	const textUpToCursor = input.slice(0, boundedCursor);
	const slashIndex = textUpToCursor.lastIndexOf("/");
	if (slashIndex < 0) {
		return null;
	}

	const precedingChar = slashIndex > 0 ? textUpToCursor[slashIndex - 1] : "";
	if (slashIndex !== 0 && !/\s/.test(precedingChar)) {
		return null;
	}

	const tokenBody = textUpToCursor.slice(slashIndex + 1);

	return {
		start: slashIndex,
		end: boundedCursor,
		query: tokenBody.toLowerCase(),
	};
}

export interface UseSlashCommandsReturn {
	/** Filtered slash command suggestions */
	suggestions: SlashCommand[];
	/** Currently selected index in the dropdown */
	selectedIndex: number;
	/** Whether the dropdown is open */
	isOpen: boolean;

	/**
	 * Update slash command suggestions based on current input.
	 * Slash commands only trigger when input starts with '/'.
	 */
	updateSuggestions: (input: string, cursorPosition: number) => void;

	/**
	 * Select a slash command from the dropdown.
	 * @returns Updated input text with command (e.g., "/web ")
	 */
	selectSuggestion: (
		input: string,
		command: SlashCommand,
		cursorPosition?: number,
	) => string;

	/** Navigate the dropdown selection */
	navigate: (direction: "up" | "down") => void;

	/** Close the dropdown */
	close: () => void;
}

/**
 * Hook for managing slash command dropdown state and logic.
 *
 * @param availableCommands - Available slash commands from the agent session
 * @param onAutoMentionToggle - Callback to enable/disable auto-mention
 *        (slash commands require auto-mention to be disabled so "/" stays at the start)
 */
export function useSlashCommands(
	availableCommands: SlashCommand[],
	onAutoMentionToggle?: (disabled: boolean) => void,
): UseSlashCommandsReturn {
	const [suggestions, setSuggestions] = useState<SlashCommand[]>([]);
	const [selectedIndex, setSelectedIndex] = useState(0);

	const isOpen = suggestions.length > 0;

	const updateSuggestions = useCallback(
		(input: string, cursorPosition: number) => {
			const wasOpen = suggestions.length > 0;
			const activeToken = getActiveSlashToken(input, cursorPosition);

			if (!activeToken) {
				// Re-enable auto-mention only if dropdown was showing
				// (meaning it was disabled by slash command detection)
				if (wasOpen) {
					onAutoMentionToggle?.(false);
				}
				setSuggestions([]);
				setSelectedIndex(0);
				return;
			}
			const query = activeToken.query;
			const effectiveCommands = getEffectiveCommands(availableCommands);

			// Filter command list (with local fallback when backend discovery is absent)
			const filtered = effectiveCommands
				.filter((cmd) => {
					if (!query) {
						return true;
					}
					const name = cmd.name.toLowerCase();
					const description = cmd.description.toLowerCase();
					const hint = (cmd.hint ?? "").toLowerCase();
					return (
						name.includes(query) ||
						description.includes(query) ||
						hint.includes(query)
					);
				})
				.sort((a, b) => {
					const rankDelta = getMatchRank(a, query) - getMatchRank(b, query);
					if (rankDelta !== 0) {
						return rankDelta;
					}
					return compareSlashCommands(a, b);
				});

			setSuggestions(filtered);
			setSelectedIndex(0);
			onAutoMentionToggle?.(activeToken.start === 0);
		},
		[availableCommands, onAutoMentionToggle, suggestions.length],
	);

	const selectSuggestion = useCallback(
		(
			input: string,
			command: SlashCommand,
			cursorPosition?: number,
		): string => {
			const effectiveCursor = cursorPosition ?? input.length;
			const activeToken = getActiveSlashToken(input, effectiveCursor);
			const commandText = `/${command.name} `;
			const updatedInput = activeToken
				? input.slice(0, activeToken.start) +
					commandText +
					input.slice(activeToken.end)
				: commandText;

			// Close dropdown
			setSuggestions([]);
			setSelectedIndex(0);

			return updatedInput;
		},
		[],
	);

	const navigate = useCallback(
		(direction: "up" | "down") => {
			if (suggestions.length === 0) {
				return;
			}

			const maxIndex = suggestions.length - 1;

			setSelectedIndex((current) => {
				if (direction === "down") {
					return Math.min(current + 1, maxIndex);
				} else {
					return Math.max(current - 1, 0);
				}
			});
		},
		[suggestions.length],
	);

	const close = useCallback(() => {
		setSuggestions([]);
		setSelectedIndex(0);
	}, []);

	return {
		suggestions,
		selectedIndex,
		isOpen,
		updateSuggestions,
		selectSuggestion,
		navigate,
		close,
	};
}
