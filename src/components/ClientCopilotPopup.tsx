"use client";

import { CopilotPopup } from "@copilotkit/react-ui";

export default function ClientCopilotPopup() {
  return (
    <CopilotPopup
      labels={{
        title: "Atlas Assistant",
        initial: "Hi! I'm your Atlas ERP assistant. How can I help you today?",
      }}
    />
  );
}
