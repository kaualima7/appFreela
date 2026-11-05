"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { API_URL, responseError } from "@/app/api";
import { saveToken } from "@/app/login/auth_service";

export default function Register() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    async function save(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSaving(true);
        setError("");
        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: name.trim(), email: email.trim(), passwordHash: password }),
            });
            if (!response.ok) throw new Error(await responseError(response, "Não foi possível criar a conta. Verifique se o e-mail já está cadastrado."));
            const data = await response.json();
            saveToken(data.access_token);
            router.replace("/admin");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Não foi possível conectar à API.");
        } finally {
            setSaving(false);
        }
    }

    return <main className="container py-5" style={{ maxWidth: 560 }}>
        <div className="alert alert-info mb-4" role="note">
            Cadastro em preparação. Esta tela será revisada na próxima etapa. <Link href="/" className="alert-link">Voltar à vitrine</Link>
        </div>
        <h1 className="h3 mb-3">Criar conta</h1>
        {error && <div className="alert alert-danger" role="alert">{error}</div>}
        <form onSubmit={save} className="card card-body">
            <label htmlFor="register-name" className="form-label">Nome</label>
            <input id="register-name" className="form-control mb-3" value={name} onChange={(event) => setName(event.target.value)} minLength={3} maxLength={100} required />
            <label htmlFor="register-email" className="form-label">E-mail</label>
            <input id="register-email" type="email" className="form-control mb-3" value={email} onChange={(event) => setEmail(event.target.value)} required />
            <label htmlFor="register-password" className="form-label">Senha</label>
            <input id="register-password" type="password" className="form-control mb-3" value={password} onChange={(event) => setPassword(event.target.value)} minLength={6} required />
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Cadastrando..." : "Cadastrar"}</button>
        </form>
        <Link href="/login" className="d-inline-block mt-3 text-primary">Já tenho uma conta</Link>
    </main>;
}
