"use client";

// Escolhe a foto de destaque da página inicial e alterna a opção a cada novo carregamento.

import Image from "next/image";
import { useEffect, useState } from "react";

const photos = [
  {
    src: "/freelike-home.webp",
    alt: "Homem usando o celular em um espaço de trabalho compartilhado",
  },
  {
    src: "/freelike-home-designer.webp",
    alt: "Designer criando a identidade visual de uma cafeteria no notebook",
  },
  {
    src: "/freelike-home-cardapio.webp",
    alt: "Pessoa usando um cardápio digital no balcão de uma lancheria",
  },
];

const storageKey = "freelike-home-next-photo";
let currentPhotoIndex: number | undefined;

function selectPhoto() {
  // A mesma foto fica na home até um novo carregamento da página.
  if (currentPhotoIndex !== undefined) return currentPhotoIndex;

  let index = 0;
  try {
    const savedIndex = Number(sessionStorage.getItem(storageKey));
    if (
      Number.isInteger(savedIndex) &&
      savedIndex >= 0 &&
      savedIndex < photos.length
    ) {
      index = savedIndex;
    }
    sessionStorage.setItem(storageKey, String((index + 1) % photos.length));
  } catch {
    // Sem acesso ao armazenamento, a home ainda mostra uma foto.
  }
  currentPhotoIndex = index;
  return index;
}

export default function HomeHeroPhoto() {
  const [photoIndex, setPhotoIndex] = useState<number | null>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setPhotoIndex(selectPhoto()));
    return () => cancelAnimationFrame(frame);
  }, []);

  if (photoIndex === null) {
    return <div className="home-photo-placeholder" aria-hidden="true" />;
  }

  const { src, alt } = photos[photoIndex];
  return (
    <Image
      src={src}
      alt={alt}
      width={1448}
      height={1086}
      loading="eager"
      fetchPriority="high"
      unoptimized
    />
  );
}
