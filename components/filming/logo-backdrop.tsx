import { LogoMark } from "@/components/brand/logo-mark";

/** Fixed logo behind the gallery; tiles scroll over it. */
export function LogoBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 grid place-items-center"
    >
      <LogoMark
        className="h-[38vh] w-auto text-ink md:h-[46vh]"
        style={{ opacity: "var(--filming-logo-opacity)" }}
      />
    </div>
  );
}
