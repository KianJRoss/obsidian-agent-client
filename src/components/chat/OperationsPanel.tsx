import * as React from "react";
const { useMemo, useState, useCallback, useEffect } = React;
import { Notice } from "obsidian";
import type { SlashCommand } from "../../domain/models/chat-session";

type FocusActionId = "recovery" | "todo" | "relations";
type AssistantActionId =
	| "status"
	| "sessions"
	| "fork"
	| "resume"
	| "capabilities";
type TriageActionId = "sources" | "audit" | "weekly";
type DiagnosticModeId =
	| "auth_test"
	| "inspect_notion"
	| "inspect_obsidian"
	| "full_inspection";
type OperationViewId =
	| "sync"
	| "focus"
	| "maintenance"
	| "cleanup"
	| "diagnostics"
	| "triage";

interface OptionBase<TId extends string> {
	id: TId;
	name: string;
	description: string;
}

interface SyncModeOption extends OptionBase<string> {}
interface FocusActionOption extends OptionBase<FocusActionId> {}
interface AssistantActionOption extends OptionBase<AssistantActionId> {}
interface TriageActionOption extends OptionBase<TriageActionId> {}
interface MaintenanceActionOption extends OptionBase<string> {}
interface CleanupActionOption extends OptionBase<string> {}
interface DiagnosticModeOption extends OptionBase<DiagnosticModeId> {}
interface FlagOption extends OptionBase<string> {}

const SYNC_MODES: SyncModeOption[] = [
	{ id: "full", name: "Full Sync", description: "Moodle + Cengage full sync." },
	{ id: "moodle", name: "Moodle Only", description: "Moodle-only sync." },
	{
		id: "cengage",
		name: "Cengage / WebAssign",
		description: "Cengage/WebAssign-only sync.",
	},
	{
		id: "webassign",
		name: "WebAssign Alias",
		description: "Alias for Cengage/WebAssign-only sync.",
	},
	{ id: "zotero", name: "Zotero Only", description: "Zotero-only sync." },
	{
		id: "discovery",
		name: "Discovery Sync",
		description: "New-item discovery sync.",
	},
	{
		id: "notion_refresh",
		name: "Notion -> Obsidian Refresh",
		description: "Refresh Notion statuses into Obsidian.",
	},
	{
		id: "update_dates",
		name: "Update Dates (Vault)",
		description: "Push assignment dates from vault to Notion.",
	},
	{
		id: "full_auto",
		name: "One-Click Full + Cleanup",
		description: "Full sync + maintenance bundle.",
	},
	{
		id: "moodle_auto",
		name: "One-Click Moodle + Cleanup",
		description: "Moodle sync + maintenance bundle.",
	},
	{
		id: "calendar_dry",
		name: "Calendar Sync (dry)",
		description: "Preview calendar writes.",
	},
	{
		id: "calendar_write",
		name: "Calendar Sync (write)",
		description: "Write calendar events.",
	},
	{
		id: "calendar_auth",
		name: "Calendar Auth",
		description: "Run Google Calendar OAuth.",
	},
];

const SYNC_FLAGS: FlagOption[] = [
	{ id: "visible", name: "Visible Browser", description: "Run browser headed." },
	{ id: "no_grades", name: "Skip Grades", description: "Disable grade sync." },
	{
		id: "no_resources",
		name: "Skip Resources",
		description: "Disable resource sync.",
	},
	{
		id: "no_manual_auth_fallback",
		name: "Disable Manual Auth Fallback",
		description: "Do not pause for manual auth fallback.",
	},
	{
		id: "no_inventory_cache",
		name: "Disable Inventory Cache",
		description: "Always rebuild Moodle inventory.",
	},
	{
		id: "calendar_no_browser",
		name: "Calendar Auth No Browser",
		description: "Do not auto-open browser during calendar auth.",
	},
	{
		id: "calendar_no_list",
		name: "Calendar Auth Skip Calendar List",
		description: "Skip listing calendars after auth.",
	},
];

const FOCUS_ACTIONS: FocusActionOption[] = [
	{
		id: "recovery",
		name: "Recovery Queue",
		description: "Prioritize missing/at-risk assignments.",
	},
	{
		id: "todo",
		name: "Build TODO",
		description: "Refresh actionable TODO list for selected course.",
	},
	{
		id: "relations",
		name: "Link Relations",
		description: "Refresh related assignments/content links.",
	},
];

const ASSISTANT_ACTIONS: AssistantActionOption[] = [
	{
		id: "status",
		name: "Status",
		description: "Show session id, mode, model, and preflight state.",
	},
	{
		id: "sessions",
		name: "Sessions",
		description: "List saved sessions with title and updated time.",
	},
	{
		id: "fork",
		name: "Fork Session",
		description: "Fork current session and switch to it.",
	},
	{
		id: "resume",
		name: "Resume Session",
		description: "Load state from a selected prior session.",
	},
	{
		id: "capabilities",
		name: "Capabilities",
		description: "Show full GUI-equivalent capabilities catalog.",
	},
];

