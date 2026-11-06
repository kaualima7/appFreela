"use client";

import { useState, type FormEvent } from "react";
import { API_URL, serviceError } from "@/app/api";
import { authenticatedFetch } from "@/app/login/auth_service";
import type { FreelancerService } from "@/app/types/service";
import ServiceDialog from "./ServiceDialog";

export default function ServiceFormDialog({
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
  const [startingPrice, setStartingPrice] = useState(
    service?.startingPrice ?? "",
  );
  const [imageUrl, setImageUrl] = useState(service?.imageUrl ?? "");
  const [published, setPublished] = useState(service?.published ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setError("");
    if (
      title.trim().length < 2 ||
      title.trim().length > 120 ||
      description.trim().length < 2 ||
      description.trim().length > 2000 ||
      category.trim().length < 2 ||
      category.trim().length > 80
    ) {
      setError(
        "Confira o título, a descrição e a categoria. Não use apenas espaços.",
      );
      return;
    }
    if (!/^(0|[1-9]\d{0,8})(\.\d{1,2})?$/.test(startingPrice.trim())) {
      setError(
        "Informe um preço não negativo, com até 9 dígitos inteiros e 2 casas decimais. Use ponto, como 2400.00.",
      );
      return;
    }
    if (imageUrl.trim()) {
      try {
        const imageAddress = new URL(imageUrl.trim());
        if (
          !["http:", "https:"].includes(imageAddress.protocol) ||
          imageUrl.trim().length > 500
        )
          throw new Error();
      } catch {
        setError(
          "Informe uma URL de imagem válida, começando com http:// ou https://.",
        );
        return;
      }
    }
    setSaving(true);
    try {
      const response = await authenticatedFetch(
        `${API_URL}/services${service ? `/${service.id}` : ""}`,
        {
          method: service ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim(),
            category: category.trim(),
            startingPrice: startingPrice.trim(),
            imageUrl: imageUrl.trim() || null,
            published,
          }),
        },
      );
      if (!response.ok) {
        setError(
          await serviceError(
            response,
            "Não foi possível salvar o serviço. Tente novamente.",
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
    <ServiceDialog
      id="service-form"
      title={service ? "Editar serviço" : "Novo serviço"}
      busy={saving}
      onClose={onClose}
    >
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
              data-dialog-focus
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
              <input
                id="service-category"
                className="form-control"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                minLength={2}
                maxLength={80}
                required
              />
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
              URL da imagem{" "}
              <span className="text-secondary fw-normal">(opcional)</span>
            </label>
            <input
              id="service-image"
              type="url"
              className="form-control"
              value={imageUrl}
              onChange={(event) => setImageUrl(event.target.value)}
              maxLength={500}
              placeholder="https://exemplo.com/imagem.jpg"
              aria-describedby="service-image-help"
            />
            <p id="service-image-help" className="form-text mb-0">
              Para remover a imagem, deixe este campo vazio.
            </p>
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
        <div className="d-flex justify-content-end flex-wrap gap-2 dialog-actions">
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
    </ServiceDialog>
  );
}
