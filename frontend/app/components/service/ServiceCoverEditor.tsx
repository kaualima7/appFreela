"use client";

import Image from "next/image";
import { useRef, useState, type PointerEvent } from "react";

export const defaultCoverFrame = { zoom: 1, x: 0.5, y: 0.5 };
type CoverFrame = typeof defaultCoverFrame;
type ImageSize = { width: number; height: number };
const coverRatio = 8 / 5;

function coverCrop({ width, height }: ImageSize, frame: CoverFrame) {
  const cropWidth = Math.min(width, height * coverRatio) / frame.zoom;
  const cropHeight = cropWidth / coverRatio;

  return {
    width: cropWidth,
    height: cropHeight,
    left: (width - cropWidth) * frame.x,
    top: (height - cropHeight) * frame.y,
  };
}

export async function prepareServiceCover(url: string, frame: CoverFrame) {
  const image = new window.Image();
  image.src = url;
  await image.decode();
  const crop = coverCrop(
    { width: image.naturalWidth, height: image.naturalHeight },
    frame,
  );

  // A exportação usa a mesma proporção e o mesmo recorte da prévia.
  const scale = Math.max(1, Math.min(160, Math.floor(crop.width / 8)));
  const canvas = document.createElement("canvas");
  canvas.width = scale * 8;
  canvas.height = scale * 5;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Não foi possível preparar a capa.");
  context.drawImage(
    image,
    crop.left,
    crop.top,
    crop.width,
    crop.height,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Não foi possível preparar a capa."));
      },
      "image/webp",
      0.9,
    );
  });
}

function position(value: number) {
  return Math.max(0, Math.min(1, value));
}

export default function ServiceCoverEditor({
  url,
  frame,
  disabled,
  onChange,
}: {
  url: string;
  frame: CoverFrame;
  disabled: boolean;
  onChange: (frame: CoverFrame) => void;
}) {
  const [size, setSize] = useState<ImageSize>();
  const [failed, setFailed] = useState(false);
  const drag = useRef<{
    pointerId: number;
    clientX: number;
    clientY: number;
    frame: CoverFrame;
  } | null>(null);
  const crop = size && coverCrop(size, frame);
  const horizontalRoom = size && crop ? Math.max(0, size.width - crop.width) : 0;
  const verticalRoom = size && crop ? Math.max(0, size.height - crop.height) : 0;

  function startDrag(event: PointerEvent<HTMLDivElement>) {
    if (disabled || !crop || event.button !== 0 || drag.current) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      frame,
    };
  }

  function moveCover(event: PointerEvent<HTMLDivElement>) {
    const start = drag.current;
    if (disabled || !start || !crop || start.pointerId !== event.pointerId) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const movedX = ((event.clientX - start.clientX) / bounds.width) * crop.width;
    const movedY = ((event.clientY - start.clientY) / bounds.height) * crop.height;
    onChange({
      ...frame,
      x: horizontalRoom > 0.01 ? position(start.frame.x - movedX / horizontalRoom) : frame.x,
      y: verticalRoom > 0.01 ? position(start.frame.y - movedY / verticalRoom) : frame.y,
    });
  }

  return (
    <>
      <h2 className="h6 mb-2">Ajustar enquadramento</h2>
      <p className="form-text mb-2">
        Arraste a foto ou use os controles para escolher o que aparece na capa.
      </p>
      {failed ? (
        <p className="alert alert-danger" role="alert">
          Não foi possível abrir esta imagem. Escolha outra em JPEG, PNG ou WebP.
        </p>
      ) : (
        <div
          className="service-cover-frame"
          onPointerDown={startDrag}
          onPointerMove={moveCover}
          onLostPointerCapture={() => {
            drag.current = null;
          }}
        >
          <Image
            src={url}
            alt="Prévia do enquadramento da capa"
            width={720}
            height={450}
            unoptimized
            draggable={false}
            onLoad={({ currentTarget }) =>
              setSize({
                width: currentTarget.naturalWidth,
                height: currentTarget.naturalHeight,
              })
            }
            onError={() => setFailed(true)}
            style={
              size && crop
                ? {
                    width: `${(size.width / crop.width) * 100}%`,
                    height: `${(size.height / crop.height) * 100}%`,
                    left: `${(-crop.left / crop.width) * 100}%`,
                    top: `${(-crop.top / crop.height) * 100}%`,
                  }
                : undefined
            }
          />
        </div>
      )}
      {crop && !failed && (
        <div className="mt-3">
          <label htmlFor="cover-zoom" className="form-label mb-0">
            Zoom
          </label>
          <input
            id="cover-zoom"
            className="form-range"
            type="range"
            min="1"
            max="3"
            step="0.05"
            value={frame.zoom}
            onChange={(event) =>
              onChange({ ...frame, zoom: event.currentTarget.valueAsNumber })
            }
          />
          <label htmlFor="cover-horizontal" className="form-label mb-0">
            Enquadramento horizontal
          </label>
          <input
            id="cover-horizontal"
            className="form-range"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={frame.x}
            disabled={horizontalRoom <= 0.01}
            onChange={(event) =>
              onChange({ ...frame, x: event.currentTarget.valueAsNumber })
            }
          />
          <label htmlFor="cover-vertical" className="form-label mb-0">
            Enquadramento vertical
          </label>
          <input
            id="cover-vertical"
            className="form-range"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={frame.y}
            disabled={verticalRoom <= 0.01}
            onChange={(event) =>
              onChange({ ...frame, y: event.currentTarget.valueAsNumber })
            }
          />
        </div>
      )}
    </>
  );
}