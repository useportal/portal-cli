#!/usr/bin/env node
import { Command } from "commander";
import pc from "picocolors";
import { loadPortalConfig } from "./load-config.js";
import {
  readDisplayConfig,
  resolveApiBaseUrl,
  resolveApiKey,
  setStoredApiBaseUrl,
  setStoredApiKey,
} from "./local-config.js";
import { PortalApi } from "./portal-api.js";

const program = new Command();

program
  .name("portal")
  .description("Deploy Portal agent configuration")
  .version("0.0.0");

program
  .command("deploy")
  .description("Deploy agents from portal.config.ts")
  .option("-c, --config <path>", "Path to portal config")
  .option("-e, --environment <environmentId>", "Portal environment ID")
  .action(async (options: { config?: string; environment?: string }) => {
    await run(async () => {
      const apiKey = requireApiKey();
      const loaded = await loadPortalConfig(process.cwd(), options.config);
      const environmentId = options.environment ?? loaded.environmentId;

      if (!environmentId) {
        throw new Error(
          "Missing environmentId. Add it to portal.config.ts or pass --environment.",
        );
      }

      const api = new PortalApi(resolveApiBaseUrl());
      console.log(
        `Deploying ${loaded.agents.length} agent${loaded.agents.length === 1 ? "" : "s"} to Portal...`,
      );

      const response = await api.deployAgents(
        { environmentId, agents: loaded.agents },
        apiKey,
      );

      for (const result of response.results) {
        if (result.status === "success") {
          console.log(`${pc.green("✓")} ${result.slug} configured`);
        } else {
          console.log(
            `${pc.red("✕")} ${result.slug} failed: ${result.error ?? "Unknown error"}`,
          );
        }
      }

      if (response.results.some((result) => result.status === "error")) {
        process.exitCode = 1;
      }
    });
  });

const config = program.command("config").description("Manage Portal CLI config");

config
  .command("set")
  .description("Set a Portal CLI or account config value")
  .argument("<key>", "api-key, api-url, or llm-key")
  .argument("<value>")
  .option("--provider <provider>", "LLM provider name")
  .action(
    async (
      key: string,
      value: string,
      options: { provider?: string },
    ) => {
      await run(async () => {
        if (key === "api-key") {
          setStoredApiKey(value);
          console.log(`${pc.green("✓")} Portal API key saved locally`);
          return;
        }

        if (key === "api-url") {
          setStoredApiBaseUrl(value);
          console.log(`${pc.green("✓")} Portal API URL saved locally`);
          return;
        }

        if (key === "llm-key") {
          const apiKey = requireApiKey();
          const api = new PortalApi(resolveApiBaseUrl());
          const response = await api.setLlmKey(
            { apiKey: value, provider: options.provider },
            apiKey,
          );
          console.log(
            `${pc.green("✓")} ${response.credential.provider} LLM key saved to Portal (${response.credential.keyPreview})`,
          );
          return;
        }

        throw new Error("Unknown config key. Use api-key, api-url, or llm-key.");
      });
    },
  );

config
  .command("get")
  .description("Show resolved Portal CLI config")
  .action(() => {
    const display = readDisplayConfig();
    console.log(JSON.stringify(display, null, 2));
  });

program
  .command("whoami")
  .description("Show the Portal account resolved by the API key")
  .action(async () => {
    await run(async () => {
      const api = new PortalApi(resolveApiBaseUrl());
      const identity = await api.whoami(requireApiKey());
      console.log(JSON.stringify(identity, null, 2));
    });
  });

program.parseAsync(process.argv);

function requireApiKey(): string {
  const apiKey = resolveApiKey();
  if (!apiKey) {
    throw new Error(
      "Missing Portal API key. Set PORTAL_API_KEY or run `portal config set api-key <key>`.",
    );
  }
  return apiKey;
}

async function run(fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
  } catch (error) {
    console.error(
      `${pc.red("Error:")} ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exitCode = 1;
  }
}
