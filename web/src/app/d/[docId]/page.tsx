import AuditView from "@/components/vault/AuditView";

export default async function AuditPage({
  params,
}: {
  params: Promise<{ docId: string }>;
}) {
  const { docId } = await params;
  return <AuditView docId={docId} />;
}
