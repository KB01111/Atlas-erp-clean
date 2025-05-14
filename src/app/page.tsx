"use client";

import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    window.location.href = "/dashboard";
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
      <h1 className="text-4xl font-bold mb-6">Welcome to Atlas-ERP</h1>
      <p className="text-xl mb-8 text-center max-w-2xl">
        Redirecting to dashboard...
      </p>
    </div>
  );
}
