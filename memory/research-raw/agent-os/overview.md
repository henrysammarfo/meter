# Agent Native

import { Link } from "zudoku/components";
import { Card, CardHeader, CardTitle, CardDescription } from "zudoku/ui/Card";
import {
  Bot,
  FileText,
  Plug,
  ChevronRight,
  Code2,
  Lightbulb,
  Users,
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

export const Badge = ({ children }) => (
  <span className="inline-flex items-center rounded-md border bg-muted px-2 py-1 text-xs font-semibold text-foreground">
    {children}
  </span>
);

export const CardLink = ({ to, title, description, children, badge }) => (
  <div className="not-prose group relative rounded-xl">
    <Link
      to={to}
      className="absolute inset-0 z-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      aria-label={title}
    />
    <Card className="pointer-events-none flex h-full flex-col transition-all group-hover:-translate-y-0.5 group-hover:shadow-md">
      <CardHeader className="flex-1">
        <div className="flex items-center gap-2">
          {children}
          {badge && <Badge>{badge}</Badge>}
        </div>
        <CardTitle className="mt-3 text-base">{title}</CardTitle>
        <CardDescription className="mt-1">{description}</CardDescription>
        <span className="pointer-events-none mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary">
          Learn more <ChevronRight className="h-3 w-3" />
        </span>
      </CardHeader>
    </Card>
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

<div className="not-prose -mt-2 mb-8 rounded-2xl border bg-[radial-gradient(circle_at_top_right,rgba(240,185,11,0.08),transparent_50%)] p-6">
  <div className="flex items-center gap-3 mb-3">
    <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border bg-primary/10">
      <Bot className="h-6 w-6 text-primary" />
    </div>
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
        Agent Native
      </p>
    </div>
  </div>
  <p className="text-sm leading-6 text-muted-foreground">
    Lightweight, AI-friendly access to Binance API documentation. Discover and
    load full documentation programmatically — built for AI tools, coding
    assistants, and autonomous agents.
  </p>
</div>

## Core Components

<div className="mt-1 text-sm text-muted-foreground">
  Choose the integration method that fits your use case.
</div>

<div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 not-prose">
  <CardLink
    to="/agent-native/mcp-server"
    title="MCP Server"
    description="Connect AI agents and coding assistants over the Model Context Protocol — for trading or for documentation lookup."
    badge="MCP"
  >
    <IconTile label="MCP Server">
      <Plug className="h-5 w-5" aria-hidden />
    </IconTile>
  </CardLink>
  <CardLink
    to="/agent-native/llms-txt"
    title="llms.txt"
    description="A lightweight discovery protocol. AI tools fetch static files to understand what documentation is available and load full content."
    badge="Static files"
  >
    <IconTile label="llms.txt">
      <FileText className="h-5 w-5" aria-hidden />
    </IconTile>
  </CardLink>
</div>

---

## Quick Start

### Fetch documentation with llms.txt

```bash
# Summary — document titles, descriptions, and links
curl -s https://developers.binance.com/en/docs/llms.txt

# Full content — complete documentation in a single file
curl -s https://developers.binance.com/en/docs/llms-full.txt
```

---

## Who Is This For?

<div className="mt-1 text-sm text-muted-foreground">
  Whether you're building with AI IDEs or integrating documentation into agent
  pipelines, llms.txt fits a wide range of workflows.
</div>

<div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 not-prose">
  <ScenarioCard
    icon={Code2}
    title="Agent Framework Developers"
    description="Building with LangChain, CrewAI, or AutoGen? Feed llms.txt into your agent's context to ground responses in up-to-date Binance API documentation."
  />
  <ScenarioCard
    icon={Lightbulb}
    title="LLM Application Builders"
    description="Use llms.txt for context injection. Drop full documentation into any LLM-powered application without scraping or chunking pages yourself."
  />
  <ScenarioCard
    icon={Users}
    title="Prompt Engineers"
    description="Use llms.txt to feed complete Binance API documentation into any LLM. Perfect for building prompts with up-to-date API context."
  />
</div>
