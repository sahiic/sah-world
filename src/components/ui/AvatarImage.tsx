"use client";

import Image from "next/image";
import { memo, useState } from "react";

export default memo(function AvatarImage({
  src,
  alt = "",
  className,
  size = 96,
  priority = false,
}: {
  src: string;
  alt?: string;
  className?: string;
  size?: number;
  priority?: boolean;
}) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const fallback = !src || failedSource === src;
  const imageSource = fallback ? "/avatar-fallback.svg" : src;
  const unoptimized =
    imageSource.startsWith("https://api.dicebear.com/") ||
    /\.svg(?:$|[?#])/i.test(imageSource);

  return (
    <Image
      src={imageSource}
      alt={alt}
      className={className}
      width={size}
      height={size}
      sizes={`${size}px`}
      preload={priority}
      unoptimized={unoptimized}
      onError={() => { if (!fallback) setFailedSource(src); }}
    />
  );
});
