import { createFileRoute } from "@tanstack/react-router";
import { ShareView } from "@/components/ledger/share-view";

export const Route = createFileRoute("/share/$token")({
  component: SharePage,
});

function SharePage() {
  const { token } = Route.useParams();
  return <ShareView token={token} />;
}
