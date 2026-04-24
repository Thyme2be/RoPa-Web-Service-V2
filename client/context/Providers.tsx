"use client";

import React, { ReactNode } from "react";
import { OwnerProvider } from "./OwnerContext";
import { ProcessorProvider } from "./ProcessorContext";
import { ExecutiveProvider } from "./ExecutiveContext";

export function AppProviders({ children }: { children: ReactNode }) {
    return (
        <OwnerProvider>
            <ProcessorProvider>
                <ExecutiveProvider>
                    {children}
                </ExecutiveProvider>
            </ProcessorProvider>
        </OwnerProvider>
    );
}
