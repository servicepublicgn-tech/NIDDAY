import { StartPage } from "@/components/startpage";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "NIDDAY — Financial Intelligence & Public Traceability",
  description:
    "A financial intelligence and public traceability platform for organizations that need clear, accountable records from financial activity to evidence and outcomes.",
  path: "/",
  og: {
    title: "NIDDAY",
    description: "Financial Intelligence & Public Traceability",
  },
});

export default function Page() {
  return <StartPage />;
}
