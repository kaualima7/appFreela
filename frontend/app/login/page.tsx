"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { API_URL, responseError } from "@/app/api";
import { saveToken } from "./auth_service";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();

    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [erro, setErro] = useState("");

    async function submitForm(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setErro("");
       try {
       const resp = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                email: email, password: password
            })
        })
        if (!resp.ok) {
            setErro(await responseError(resp, "Não foi possível entrar."));
            return;
        }
        const dados = await resp.json();
        saveToken(dados.access_token);
        router.replace("/admin");
       } catch {
           setErro("Não foi possível conectar à API. Verifique se o backend está ligado.");
       }
    }

    return (
        <div className="container py-5">
            <div className="alert alert-info mb-4" role="note">
                Acesso em preparação. Esta tela será revisada na próxima etapa. <Link href="/" className="alert-link">Voltar à vitrine</Link>
            </div>
            <h1 className="mb-3">Login</h1>

            {erro != "" && (
                <p>{erro}</p>
            )}


            <form onSubmit={submitForm} className="card p-3">
                <div className="mb-3">
                    <label className="form-label">E-mail</label>
                    <input
                        onChange={(e)=> setEmail(e.target.value)}
                        type="email"
                        className="form-control"
                        placeholder="nome@exemplo.com"
                        required />
                </div>

                <div className="mb-3">
                    <label className="form-label">Senha</label>
                    <div className="input-group">
                        <input
                            onChange={(e)=> setPassword(e.target.value)}
                            type={showPassword ? "text" : "password"}
                            className="form-control"
                            placeholder="••••••••"
                            required />
                        <div className="input-group-append">
                            <button
                                onClick={() => setShowPassword(!showPassword)}
                                type="button"
                                className="btn btn-outline-secondary">
                                {showPassword ? (
                                    <i className="bi bi-eye"></i>
                                ) : (
                                    <i className="bi bi-eye-slash"></i>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                <button className="btn btn-dark" type="submit">
                    Entrar
                </button>
            </form>
            <p className="mt-3">Primeiro acesso? <Link href="/register" className="text-primary text-decoration-underline">Criar uma conta</Link></p>
        </div>
    );
}
