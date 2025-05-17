"use client";

import { UnstructuredConfig } from "@/components/settings/UnstructuredConfig";
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";
import { BorderContainer } from "@/components/ui/shine-border";
import { FileText, Server, Database, Bot } from "lucide-react";

export default function UnstructuredSettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">
          <AnimatedGradientText>unstructured.io Integration</AnimatedGradientText>
        </h1>
      </div>
      
      <BorderContainer
        borderColor="rgba(59, 130, 246, 0.2)"
        shineBorderColor="rgba(59, 130, 246, 0.6)"
        borderRadius="0.75rem"
        className="w-full"
       variant="primary" rounded="xl">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
              <FileText className="text-primary" size={20} />
              <span>About unstructured.io</span>
            </h2>
            <p className="text-slate-600">
              unstructured.io is a powerful document processing library that extracts structured content from unstructured documents like PDFs, Word documents, PowerPoint presentations, images, HTML, and more. It provides enhanced document understanding capabilities for Atlas-ERP.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <Server className="text-indigo-600" size={18} />
                  <h3 className="font-medium">Docker Integration</h3>
                </div>
                <p className="text-sm text-slate-600">
                  Run unstructured.io locally using Docker for enhanced privacy and performance.
                </p>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="text-indigo-600" size={18} />
                  <h3 className="font-medium">Knowledge Graph</h3>
                </div>
                <p className="text-sm text-slate-600">
                  Extract structured data from documents and add it to your knowledge graph.
                </p>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <Bot className="text-indigo-600" size={18} />
                  <h3 className="font-medium">AI Processing</h3>
                </div>
                <p className="text-sm text-slate-600">
                  Enhance document understanding with AI-powered entity extraction and classification.
                </p>
              </div>
            </div>
          </div>
          
          <UnstructuredConfig />
        </div>
      </BorderContainer>
    </div>
  );
}
