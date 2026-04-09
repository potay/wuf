export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Login has its own full-screen layout - hide the bottom nav
  return <div className="fixed inset-0 z-[60] bg-background">{children}</div>;
}
