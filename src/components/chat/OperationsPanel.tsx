import * as React from "react";
const { useMemo, useState, useCallback } = React;
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

export interface OperationsPanelProps {
	availableCommands: SlashCommand[];
	isBusy: boolean;
	onRunPrompt: (prompt: string) => Promise<boolean>;
}

export function OperationsPanel({
	availableCommands,
	isBusy,
	onRunPrompt,
}: OperationsPanelProps) {
	const [collapsed, setCollapsed] = useState(false);
	const [syncModeId, setSyncModeId] = useState("notion_refresh");
	const [focusCourse, setFocusCourse] = useState("");

	const commandNames = useMemo(
		() => new Set(availableCommands.map((command) => command.name)),
		[availableCommands],
	);

	const selectedSyncMode = useMemo(
		() => SYNC_MODES.find((mode) => mode.id === syncModeId) || SYNC_MODES[0],
		[syncModeId],
	);

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
		if (commandNames.has("sync")) {
			void runPrompt(`/sync ${selectedSyncMode.syncArg}`);
			return;
		}
		void runPrompt(
			`Run a safe ${selectedSyncMode.name} workflow and summarize what changed.`,
		);
	}, [commandNames, runPrompt, selectedSyncMode]);

	const runFocus = useCallback(
		(action: "recovery" | "todo" | "relations") => {
			const course = focusCourse.trim();
			if (commandNames.has("focus")) {
				const suffix = course.length > 0 ? ` ${course}` : "";
				void runPrompt(`/focus ${action}${suffix}`);
				return;
			}
			const courseText =
				course.length > 0
					? ` for course ${course}`
					: " for my current focus course";
			void runPrompt(
				`Run ${action} focus workflow${courseText} and summarize prioritized next steps.`,
			);
		},
		[commandNames, focusCourse, runPrompt],
	);

	const runAssistant = useCallback(
		(action: "status" | "sessions" | "fork" | "resume" | "capabilities") => {
			if (commandNames.has(action)) {
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
		[commandNames, runPrompt],
	);

	const runTriage = useCallback(
		(kind: "sources" | "audit" | "weekly") => {
			if (kind === "sources") {
				void runPrompt(
					"Run a source triage across Obsidian vault, Notion databases, and Zotero. " +
						"Identify new/unprocessed items, missing links, and top 5 organization actions.",
				);
				return;
			}
			if (kind === "audit") {
				void runPrompt(
					"Run vault integrity checks for wiki links, source_uid duplicates, and mapping consistency. " +
						"Summarize issues and provide the safest fix sequence.",
				);
				return;
			}
			void runPrompt(
				"Build a weekly information-gathering plan: due items, reading queue from Zotero, " +
					"and required Notion/Obsidian updates.",
			);
		},
		[runPrompt],
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
						<input
							type="text"
							className="agent-client-operations-input"
							placeholder="Focused Course ID (optional)"
							value={focusCourse}
							onChange={(event) =>
								setFocusCourse(event.target.value)
							}
							disabled={isBusy}
						/>
						<div className="agent-client-operations-action-row">
							<button
								type="button"
								className="agent-client-operations-action-button"
								onClick={() => runFocus("recovery")}
								disabled={isBusy}
							>
								Recovery
							</button>
							<button
								type="button"
								className="agent-client-operations-action-button"
								onClick={() => runFocus("todo")}
								disabled={isBusy}
							>
								TODO
							</button>
							<button
								type="button"
								className="agent-client-operations-action-button"
								onClick={() => runFocus("relations")}
								disabled={isBusy}
							>
								Relations
							</button>
						</div>
					</section>

					<section className="agent-client-operations-card">
						<h5 className="agent-client-operations-card-title">
							Assistant
						</h5>
						<div className="agent-client-operations-action-row">
							<button
								type="button"
								className="agent-client-operations-action-button"
								onClick={() => runAssistant("status")}
								disabled={isBusy}
							>
								Status
							</button>
							<button
								type="button"
								className="agent-client-operations-action-button"
								onClick={() => runAssistant("sessions")}
								disabled={isBusy}
							>
								Sessions
							</button>
							<button
								type="button"
								className="agent-client-operations-action-button"
								onClick={() => runAssistant("fork")}
								disabled={isBusy}
							>
								Fork
							</button>
							<button
								type="button"
								className="agent-client-operations-action-button"
								onClick={() => runAssistant("resume")}
								disabled={isBusy}
							>
								Resume
							</button>
							<button
								type="button"
								className="agent-client-operations-action-button"
								onClick={() => runAssistant("capabilities")}
								disabled={isBusy}
							>
								Capabilities
							</button>
						</div>
					</section>

					<section className="agent-client-operations-card">
						<h5 className="agent-client-operations-card-title">
							Triage
						</h5>
						<p className="agent-client-operations-card-desc">
							Prioritize organization and information-gathering tasks
							across Obsidian, Notion, and Zotero.
						</p>
						<div className="agent-client-operations-action-row">
							<button
								type="button"
								className="agent-client-operations-action-button"
								onClick={() => runTriage("sources")}
								disabled={isBusy}
							>
								Source Triage
							</button>
							<button
								type="button"
								className="agent-client-operations-action-button"
								onClick={() => runTriage("audit")}
								disabled={isBusy}
							>
								Vault Audit
							</button>
							<button
								type="button"
								className="agent-client-operations-action-button"
								onClick={() => runTriage("weekly")}
								disabled={isBusy}
							>
								Weekly Plan
							</button>
						</div>
					</section>
				</div>
			)}
		</div>
	);
}