const TRIAGE_ACTIONS: TriageActionOption[] = [
	{
		id: "sources",
		name: "Source Triage",
		description: "Find unprocessed items and missing links.",
	},
	{
		id: "audit",
		name: "Vault Audit",
		description: "Run integrity checks for links and mappings.",
	},
	{
		id: "weekly",
		name: "Weekly Plan",
		description: "Build a practical weekly info-gathering plan.",
	},
];

const MAINTENANCE_ACTIONS: MaintenanceActionOption[] = [
	{
		id: "bundle",
		name: "Maintenance Bundle",
		description: "Run normalize/organize/dedupe/link checks bundle.",
	},
	{
		id: "normalize_courses",
		name: "Normalize Course Links",
		description: "Normalize course naming and cleanup legacy stubs.",
	},
	{
		id: "organize_course",
		name: "Organize Assignments (course)",
		description: "Organize assignments by course.",
	},
	{
		id: "organize_week",
		name: "Organize Assignments (course + week)",
		description: "Organize assignments by course and inferred week.",
	},
	{
		id: "reclassify_resources",
		name: "Move HW from Resources",
		description: "Move homework-like resources into assignments.",
	},
	{
		id: "cleanup_forums",
		name: "Cleanup Forum Assignments",
		description: "Cleanup forum-assignment noise.",
	},
	{
		id: "report_duplicates",
		name: "Report Duplicates",
		description: "Generate duplicate report.",
	},
	{
		id: "audit_links",
		name: "Audit Wiki Links",
		description: "Check wiki-link integrity.",
	},
	{
		id: "audit_source_uids",
		name: "Audit Duplicate Source UIDs",
		description: "Detect duplicate source_uid values.",
	},
	{
		id: "audit_mapping",
		name: "Audit Mapping Integrity",
		description: "Validate mapping consistency.",
	},
	{
		id: "backfill_source_uids_dry",
		name: "Backfill Source UIDs (dry)",
		description: "Preview missing source_uid backfill changes.",
	},
	{
		id: "backfill_source_uids_write",
		name: "Backfill Source UIDs (write)",
		description: "Apply source_uid backfill changes.",
	},
	{
		id: "reset_discovery_state",
		name: "Reset Discovery State",
		description: "Reset discovery cache/state.",
	},
	{
		id: "vault_cleanup",
		name: "Vault Cleanup",
		description: "Run vault cleanup.",
	},
	{
		id: "notion_db_manager",
		name: "Notion DB Manager",
		description: "Run Notion DB maintenance actions.",
	},
	{
		id: "ai_reclass_dry",
		name: "AI Reclassify (dry)",
		description: "Preview AI reclassification changes.",
	},
	{
		id: "ai_reclass_live",
		name: "AI Reclassify (live)",
		description: "Apply AI reclassification changes.",
	},
	{
		id: "dedupe_dry",
		name: "Dedupe Sections (dry)",
		description: "Preview duplicate section removals.",
	},
	{
		id: "dedupe_write",
		name: "Dedupe Sections (write)",
		description: "Apply duplicate section removals.",
	},
	{
		id: "sync_oop_workspace",
		name: "Sync OOP Workspace",
		description: "Sync local OOP workspace into vault.",
	},
	{
		id: "calendar_auth",
		name: "Calendar Auth",
		description: "Run Google Calendar OAuth.",
	},
	{
		id: "calendar_dry",
		name: "Calendar Sync (dry)",
		description: "Preview calendar writes.",
	},
	{
		id: "calendar_write",
		name: "Calendar Sync (write)",
		description: "Write calendar events.",
	},
];

const MAINTENANCE_FLAGS: FlagOption[] = [
	{
		id: "create_frontmatter",
		name: "Create Frontmatter",
		description: "Create frontmatter when writing missing source_uids.",
	},
	{
		id: "calendar_no_browser",
		name: "Calendar Auth No Browser",
		description: "Do not auto-open browser during calendar auth.",
	},
	{
		id: "calendar_no_list",
		name: "Calendar Auth Skip Calendar List",
		description: "Skip listing calendars after auth.",
	},
];

