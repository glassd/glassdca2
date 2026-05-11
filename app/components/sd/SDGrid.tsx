export default function SDGrid() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 grid grid-cols-12 gap-px px-8"
    >
      {Array.from({ length: 12 }).map((_, i) => (
        <span
          key={i}
          className="border-l border-dashed border-sd-rule last:border-r"
        />
      ))}
    </div>
  );
}
