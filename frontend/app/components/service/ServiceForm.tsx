"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { API_URL, serviceError } from "@/app/api";
import { authenticatedFetch } from "@/app/login/auth_service";
import type { FreelancerService } from "@/app/types/service";
import { serviceCategories } from "@/app/types/service-categories";

import ServiceImage from "./ServiceImage";
import ServiceCoverEditor, {
  defaultCoverFrame,
  prepareServiceCover,
} from "./ServiceCoverEditor";

const coverTypes = ["image/jpeg", "image/png", "image/webp"];
const coverLimit = 5 * 1024 * 1024;

export default function ServiceForm({
  service,
  onClose,
  onSaved,
}: {
  service: FreelancerService | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(service?.title ?? "");
  const [description, setDescription] = useState(service?.description ?? "");
  const [category, setCategory] = useState(service?.category ?? "");
  const previousCategory = service?.category;
  const hasLegacyCategory =
    previousCategory && !serviceCategories.includes(previousCategory);
  const [startingPrice, setStartingPrice] = useState(
    service?.startingPrice ?? "",
  );
  const [cover, setCover] = useState<string | null>(null);
  const [coverFrame, setCoverFrame] = useState(defaultCoverFrame);
  const [coverError, setCoverError] = useState("");
  const [removeCover, setRemoveCover] = useState(false);
  const [published, setPublished] = useState(service?.published ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const coverPreview =
    cover ?? (removeCover ? null : service?.imageUrl ?? null);

  useEffect(() => {
    if (cover) return () => URL.revokeObjectURL(cover);
  }, [cover]);

  function chooseCover(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    if (
      !coverTypes.includes(file.type) &&
      !/\.(jpe?g|png|webp)$/i.test(file.name)
    ) {
      setCoverError("Escolha uma imagem JPG, JPEG, PNG ou WebP.");
      return;
    }
    if (file.size > coverLimit) {
      setCoverError("Escolha uma imagem de até 5 MB.");
      return;
    }
    setError("");
    setCoverError("");
    setCover(URL.createObjectURL(file));
    setCoverFrame(defaultCoverFrame);
    setRemoveCover(false);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setError("");
    if (
      title.trim().length < 2 ||
      title.trim().length > 120 ||
      description.trim().length < 2 ||
      description.trim().length > 2000
    ) {
      setError(
        "Confira o título e a descrição. Não use apenas espaços.",
      );
      return;
    }
    if (
      !category ||
      (!serviceCategories.includes(category) && category !== previousCategory)
    ) {
      setError("Escolha uma categoria para o anúncio.");
      return;
    }
    if (!/^(0|[1-9]\d{0,8})(\.\d{1,2})?$/.test(startingPrice.trim())) {
      setError(
        "Informe um preço não negativo, com até 9 dígitos inteiros e 2 casas decimais. Use ponto, como 2400.00.",
      );
      return;
    }
    setSaving(true);
    try {
      const serviceFields = {
        title: title.trim(),
        description: description.trim(),
        category,
        startingPrice: startingPrice.trim(),
        published,
        ...(removeCover ? { imageUrl: null } : {}),
      };
      const form = cover ? new FormData() : null;
      if (form && cover) {
        form.append("service", JSON.stringify(serviceFields));
        let image: Blob;
        try {
          image = await prepareServiceCover(cover, coverFrame);
        } catch {
          setCoverError("Não foi possível preparar a capa. Escolha outra imagem e tente novamente.");
          return;
        }
        form.append("cover", image, image.type === "image/webp" ? "capa.webp" : "capa.png");
      }
      const response = await authenticatedFetch(
        `${API_URL}/services${service ? `/${service.id}` : ""}`,
        {
          method: service ? "PATCH" : "POST",
          headers: form ? undefined : { "Content-Type": "application/json" },
          body: form ?? JSON.stringify(serviceFields),
        },
      );
      if (!response.ok) {
        setError(
          await serviceError(
            response,
            cover
              ? "Não foi possível enviar a imagem e salvar o anúncio. Tente novamente."
              : "Não foi possível salvar o serviço. Tente novamente.",
          ),
        );
        return;
      }
      onSaved();
    } catch {
      setError(
        "Não foi possível conectar. Verifique sua conexão e tente novamente.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      <form onSubmit={save} aria-busy={saving}>
        <fieldset disabled={saving}>
          <div className="mb-3">
            <label htmlFor="service-title" className="form-label">
              Título
            </label>
            <input
              id="service-title"
              className="form-control"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              minLength={2}
              maxLength={120}
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="service-description" className="form-label">
              Descrição
            </label>
            <textarea
              id="service-description"
              className="form-control"
              rows={4}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              minLength={2}
              maxLength={2000}
              required
            />
          </div>
          <div className="row g-3 mb-3">
            <div className="col-sm-6">
              <label htmlFor="service-category" className="form-label">
                Categoria
              </label>
              <select
                id="service-category"
                className="form-select"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                required
              >
                <option value="" disabled>
                  Selecione uma categoria
                </option>
                {hasLegacyCategory && (
                  <option value={previousCategory}>
                    {previousCategory} (categoria anterior)
                  </option>
                )}
                {serviceCategories.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-sm-6">
              <label htmlFor="service-price" className="form-label">
                Preço inicial (R$)
              </label>
              <input
                id="service-price"
                className="form-control"
                type="text"
                inputMode="decimal"
                value={startingPrice}
                onChange={(event) => setStartingPrice(event.target.value)}
                pattern="(0|[1-9][0-9]{0,8})([.][0-9]{1,2})?"
                maxLength={12}
                placeholder="2400.00"
                aria-describedby="service-price-help"
                title="Use ponto para os centavos, como 2400.00."
                required
              />
              <p id="service-price-help" className="form-text mb-0">
                Use ponto para os centavos. Ex.: 2400.00
              </p>
            </div>
          </div>
          <div className="mb-3">
            <label htmlFor="service-image" className="form-label">
              Escolher imagem{" "}
              <span className="text-secondary fw-normal">(opcional)</span>
            </label>
            <input
              id="service-image"
              type="file"
              className="form-control"
              accept={[...coverTypes, ".jpg", ".jpeg", ".png", ".webp"].join(",")}
              onChange={chooseCover}
              aria-describedby="service-image-help"
            />
            <p id="service-image-help" className="form-text">
              JPG, JPEG, PNG ou WebP de até 5 MB.
            </p>
            {coverError && (
              <p className="text-danger small" role="alert">{coverError}</p>
            )}
            {coverPreview && (
              <div className="service-cover-preview mt-3">
                {cover ? (
                  <ServiceCoverEditor
                    key={cover}
                    url={cover}
                    frame={coverFrame}
                    disabled={saving}
                    onChange={setCoverFrame}
                  />
                ) : (
                  <ServiceImage
                    title="Prévia da capa do anúncio"
                    imageUrl={coverPreview}
                  />
                )}
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm mt-2"
                  onClick={() => {
                    setCover(null);
                    setRemoveCover(true);
                    setCoverError("");
                    setError("");
                  }}
                >
                  Remover capa
                </button>
              </div>
            )}
            {!coverPreview && removeCover && service?.imageUrl && (
              <p className="form-text mb-0" role="status">
                A capa atual será removida ao salvar.
              </p>
            )}
          </div>
          <div className="form-check mb-4">
            <input
              id="service-published"
              type="checkbox"
              className="form-check-input"
              checked={published}
              onChange={(event) => setPublished(event.target.checked)}
            />
            <label htmlFor="service-published" className="form-check-label">
              Publicar na vitrine
            </label>
          </div>
        </fieldset>
        <div className="workspace-actions d-flex justify-content-end flex-wrap gap-2 dialog-actions">
          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={onClose}
            disabled={saving}
          >
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Salvando..." : "Salvar serviço"}
          </button>
        </div>
      </form>
    </div>
  );
}
