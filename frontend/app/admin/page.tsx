"use client";

import Link from "next/link";

export default function Admin() {

    return (
        <div className="container py-4">
            <h1 className="h3 mb-3">Administração</h1>
            <p>Selecione o cadastro que deseja acessar.</p>
            <div className="d-flex flex-wrap gap-3">
                <Link href="/admin/users" className="btn btn-outline-primary">Gerenciar usuários</Link>
                <Link href="/admin/profiles" className="btn btn-outline-primary">Gerenciar perfis</Link>
            </div>
        </div>
    );
}
