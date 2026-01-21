---
head:
  - - meta
    - name: description
      content: Learn how to expose Model Context Protocol (MCP) endpoints with Ts.ED using @tsed/platform-mcp, including functional helpers, decorators, and CLI references.
  - - meta
    - name: keywords
      content: ts.ed mcp model context protocol ai llm tools prompts resources express fastify koa platform platform-mcp cli
---

# Model Context Protocol (MCP) integration

`@tsed/platform-mcp` brings [Model Context Protocol](https://modelcontextprotocol.io) support to every Ts.ED HTTP
adapter. The module exposes a configurable `/mcp` endpoint, lets you register tools/resources/prompts through DI-aware
helpers or decorators, and reuses the same MCP primitives that power the CLI integration.

> Need a standalone CLI implementation? Use `@tsed/cli-mcp` (Ts.ED CLI v7 beta) to generate a streamable or stdio MCP
> server that ships with the same functional API. The CLI package is ideal for headless agents, while
> `@tsed/platform-mcp` embeds MCP inside your HTTP application.

## Installation

```bash
yarn add @tsed/platform-mcp
```

```typescript [src/Server.ts]
import {Configuration} from "@tsed/di";
import "@tsed/platform-express";
import "@tsed/platform-mcp";

@Configuration({
  mcp: {
    path: "/mcp" // defaults to "/mcp"
  }
})
export class Server {}
```

## Register tools via the functional API

```typescript
import {defineTool} from "@tsed/platform-mcp";
import {s} from "@tsed/schema";

export const helloWorldTool = defineTool({
  name: "hello-world",
  title: "Hello World",
  description: "Replies with a warm greeting",
  inputSchema: s
    .object({
      subject: s.string().required()
    })
    .required(),
  async handler({subject}) {
    return {
      content: [],
      structuredContent: {
        message: `Hello ${subject}!`
      }
    };
  }
});
```

Add the token to any `@Module({providers: [...]})` array (or export it from a feature module). All functional helpers
(`defineTool`, `defineResource`, `definePrompt`) wrap handler execution inside a Ts.ED `DIContext`, so you can inject
and
use other services exactly like a controller method.

## Decorator-based registration

Prefer annotations over helper functions? Use the decorators that mirror the functional API:

```typescript
import {Injectable} from "@tsed/di";
import {Prompt, Resource, Tool} from "@tsed/platform-mcp";

@Injectable()
export class McpCatalog {
  @Tool({name: "time", title: "Current time"})
  getTime() {
    return {
      content: [],
      structuredContent: {
        now: new Date().toISOString()
      }
    };
  }

  @Prompt({name: "ask-tsed", title: "Ask Ts.ED"})
  prompt({question}: {question: string}) {
    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: question
          }
        }
      ]
    };
  }

  @Resource({
    name: "docs",
    uri: "tsed://docs/index",
    description: "Internal documentation"
  })
  readDocs() {
    return {
      contents: [
        {
          uri: "tsed://docs/index",
          mimeType: "text/markdown",
          text: "Internal doc content"
        }
      ]
    };
  }
}
```

When the service is loaded, the decorators register MCP handlers using the same DI-aware factories as the functional
helpers.

## Customising the endpoint

Set `mcp.path` or `mcp.enabled` to control how the transport is exposed:

```typescript
@Configuration({
  imports: [PlatformMcpModule],
  mcp: {
    path: "/ai/mcp",
    enabled: process.env.MCP_DISABLED !== "true"
  }
})
```

All Ts.ED adapters (Express, Fastify, Koa) forward `POST <path>` requests to
`@modelcontextprotocol/sdk`'s `StreamableHTTPServerTransport`, so any MCP-capable client (Claude Desktop, etc.) can talk
with your server regardless of the underlying framework.

## Testing & CLI cross-over

- Use `PlatformTest` to bootstrap the module and inject `MCP_SERVER` for assertions.
- Exercise the HTTP endpoint with `supertest` to verify that requests flow through the MCP transport.
- For CLI-based agents, scaffold `@tsed/cli-mcp` (Ts.ED CLI v7 beta). It shares the same helper implementations, so code
  written for the CLI can be promoted into `@tsed/platform-mcp` without rewriting handlers.
