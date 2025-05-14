# CopilotKit Integration Documentation

This document provides an overview of the CopilotKit integration in the Atlas-ERP project.

## Overview

Atlas-ERP integrates CopilotKit to provide an AI assistant that can help users navigate the application, understand data, and perform actions. The integration consists of several components:

1. **CopilotKit Provider**: Wraps the application to provide AI capabilities
2. **CopilotPopup**: The UI component that displays the chat interface
3. **CopilotKit API Endpoint**: The server-side endpoint that processes AI requests
4. **LiteLLM Adapter**: Custom adapter to support multiple LLM providers
5. **StatusPanel**: Component that displays the status of various services, including CopilotKit

## Components

### CopilotKit Provider

The CopilotKit provider is set up in the root layout (`app/layout.tsx`) to wrap the entire application:

```tsx
<CopilotKit runtimeUrl="/api/copilotkit">
  {children}
  <CopilotPopupWrapper
    labels={{
      title: "Atlas Assistant",
      initial: "Hi! I'm your Atlas ERP assistant. How can I help you today?",
    }}
  />
</CopilotKit>
```

### CopilotPopup

We use a custom wrapper component (`CopilotPopupWrapper.tsx`) to dynamically import the CopilotPopup component with SSR disabled:

```tsx
const DynamicCopilotPopup = dynamic(
  () => import("@copilotkit/react-ui").then((mod) => ({ default: mod.CopilotPopup })),
  { ssr: false }
);

export default function CopilotPopupWrapper({
  labels,
  instructions,
  children
}: CopilotPopupWrapperProps) {
  return (
    <DynamicCopilotPopup
      labels={labels}
      instructions={instructions}
      poweredByComponent={PoweredBy}
    >
      {children}
    </DynamicCopilotPopup>
  );
}
```

### CopilotKit API Endpoint

The API endpoint (`app/api/copilotkit/route.ts`) handles requests from the CopilotKit frontend:

```tsx
export const POST = async (req: NextRequest) => {
  try {
    const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
      runtime,
      serviceAdapter,
      endpoint: '/api/copilotkit',
    });

    return handleRequest(req);
  } catch (error) {
    console.error("Error handling CopilotKit request:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process request",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
```

### LiteLLM Adapter

We use a custom LiteLLM adapter (`src/lib/litellm-adapter.ts`) to support multiple LLM providers:

```tsx
export class LiteLLMAdapter implements LLMAdapter {
  // Implementation details...
}
```

### StatusPanel

The StatusPanel component (`src/components/StatusPanel.tsx`) displays the status of various services, including CopilotKit:

```tsx
const checkCopilotKit = async (): Promise<"operational" | "degraded" | "down"> => {
  try {
    // Test the CopilotKit API endpoint with a simple request
    const response = await fetch("/api/copilotkit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: "Hello, are you working?" }
        ],
      }),
    });
    
    if (response.ok) {
      return "operational";
    } else if (response.status >= 500) {
      return "down";
    } else {
      return "degraded";
    }
  } catch (error) {
    console.error("Error checking CopilotKit status:", error);
    return "down";
  }
};
```

## Making Components Readable and Actionable

CopilotKit provides hooks to make components readable and actionable by the AI:

### useCopilotReadable

```tsx
useCopilotReadable({
  name: title.toLowerCase(),
  description: `Current ${title.toLowerCase()} information`,
  value: { value, change },
});
```

### useCopilotAction

```tsx
useCopilotAction({
  name: `run_${name.toLowerCase().replace(/\s+/g, "_")}`,
  description: `Run the ${name} agent to ${description}`,
  parameters: [],
  handler: async () => {
    // Implementation...
  },
});
```

## LLM Configuration

Atlas-ERP supports multiple LLM providers through LiteLLM:

- **OpenAI**: GPT-4o, GPT-4 Turbo, GPT-3.5 Turbo
- **Anthropic**: Claude 3 Opus, Claude 3 Sonnet, Claude 3 Haiku
- **Azure OpenAI**: GPT-4, GPT-3.5 Turbo
- **Ollama**: Llama 3, Mistral, CodeLlama

The LLM settings can be configured through the UI or environment variables.

## Troubleshooting

If you encounter issues with the CopilotKit integration, check the following:

1. **API Keys**: Ensure that the appropriate API keys are set in the environment variables or the LLM settings
2. **Network Connectivity**: Check that the application can connect to the LLM provider's API
3. **Console Errors**: Look for errors in the browser console or server logs
4. **StatusPanel**: Use the StatusPanel component to check the status of the CopilotKit service

## Future Improvements

- Implement streaming responses for better user experience
- Add support for more LLM providers
- Enhance the AI's knowledge of the application with more useCopilotReadable hooks
- Add more actions that the AI can perform with useCopilotAction hooks
