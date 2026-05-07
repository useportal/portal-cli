import { createJiti } from "jiti";
import { existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { z } from "zod";
import type { AgentConfig } from "./types.js";

const toolSchema = z.object({
  type: z.enum(["http", "client", "portal"]),
  description: z.string().min(1),
  inputSchema: z.unknown().optional(),
  url: z.string().url().optional(),
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]).optional(),
});

const agentSchema = z.object({
  name: z.string().min(1),
  model: z.string().min(1),
  instructions: z.string().min(1),
  tools: z.record(z.string(), toolSchema).optional(),
});

const portalConfigSchema = z.object({
  environmentId: z.string().min(1).optional(),
  agents: z.record(
    z
      .string()
      .min(1)
      .max(128)
      .regex(/^[a-z0-9][a-z0-9-_]*$/),
    agentSchema,
  ),
});

const CONFIG_FILES = [
  "portal.config.ts",
  "portal.config.mts",
  "portal.config.js",
  "portal.config.mjs",
];

export async function loadPortalConfig(
  cwd: string,
  explicitPath?: string,
): Promise<{
  path: string;
  environmentId?: string;
  agents: AgentConfig[];
}> {
  const configPath = explicitPath
    ? path.resolve(cwd, explicitPath)
    : findConfig(cwd);

  if (!configPath) {
    throw new Error("Could not find portal.config.ts in the current project");
  }

  const jiti = createJiti(pathToFileURL(configPath).href);
  const loaded = await jiti.import(configPath, { default: true });
  const parsed = portalConfigSchema.safeParse(loaded);

  if (!parsed.success) {
    throw new Error(z.prettifyError(parsed.error));
  }

  return {
    path: configPath,
    environmentId: parsed.data.environmentId,
    agents: Object.entries(parsed.data.agents).map(([slug, agent]) => ({
      slug,
      ...agent,
    })),
  };
}

function findConfig(cwd: string): string | undefined {
  for (const file of CONFIG_FILES) {
    const candidate = path.join(cwd, file);
    if (existsSync(candidate)) return candidate;
  }

  return undefined;
}
