import React from "react";
import { Network } from "lucide-react";
import { Marketplace } from "@/components/marketplace/Marketplace";

export function FederatedImaging() {
  return (
    <div className="w-full space-y-6 animate-fadeIn">
      {/* 1 Single Minimized Card with Concise Content & Bullets */}
      <div className="glass-card rounded-2xl border border-border/80 bg-white/90 dark:bg-card/90 p-5 md:p-6 backdrop-blur-xl shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
          <Network className="w-48 h-48 text-primary" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          {/* Left: Minimized Title & Bullet Points */}
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs font-bold text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                H-03 Federated AI Network
              </span>
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                ZERO-RAW-IMAGE INVARIANT ACTIVE
              </span>
            </div>

            <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-foreground font-heading">
              Federated Clinical Intelligence Network & Model Catalog
            </h2>

            {/* Bullets */}
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span><strong className="text-foreground">Privacy-Preserving:</strong> Local DP-SGD (ε ≤ 5.0) with 0 raw scans transferred</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span><strong className="text-foreground">Scanner Harmonization:</strong> FedBN normalization & Byzantine fault tolerance</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
                <span><strong className="text-foreground">Collaborative Training:</strong> Pool clinical intelligence across 5 hospital sites</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-500 shrink-0" />
                <span><strong className="text-foreground">Cryptographic Provenance:</strong> SHA-256 parent-child audit lineage proof</span>
              </li>
            </ul>
          </div>

          {/* Right: Metrics Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-2.5 w-full lg:w-auto shrink-0">
            <div className="p-2.5 sm:p-3 rounded-xl bg-white/90 dark:bg-card/90 border border-border/80 text-center shadow-sm hover:shadow-md transition-shadow min-w-[105px] sm:min-w-[115px]">
              <div className="text-lg sm:text-xl font-black text-foreground font-mono">5 Sites</div>
              <div className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">Federation</div>
            </div>
            <div className="p-2.5 sm:p-3 rounded-xl bg-white/90 dark:bg-card/90 border border-border/80 text-center shadow-sm hover:shadow-md transition-shadow min-w-[105px] sm:min-w-[115px]">
              <div className="text-lg sm:text-xl font-black text-primary font-mono">6 Models</div>
              <div className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">Active Catalog</div>
            </div>
            <div className="p-2.5 sm:p-3 rounded-xl bg-white/90 dark:bg-card/90 border border-border/80 text-center shadow-sm hover:shadow-md transition-shadow min-w-[105px] sm:min-w-[115px]">
              <div className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">0 Scans</div>
              <div className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">Raw Shared</div>
            </div>
            <div className="p-2.5 sm:p-3 rounded-xl bg-white/90 dark:bg-card/90 border border-border/80 text-center shadow-sm hover:shadow-md transition-shadow min-w-[105px] sm:min-w-[115px]">
              <div className="text-lg sm:text-xl font-black text-indigo-600 dark:text-indigo-400 font-mono">ε ≤ 5.0</div>
              <div className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">Privacy Bound</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Marketplace */}
      <Marketplace />
    </div>
  );
}

export default FederatedImaging;
