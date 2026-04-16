export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="fixed inset-0 z-[60] bg-background overflow-auto">{children}</div>;
}
