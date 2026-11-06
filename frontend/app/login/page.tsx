"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { API_URL, responseError } from "@/app/api";
import AuthLayout from "@/app/components/AuthLayout";
import { accountHome, saveSession, type AuthSession } from "./auth_service";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) {
        setError(
          response.status === 401
            ? "E-mail ou senha inválidos."
            : response.status === 400
              ? "Confira o e-mail e a senha informados."
              : await responseError(
                  response,
                  "Não foi possível entrar. Tente novamente.",
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
    <AuthLayout title="Entrar" description="Acesse sua conta no Freelike.">
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      <form onSubmit={submitForm} aria-busy={saving}>
        <div className="mb-3">
          <label htmlFor="login-email" className="form-label">
            E-mail
          </label>
          <input
            id="login-email"
            type="email"
            className="form-control"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="nome@exemplo.com"
            required
            disabled={saving}
          />
        </div>
        <div className="mb-4">
          <label htmlFor="login-password" className="form-label">
            Senha
          </label>
          <div className="input-group">
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              className="form-control"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={6}
              required
              disabled={saving}
            />
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              aria-pressed={showPassword}
              aria-controls="login-password"
              disabled={saving}
            >
              <i
                className={showPassword ? "bi bi-eye-slash" : "bi bi-eye"}
                aria-hidden="true"
              />
            </button>
          </div>
        </div>
        <button
          type="submit"
          className="btn btn-primary w-100"
          disabled={saving}
        >
          {saving ? "Entrando..." : "Entrar"}
        </button>
      </form>
      <p className="auth-form-link mt-4 mb-3">
        Ainda não tem uma conta? <Link href="/register">Criar conta</Link>
      </p>
      <Link href="/" className="auth-back-link">
        <i className="bi bi-arrow-left me-2" aria-hidden="true" />
        Voltar à vitrine
      </Link>
    </AuthLayout>
  );
}
