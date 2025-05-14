"use client";

import { CopilotPopup } from "@copilotkit/react-ui";
import { ReactNode } from "react";

// Props interface for our component
interface ClientOnlyCopilotPopupProps {
  labels?: {
    title?: string;
    initial?: string;
    placeholder?: string;
    sendButtonAriaLabel?: string;
  };
  instructions?: string;
  children?: ReactNode;
}

// Custom PoweredBy component with consistent styling
const PoweredByComponent = () => {
  return (
    <p 
      className="poweredBy"
      style={{
        visibility: "visible",
        display: "block",
        position: "static",
        textAlign: "center",
        fontSize: "12px",
        padding: "3px 0",
        color: "rgb(214, 214, 214)"
      }}
    >
      Powered by CopilotKit
    </p>
  );
};

// Client-only CopilotPopup component
export default function ClientOnlyCopilotPopup({
  labels,
  instructions,
  children
}: ClientOnlyCopilotPopupProps) {
  return (
    <CopilotPopup
      labels={labels}
      instructions={instructions}
      poweredByComponent={PoweredByComponent}
    >
      {children}
    </CopilotPopup>
  );
}
