export default function FieldLabelWithHint({
  label,
  hint,
  required = false,
  htmlFor,
  className = "",
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={`text-sm font-medium mb-1.5 flex items-center gap-1 ${className}`}
    >
      <span>
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </span>
      <span className="relative inline-flex group/hint shrink-0">
        <span
          className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold leading-none cursor-help select-none"
          aria-label={`More info: ${label}`}
        >
          !
        </span>
        <span
          role="tooltip"
          className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-[60] hidden w-72 rounded-md border bg-popover px-3 py-2 text-xs font-normal text-popover-foreground shadow-md group-hover/hint:block"
        >
          {hint}
        </span>
      </span>
    </label>
  );
}
