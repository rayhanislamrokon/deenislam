"use client";

import { useEffect, useState } from "react";
import { hasPermission, tokenPermissions } from "../lib/adminPermissions";
import VisitorAnalyticsSummary from "./VisitorAnalyticsSummary";
import ContentEngagementSummary from "./ContentEngagementSummary";

export default function PermissionAwareOverview() {
  const [showAudience, setShowAudience] = useState(false);
  useEffect(() => {
    const permissions = tokenPermissions(sessionStorage.getItem("deenislam_admin_token") || "");
    setShowAudience(hasPermission(permissions, "dashboard.view"));
  }, []);
  return <>
    {showAudience && <VisitorAnalyticsSummary />}
    {!showAudience && <div className="categoryOverviewNotice"><b>Your content overview</b><span>This dashboard only shows engagement for the categories assigned to your account.</span></div>}
    <ContentEngagementSummary />
  </>;
}
