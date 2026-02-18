import * as React from "react";
import { HeaderButton } from "./HeaderButton";

export interface HeaderQuickAction {
	id: string;
	label: string;
	prompt: string;
	tooltip?: string;
}

/**
 * Props for ChatHeader component
 */
export interface ChatHeaderProps {
	/** Display name of the active agent */
	agentLabel: string;
	/** Whether a plugin update is available */
	isUpdateAvailable: boolean;
	/** Whether session history is supported (show History button) */
	hasHistoryCapability?: boolean;
	/** Callback to create a new chat session */
	onNewChat: () => void;
	/** Callback to export the chat */
	onExportChat: () => void;
	/** Callback to toggle header menu */
	onToggleMenu: () => void;
	/** Callback to open session history */
	onOpenHistory?: () => void;
	/** Quick action buttons shown under the title */
	quickActions?: HeaderQuickAction[];
	/** Callback for quick action button click */
	onRunQuickAction?: (action: HeaderQuickAction) => void;
	/** Disable quick action buttons while session is busy/restoring */
	disableQuickActions?: boolean;
	/** Reference to the menu button for menu positioning */
	menuButtonRef: React.RefObject<HTMLButtonElement | null>;
}

/**
 * Header component for the chat view.
 *
 * Displays:
 * - Agent name
 * - Update notification (if available)
 * - Action buttons (new chat, history, export, settings)
 */
export function ChatHeader({
	agentLabel,
	isUpdateAvailable,
	hasHistoryCapability = false,
	onNewChat,
	onExportChat,
	onToggleMenu,
	onOpenHistory,
	quickActions = [],
	onRunQuickAction,
	disableQuickActions = false,
	menuButtonRef,
}: ChatHeaderProps) {
	return (
		<div className="agent-client-chat-view-header">
			<div className="agent-client-chat-view-header-main">
				<h3 className="agent-client-chat-view-header-title">
					{agentLabel}
				</h3>
				{quickActions.length > 0 && onRunQuickAction && (
					<div className="agent-client-chat-view-header-quick-actions">
						{quickActions.map((action) => (
							<button
								key={action.id}
								type="button"
								className="agent-client-header-quick-action-button"
								title={action.tooltip || action.prompt}
								onClick={() => onRunQuickAction(action)}
								disabled={disableQuickActions}
							>
								{action.label}
							</button>
						))}
					</div>
				)}
			</div>
			{isUpdateAvailable && (
				<p className="agent-client-chat-view-header-update">
					Plugin update available!
				</p>
			)}
			<div className="agent-client-chat-view-header-actions">
				<HeaderButton
					iconName="plus"
					tooltip="New chat"
					onClick={onNewChat}
				/>
				{onOpenHistory && (
					<HeaderButton
						iconName="history"
						tooltip="Session history"
						onClick={onOpenHistory}
					/>
				)}
				<HeaderButton
					iconName="save"
					tooltip="Export chat to Markdown"
					onClick={onExportChat}
				/>
				<HeaderButton
					ref={menuButtonRef}
					iconName="more-vertical"
					tooltip="More"
					onClick={onToggleMenu}
				/>
			</div>
		</div>
	);
}
