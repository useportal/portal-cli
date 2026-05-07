import Conf from "conf";

type PortalCliConfig = {
  apiKey?: string;
  apiBaseUrl?: string;
};

let config: Conf<PortalCliConfig> | undefined;

export function getStoredApiKey(): string | undefined {
  return readConfigValue("apiKey");
}

export function setStoredApiKey(apiKey: string): void {
  getConfig().set("apiKey", apiKey);
}

export function getStoredApiBaseUrl(): string | undefined {
  return readConfigValue("apiBaseUrl");
}

export function setStoredApiBaseUrl(apiBaseUrl: string): void {
  getConfig().set("apiBaseUrl", apiBaseUrl);
}

export function resolveApiKey(): string | undefined {
  return process.env.PORTAL_API_KEY || getStoredApiKey();
}

export function resolveApiBaseUrl(): string {
  return (
    process.env.PORTAL_API_URL ||
    getStoredApiBaseUrl() ||
    "https://api.useportal.co"
  ).replace(/\/$/, "");
}

export function readDisplayConfig() {
  return {
    apiKey: maskSecret(resolveApiKey()),
    apiBaseUrl: resolveApiBaseUrl(),
  };
}

function maskSecret(value: string | undefined): string | undefined {
  if (!value) return undefined;
  if (value.length <= 8) return "****";
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

function getConfig(): Conf<PortalCliConfig> {
  config ??= new Conf<PortalCliConfig>({
    projectName: "portal",
    cwd: process.env.PORTAL_CONFIG_DIR,
  });
  return config;
}

function readConfigValue<Key extends keyof PortalCliConfig>(
  key: Key,
): PortalCliConfig[Key] | undefined {
  try {
    return getConfig().get(key);
  } catch {
    return undefined;
  }
}
