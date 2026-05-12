export default function SDGrid() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 grid grid-cols-6 gap-px px-[18px] md:grid-cols-8 md:px-7 xl:grid-cols-12 xl:px-8"
    >
      {Array.from({ length: 12 }).map((_, i) => (
        <span
          key={i}
          className={
            "border-l border-dashed border-sd-rule last:border-r " +
            (i >= 6 ? "hidden md:block " : "") +
            (i >= 8 ? "md:hidden xl:block" : "")
          }
        />
      ))}
    </div>
  );
}
