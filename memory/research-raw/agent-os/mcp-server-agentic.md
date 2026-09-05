# Binance MCP Server

<!-- SYNCED FROM be/agentic-tools@d3e0564fcb973e8686974a42b8e063d4fc25d053 docs/binance-mcp-server.md on 2026-08-17 -->
<!-- This MCP server is operated by Binance's AI team; mirrored here as our discovery entry point. -->

<!-- To check for drift: git log d3e0564fcb973e8686974a42b8e063d4fc25d053..HEAD -- docs/binance-mcp-server.md in be/agentic-tools -->

<!-- Layout (hero/fact tiles/callout/scenario cards/tabs/step cards) is a local redesign on top of the -->
<!-- synced text above — if you resync content, re-apply these components rather than pasting plain markdown. -->

import { Callout } from "zudoku/ui/Callout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "zudoku/ui/Tabs";
import {
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Wallet,
  ShoppingCart,
  Repeat,
  Eye,
} from "lucide-react";

export const IconTile = ({ children, label }) => (
  <span
    className="inline-flex h-10 w-10 items-center justify-center rounded-lg border bg-muted"
    aria-label={label}
    title={label}
  >
    {children}
  </span>
);

export const FactTile = ({ icon: Icon, label, value }) => (
  <div className="not-prose flex items-center gap-3 rounded-xl border bg-card p-4">
    <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-muted/40">
      <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
    </div>
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium break-all">{value}</p>
    </div>
  </div>
);

export const ScenarioCard = ({ icon: Icon, title, description }) => (
  <div className="not-prose rounded-xl border bg-card p-4 transition-colors hover:border-primary/30 hover:bg-primary/5">
    <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl border bg-muted/40">
      <Icon className="h-5 w-5 text-muted-foreground" />
    </div>
    <h4 className="text-sm font-semibold">{title}</h4>
    <p className="mt-1 text-xs leading-5 text-muted-foreground">
      {description}
    </p>
  </div>
);

export const StepCard = ({ number, icon: Icon, title, quote, outcome }) => (
  <div className="not-prose rounded-xl border bg-card p-4">
    <div className="mb-3 flex items-center gap-2">
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
        {number}
      </span>
      <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
      <h4 className="text-sm font-semibold">{title}</h4>
    </div>
    <p className="text-sm italic text-muted-foreground">"{quote}"</p>
    <p className="mt-2 text-xs leading-5 text-muted-foreground">{outcome}</p>
  </div>
);

<div className="not-prose -mt-2 mb-6 rounded-2xl border bg-[radial-gradient(circle_at_top_right,rgba(240,185,11,0.08),transparent_50%)] p-6">
  <div className="flex items-center gap-3 mb-3">
    <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border bg-primary/10">
      <TrendingUp className="h-6 w-6 text-primary" />
    </div>
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
        Binance MCP Server
      </p>
    </div>
  </div>
  <p className="text-sm leading-6 text-muted-foreground">
    Connect your AI agent to Binance with a single URL. Your agent can read
    market data, check balances, trade Spot / Margin / Convert / USDⓈ-M / COIN-M
    Futures, and move funds between wallets inside a dedicated Agentic
    sub-account — no local install, no API keys on your device.
  </p>
</div>

<div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 not-prose">
  <FactTile
    icon={ShieldCheck}
    label="Withdrawal scope"
    value="Never available"
  />
  <FactTile
    icon={CheckCircle2}
    label="Every trade / transfer"
    value="Confirmed by you first"
  />
</div>

