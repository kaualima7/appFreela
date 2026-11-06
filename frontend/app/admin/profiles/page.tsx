"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { API_URL, responseError } from "@/app/api";
import { getToken, authenticatedFetch } from "@/app/login/auth_service";

type User = { id: number; name: string; email: string };
type Profile = {
    id: number;
    userId: number;
    fullName: string;
    birthDate: string | null;
    avatarUrl: string | null;
    user: User;
};

async function fetchData(signal?: AbortSignal): Promise<[User[], Profile[]]> {
    const options = { headers: { Authorization: `Bearer ${getToken()}` }, signal };
    const [usersResponse, profilesResponse] = await Promise.all([
        authenticatedFetch(`${API_URL}/users`, options),
        authenticatedFetch(`${API_URL}/profiles`, options),
    ]);
    if (!usersResponse.ok) throw new Error(await responseError(usersResponse, "Não foi possível carregar os usuários."));
    if (!profilesResponse.ok) throw new Error(await responseError(profilesResponse, "Não foi possível carregar os perfis."));
    return [await usersResponse.json(), await profilesResponse.json()];
}

export default function Profiles() {
    const [users, setUsers] = useState<User[]>([]);
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [id, setId] = useState<number | null>(null);
    const [userId, setUserId] = useState("");
    const [fullName, setFullName] = useState("");
    const [birthDate, setBirthDate] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const availableUsers = users.filter((user) => !profiles.some((profile) => profile.userId === user.id));
    const canCreate = availableUsers.length > 0;

    useEffect(() => {
        const controller = new AbortController();
        fetchData(controller.signal)
            .then(([userList, profileList]) => {
                setUsers(userList);
                setProfiles(profileList);
            })
            .catch((err) => {
                if (!controller.signal.aborted) setError(err instanceof Error ? err.message : "Verifique se a API está ligada.");
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });
        return () => controller.abort();
    }, []);

    async function load() {
        setLoading(true);
        try {
            const [userList, profileList] = await fetchData();
            setUsers(userList);
            setProfiles(profileList);
        } finally {
            setLoading(false);
        }
    }

    function clearForm() {
        setId(null);
        setUserId("");
        setFullName("");
        setBirthDate("");
        setAvatarUrl("");
    }

    function edit(profile: Profile) {
        setId(profile.id);
        setUserId(String(profile.userId));
        setFullName(profile.fullName);
        setBirthDate(profile.birthDate?.slice(0, 10) || "");
        setAvatarUrl(profile.avatarUrl || "");
        setError("");
        setSuccess("");
        document.getElementById("profile-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    async function save(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (saving) return;
        setError("");
        setSuccess("");
        if (fullName.trim().length < 2) {
            setError("Informe um nome completo com pelo menos 2 caracteres.");
            return;
        }
        setSaving(true);
        try {
            const data = {
                fullName: fullName.trim(),
                birthDate: birthDate || null,
                avatarUrl: avatarUrl.trim() || null,
                ...(id === null ? { userId: Number(userId) } : {}),
            };
            const response = await authenticatedFetch(`${API_URL}/profiles${id === null ? "" : `/${id}`}`, {
                method: id === null ? "POST" : "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error(await responseError(response, "Não foi possível salvar o perfil."));
            clearForm();
            setSuccess(id === null ? "Perfil cadastrado." : "Perfil atualizado.");
            await load();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Não foi possível salvar. Verifique a API.");
        } finally {
            setSaving(false);
        }
    }

    async function remove(profile: Profile) {
        if (!window.confirm(`Excluir o perfil de ${profile.fullName}? O usuário será mantido.`)) return;
        setSaving(true);
        setError("");
        setSuccess("");
        try {
            const response = await authenticatedFetch(`${API_URL}/profiles/${profile.id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            if (!response.ok) throw new Error(await responseError(response, "Não foi possível excluir o perfil."));
            if (id === profile.id) clearForm();
            setSuccess("Perfil excluído.");
            await load();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Não foi possível excluir. Verifique a API.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <main className="container py-4">
            <h1 className="h3 mb-2">Perfis dos usuários</h1>
            <p className="text-secondary mb-4">Cadastre e atualize as informações complementares dos usuários.</p>

            {error && <div className="alert alert-danger" role="alert">{error}</div>}
            {success && <div className="alert alert-success" role="status">{success}</div>}

            <form id="profile-form" onSubmit={save} className="card card-body mb-4">
                <h2 className="h5 mb-3">{id === null ? "Cadastrar perfil" : "Editar perfil"}</h2>
                {!loading && id === null && !canCreate && (
                    <p className="alert alert-info">
                        {users.length === 0 ? "Cadastre um usuário antes de criar um perfil." : "Todos os usuários já possuem perfil. Você pode editar um perfil abaixo."}
                        {users.length === 0 && <> <Link href="/admin/users" className="text-decoration-underline">Cadastrar usuário</Link></>}
                    </p>
                )}
                <fieldset disabled={loading || saving || (id === null && !canCreate)}>
                    <div className="row g-3">
                        <div className="col-md-6">
                            <label htmlFor="profile-user" className="form-label">Usuário *</label>
                            <select id="profile-user" className="form-select" value={userId} onChange={(event) => setUserId(event.target.value)} required disabled={id !== null}>
                                <option value="">Selecione um usuário</option>
                                {(id === null ? availableUsers : users.filter((user) => String(user.id) === userId)).map((user) => (
                                    <option key={user.id} value={user.id}>{user.name} — {user.email}</option>
                                ))}
                            </select>
                            <div className="form-text">{id === null ? "Aparecem apenas usuários sem perfil." : "O usuário vinculado permanece o mesmo na edição."}</div>
                        </div>
                        <div className="col-md-6">
                            <label htmlFor="full-name" className="form-label">Nome completo *</label>
                            <input id="full-name" className="form-control" value={fullName} onChange={(event) => setFullName(event.target.value)} minLength={2} maxLength={120} required />
                        </div>
                        <div className="col-md-4">
                            <label htmlFor="birth-date" className="form-label">Data de nascimento</label>
                            <input id="birth-date" type="date" className="form-control" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} />
                        </div>
                        <div className="col-md-8">
                            <label htmlFor="avatar-url" className="form-label">URL do avatar</label>
                            <input id="avatar-url" type="url" pattern="https?://.+" className="form-control" placeholder="https://exemplo.com/foto.jpg" value={avatarUrl} onChange={(event) => setAvatarUrl(event.target.value)} maxLength={500} />
                            <div className="form-text">Nascimento e avatar são opcionais.</div>
                        </div>
                    </div>
                    <div className="d-flex gap-2 mt-3">
                        <button className="btn btn-primary" type="submit">{saving ? "Salvando..." : id === null ? "Cadastrar" : "Salvar alterações"}</button>
                        {id !== null && <button className="btn btn-outline-secondary" type="button" onClick={clearForm}>Cancelar</button>}
                    </div>
                </fieldset>
            </form>

            <div className="d-flex justify-content-between align-items-center mb-3">
                <h2 className="h5 mb-0">Perfis cadastrados ({profiles.length})</h2>
                <button className="btn btn-sm btn-outline-secondary" type="button" disabled={loading || saving} onClick={() => { setError(""); void load().catch((err) => setError(err instanceof Error ? err.message : "Não foi possível carregar os dados.")); }}>Atualizar lista</button>
            </div>
            {loading ? <p role="status">Carregando...</p> : profiles.length === 0 ? <p className="text-secondary">Nenhum perfil cadastrado.</p> : (
                <div className="table-responsive">
                    <table className="table table-striped align-middle">
                        <thead><tr><th>Avatar</th><th>Nome completo</th><th>Usuário</th><th>Nascimento</th><th className="text-end">Ações</th></tr></thead>
                        <tbody>
                            {profiles.map((profile) => (
                                <tr key={profile.id}>
                                    <td>
                                        {profile.avatarUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img key={profile.avatarUrl} src={profile.avatarUrl} alt={`Avatar de ${profile.fullName}`} width={48} height={48} className="rounded-circle object-fit-cover" onError={(event) => { event.currentTarget.hidden = true; }} />
                                        ) : <span className="text-secondary small">Sem avatar</span>}
                                    </td>
                                    <td>{profile.fullName}</td>
                                    <td>{profile.user.name}<br /><span className="text-secondary small">{profile.user.email}</span></td>
                                    <td>{profile.birthDate ? profile.birthDate.slice(0, 10).split("-").reverse().join("/") : "Não informada"}</td>
                                    <td className="text-end text-nowrap">
                                        <button type="button" className="btn btn-sm btn-outline-primary me-2" disabled={saving} onClick={() => edit(profile)}>Editar</button>
                                        <button type="button" className="btn btn-sm btn-outline-danger" disabled={saving} onClick={() => void remove(profile)}>Excluir</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </main>
    );
}
