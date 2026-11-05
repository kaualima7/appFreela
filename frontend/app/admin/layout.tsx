"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { isAuthenticated } from "../login/auth_service";
import Link from "next/link";
import { clearToken } from "../login/auth_service";

export default function RootLayout({ children }: LayoutProps<"/">) {

    const router = useRouter();
    const [autenticado, setAutenticado] = useState(false);
    useEffect(() => {
        if (!isAuthenticated()) {
            router.replace("/login");
            return;
        }
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setAutenticado(true);
    }, [router]);

    if (!autenticado) return null;

    return <>
        <nav className="border-bottom bg-light" aria-label="Administração">
            <div className="container d-flex flex-wrap align-items-center gap-3 py-3">
                <Link href="/admin" className="fw-bold me-auto">Administração</Link>
                <Link href="/admin/users">Usuários</Link>
                <Link href="/admin/profiles">Perfis</Link>
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => { clearToken(); router.replace("/login"); }}>Sair</button>
            </div>
        </nav>
        {children}
    </>;
}
