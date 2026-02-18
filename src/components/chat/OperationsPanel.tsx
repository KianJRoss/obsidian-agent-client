import * as React from "react";
const { useMemo, useState, useCallback, useEffect } = React;
import { Notice } from "obsidian";
import type { SlashCommand } from "../../domain/models/chat-session";

interface SyncModeOption {
	id: string;
	name: string;
	description: string;
	syncArg: string;
}

const SYNC_MODES: SyncModeOption[] = [
	{
		id: "notion_refresh",
		name: "Notion -> Obsidian Refresh",
		description: "Refresh assignment status and dashboard views without scraping LMS sites.",
		syncArg: "notion_refresh",
	},
	{
		id: "discovery",
		name: "Discovery Sync",
		description: "Collect newly discovered items with low disruption to existing notes.",
		syncArg: "discovery",
	},
	{
		id: "zotero",
		name: "Zotero Only",
		description: "Pull recent Zotero items and update literature note coverage.",
		syncArg: "zotero",
	},
	{
		id: "moodle_auto",
		name: "One-Click Moodle + Cleanup",
		description: "Run Moodle sync with your safe post-sync cleanup defaults.",
		syncArg: "moodle_auto",
	},
	{
		id: "full_auto",
		name: "One-Click Full Sync + Cleanup",
		description: "Run a full safe sync pass across Moodle and Cengage, then cleanup.",
		syncArg: "full_auto",
	},
];

interface FocusActionOption {
	id: "recovery" | "todo" | "relations";
	name: string;
	description: string;
}

const FOCUS_ACTIONS: FocusActionOption[] = [
	{
		id: "recovery",
		name: "Recovery Queue",
		description: "Prioritize highest-impact missing or at-risk coursework.",
	},
	{
		id: "todo",
		name: "TODO List",
		description: "Build or refresh the current actionable task packet.",
	},
	{
		id: "relations",
		name: "Link Relations",
		description: "Refresh related-assignment links and supporting context.",
	},
];

interface AssistantActionOption {
	id: "status" | "sessions" | "fork" | "resume" | "capabilities";
	name: string;
	description: string;
}

const ASSISTANT_ACTIONS: AssistantActionOption[] = [
	{
		id: "status",
		name: "Status",
		description: "Show current session mode/model and last operational health.",
	},
	{
		id: "sessions",
		name: "Sessions",
		description: "List resumable and recent sessions.",
	},
	{
		id: "fork",
		name: "Fork Session",
		description: "Create a branch session from current context.",
	},
	{
		id: "resume",
		name: "Resume Session",
		description: "Resume a saved session context.",
	},
	{
		id: "capabilities",
		name: "Capabilities",
		description: "List safe local operational capabilities.",
	},
];

interface TriageActionOption {
	id: "sources" | "audit" | "weekly";
	name: string;
	description: string;
}

const TRIAGE_ACTIONS: TriageActionOption[] = [
	{
		id: "sources",
		name: "Source Triage",
		description:
			"Find new/unprocessed items and missing links across Obsidian, Notion, and Zotero.",
	},
	{
		id: "audit",
		name: "Vault Audit",
		description:
			"Run integrity checks for links, source_uids, and mapping consistency.",
	},
	{
		id: "weekly",
		name: "Weekly Plan",
		description:
			"Produce a weekly information-gathering and organization plan.",
	},
];

const TRIAGE_DEPTH_OPTIONS = [
	{ id: "concise", label: "Concise" },
	{ id: "detailed", label: "Detailed" },
] as const;

type FocusActionId = FocusActionOption["id"];
type AssistantActionId = AssistantActionOption["id"];
type TriageActionId = TriageActionOption["id"];

export interface FocusCourseOption {
	id: string;
	label: string;
}

export interface OperationsPanelProps {
	availableCommands: SlashCommand[];
	focusCourseOptions: FocusCourseOption[];
	isBusy: boolean;
	onRunPrompt: (prompt: string) => Promise<boolean>;
}

