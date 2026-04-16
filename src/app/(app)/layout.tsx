import { BottomNav } from "@/components/bottom-nav";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="flex-1 pb-20 scroll-touch">{children}</div>
      <BottomNav />
    </>
  );
}