const CLEANUP_ACTIONS: CleanupActionOption[] = [
	{
		id: "all",
		name: "All Default Cleanup",
		description: "Run vault + dry reclass + notion + dedupe + organize + oop sync.",
	},
	{ id: "vault", name: "Vault Cleanup", description: "Run vault cleanup." },
	{
		id: "reclass_dry",
		name: "Reclassify (dry)",
		description: "Preview AI reclassification.",
	},
	{
		id: "reclass_live",
		name: "Reclassify (live)",
		description: "Apply AI reclassification.",
	},
	{
		id: "notion",
		name: "Notion Manager",
		description: "Run Notion cleanup/maintenance actions.",
	},
	{
		id: "dedupe_dry",
		name: "Dedupe (dry)",
		description: "Preview duplicate assignment section cleanup.",
	},
	{
		id: "dedupe_write",
		name: "Dedupe (write)",
		description: "Apply duplicate assignment section cleanup.",
	},
	{
		id: "organize",
		name: "Organize by Course",
		description: "Move assignment notes into course folders.",
	},
	{
		id: "organize_week",
		name: "Organize by Week",
		description: "Move assignment notes into course/week folders.",
	},
	{
		id: "oop_sync",
		name: "Sync OOP Workspace",
		description: "Sync local OOP workspace into vault.",
	},
	{
		id: "reset_state",
		name: "Reset Discovery State",
		description: "Clear discovery state cache.",
	},
	{
		id: "reset_vault",
		name: "Reset Vault Sync Content",
		description: "Reset sync-managed vault content.",
	},
	{
		id: "clear_notion",
		name: "Clear Notion Databases",
		description: "Archive all configured Notion DB entries.",
	},
	{
		id: "full_reset",
		name: "Full Reset",
		description: "Reset vault + clear notion + reset discovery state.",
	},
];

const DIAGNOSTIC_MODES: DiagnosticModeOption[] = [
	{
		id: "auth_test",
		name: "Auth Test",
		description: "Verify Moodle/Cengage auth connectivity.",
	},
	{
		id: "inspect_notion",
		name: "Inspect Notion",
		description: "Print key Notion rows for inspection.",
	},
	{
		id: "inspect_obsidian",
		name: "Inspect Obsidian",
		description: "Inspect Obsidian vault API content.",
	},
	{
		id: "full_inspection",
		name: "Full Inspection",
		description: "Run Notion and Obsidian inspections together.",
	},
];

const DIAGNOSTIC_FLAGS: FlagOption[] = [
	{
		id: "visible",
		name: "Visible Browser",
		description: "Run browser headed for auth_test.",
	},
	{
		id: "no_manual_auth_fallback",
		name: "Disable Manual Auth Fallback",
		description: "Do not pause for manual auth fallback.",
	},
];

const OPERATION_VIEWS: Array<{ id: OperationViewId; label: string }> = [
	{ id: "sync", label: "Sync" },
	{ id: "focus", label: "Focus" },
	{ id: "maintenance", label: "Maintenance" },
	{ id: "cleanup", label: "Cleanup" },
	{ id: "diagnostics", label: "Diagnostics" },
	{ id: "triage", label: "Triage" },
];

export interface FocusCourseOption {
	id: string;
	label: string;
}

interface MultiSelectDropdownProps {
	title: string;
	options: Array<OptionBase<string>>;
	selectedIds: string[];
	disabled: boolean;
	onToggle: (id: string) => void;
}

