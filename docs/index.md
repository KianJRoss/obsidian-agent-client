---
layout: home

hero:
  name: "Agent Client"
  text: "AI Agents in Obsidian"
  tagline: Chat with custom ACP agents â€” right from your vault
  actions:
    - theme: brand
      text: Get Started
      link: /getting-started/
    - theme: alt
      text: View on GitHub
      link: https://github.com/RAIT-09/obsidian-agent-client

features:
  - icon: bot
    title: Direct Agent Integration
    details: Chat with AI coding agents in a dedicated right-side panel
  - icon: note
    title: Note Mentions
    details: Mention any note with @notename to include its content in your prompt
  - icon: bolt
    title: Slash Commands
    details: Use / commands to quickly trigger agent actions
  - icon: switch
    title: Multi-Agent Support
    details: Switch between custom ACP agents
  - icon: sliders
    title: Mode & Model Selection
    details: Change AI models and agent modes directly from the chat
  - icon: terminal
    title: Terminal Integration
    details: Let your agent execute commands and return results in chat
---

<div style="max-width: 800px; margin: 2rem auto;">
  <video controls autoplay loop muted playsinline style="width: 100%; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
    <source src="/demo.mp4" type="video/mp4">
  </video>
</div>

## What is Agent Client?

Agent Client is an Obsidian plugin that brings AI coding agents directly into your vault. Built on the [Agent Client Protocol (ACP)](https://github.com/agentclientprotocol/agent-client-protocol), it enables seamless communication with various AI agents.

### Supported Agents

| Agent | Provider | Integration |
|-------|----------|-------------|
| **Custom** | Various | [Any ACP-compatible agent](https://agentclientprotocol.com/overview/agents) (e.g., OpenCode, Qwen Code, Kiro) |

### Key Features

- **Note Mentions**: Reference your Obsidian notes in conversations with `@notename`
- **File Editing**: Let agents read and modify files with permission controls
- **Chat Export**: Save conversations for future reference
- **Terminal Integration**: Agents can execute shell commands and show results inline

Ready to get started? Check out the [Installation Guide](/getting-started/).


