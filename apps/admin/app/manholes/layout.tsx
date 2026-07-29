export default function ManholesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-ink-950">
      {children}
    </div>
  );
}
