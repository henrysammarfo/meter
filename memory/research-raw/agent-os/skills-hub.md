# Binance Skills Hub

The Binance Skills Hub is an open marketplace of AI agent skills that give any LLM-powered agent
native access to Binance crypto capabilities — token search, on-chain trading, wallet tracking,
smart-money signals, and DeFi protocol interactions.

Skills are framework-agnostic and work with Claude Code, LangChain, CrewAI, OpenClaw, and custom
agent stacks.

For the full skill catalogue, installation options, authentication setup, and contribution
guidelines, see the [binance-skills-hub](https://github.com/binance/binance-skills-hub) repository
on GitHub.

## How it works

Each skill is a self-contained module that exposes a set of capabilities an AI agent can invoke
through natural language. Skills follow the
[Model Context Protocol (MCP)](https://modelcontextprotocol.io/) standard, so any MCP-compatible
agent can discover and call them without custom integration code.

Skills are split into two categories:

- **Read-only skills** — query market data, wallet balances, token info, trending tokens,
  smart-money activity, DeFi protocol stats, and trading signals
- **Read + Write skills** — execute on-chain operations such as token transfers, swaps, and limit
  orders via the Agentic Wallet

The hub is open source and community-extensible — anyone can contribute new skills by following the
repository's contribution guide.

## Supported environments

- Node.js 22+
- Any MCP-compatible AI agent (Claude Code, OpenClaw, custom clients)
- Python agents via LangChain / CrewAI adapters

## Getting started

Install skills from the hub:

```bash
npx skills add https://github.com/binance/binance-skills-hub
```

Refer to the repository README for authentication setup, available skills, and usage examples.

## Typical use cases

- Adding crypto market data and trading capabilities to any AI agent
- Building autonomous trading bots with natural-language interfaces
- Monitoring wallet balances and smart-money flows from an agent
- Integrating DeFi analytics into research or reporting workflows
- Prototyping agent-driven strategies without writing API integration code
