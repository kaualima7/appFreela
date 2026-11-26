"use client";

// Mostra o formulário de login da Web.
// submitForm envia os dados à API; auth_service.ts salva o token e escolhe a página de destino.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { API_URL, responseError } from "@/app/api";
import AuthLayout from "@/app/components/AuthLayout";
import { accountHome, saveSession, type AuthSession } from "./auth_service";

export default function LoginPage() {
  const router = useRouter();
  //guarda os valores digitados no login; setEmail e setPassword atualizam esses estados
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  //executa a tentativa de login quando o formulário é enviado
  async function submitForm(event: FormEvent<HTMLFormElement>) {
    //impede o envio padrão do navegador para controlar o login pelo código
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      //envia o pedido de login para a API e aguarda a resposta, guardada em response
      //post /auth/login é recebido pelo método login em backend/src/auth/auth.controller.ts
      const response = await fetch(`${API_URL}/auth/login`, {
        //usa o método POST e informa que os dados vão em formato JSON
        method: "POST",
        headers: { "Content-Type": "application/json" },
        //envia e-mail e senha digitados; trim tira espaços das pontas do e-mail
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
      // Login aceito: lê o token e os dados da conta para salvar a sessão e abrir a página de destino.
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
      {/* o envio do formulário chama submitForm, por exemplo ao clicar em Entrar */}
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
      <Link href="/explorar" className="auth-back-link">
        <i className="bi bi-arrow-left me-2" aria-hidden="true" />
        Voltar à vitrine
      </Link>
    </AuthLayout>
  );
}
