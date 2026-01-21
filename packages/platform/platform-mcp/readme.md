# @tsed/platform-mcp

> Ts.ED integration for the Model Context Protocol (MCP).

`@tsed/platform-mcp` lets any Ts.ED HTTP adapter (Express, Fastify, Koa) expose an MCP endpoint and register tools, resources, and prompts through familiar decorators or functional helpers. It ships with:

- A `PlatformMcpModule` that mounts a configurable `/mcp` endpoint on top of `@tsed/platform-http`.
- Functional helpers (`defineTool`, `defineResource`, `definePrompt`) to register MCP handlers via DI tokens.
- Decorators (`@Tool`, `@Prompt`, `@Resource`) for declarative registration inside services/controllers.
- Shared utilities (`MCP_SERVER`, transport helpers) that wire `@modelcontextprotocol/sdk` into Ts.ED's dependency injection system.

## Installation

```bash
yarn add @tsed/platform-mcp
```

## Documentation

Full usage docs live under `docs/docs/mcp.md` inside the Ts.ED repository.
