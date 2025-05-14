"use client";

import { CopilotPopup as OriginalCopilotPopup } from "@copilotkit/react-ui";
import { ReactNode } from "react";

// Custom PoweredBy component that will be rendered server-side and client-side consistently
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

// Props interface for our custom component
interface CustomCopilotPopupProps {
  labels?: {
    title?: string;
    initial?: string;
    placeholder?: string;
    sendButtonAriaLabel?: string;
  };
  instructions?: string;
  children?: ReactNode;
}

// Custom wrapper component for CopilotPopup
export default function CustomCopilotPopup({
  labels,
  instructions,
  children
}: CustomCopilotPopupProps) {
  return (
    <OriginalCopilotPopup
      labels={labels}
      instructions={instructions}
      poweredByComponent={PoweredByComponent}
    >
      {children}
    </OriginalCopilotPopup>
  );
}
