"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";
import { RegisterServiceWorker } from "@/components/register-service-worker";

type ProvidersProps = {
  children: ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <RegisterServiceWorker />
      {children}
    </SessionProvider>
  );
}