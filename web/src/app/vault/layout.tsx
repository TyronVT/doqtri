import AuthGate from "@/components/vault/AuthGate";
import VaultShell from "@/components/vault/VaultShell";

export default function VaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGate>
      <VaultShell>{children}</VaultShell>
    </AuthGate>
  );
}