export function OperationsPanel({
	availableCommands,
	focusCourseOptions,
	isBusy,
	onRunPrompt,
}: OperationsPanelProps) {
	const [collapsed, setCollapsed] = useState(false);
	const [syncModeId, setSyncModeId] = useState("notion_refresh");
	const [focusActionIds, setFocusActionIds] = useState<FocusActionId[]>([
		"todo",
	]);
	const [focusCourseId, setFocusCourseId] = useState("");
	const [assistantActionId, setAssistantActionId] =
		useState<AssistantActionId>("status");
	const [assistantResumeArg, setAssistantResumeArg] = useState("latest");
	const [triageActionIds, setTriageActionIds] = useState<TriageActionId[]>([
		"sources",
	]);
	const [triageDepth, setTriageDepth] = useState<"concise" | "detailed">(
		"concise",
	);

	const commandNames = useMemo(
		() => new Set(availableCommands.map((command) => command.name)),
		[availableCommands],
	);
	const hasCommandDiscovery = commandNames.size > 0;

	const shouldTrySlashCommand = useCallback(
		(command: string) => {
			// Some ACP bridges (including custom ones) support slash commands
			// without advertising available_commands_update.
			if (!hasCommandDiscovery) {
				return true;
			}
			return commandNames.has(command);
		},
		[commandNames, hasCommandDiscovery],
	);

	const selectedSyncMode = useMemo(
		() => SYNC_MODES.find((mode) => mode.id === syncModeId) || SYNC_MODES[0],
		[syncModeId],
	);

	const selectedFocusAction = useMemo(
		() => FOCUS_ACTIONS.filter((action) => focusActionIds.includes(action.id)),
		[focusActionIds],
	);

	const selectedFocusCourse = useMemo(
		() =>
			focusCourseOptions.find((course) => course.id === focusCourseId) ||
			focusCourseOptions[0],
		[focusCourseOptions, focusCourseId],
	);

	const selectedAssistantAction = useMemo(
		() =>
			ASSISTANT_ACTIONS.find((action) => action.id === assistantActionId) ||
			ASSISTANT_ACTIONS[0],
		[assistantActionId],
	);

	const selectedTriageActions = useMemo(
		() => TRIAGE_ACTIONS.filter((action) => triageActionIds.includes(action.id)),
		[triageActionIds],
	);

	useEffect(() => {
		if (focusCourseOptions.length === 0) {
			return;
		}
		const exists = focusCourseOptions.some(
			(course) => course.id === focusCourseId,
		);
		if (!exists) {
			setFocusCourseId(focusCourseOptions[0].id);
		}
	}, [focusCourseOptions, focusCourseId]);

	const runPrompt = useCallback(
		async (prompt: string) => {
			if (isBusy) {
				new Notice(
					"[Agent Client] Session is busy. Wait for the current operation to finish.",
				);
				return;
			}
			const ok = await onRunPrompt(prompt);
			if (!ok) {
				new Notice("[Agent Client] Could not start operation.");
			}
		},
		[isBusy, onRunPrompt],
	);

	const runSync = useCallback(() => {
		if (shouldTrySlashCommand("sync")) {
			void runPrompt(`/sync ${selectedSyncMode.syncArg}`);
			return;
		}
		void runPrompt(
			`Run a safe ${selectedSyncMode.name} workflow and summarize what changed.`,
		);
	}, [runPrompt, selectedSyncMode, shouldTrySlashCommand]);

	const toggleFocusAction = useCallback((actionId: FocusActionId) => {
		setFocusActionIds((prev) => {
			if (prev.includes(actionId)) {
				return prev.filter((id) => id !== actionId);
			}
			return [...prev, actionId];
		});
	}, []);

	const runFocus = useCallback(() => {
		if (selectedFocusAction.length === 0) {
			new Notice("[Agent Client] Select at least one focus action.");
			return;
		}
		const course = (selectedFocusCourse?.id || "").trim();
		if (
			selectedFocusAction.length === 1 &&
			shouldTrySlashCommand("focus")
		) {
			const suffix = course.length > 0 ? ` ${course}` : "";
			void runPrompt(`/focus ${selectedFocusAction[0].id}${suffix}`);
			return;
		}
		const courseText =
			course.length > 0
				? ` for course ${course}`
				: " for my current focus course";
		const actionsText = selectedFocusAction.map((action) => action.id).join(", ");
		void runPrompt(
			`Run these focus workflows${courseText}: ${actionsText}. Execute safely and summarize prioritized next steps.`,
		);
	}, [runPrompt, selectedFocusAction, selectedFocusCourse, shouldTrySlashCommand]);

	const runAssistant = useCallback(
		(action: AssistantActionId) => {
			if (shouldTrySlashCommand(action)) {
				if (action === "resume" && assistantResumeArg.trim().length > 0) {
					void runPrompt(`/resume ${assistantResumeArg.trim()}`);
					return;
				}
				void runPrompt(`/${action}`);
				return;
			}
			const fallbackPrompts: Record<typeof action, string> = {
				status:
					"Show current assistant session status, selected mode, selected model, and recent run health.",
				sessions:
					"List available sessions with short titles and most recent update times.",
				fork: "Fork the current session into a new branch and confirm the new session id.",
				resume:
					"List resumable sessions and tell me how to resume the one I want.",
				capabilities:
					"List currently available safe operational capabilities for this workspace.",
			};
			void runPrompt(fallbackPrompts[action]);
		},
		[assistantResumeArg, runPrompt, shouldTrySlashCommand],
	);

	const toggleTriageAction = useCallback((actionId: TriageActionId) => {
		setTriageActionIds((prev) => {
			if (prev.includes(actionId)) {
				return prev.filter((id) => id !== actionId);
			}
			return [...prev, actionId];
		});
	}, []);

	const runTriage = useCallback(
		(kind: TriageActionId) => {
			const detailClause =
				triageDepth === "detailed"
					? "Provide a detailed report with grouped findings and next-step checklist."
					: "Keep it concise and practical.";
			if (kind === "sources") {
				void runPrompt(
					"Run a source triage across Obsidian vault, Notion databases, and Zotero. " +
						`Identify new/unprocessed items, missing links, and top 5 organization actions. ${detailClause}`,
				);
				return;
			}
			if (kind === "audit") {
				void runPrompt(
					"Run vault integrity checks for wiki links, source_uid duplicates, and mapping consistency. " +
						`Summarize issues and provide the safest fix sequence. ${detailClause}`,
				);
				return;
			}
			void runPrompt(
				"Build a weekly information-gathering plan: due items, reading queue from Zotero, " +
					`and required Notion/Obsidian updates. ${detailClause}`,
			);
		},
		[runPrompt, triageDepth],
	);

	const runSelectedTriage = useCallback(() => {
		if (selectedTriageActions.length === 0) {
			new Notice("[Agent Client] Select at least one triage action.");
			return;
		}
		if (selectedTriageActions.length === 1) {
			runTriage(selectedTriageActions[0].id);
			return;
		}
		const labels = selectedTriageActions.map((action) => action.name).join(", ");
		const depthText =
			triageDepth === "detailed"
				? "Detailed report with grouped findings and ordered action plan."
				: "Concise summary with key actions only.";
		void runPrompt(
			`Run these triage workflows in order: ${labels}. ${depthText}`,
		);
	}, [runPrompt, runTriage, selectedTriageActions, triageDepth]);

	const runSelectedAssistant = useCallback(() => {
		runAssistant(assistantActionId);
	}, [assistantActionId, runAssistant]);

	const focusSelectedText = useMemo(() => {
		if (selectedFocusAction.length === 0) {
			return "No actions selected.";
		}
		return `Selected: ${selectedFocusAction.map((action) => action.name).join(", ")}`;
	}, [selectedFocusAction]);

	const triageSelectedText = useMemo(() => {
		if (selectedTriageActions.length === 0) {
			return "No triage actions selected.";
		}
		return `Selected: ${selectedTriageActions
			.map((action) => action.name)
			.join(", ")}`;
	}, [selectedTriageActions]);

	const assistantResumeOptions = useMemo(
		() => [
			{ id: "latest", label: "latest" },
			{ id: "", label: "list sessions first" },
		],
		[],
	);

	return (
		<div className="agent-client-operations-panel">
			<div className="agent-client-operations-panel-header">
				<h4 className="agent-client-operations-panel-title">
					Operations
				</h4>
				<button
					type="button"
					className="agent-client-operations-collapse-button"
					onClick={() => setCollapsed((prev) => !prev)}
				>
					{collapsed ? "Show" : "Hide"}
				</button>
			</div>

			{!collapsed && (
				<div className="agent-client-operations-grid">
					<section className="agent-client-operations-card">
						<h5 className="agent-client-operations-card-title">Sync</h5>
						<select
							className="agent-client-operations-select"
							value={syncModeId}
							onChange={(event) =>
								setSyncModeId(event.target.value)
							}
							disabled={isBusy}
						>
							{SYNC_MODES.map((mode) => (
								<option key={mode.id} value={mode.id}>
									{mode.name}
								</option>
							))}
						</select>
						<p className="agent-client-operations-card-desc">
							{selectedSyncMode.description}
						</p>
						<button
							type="button"
							className="agent-client-operations-action-button"
							onClick={runSync}
							disabled={isBusy}
						>
							Run Sync
						</button>
					</section>

					<section className="agent-client-operations-card">
						<h5 className="agent-client-operations-card-title">Focus</h5>
						<div className="agent-client-operations-multiselect">
							{FOCUS_ACTIONS.map((action) => (
								<label
									key={action.id}
									className="agent-client-operations-multiselect-item"
								>
									<input
										type="checkbox"
										checked={focusActionIds.includes(action.id)}
										onChange={() => toggleFocusAction(action.id)}
										disabled={isBusy}
									/>
									<span>{action.name}</span>
								</label>
							))}
						</div>
						<select
							className="agent-client-operations-select"
							value={focusCourseId}
							onChange={(event) =>
								setFocusCourseId(event.target.value)
							}
							disabled={isBusy}
						>
							{focusCourseOptions.map((course) => (
								<option key={course.id || "__none"} value={course.id}>
									{course.label}
								</option>
							))}
						</select>
						<p className="agent-client-operations-card-desc">
							{focusSelectedText}
						</p>
						<button
							type="button"
							className="agent-client-operations-action-button"
							onClick={runFocus}
							disabled={isBusy}
						>
							Run Focus
						</button>
					</section>

					<section className="agent-client-operations-card">
						<h5 className="agent-client-operations-card-title">
							Assistant
						</h5>
						<select
							className="agent-client-operations-select"
							value={assistantActionId}
							onChange={(event) =>
								setAssistantActionId(
									event.target.value as AssistantActionId,
								)
							}
							disabled={isBusy}
						>
							{ASSISTANT_ACTIONS.map((action) => (
								<option key={action.id} value={action.id}>
									{action.name}
								</option>
							))}
						</select>
						{assistantActionId === "resume" && (
							<select
								className="agent-client-operations-select"
								value={assistantResumeArg}
								onChange={(event) =>
									setAssistantResumeArg(event.target.value)
								}
								disabled={isBusy}
							>
								{assistantResumeOptions.map((option) => (
									<option key={option.id || "__blank"} value={option.id}>
										{option.label}
									</option>
								))}
							</select>
						)}
						<p className="agent-client-operations-card-desc">
							{selectedAssistantAction.description}
						</p>
						<button
							type="button"
							className="agent-client-operations-action-button"
							onClick={runSelectedAssistant}
							disabled={isBusy}
						>
							Run Assistant Action
						</button>
					</section>

					<section className="agent-client-operations-card">
						<h5 className="agent-client-operations-card-title">
							Triage
						</h5>
						<p className="agent-client-operations-card-desc">
							Prioritize organization and information-gathering tasks
							across Obsidian, Notion, and Zotero.
						</p>
						<div className="agent-client-operations-multiselect">
							{TRIAGE_ACTIONS.map((action) => (
								<label
									key={action.id}
									className="agent-client-operations-multiselect-item"
								>
									<input
										type="checkbox"
										checked={triageActionIds.includes(action.id)}
										onChange={() => toggleTriageAction(action.id)}
										disabled={isBusy}
									/>
									<span>{action.name}</span>
								</label>
							))}
						</div>
						<select
							className="agent-client-operations-select"
							value={triageDepth}
							onChange={(event) =>
								setTriageDepth(
									event.target.value as "concise" | "detailed",
								)
							}
							disabled={isBusy}
						>
							{TRIAGE_DEPTH_OPTIONS.map((option) => (
								<option key={option.id} value={option.id}>
									Depth: {option.label}
								</option>
							))}
						</select>
						<p className="agent-client-operations-card-desc">
							{triageSelectedText}
						</p>
						<button
							type="button"
							className="agent-client-operations-action-button"
							onClick={runSelectedTriage}
							disabled={isBusy}
						>
							Run Triage
						</button>
					</section>
				</div>
			)}
		</div>
	);
}
