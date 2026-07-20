import DocWorkspace from "@/components/vault/DocWorkspace";

export default async function DocPage({
  params,
}: {
  params: Promise<{ docId: string }>;
}) {
  const { docId } = await params;
  return <DocWorkspace docId={docId} />;
}
