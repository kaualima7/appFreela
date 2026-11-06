"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { API_URL, responseError } from "@/app/api";
import AuthLayout from "@/app/components/AuthLayout";
import {
  accountHome,
  saveSession,
  type AccountType,
  type AuthSession,
} from "@/app/login/auth_service";

export default function Register() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accountType, setAccountType] = useState<AccountType | "">("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    if (!accountType || name.trim().length < 3 || name.trim().length > 100) {
      setError("Informe seu nome e escolha o tipo de conta.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          accountType,
        }),
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) {
        setError(
          response.status === 409
            ? "Este e-mail já está cadastrado."
            : response.status === 400
              ? "Confira os campos informados."
              : await responseError(
                  response,
                  "Não foi possível criar a conta. Tente novamente.",
                ),
        );
        return;
      }
      const session: AuthSession = await response.json();
      saveSession(session);
      router.replace(accountHome(session.user.accountType));
    } catch {
      setError(
        "Não foi possível conectar. Verifique sua conexão e tente novamente.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <AuthLayout
      title="Criar conta"
      description="Escolha como você quer usar o Freelike."
    >
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      <form onSubmit={save} aria-busy={saving}>
        <fieldset className="mb-4" disabled={saving}>
          <legend className="form-label fs-6 mb-2">Tipo de conta</legend>
          <div className="row g-2">
            <div className="col-sm-6">
              <label
                className={`account-option h-100 ${accountType === "CLIENT" ? "selected" : ""}`}
              >
                <input
                  className="form-check-input mt-1"
                  type="radio"
                  name="accountType"
                  value="CLIENT"
                  checked={accountType === "CLIENT"}
                  onChange={() => setAccountType("CLIENT")}
                  required
                />
                <span>
                  <strong className="d-block">Cliente</strong>
                  <span className="small text-secondary">
                    Procurar serviços e demonstrar interesse.
                  </span>
                </span>
              </label>
            </div>
            <div className="col-sm-6">
              <label
                className={`account-option h-100 ${accountType === "FREELANCER" ? "selected" : ""}`}
              >
                <input
                  className="form-check-input mt-1"
                  type="radio"
                  name="accountType"
                  value="FREELANCER"
                  checked={accountType === "FREELANCER"}
                  onChange={() => setAccountType("FREELANCER")}
                  required
                />
                <span>
                  <strong className="d-block">Freelancer</strong>
                  <span className="small text-secondary">
                    Publicar e gerenciar serviços.
                  </span>
                </span>
              </label>
            </div>
          </div>
        </fieldset>
        <div className="mb-3">
          <label htmlFor="register-name" className="form-label">
            Nome
          </label>
          <input
            id="register-name"
            className="form-control"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            minLength={3}
            maxLength={100}
            required
            disabled={saving}
          />
        </div>
        <div className="mb-3">
          <label htmlFor="register-email" className="form-label">
            E-mail
          </label>
          <input
            id="register-email"
            type="email"
            className="form-control"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            disabled={saving}
          />
        </div>
        <div className="mb-4">
          <label htmlFor="register-password" className="form-label">
            Senha
          </label>
          <input
            id="register-password"
            type="password"
            className="form-control"
            autoComplete="new-password"
            aria-describedby="password-help"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={6}
            required
            disabled={saving}
          />
          <p id="password-help" className="form-text mb-0">
            Use pelo menos 6 caracteres.
          </p>
        </div>
        <button
          type="submit"
          className="btn btn-primary w-100"
          disabled={saving}
        >
          {saving ? "Criando conta..." : "Criar conta"}
        </button>
      </form>
      <p className="auth-form-link mt-4 mb-3">
        Já tem uma conta? <Link href="/login">Entrar</Link>
      </p>
      <Link href="/" className="auth-back-link">
        <i className="bi bi-arrow-left me-2" aria-hidden="true" />
        Voltar à vitrine
      </Link>
    </AuthLayout>
  );
}
