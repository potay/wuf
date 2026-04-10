export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="fixed inset-0 z-[60] bg-[var(--bg)]">{children}</div>;
}
