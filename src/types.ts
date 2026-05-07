export type AgentToolType = "http" | "client" | "portal";

export interface AgentTool {
  type: AgentToolType;
  description: string;
  inputSchema?: unknown;
  url?: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
}

export interface AgentConfig {
  slug: string;
  name: string;
  model: string;
  instructions: string;
  tools?: Record<string, AgentTool>;
}

export interface DeployAgentsRequest {
  environmentId: string;
  agents: AgentConfig[];
}

export interface DeployAgentResult {
  slug: string;
  status: "success" | "error";
  error?: string;
}

export interface DeployAgentsResponse {
  results: DeployAgentResult[];
}

export interface SetLlmKeyRequest {
  apiKey: string;
  provider?: string;
}

export interface LlmCredentialResponse {
  credential: {
    provider: string;
    keyPreview: string;
    updatedAt: string;
  };
}

export interface WhoamiResponse {
  projectId: string;
  environmentId: string;
  organizationId: string;
}


