"use client";

import Image from "next/image";
import { useState } from "react";

export default function ProfileAvatar({
  name,
  avatarUrl,
}: {
  name: string;
  avatarUrl?: string | null;
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const initials = name.trim().split(/\s+/);
  const letters =
    initials.length > 1
      ? initials[0].charAt(0) + initials[initials.length - 1].charAt(0)
      : initials[0].charAt(0);

  return (
    <span
      className="profile-avatar d-inline-flex align-items-center justify-content-center rounded-circle overflow-hidden flex-shrink-0"
      aria-hidden="true"
    >
      {avatarUrl &&
      /^https?:\/\//i.test(avatarUrl) &&
      avatarUrl !== failedUrl ? (
        <Image
          src={avatarUrl}
          alt=""
          width={64}
          height={64}
          unoptimized
          className="object-fit-cover w-100 h-100"
          onError={() => setFailedUrl(avatarUrl)}
        />
      ) : (
        letters.toLocaleUpperCase("pt-BR")
      )}
    </span>
  );
}
