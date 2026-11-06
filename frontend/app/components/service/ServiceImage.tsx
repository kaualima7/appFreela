"use client";

import Image from "next/image";
import { useState } from "react";

export default function ServiceImage({
  title,
  imageUrl,
}: {
  title: string;
  imageUrl: string | null;
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  return (
    <div className="service-image">
      {imageUrl && imageUrl !== failedUrl ? (
        <Image
          src={imageUrl}
          alt={title}
          width={720}
          height={450}
          className="service-photo"
          unoptimized
          onError={() => setFailedUrl(imageUrl)}
        />
      ) : (
        <div className="image-placeholder">
          <i className="bi bi-image" aria-hidden="true" />
          <span>Serviço sem imagem</span>
        </div>
      )}
    </div>
  );
}
