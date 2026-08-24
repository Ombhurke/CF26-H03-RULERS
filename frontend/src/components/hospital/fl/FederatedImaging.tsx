import React from "react";
import { Marketplace } from "@/components/marketplace/Marketplace";

export function FederatedImaging() {
  return (
    <div className="w-full space-y-6 animate-fadeIn">
      {/* Main Marketplace & Training Dashboard */}
      <Marketplace />
    </div>
  );
}

export default FederatedImaging;
