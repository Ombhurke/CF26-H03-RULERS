import React, { useState } from "react";
import {
  Cpu,
  ShieldCheck,
  Network,
  Activity,
  Layers,
  Sparkles,
  Lock,
  Boxes,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Marketplace } from "@/components/marketplace/Marketplace";

export function FederatedImaging() {
  return (
    <div className="w-full space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="glass-card rounded-3xl border border-border/80 bg-white/90 dark:bg-card/90 p-6 md:p-8 backdrop-blur-xl shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <Network className="w-64 h-64 text-primary" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-bold text-primary">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                H-03 Federated AI Network
              </span>
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/25 px-3 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                ZERO-RAW-IMAGE INVARIANT ACTIVE
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground font-heading">
              Federated Clinical Intelligence Network
            </h2>

            <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
              Collaborative model development across healthcare systems. Models train locally using DP-SGD with FedBN domain harmonization and Multi-Krum Byzantine fault tolerance. Raw scans and PHI never leave hospital firewalls.
            </p>
          </div>

          {/* Key Metrics Quick Pill */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full md:w-auto shrink-0">
            <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-card/80 border border-border/80 text-center shadow-sm">
              <div className="text-lg font-black text-foreground font-mono">5 Sites</div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Federation Roster</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-card/80 border border-border/80 text-center shadow-sm">
              <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">ε ≤ 5.0</div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Privacy Bound</div>
            </div>
            <div className="col-span-2 sm:col-span-1 p-3.5 rounded-2xl bg-white/80 dark:bg-card/80 border border-border/80 text-center shadow-sm">
              <div className="text-lg font-black text-primary font-mono">SHA-256</div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Provenance Proof</div>
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
