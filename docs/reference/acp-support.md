# ACP Protocol Support

This page documents which Agent Client Protocol (ACP) features are supported by this plugin.

## What is ACP?

The [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) is an open standard for communication between AI agents and client applications. It defines how clients send prompts, receive responses, handle permissions, and manage sessions.

Agent Client implements ACP as a **client**, communicating with ACP-compatible custom ACP backends.

## Methods

### Client â†’ Agent

Methods the plugin can call on agents.

| Method | Status | Notes |
|--------|--------|-------|
| `initialize` | âœ… Supported | |
| `authenticate` | âœ… Supported | |
| `session/new` | âœ… Supported | |
| `session/prompt` | âœ… Supported | |
| `session/cancel` | âœ… Supported | |
| `session/set_mode` | âœ… Supported | |
| `session/load` | âœ… Supported | |
| `session/set_model` | âœ… Supported | Unstable API |
| `session/list` | âœ… Supported | Unstable API |
| `session/resume` | âœ… Supported | Unstable API |
| `session/fork` | âœ… Supported | Unstable API |

::: tip
Methods marked "Unstable API" may change in future ACP versions. They are prefixed with `unstable_` in the SDK.
:::

### Agent â†’ Client (Notifications)

Session updates the plugin can receive from agents via `session/update`.

| Update Type | Status | Notes |
|-------------|--------|-------|
| `agent_message_chunk` | âœ… Supported | Text only |
| `agent_thought_chunk` | âœ… Supported | Text only |
| `user_message_chunk` | âœ… Supported | Text only; used for session history replay |
| `tool_call` | âœ… Supported | |
| `tool_call_update` | âœ… Supported | |
| `plan` | âœ… Supported | |
| `available_commands_update` | âœ… Supported | |
| `current_mode_update` | âœ… Supported | |

### Agent â†’ Client (Requests)

Requests agents can make to the plugin.

| Method | Status | Notes |
|--------|--------|-------|
| `session/request_permission` | âœ… Supported | |
| `terminal/create` | âœ… Supported | |
| `terminal/output` | âœ… Supported | |
| `terminal/wait_for_exit` | âœ… Supported | |
| `terminal/kill` | âœ… Supported | |
| `terminal/release` | âœ… Supported | |
| `fs/read_text_file` | â€” | Agents use their own Read tools |
| `fs/write_text_file` | â€” | Agents use their own Write tools |

## Content Types

### Prompt Content (Client â†’ Agent)

Content types the plugin can send in `session/prompt`.

| Type | Status | Notes |
|------|--------|-------|
| `text` | âœ… Supported | |
| `image` | âœ… Supported | Requires agent support |
| `audio` | âŒ Not supported | |
| `resource_link` | âŒ Not supported | |
| `resource` | âœ… Supported | Embedded context; requires agent support |

### Tool Call Content (Agent â†’ Client)

Content types the plugin can display in tool calls.

| Type | Status | Notes |
|------|--------|-------|
| `diff` | âœ… Supported | |
| `terminal` | âœ… Supported | |
| `content` | âŒ Not supported | |

## Client Capabilities

Capabilities advertised to agents during initialization.

| Capability | Value |
|------------|-------|
| `fs.readTextFile` | `false` |
| `fs.writeTextFile` | `false` |
| `terminal` | `true` |

::: info
The plugin does not implement filesystem operations (`fs/read_text_file`, `fs/write_text_file`). Agents handle file operations through their own tools.
:::

## See Also

- [Agent Client Protocol Specification](https://agentclientprotocol.com/)
- [ACP Schema Reference](https://agentclientprotocol.com/protocol/schema)


