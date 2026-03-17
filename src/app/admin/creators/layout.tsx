export default function CreatorAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-6">
      {children}
    </div>
  );
}
