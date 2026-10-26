import { AppShell } from "@/components/app-shell";
import { authEnabled } from "@/lib/auth";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return <AppShell authEnabled={authEnabled()}>{children}</AppShell>;
}
