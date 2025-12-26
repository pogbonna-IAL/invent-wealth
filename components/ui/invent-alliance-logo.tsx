import Image from "next/image";

interface InventAllianceLogoProps {
  className?: string;
  width?: number;
  height?: number;
  showText?: boolean;
  size?: "small" | "large";
}

/**
 * Invent Alliance logo component
 * Displays the interlocking diamond symbol (smaller version by default)
 */
export function InventAllianceLogo({
  className = "",
  width,
  height,
  showText = true,
  size = "small",
}: InventAllianceLogoProps) {
  const isSmall = size === "small";
  const logoPath = isSmall ? "/invent-alliance-logo-small.svg" : "/invent-alliance-logo.svg";
  const defaultWidth = isSmall ? 32 : width || 160;
  const defaultHeight = isSmall ? 32 : height || 64;
  
  return (
    <Image
      src={logoPath}
      alt="Invent Alliance"
      width={width || defaultWidth}
      height={height || defaultHeight}
      className={className}
      priority
    />
  );
}

