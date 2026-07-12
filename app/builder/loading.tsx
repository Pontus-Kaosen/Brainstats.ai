export default function BuilderLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050505] text-[#A9A9A9]">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-[#18ff6d33] border-t-[#18ff6d]" />
        <p className="mt-4 text-sm font-semibold">Brain Builder</p>
      </div>
    </div>
  );
}