<Callout type="caution" title="Risks">
  You are responsible for the trades your AI agent places. AI can make mistakes,
  act on outdated or hallucinated information, or send incorrect parameters —
  always verify before execution. Trading derivatives and margin carries
  substantial risk. See [Disclosures](#disclosures) below.
</Callout>

## What's an MCP?

Model Context Protocol (MCP) is an open standard that lets AI agents connect to external apps and
services. Instead of just answering questions, an AI with MCP access can take actions on your
behalf.

## What your agent can do

<div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 not-prose">
  <ScenarioCard
    icon={TrendingUp}
    title="Check the market"
    description={
      '"What’s the current BTCUSDT price and 24h change?" — tickers, order books, candlesticks, funding rates.'
    }
  />
  <ScenarioCard
    icon={Wallet}
    title="Check your balance"
    description={
      '"Show my Agentic account balance across all wallets." — plus a read-only view of your main account.'
    }
  />
  <ScenarioCard
    icon={ShoppingCart}
    title="Trade"
    description={
      '"Buy $100 of BNB at market on spot." — Spot, Margin, Convert, USDⓈ-M Futures, and COIN-M Futures.'
    }
  />
  <ScenarioCard
    icon={Repeat}
    title="Move funds between wallets"
    description={
      '"Move 2,000 USDT from my Spot wallet to my USDⓈ-M wallet." — inside your Agentic sub-account only.'
    }
  />
</div>

## What your agent can access

When you connect, you choose which scopes to grant. Start with the least you need:

- **Market data** (public, no auth) — tickers, order books, candles, funding
- **Account** — Agentic sub-account balance, positions, bills; optional read-only view of your main
  account
- **Trade** — spot, margin, convert, futures (only what you grant and your account is authorized
  for)
- **Transfer** — move funds between wallets inside the same Agentic sub-account only

There is **no withdrawal scope**. Your agent can never move funds out of the sub-account to an
external address.

## Before you start

1. Log in to [Binance.com](https://www.binance.com) in your desktop browser — this feature is built
   for desktop, not mobile.
2. Make sure the AI client you plan to use is installed and open: Claude Code, Claude Desktop, Codex
   CLI, ChatGPT on the web, ChatGPT/Codex Desktop, VS Code, or Grok Bot.

<Callout type="caution" title="Don't paste the endpoint into a chat">
  Never paste the MCP endpoint into an AI chat and ask it to install the server,
  and never open the endpoint directly in your browser. Follow the setup steps
  for your client in the tabs below instead.
</Callout>

## Connect your AI agent

<Tabs defaultValue="claude-code" className="not-prose">
  <TabsList className="h-auto flex-wrap">
    <TabsTrigger value="claude-code">Claude Code</TabsTrigger>
    <TabsTrigger value="claude-desktop">Claude Desktop</TabsTrigger>
    <TabsTrigger value="codex-cli">Codex CLI</TabsTrigger>
    <TabsTrigger value="chatgpt-web">ChatGPT on the web</TabsTrigger>
    <TabsTrigger value="chatgpt-desktop">ChatGPT/Codex Desktop</TabsTrigger>
    <TabsTrigger value="vscode">VS Code</TabsTrigger>
    <TabsTrigger value="grok">Grok Bot</TabsTrigger>
    <TabsTrigger value="other">Other</TabsTrigger>
  </TabsList>

  <TabsContent value="claude-code" className="mt-4 rounded-lg border bg-card p-4">

**Step 1:** Open Terminal on macOS/Linux or PowerShell on Windows.

<br />

![macOS/Linux Terminal](/img/agent-native-mcp-server/install-macos-terminal.jpg)

<br />

![Windows PowerShell](/img/agent-native-mcp-server/install-windows-powershell.jpg)

<br />

**Step 2:** Run the following command to add the Binance MCP server:

```bash
claude mcp add binance-mcp-server --transport http https://agent.binance.com/mcp/agentic
```

<br />

![Claude Code terminal after adding the server](/img/agent-native-mcp-server/claude-code-mcp-add-command.png)

<br />

**Step 3:** Open the `/mcp` menu and select **binance-mcp-server**.

<br />

![Claude Code /mcp menu showing binance-mcp-server](/img/agent-native-mcp-server/claude-code-mcp-menu.png)

<br />

**Step 4:** Authenticate to authorize the connection.

<br />

![Binance Agentic Account Access consent screen](/img/agent-native-mcp-server/oauth-consent-claude-code.png)

  </TabsContent>

  <TabsContent value="claude-desktop" className="mt-4 rounded-lg border bg-card p-4">

**Step 1:** Open **Settings** and go to **Connectors**.

<br />

![Claude Desktop Connectors settings](/img/agent-native-mcp-server/claude-desktop-connectors.png)

<br />

**Step 2:** Click **Add custom connector**, then paste the URL below into the connector URL field:

```text
https://agent.binance.com/mcp/agentic
```

<br />

![Add custom connector dialog with the Binance MCP Server URL](/img/agent-native-mcp-server/claude-desktop-add-connector.png)

<br />

**Step 3:** Authenticate to authorize the connection.

**Step 4:** Return to Claude Desktop and confirm that **binance-mcp-server** shows as connected.

  </TabsContent>

  <TabsContent value="codex-cli" className="mt-4 rounded-lg border bg-card p-4">

**Step 1:** Open Terminal on macOS/Linux or PowerShell on Windows.

<br />

![macOS/Linux Terminal](/img/agent-native-mcp-server/install-macos-terminal.jpg)

<br />

![Windows PowerShell](/img/agent-native-mcp-server/install-windows-powershell.jpg)

<br />

**Step 2:** Run the following command to add the Binance MCP server:

```bash
codex mcp add binance-mcp-server --url https://agent.binance.com/mcp/agentic --oauth-client-id codex
```

<br />

![Codex CLI terminal after adding the server](/img/agent-native-mcp-server/codex-cli-mcp-add-command.png)

<br />

**Step 3:** Authenticate to authorize the connection.

<br />

![Binance Agentic Account Access consent screen for Codex](/img/agent-native-mcp-server/oauth-consent-codex.png)

  </TabsContent>

  <TabsContent value="chatgpt-web" className="mt-4 rounded-lg border bg-card p-4">

**Step 1:** Enable **Developer Mode** under **Settings → Security and login**.

<br />

![ChatGPT Developer Mode setting](/img/agent-native-mcp-server/chatgpt-web-developer-mode.png)

<br />

**Step 2:** Open **Plugins** and click the **"+"** button (**New Plugin**).

<br />

![ChatGPT Plugins page](/img/agent-native-mcp-server/chatgpt-web-plugins.png)

<br />

**Step 3:** Enter a name for the plugin, paste the URL below into the plugin URL field, and then
click **Create**:

```text
https://agent.binance.com/mcp/agentic
```

<br />

![New Plugin dialog with the Binance MCP Server URL](/img/agent-native-mcp-server/chatgpt-web-new-plugin.png)

<br />

**Step 4:** Authenticate to authorize the connection.

<br />

![Binance Agentic Account Access consent screen for ChatGPT](/img/agent-native-mcp-server/oauth-consent-chatgpt-web.png)

<br />

**Step 5:** Return to ChatGPT and confirm that **binance-mcp-server** is available in Plugins.

  </TabsContent>

  <TabsContent value="chatgpt-desktop" className="mt-4 rounded-lg border bg-card p-4">

**Step 1:** Install Codex CLI, if you haven't already.

<br />

![macOS/Linux Terminal](/img/agent-native-mcp-server/install-macos-terminal.jpg)

<br />

![Windows PowerShell](/img/agent-native-mcp-server/install-windows-powershell.jpg)

<br />

For macOS/Linux:

```bash
curl -fsSL https://chatgpt.com/codex/install.sh | sh
```

For Windows:

```bash
powershell -ExecutionPolicy ByPass -c "irm https://chatgpt.com/codex/install.ps1 | iex"
```

**Step 2:** Open a new terminal and run the following command to add the Binance MCP server:

```bash
codex mcp add binance-mcp-server --url https://agent.binance.com/mcp/agentic --oauth-client-id codex
```

<br />

![Terminal running the codex mcp add command](/img/agent-native-mcp-server/chatgpt-codex-desktop-mcp-add-command.png)

<br />

**Step 3:** Authenticate to authorize the connection.

**Step 4:** Open the Codex/ChatGPT desktop app — your account should be connected.

  </TabsContent>

  <TabsContent value="vscode" className="mt-4 rounded-lg border bg-card p-4">

**Step 1:** Open the Chat panel and click the gear icon.

<br />

![VS Code Chat panel settings](/img/agent-native-mcp-server/vscode-chat-settings.png)

<br />

**Step 2:** Select **MCP Servers**, click **+**, then select **HTTP (HTTP or Server-Sent Events)**.

<br />

![Add MCP server dialog with the HTTP option selected](/img/agent-native-mcp-server/vscode-mcp-servers-add-http.png)

<br />

**Step 3:** Paste the URL below into the server URL field, enter `binance-mcp-server` as the server
name, and confirm:

```text
https://agent.binance.com/mcp/agentic
```

**Step 4:** Authenticate to authorize the connection.

<br />

![Binance Agentic Account Access consent screen for VS Code](/img/agent-native-mcp-server/oauth-consent-vscode.png)

  </TabsContent>

  <TabsContent value="grok" className="mt-4 rounded-lg border bg-card p-4">

**Step 1:** Open Grok Bot and enter the following prompt:

```
add binance-mcp-server to this bot, use below settings:
url = "https://agent.binance.com/mcp/agentic"
oauth_client_id = "grok"
```

**Step 2:** When prompted, authenticate to authorize the connection.

<br />

![Grok Bot chat confirming the Binance MCP server was added](/img/agent-native-mcp-server/grok-add-mcp-prompt.png)

  </TabsContent>

  <TabsContent value="other" className="mt-4 rounded-lg border bg-card p-4">

Our team will continue expanding support to other platforms. If you'd like us to support a specific
platform, please contact Binance Customer Support via
[Live Chat](https://www.binance.com/en/chat?sourceEntry=4).

  </TabsContent>
</Tabs>

## Check that the connection works

1. In your AI client's chat, enter: **"Use the Binance MCP Server to show the current BTCUSDT price
   and 24-hour change."**
2. Confirm the response shows the Binance MCP tool being used and returns live BTCUSDT market data.

## Open and fund an Agentic sub-account

Your agent trades inside a dedicated sub-account, isolated from your main account. If you don't have
one, the onboarding flow prompts you to create one when you first authorize.

The sub-account starts empty. Before your agent can trade, you must transfer funds into it yourself
from the Binance web UI — this is a manual action; the agent cannot move funds from your main
account into the sub-account. Funding an Agentic account works the same way as funding any other
sub-account: go to **Profile → Dashboard → Sub-account → Asset Management** and click **Transfer**
to move assets between your master account and the sub-account instantly, with no fees. Fund it via:

[https://www.binance.com/en/my/sub-account/asset-management/transfer?asset=BTC](https://www.binance.com/en/my/sub-account/asset-management/transfer?asset=BTC)

We recommend funding it with only what you're willing to let the agent trade.

Note: the **Transfer** scope only lets the agent move funds _between wallets inside_ the sub-account
(e.g. Spot → USDⓈ-M). It cannot pull funds from your main account — that first deposit is always the
manual step above.

## Example: your first session

Once connected and funded, you interact in plain language. The agent reads live data and asks you to
confirm before anything that moves funds or places an order.

<div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 not-prose">
  <StepCard
    number={1}
    icon={Eye}
    title="Check the market (read-only — runs immediately)"
    quote="What's BTCUSDT trading at, and how's it moved over 24h?"
    outcome="The agent pulls the live ticker and summarizes price and 24h change. No confirmation needed — reads never touch your balance."
  />
  <StepCard
    number={2}
    icon={Wallet}
    title="Check your balance"
    quote="What do I have in my Agentic account?"
    outcome="The agent reads your sub-account balances across Spot, Margin, and Futures wallets. If it's empty, fund it first (see above)."
  />
  <StepCard
    number={3}
    icon={ShoppingCart}
    title="Place a trade (write — the agent confirms first)"
    quote="Buy $100 of BNB at market on spot."
    outcome="The agent restates the order — symbol, side, type, amount — and waits for your yes before sending it. Always verify the details here; this is the step that spends real funds."
  />
  <StepCard
    number={4}
    icon={CheckCircle2}
    title="Verify the result"
    quote="Did that fill? What's my BNB balance now?"
    outcome="The agent checks the order status and your updated balance."
  />
</div>

This confirm-before-execute pattern applies to every non-read action — orders, cancels, and
transfers between your sub-account wallets.

## Manage your Agentic account

You can manage your Agentic account directly from [Binance.com](https://www.binance.com), without
your agent.

Go to **Profile → Dashboard → Sub-account → Account Management**. Here you'll see all your
sub-accounts, including your Agentic accounts. Agentic accounts are distinguishable by their
sub-account type, shown as **Agentic virtual sub**.

From here you can perform four actions:

1. **Transfer** — fund or withdraw funds from the sub-account.
2. **View permissions** — verify your Agentic account permissions. Note: if you wish to update these
   permissions, you'll need to disconnect your agent and reconnect it to the MCP server.
3. **Disconnect agents** — select one or more agents to disconnect. You can re-connect your agents
   to this account later if you wish. You can transfer your funds back via **Sub-account Management
   → Asset Management**.
4. **Emergency stop** — in a single step, disconnect all connected agents and cancel all spot,
   margin, and futures positions and orders in this Agentic account. You can re-connect your agents
   to this account again later if you wish. You can transfer your funds back via **Sub-account
   Management → Asset Management**.

## Troubleshooting

- **I opened the endpoint in my browser** — close the page and follow the connection steps for your
  AI client above instead.
- **I pasted the endpoint into the AI chat** — remove the connection the AI created, then repeat the
  exact setup steps in this guide.
- **The command isn't recognized** — confirm the required AI client or CLI is installed, reopen
  Terminal or PowerShell, and try again.
- **The server was added but can't be used** — reconnect it, authenticate, and repeat the connection
  check above.
- Make sure the endpoint is exactly `https://agent.binance.com/mcp/agentic`.
- **Market data works but account or trading actions don't** — reconnect and grant the **Account**
  or **Trade** scope you need.
- If a trade fails with an insufficient-balance error, the sub-account has no funds — transfer funds
  into it first (see "Open and fund an Agentic sub-account").
- If the authorization expired, disconnect and reconnect the Binance MCP Server.
- To revoke access: **Profile → Dashboard → Sub-account → Account Management → Disconnect agents**.

## Getting help

If you need help while integrating:

- Review the relevant documentation first
- Check available tools, examples, and sample applications
- Contact Binance Customer Support via [Live Chat](https://www.binance.com/en/chat?sourceEntry=4) if
  you need further assistance

## Disclosures

Disclaimer: The Binance MCP Server is a Binance AI Tool that facilitates AI-assisted trading and
does not constitute any advice. Binance is not responsible for losses resulting from agent-generated
decisions. You are solely responsible for supervising your agent's activity, configuring scopes, and
verifying actions. Use of AI Tools may be subject to additional
[Binance Product Terms](https://www.binance.com/en/about-legal/product-terms), where applicable. For
more information, see our [Terms of Use](https://www.binance.com/en/terms), and Risk Warning and
[AI Policy and Terms](https://www.binance.com/en/about-legal/AI-Policy).
