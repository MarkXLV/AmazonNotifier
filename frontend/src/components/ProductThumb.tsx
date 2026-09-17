import { useState } from "react";
import { Package } from "lucide-react";

interface Props {
  src?: string | null;
  alt?: string;
  iconSize?: number;
  imgClassName?: string;
}

/**
 * Product thumbnail that gracefully falls back to a placeholder glyph when the
 * image is missing OR fails to load (Amazon rotates image URLs, so many go 404).
 */
export default function ProductThumb({
  src,
  alt = "",
  iconSize = 26,
  imgClassName = "h-full max-w-full object-contain",
}: Props) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return <Package size={iconSize} className="text-faint" strokeWidth={1.4} />;
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={imgClassName}
    />
  );
}
