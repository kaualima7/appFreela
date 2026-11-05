"use client";

import { getToken } from "@/app/login/auth_service";
import { useEffect, useState, type FormEvent } from "react";
import { API_URL, responseError } from "@/app/api";

type User = {
    id: number;
    name: string;
    email: string;
    passwordHash?: string;
};

const API = `${API_URL}/users`;

export default function Users() {


    const [id, setId] = useState<number | string | null>(null);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [users, setUsers] = useState<User[]>([]);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    function edit(user: User) {
        setId(user.id);
        setName(user.name);
        setEmail(user.email);
    }

    async function remove(userId: User["id"]) {
        if (!window.confirm("Excluir este usuário? O perfil vinculado também será excluído.")) return;
        setError("");
        try {
        const response = await fetch(`${API}/${userId}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${getToken()}`,
            },
        });
        if (!response.ok) throw new Error(await responseError(response, "Não foi possível excluir o usuário."));
        if (id === userId) { setId(null); setName(""); setEmail(""); }
        await load();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Não foi possível excluir o usuário.");
        }
    }

    async function load() {
        try {
            const response = await fetch(API, {
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            if (!response.ok)
                throw new Error("Não foi possível carregar os usuários.");
            setUsers(await response.json());
        } catch {
            setError("Não foi possível carregar os usuários. Verifique a API.");
        }
    }

    async function save(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSaving(true);
        setError("");
        try {
        const response = await fetch(id === null ? API : `${API}/${id}`, {
            method: id === null ? "POST" : "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getToken()}`,
            },
            body: JSON.stringify({
                name: name,
                email: email,
                passwordHash: "123456",
            }),
        })
        if (!response.ok) throw new Error(await responseError(response, "Não foi possível salvar o usuário."));
        setId(null);
        setName("");
        setEmail("");
        await load();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Não foi possível salvar o usuário.");
        } finally {
            setSaving(false);
        }
    }

    useEffect(() => {
        void load();
    }, []);

    return (
        <main className="container py-4">
            <h1 className="h3 mb-4">Usuários</h1>

            {error && (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            )}


            <form onSubmit={save} className="row g-3 mb-4">
                <div className="col-md-5">
                    <label className="form-label" htmlFor="name">
                        Nome
                    </label>
                    <input
                        id="name"
                        className="form-control"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        required
                    />

                </div>
                <div className="col-md-5">
                    <label className="form-label" htmlFor="email">
                        E-mail
                    </label>
                    <input
                        id="email"
                        className="form-control"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                    />
                </div>
                <div className="col-md-2 d-flex align-items-end">
                    <button className="btn btn-primary" type="submit" disabled={saving}>
                        {id === null ? "Cadastrar" : "Salvar"}
                    </button>
                    {id !== null && <button className="btn btn-outline-secondary ms-2" type="button" onClick={() => { setId(null); setName(""); setEmail(""); }}>Cancelar</button>}
                </div>
            </form>
            <p className="small text-secondary">Novos usuários recebem a senha inicial 123456.</p>

            <div className="table-responsive">
                <table className="table table-striped align-middle">
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>E-mail</th>
                            <th className="text-end">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id}>
                                <td>{user.name}</td>
                                <td>{user.email}</td>
                                <td className="text-end">
                                    <button
                                        className="btn btn-sm btn-outline-primary me-2"
                                        onClick={() => edit(user)}
                                    >
                                        Editar
                                    </button>
                                    <button
                                        className="btn btn-sm btn-outline-danger"
                                        onClick={() => void remove(user.id)}
                                    >
                                        Excluir
                                    </button>
                                </td>

                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

        </main>
    );
}
