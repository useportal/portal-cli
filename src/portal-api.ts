import type {
  DeployAgentsRequest,
  DeployAgentsResponse,
  LlmCredentialResponse,
  SetLlmKeyRequest,
} from "./types.js";

type RequestOptions = {
  method?: string;
  body?: unknown;
  apiKey: string;
};

export class PortalApi {
  constructor(private readonly baseUrl: string) {}

  deployAgents(
    payload: DeployAgentsRequest,
    apiKey: string,
  ): Promise<DeployAgentsResponse> {
    return this.request("/agents", {
      method: "POST",
      body: payload,
      apiKey,
    });
  }

  setLlmKey(
    payload: SetLlmKeyRequest,
    apiKey: string,
  ): Promise<LlmCredentialResponse> {
    return this.request("/agents/llm-key", {
      method: "PUT",
      body: payload,
      apiKey,
    });
  }

  whoami(apiKey: string): Promise<{
    projectId: string;
    environmentId: string;
    organizationId: string;
  }> {
    return this.request("/agents/whoami", { apiKey });
  }

  private async request<T>(path: string, options: RequestOptions): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: options.method ?? "GET",
      headers: {
        authorization: `Bearer ${options.apiKey}`,
        "content-type": "application/json",
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : undefined;

    if (!response.ok && response.status !== 207) {
      const message =
        data && typeof data === "object" && "error" in data
          ? String(data.error)
          : `Portal API request failed with ${response.status}`;
      throw new Error(message);
    }

    return data as T;
  }
}
