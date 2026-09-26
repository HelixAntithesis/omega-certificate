import { createFileRoute } from "@tanstack/react-router";
import { CertApp } from "@/components/cert-app";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <CertApp />;
}
