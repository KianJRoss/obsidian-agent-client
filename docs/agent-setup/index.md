# Agent Setup Overview

Agent Client supports multiple AI agents through the [Agent Client Protocol (ACP)](https://github.com/zed-industries/agent-client-protocol). This section covers how to set up each supported agent.

## Supported Agents

| Agent | Provider | Package |
|-------|----------|---------|
| [Custom Agents](./custom-agents) | Various | Any ACP-compatible agent |

## Common Setup Steps

Custom ACP agents generally follow this setup pattern:

1. **Install or prepare your custom ACP backend**
2. **Find the installation path** using `which` (macOS/Linux) or `where.exe` (Windows)
3. **Configure the path** in Settings â†’ Agent Client
4. **Set up environment variables** (e.g., GEMINI_API_KEY, OPENROUTER_API_KEY)

## WSL Mode (Windows)

For Windows users, we recommend using **WSL Mode** for better compatibility:

1. Install [WSL](https://docs.microsoft.com/en-us/windows/wsl/install)
2. Install Node.js and agents inside WSL
3. Enable **WSL Mode** in Settings â†’ Agent Client
4. Use Linux-style paths (e.g., `/usr/local/bin/node`)

## Switching Agents

Once you have multiple agents configured, you can switch between them using the **â‹®** menu in the chat header. To change the default agent for new chat views, go to **Settings â†’ Agent Client â†’ Default agent**.


