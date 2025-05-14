"use client";

import dynamic from "next/dynamic";
import { ReactNode } from "react";

// Dynamically import the CopilotPopup with SSR disabled
const DynamicCopilotPopup = dynamic(
  () => import("@copilotkit/react-ui").then((mod) => ({ default: mod.CopilotPopup })),
  { ssr: false }
);

// Custom PoweredBy component
const PoweredBy = () => (
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

// Props interface for our wrapper component
interface CopilotPopupWrapperProps {
  labels?: {
    title?: string;
    initial?: string;
    placeholder?: string;
    sendButtonAriaLabel?: string;
  };
  instructions?: string;
  children?: ReactNode;
}

// Wrapper component that renders the dynamic import
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