function MultiSelectDropdown({
	title,
	options,
	selectedIds,
	disabled,
	onToggle,
}: MultiSelectDropdownProps) {
	const summary = useMemo(() => {
		if (selectedIds.length === 0) {
			return `${title}: none`;
		}
		const names = options
			.filter((option) => selectedIds.includes(option.id))
			.map((option) => option.name);
		return `${title}: ${names.join(", ")}`;
	}, [options, selectedIds, title]);

	return (
		<details className="agent-client-operations-multi-dropdown">
			<summary className="agent-client-operations-multi-summary">
				{summary}
			</summary>
			<div className="agent-client-operations-multi-list">
				{options.map((option) => (
					<label
						key={option.id}
						className="agent-client-operations-multi-item"
					>
						<input
							type="checkbox"
							checked={selectedIds.includes(option.id)}
							onChange={() => onToggle(option.id)}
							disabled={disabled}
						/>
						<span>{option.name}</span>
					</label>
				))}
			</div>
		</details>
	);
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
	const [activeView, setActiveView] = useState<OperationViewId>("sync");
	const [syncModeIds, setSyncModeIds] = useState<string[]>(["notion_refresh"]);
	const [syncFlagIds, setSyncFlagIds] = useState<string[]>([]);
	const [syncManualAuthTimeout, setSyncManualAuthTimeout] = useState("300");
	const [syncInventoryCacheTtl, setSyncInventoryCacheTtl] = useState("1800");
	const [syncMaxParallelCourses, setSyncMaxParallelCourses] = useState("4");
	const [syncMaxParallelTasks, setSyncMaxParallelTasks] = useState("8");
	const [syncCalendarMode, setSyncCalendarMode] = useState("all");
	const [syncCalendarDaysAhead, setSyncCalendarDaysAhead] = useState("120");

	const [focusActionIds, setFocusActionIds] = useState<FocusActionId[]>([
		"todo",
	]);
	const [focusCourseId, setFocusCourseId] = useState("");

	const [maintenanceActionIds, setMaintenanceActionIds] = useState<string[]>([
		"bundle",
	]);
	const [maintenanceFlagIds, setMaintenanceFlagIds] = useState<string[]>([]);
	const [maintenanceNotionAction, setMaintenanceNotionAction] = useState("all");
	const [maintenanceReclassFolder, setMaintenanceReclassFolder] =
		useState("all");
	const [maintenanceReclassLimit, setMaintenanceReclassLimit] =
		useState("none");
	const [maintenanceCalendarMode, setMaintenanceCalendarMode] =
		useState("all");
	const [maintenanceCalendarDaysAhead, setMaintenanceCalendarDaysAhead] =
		useState("120");

	const [cleanupActionIds, setCleanupActionIds] = useState<string[]>([
		"vault",
		"reclass_dry",
		"notion",
	]);
	const [cleanupNotionAction, setCleanupNotionAction] = useState("all");
	const [cleanupReclassFolder, setCleanupReclassFolder] = useState("all");
	const [cleanupReclassLimit, setCleanupReclassLimit] = useState("none");

	const [diagnosticModeIds, setDiagnosticModeIds] = useState<
		DiagnosticModeId[]
	>([]);
	const [diagnosticFlagIds, setDiagnosticFlagIds] = useState<string[]>([]);
	const [diagnosticManualAuthTimeout, setDiagnosticManualAuthTimeout] =
		useState("300");

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
			if (!hasCommandDiscovery) {
				return true;
			}
			return commandNames.has(command);
		},
		[commandNames, hasCommandDiscovery],
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

	const toggleStringId = useCallback(
		(id: string, setState: React.Dispatch<React.SetStateAction<string[]>>) => {
			setState((prev) => {
				if (prev.includes(id)) {
					return prev.filter((x) => x !== id);
				}
				return [...prev, id];
			});
		},
		[],
	);

	const toggleFocusAction = useCallback(
		(id: FocusActionId) => {
			setFocusActionIds((prev) => {
				if (prev.includes(id)) {
					return prev.filter((x) => x !== id);
				}
				return [...prev, id];
			});
		},
		[],
	);

	const toggleDiagnosticMode = useCallback(
		(id: DiagnosticModeId) => {
			setDiagnosticModeIds((prev) => {
				if (prev.includes(id)) {
					return prev.filter((x) => x !== id);
				}
				return [...prev, id];
			});
		},
		[],
	);

	const toggleTriageAction = useCallback(
		(id: TriageActionId) => {
			setTriageActionIds((prev) => {
				if (prev.includes(id)) {
					return prev.filter((x) => x !== id);
				}
				return [...prev, id];
			});
		},
		[],
	);

	const runSync = useCallback(() => {
		if (syncModeIds.length === 0) {
			new Notice("[Agent Client] Select at least one sync mode.");
			return;
		}
		if (shouldTrySlashCommand("sync")) {
			const tokens = [`modes=${syncModeIds.join(",")}`];
			if (syncFlagIds.length > 0) {
				tokens.push(`flags=${syncFlagIds.join(",")}`);
			}
			if (syncManualAuthTimeout !== "300") {
				tokens.push(`manual_auth_timeout=${syncManualAuthTimeout}`);
			}
			if (syncInventoryCacheTtl !== "1800") {
				tokens.push(`inventory_cache_ttl=${syncInventoryCacheTtl}`);
			}
			if (syncMaxParallelCourses !== "4") {
				tokens.push(`max_parallel_courses=${syncMaxParallelCourses}`);
			}
			if (syncMaxParallelTasks !== "8") {
				tokens.push(`max_parallel_tasks=${syncMaxParallelTasks}`);
			}
			if (syncCalendarMode !== "all") {
				tokens.push(`calendar_mode=${syncCalendarMode}`);
			}
			if (syncCalendarDaysAhead !== "120") {
				tokens.push(`calendar_days_ahead=${syncCalendarDaysAhead}`);
			}
			void runPrompt(`/sync ${tokens.join(" ")}`);
			return;
		}
		const names = SYNC_MODES.filter((mode) =>
			syncModeIds.includes(mode.id),
		).map((mode) => mode.name);
		void runPrompt(
			`Run these sync modes safely in order: ${names.join(", ")}. Summarize what changed and any errors.`,
		);
	}, [
		runPrompt,
		shouldTrySlashCommand,
		syncModeIds,
		syncFlagIds,
		syncManualAuthTimeout,
		syncInventoryCacheTtl,
		syncMaxParallelCourses,
		syncMaxParallelTasks,
		syncCalendarMode,
		syncCalendarDaysAhead,
	]);

	const runFocus = useCallback(() => {
		if (focusActionIds.length === 0) {
			new Notice("[Agent Client] Select at least one focus action.");
			return;
		}
		const course = (selectedFocusCourse?.id || "").trim();
		if (shouldTrySlashCommand("focus")) {
			const suffix = course.length > 0 ? ` ${course}` : "";
			void runPrompt(`/focus ${focusActionIds.join(",")}${suffix}`);
			return;
		}
		const courseText =
			course.length > 0
				? ` for course ${course}`
				: " for my current focus course";
		void runPrompt(
			`Run focus workflows${courseText}: ${focusActionIds.join(", ")}. Summarize prioritized next steps.`,
		);
	}, [focusActionIds, runPrompt, selectedFocusCourse, shouldTrySlashCommand]);

	const runAssistant = useCallback(() => {
		if (shouldTrySlashCommand(assistantActionId)) {
			if (
				assistantActionId === "resume" &&
				assistantResumeArg.trim().length > 0
			) {
				void runPrompt(`/resume ${assistantResumeArg.trim()}`);
				return;
			}
			void runPrompt(`/${assistantActionId}`);
			return;
		}
		void runPrompt(selectedAssistantAction.description);
	}, [
		assistantActionId,
		assistantResumeArg,
		runPrompt,
		selectedAssistantAction,
		shouldTrySlashCommand,
	]);

	const runMaintenance = useCallback(() => {
		if (maintenanceActionIds.length === 0) {
			new Notice("[Agent Client] Select at least one maintenance action.");
			return;
		}
		if (shouldTrySlashCommand("maintenance")) {
			const tokens = [`actions=${maintenanceActionIds.join(",")}`];
			if (maintenanceFlagIds.length > 0) {
				tokens.push(`flags=${maintenanceFlagIds.join(",")}`);
			}
			if (maintenanceNotionAction !== "all") {
				tokens.push(`notion_action=${maintenanceNotionAction}`);
			}
			if (maintenanceReclassFolder !== "all") {
				tokens.push(`reclass_folder=${maintenanceReclassFolder}`);
			}
			if (maintenanceReclassLimit !== "none") {
				tokens.push(`reclass_limit=${maintenanceReclassLimit}`);
			}
			if (maintenanceCalendarMode !== "all") {
				tokens.push(`calendar_mode=${maintenanceCalendarMode}`);
			}
			if (maintenanceCalendarDaysAhead !== "120") {
				tokens.push(`calendar_days_ahead=${maintenanceCalendarDaysAhead}`);
			}
			void runPrompt(`/maintenance ${tokens.join(" ")}`);
			return;
		}
		const names = MAINTENANCE_ACTIONS.filter((action) =>
			maintenanceActionIds.includes(action.id),
		).map((action) => action.name);
		void runPrompt(
			`Run maintenance actions in order: ${names.join(", ")}. Summarize outputs and fixes applied.`,
		);
	}, [
		maintenanceActionIds,
		maintenanceFlagIds,
		maintenanceNotionAction,
		maintenanceReclassFolder,
		maintenanceReclassLimit,
		maintenanceCalendarMode,
		maintenanceCalendarDaysAhead,
		runPrompt,
		shouldTrySlashCommand,
	]);

	const runCleanup = useCallback(() => {
		if (cleanupActionIds.length === 0) {
			new Notice("[Agent Client] Select at least one cleanup action.");
			return;
		}
		if (shouldTrySlashCommand("cleanup")) {
			const tokens = [`actions=${cleanupActionIds.join(",")}`];
			if (cleanupNotionAction !== "all") {
				tokens.push(`notion_action=${cleanupNotionAction}`);
			}
			if (cleanupReclassFolder !== "all") {
				tokens.push(`reclass_folder=${cleanupReclassFolder}`);
			}
			if (cleanupReclassLimit !== "none") {
				tokens.push(`reclass_limit=${cleanupReclassLimit}`);
			}
			void runPrompt(`/cleanup ${tokens.join(" ")}`);
			return;
		}
		const names = CLEANUP_ACTIONS.filter((action) =>
			cleanupActionIds.includes(action.id),
		).map((action) => action.name);
		void runPrompt(
			`Run cleanup actions in order: ${names.join(", ")}. Summarize destructive vs non-destructive effects.`,
		);
	}, [
		cleanupActionIds,
		cleanupNotionAction,
		cleanupReclassFolder,
		cleanupReclassLimit,
		runPrompt,
		shouldTrySlashCommand,
	]);

	const runDiagnostics = useCallback(() => {
		if (diagnosticModeIds.length === 0) {
			new Notice("[Agent Client] Select at least one diagnostics mode.");
			return;
		}
		if (shouldTrySlashCommand("diagnostics")) {
			const tokens = [`modes=${diagnosticModeIds.join(",")}`];
			if (diagnosticFlagIds.length > 0) {
				tokens.push(`flags=${diagnosticFlagIds.join(",")}`);
			}
			if (diagnosticManualAuthTimeout !== "300") {
				tokens.push(`manual_auth_timeout=${diagnosticManualAuthTimeout}`);
			}
			void runPrompt(`/diagnostics ${tokens.join(" ")}`);
			return;
		}
		const names = DIAGNOSTIC_MODES.filter((mode) =>
			diagnosticModeIds.includes(mode.id),
		).map((mode) => mode.name);
		void runPrompt(
			`Run diagnostics in order: ${names.join(", ")}. Return concise pass/fail summary.`,
		);
	}, [
		diagnosticModeIds,
		diagnosticFlagIds,
		diagnosticManualAuthTimeout,
		runPrompt,
		shouldTrySlashCommand,
	]);

	const runTriage = useCallback(() => {
		if (selectedTriageActions.length === 0) {
			new Notice("[Agent Client] Select at least one triage action.");
			return;
		}
		const names = selectedTriageActions.map((action) => action.name).join(", ");
		const depthText =
			triageDepth === "detailed"
				? "Provide detailed grouped findings and ordered next steps."
				: "Keep output concise with highest-priority actions.";
		void runPrompt(
			`Run triage workflows: ${names}. ${depthText} Focus on Obsidian, Notion, and Zotero organization.`,
		);
	}, [runPrompt, selectedTriageActions, triageDepth]);

	const triageSelectedText = useMemo(() => {
		if (selectedTriageActions.length === 0) {
			return "Selected: none";
		}
		return `Selected: ${selectedTriageActions
			.map((action) => action.name)
			.join(", ")}`;
	}, [selectedTriageActions]);

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
				<>
					<div className="agent-client-operations-view-picker">
						<select
							className="agent-client-operations-select"
							value={activeView}
							onChange={(event) =>
								setActiveView(event.target.value as OperationViewId)
							}
							disabled={isBusy}
						>
							{OPERATION_VIEWS.map((view) => (
								<option key={view.id} value={view.id}>
									Section: {view.label}
								</option>
							))}
						</select>
					</div>
					<div className="agent-client-operations-grid agent-client-operations-grid-compact">
					{activeView === "sync" && (
					<section className="agent-client-operations-card">
						<h5 className="agent-client-operations-card-title">Sync</h5>
						<MultiSelectDropdown
							title="Modes"
							options={SYNC_MODES}
							selectedIds={syncModeIds}
							disabled={isBusy}
							onToggle={(id) => toggleStringId(id, setSyncModeIds)}
						/>
						<MultiSelectDropdown
							title="Flags"
							options={SYNC_FLAGS}
							selectedIds={syncFlagIds}
							disabled={isBusy}
							onToggle={(id) => toggleStringId(id, setSyncFlagIds)}
						/>
						<select
							className="agent-client-operations-select"
							value={syncManualAuthTimeout}
							onChange={(event) =>
								setSyncManualAuthTimeout(event.target.value)
							}
							disabled={isBusy}
						>
							<option value="120">Manual Auth Timeout: 120s</option>
							<option value="300">Manual Auth Timeout: 300s</option>
							<option value="600">Manual Auth Timeout: 600s</option>
							<option value="900">Manual Auth Timeout: 900s</option>
						</select>
						<select
							className="agent-client-operations-select"
							value={syncInventoryCacheTtl}
							onChange={(event) =>
								setSyncInventoryCacheTtl(event.target.value)
							}
							disabled={isBusy}
						>
							<option value="600">Inventory Cache TTL: 600s</option>
							<option value="1800">Inventory Cache TTL: 1800s</option>
							<option value="3600">Inventory Cache TTL: 3600s</option>
						</select>
						<select
							className="agent-client-operations-select"
							value={syncMaxParallelCourses}
							onChange={(event) =>
								setSyncMaxParallelCourses(event.target.value)
							}
							disabled={isBusy}
						>
							<option value="1">Max Parallel Courses: 1</option>
							<option value="2">Max Parallel Courses: 2</option>
							<option value="4">Max Parallel Courses: 4</option>
							<option value="6">Max Parallel Courses: 6</option>
							<option value="8">Max Parallel Courses: 8</option>
						</select>
						<select
							className="agent-client-operations-select"
							value={syncMaxParallelTasks}
							onChange={(event) =>
								setSyncMaxParallelTasks(event.target.value)
							}
							disabled={isBusy}
						>
							<option value="2">Max Parallel Tasks: 2</option>
							<option value="4">Max Parallel Tasks: 4</option>
							<option value="8">Max Parallel Tasks: 8</option>
							<option value="12">Max Parallel Tasks: 12</option>
							<option value="16">Max Parallel Tasks: 16</option>
						</select>
						<select
							className="agent-client-operations-select"
							value={syncCalendarMode}
							onChange={(event) => setSyncCalendarMode(event.target.value)}
							disabled={isBusy}
						>
							<option value="all">Calendar Mode: all</option>
							<option value="classes">Calendar Mode: classes</option>
							<option value="assignments">
								Calendar Mode: assignments
							</option>
						</select>
						<select
							className="agent-client-operations-select"
							value={syncCalendarDaysAhead}
							onChange={(event) =>
								setSyncCalendarDaysAhead(event.target.value)
							}
							disabled={isBusy}
						>
							<option value="30">Calendar Days Ahead: 30</option>
							<option value="60">Calendar Days Ahead: 60</option>
							<option value="120">Calendar Days Ahead: 120</option>
							<option value="180">Calendar Days Ahead: 180</option>
						</select>
						<button
							type="button"
							className="agent-client-operations-action-button"
							onClick={runSync}
							disabled={isBusy}
						>
							Run Sync
						</button>
					</section>
					)}

					{activeView === "focus" && (
					<section className="agent-client-operations-card">
						<h5 className="agent-client-operations-card-title">Focus</h5>
						<MultiSelectDropdown
							title="Actions"
							options={FOCUS_ACTIONS}
							selectedIds={focusActionIds}
							disabled={isBusy}
							onToggle={(id) => toggleFocusAction(id as FocusActionId)}
						/>
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
						<button
							type="button"
							className="agent-client-operations-action-button"
							onClick={runFocus}
							disabled={isBusy}
						>
							Run Focus
						</button>
					</section>
					)}

					{activeView === "maintenance" && (
					<section className="agent-client-operations-card">
						<h5 className="agent-client-operations-card-title">
							Maintenance
						</h5>
						<MultiSelectDropdown
							title="Actions"
							options={MAINTENANCE_ACTIONS}
							selectedIds={maintenanceActionIds}
							disabled={isBusy}
							onToggle={(id) =>
								toggleStringId(id, setMaintenanceActionIds)
							}
						/>
						<MultiSelectDropdown
							title="Flags"
							options={MAINTENANCE_FLAGS}
							selectedIds={maintenanceFlagIds}
							disabled={isBusy}
							onToggle={(id) =>
								toggleStringId(id, setMaintenanceFlagIds)
							}
						/>
						<select
							className="agent-client-operations-select"
							value={maintenanceNotionAction}
							onChange={(event) =>
								setMaintenanceNotionAction(event.target.value)
							}
							disabled={isBusy}
						>
							<option value="all">Notion Action: all</option>
							<option value="duplicates">Notion Action: duplicates</option>
							<option value="cleanup">Notion Action: cleanup</option>
							<option value="backfill">Notion Action: backfill</option>
							<option value="archive">Notion Action: archive</option>
						</select>
						<select
							className="agent-client-operations-select"
							value={maintenanceReclassFolder}
							onChange={(event) =>
								setMaintenanceReclassFolder(event.target.value)
							}
							disabled={isBusy}
						>
							<option value="all">Reclass Folder: all</option>
							<option value="assignments">Reclass Folder: assignments</option>
							<option value="lectures">Reclass Folder: lectures</option>
							<option value="resources">Reclass Folder: resources</option>
						</select>
						<select
							className="agent-client-operations-select"
							value={maintenanceReclassLimit}
							onChange={(event) =>
								setMaintenanceReclassLimit(event.target.value)
							}
							disabled={isBusy}
						>
							<option value="none">Reclass Limit: none</option>
							<option value="25">Reclass Limit: 25</option>
							<option value="50">Reclass Limit: 50</option>
							<option value="100">Reclass Limit: 100</option>
						</select>
						<select
							className="agent-client-operations-select"
							value={maintenanceCalendarMode}
							onChange={(event) =>
								setMaintenanceCalendarMode(event.target.value)
							}
							disabled={isBusy}
						>
							<option value="all">Calendar Mode: all</option>
							<option value="classes">Calendar Mode: classes</option>
							<option value="assignments">
								Calendar Mode: assignments
							</option>
						</select>
						<select
							className="agent-client-operations-select"
							value={maintenanceCalendarDaysAhead}
							onChange={(event) =>
								setMaintenanceCalendarDaysAhead(event.target.value)
							}
							disabled={isBusy}
						>
							<option value="30">Calendar Days Ahead: 30</option>
							<option value="60">Calendar Days Ahead: 60</option>
							<option value="120">Calendar Days Ahead: 120</option>
							<option value="180">Calendar Days Ahead: 180</option>
						</select>
						<button
							type="button"
							className="agent-client-operations-action-button"
							onClick={runMaintenance}
							disabled={isBusy}
						>
							Run Maintenance
						</button>
					</section>
					)}

					{activeView === "cleanup" && (
					<section className="agent-client-operations-card">
						<h5 className="agent-client-operations-card-title">Cleanup</h5>
						<MultiSelectDropdown
							title="Actions"
							options={CLEANUP_ACTIONS}
							selectedIds={cleanupActionIds}
							disabled={isBusy}
							onToggle={(id) => toggleStringId(id, setCleanupActionIds)}
						/>
						<select
							className="agent-client-operations-select"
							value={cleanupNotionAction}
							onChange={(event) =>
								setCleanupNotionAction(event.target.value)
							}
							disabled={isBusy}
						>
							<option value="all">Notion Action: all</option>
							<option value="duplicates">Notion Action: duplicates</option>
							<option value="cleanup">Notion Action: cleanup</option>
							<option value="backfill">Notion Action: backfill</option>
							<option value="archive">Notion Action: archive</option>
						</select>
						<select
							className="agent-client-operations-select"
							value={cleanupReclassFolder}
							onChange={(event) =>
								setCleanupReclassFolder(event.target.value)
							}
							disabled={isBusy}
						>
							<option value="all">Reclass Folder: all</option>
							<option value="assignments">Reclass Folder: assignments</option>
							<option value="lectures">Reclass Folder: lectures</option>
							<option value="resources">Reclass Folder: resources</option>
						</select>
						<select
							className="agent-client-operations-select"
							value={cleanupReclassLimit}
							onChange={(event) =>
								setCleanupReclassLimit(event.target.value)
							}
							disabled={isBusy}
						>
							<option value="none">Reclass Limit: none</option>
							<option value="25">Reclass Limit: 25</option>
							<option value="50">Reclass Limit: 50</option>
							<option value="100">Reclass Limit: 100</option>
						</select>
						<button
							type="button"
							className="agent-client-operations-action-button"
							onClick={runCleanup}
							disabled={isBusy}
						>
							Run Cleanup
						</button>
					</section>
					)}

					{activeView === "diagnostics" && (
					<section className="agent-client-operations-card">
						<h5 className="agent-client-operations-card-title">
							Diagnostics
						</h5>
						<MultiSelectDropdown
							title="Modes"
							options={DIAGNOSTIC_MODES}
							selectedIds={diagnosticModeIds}
							disabled={isBusy}
							onToggle={(id) =>
								toggleDiagnosticMode(id as DiagnosticModeId)
							}
						/>
						<MultiSelectDropdown
							title="Flags"
							options={DIAGNOSTIC_FLAGS}
							selectedIds={diagnosticFlagIds}
							disabled={isBusy}
							onToggle={(id) =>
								toggleStringId(id, setDiagnosticFlagIds)
							}
						/>
						<select
							className="agent-client-operations-select"
							value={diagnosticManualAuthTimeout}
							onChange={(event) =>
								setDiagnosticManualAuthTimeout(event.target.value)
							}
							disabled={isBusy}
						>
							<option value="120">Manual Auth Timeout: 120s</option>
							<option value="300">Manual Auth Timeout: 300s</option>
							<option value="600">Manual Auth Timeout: 600s</option>
							<option value="900">Manual Auth Timeout: 900s</option>
						</select>
						<button
							type="button"
							className="agent-client-operations-action-button"
							onClick={runDiagnostics}
							disabled={isBusy}
						>
							Run Diagnostics
						</button>
					</section>
					)}

					{activeView === "triage" && (
					<section className="agent-client-operations-card">
						<h5 className="agent-client-operations-card-title">Triage</h5>
						<MultiSelectDropdown
							title="Actions"
							options={TRIAGE_ACTIONS}
							selectedIds={triageActionIds}
							disabled={isBusy}
							onToggle={(id) =>
								toggleTriageAction(id as TriageActionId)
							}
						/>
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
							<option value="concise">Depth: Concise</option>
							<option value="detailed">Depth: Detailed</option>
						</select>
						<p className="agent-client-operations-card-desc">
							{triageSelectedText}
						</p>
						<button
							type="button"
							className="agent-client-operations-action-button"
							onClick={runTriage}
							disabled={isBusy}
						>
							Run Triage
						</button>
					</section>
					)}
				</div>
				</>
			)}
		</div>
	);
}
