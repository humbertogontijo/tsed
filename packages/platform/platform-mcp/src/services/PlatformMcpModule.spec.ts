import {StreamableHTTPServerTransport} from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {PlatformApplication} from "@tsed/platform-http";
import {PlatformTest} from "@tsed/platform-http/testing";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";

import {MCP_SERVER} from "./McpServerFactory.js";
import {PlatformMcpModule} from "./PlatformMcpModule.js";

async function getModuleFixture() {
  const platformApplication = {
    post: vi.fn()
  } as any;
  const server = {
    connect: vi.fn().mockResolvedValue(undefined)
  } as any;

  const service = await PlatformTest.invoke<PlatformMcpModule>(PlatformMcpModule, [
    {
      token: PlatformApplication,
      use: platformApplication
    },
    {
      token: MCP_SERVER,
      use: server
    }
  ]);

  return {service, platformApplication, server};
}

describe("PlatformMcpModule", () => {
  beforeEach(() =>
    PlatformTest.create({
      mcp: {
        path: "/ai/mcp"
      }
    })
  );
  afterEach(() => PlatformTest.reset());

  it("should register the MCP endpoint", async () => {
    const {service, platformApplication} = await getModuleFixture();

    await service.$onRoutesInit();

    expect(platformApplication.post).toHaveBeenCalledWith("/ai/mcp", expect.any(Function));
  });

  it("should pipe HTTP requests to the MCP transport", async () => {
    const {service, platformApplication, server} = await getModuleFixture();
    const handleSpy = vi.spyOn(StreamableHTTPServerTransport.prototype, "handleRequest").mockResolvedValueOnce(undefined as any);

    try {
      await service.$onRoutesInit();

      const handler = platformApplication.post.mock.calls[0][1];
      const closeHandlers: Array<() => void> = [];
      const response: any = {};
      response.raw = {
        on: vi.fn((event, cb) => {
          if (event === "close") {
            closeHandlers.push(cb as () => void);
          }

          return response.raw;
        })
      };
      const request: any = {
        raw: {},
        body: {jsonrpc: "2.0"}
      };

      await handler({request, response});

      expect(server.connect).toHaveBeenCalledTimes(1);
      expect(handleSpy).toHaveBeenCalledWith(request.raw, response.raw, request.body);

      closeHandlers.forEach((cb) => cb());
    } finally {
      handleSpy.mockRestore();
    }
  });
});
