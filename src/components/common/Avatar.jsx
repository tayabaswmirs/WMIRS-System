import { useState } from "react";

const SIZES = {
  xs: "w-6 h-6 text-[10px]",
  sm: "w-8 h-8 text-[11px]",
  md: "w-10 h-10 text-[13px]",
  lg: "w-14 h-14 text-[18px]",
  xl: "w-20 h-20 text-[24px]",
  "2xl": "w-28 h-28 text-[32px]",
};

const getInitials = (name) =>
  (name || "U")
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

export default function Avatar({
  src,
  name = "User",
  role = "ranger",
  size = "md",
  className = "",
  style = {},
  onClick,
  title,
}) {
  const [hasError, setHasError] = useState(false);
  const sizeClass = SIZES[size] || SIZES.md;
  const initials = getInitials(name);

  // Role accent presets matching MongoDB visual system
  const roleStyles = {
    admin: {
      background: "#001e2b",
      color: "#00ed64",
      borderColor: "#00ed64",
    },
    staff: {
      background: "#c3f0d2",
      color: "#00684a",
      borderColor: "#00a35c",
    },
    ranger: {
      background: "#e3fcef",
      color: "#00684a",
      borderColor: "#00a35c",
    },
  };

  const activeRoleStyle = roleStyles[role?.toLowerCase()] || roleStyles.ranger;
  const isInteractive = typeof onClick === "function";

  if (src && !hasError) {
    return (
      <div
        className={`relative inline-flex items-center justify-center rounded-full overflow-hidden shrink-0 select-none ${sizeClass} ${
          isInteractive ? "cursor-pointer hover:opacity-90 transition-opacity" : ""
        } ${className}`}
        style={{
          border: `2px solid ${activeRoleStyle.borderColor}`,
          ...style,
        }}
        onClick={onClick}
        title={title || name}
        role={isInteractive ? "button" : undefined}
      >
        <img
          src={src}
          alt={name}
          onError={() => setHasError(true)}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full shrink-0 font-bold select-none tracking-tight ${sizeClass} ${
        isInteractive ? "cursor-pointer hover:opacity-90 transition-opacity" : ""
      } ${className}`}
      style={{
        background: activeRoleStyle.background,
        color: activeRoleStyle.color,
        border: `2px solid ${activeRoleStyle.borderColor}`,
        fontFamily: "'Euclid Circular A', system-ui, sans-serif",
        ...style,
      }}
      onClick={onClick}
      title={title || name}
      role={isInteractive ? "button" : undefined}
      aria-label={name}
    >
      <span>{initials}</span>
    </div>
  );
}
