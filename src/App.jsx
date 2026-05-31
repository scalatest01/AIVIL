import { useState, useEffect } from "react";
import Landing from "./Landing";
import RealDashboard from "./RealDashboard";
import DevPortal from "./DevPortal";
import DocsPage from "./DocsPage";
import PricingPage from "./PricingPage";
import ResetPasswordPage from "./ResetPasswordPage";
import AgentProfilePage from "./AgentProfilePage";

const getPage = () => {
  const path = window.location.pathname;
  if (path === "/app" || path === "/app/") return "dashboard";
  if (path === "/signup" || path === "/signup/") return "signup";
  if (path === "/docs" || path === "/docs/") return "docs";
  if (path === "/pricing" || path === "/pricing/") return "pricing";
  if (path === "/reset-password" || path === "/reset-password/") return "reset-password";
  if (path.startsWith("/agent/")) return "agent";
  return "landing";
};

export default function App() {
  const [page, setPage] = useState(getPage);

  useEffect(() => {
    window.goToApp = () => { window.history.pushState({}, "", "/app"); setPage("dashboard"); window.scrollTo(0, 0); };
    window.goToHome = () => { window.history.pushState({}, "", "/"); setPage("landing"); window.scrollTo(0, 0); };
    window.goToSignup = () => { window.history.pushState({}, "", "/signup"); setPage("signup"); window.scrollTo(0, 0); };
    window.goToDocs = () => { window.history.pushState({}, "", "/docs"); setPage("docs"); window.scrollTo(0, 0); };
    window.goToPricing = () => { window.history.pushState({}, "", "/pricing"); setPage("pricing"); window.scrollTo(0, 0); };
    const handlePop = () => setPage(getPage());
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, []);
  
if (page === "dashboard") return <RealDashboard />;
if (page === "signup") return <DevPortal />;
if (page === "docs") return <DocsPage />;
if (page === "pricing") return <PricingPage />;
if (page === "reset-password") return <ResetPasswordPage />;
if (page === "agent") return <AgentProfilePage />;
return <Landing />;
}
