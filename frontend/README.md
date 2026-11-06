# Frontend

Next.js e Bootstrap. Execute os comandos nesta pasta, com o backend ligado em outro terminal.

## Configuração inicial

```powershell
npm ci
Copy-Item .env.example .env.local
```

Não substitua um `.env.local` já configurado. `NEXT_PUBLIC_API_URL` deve apontar para `http://localhost:3000/api`. Reinicie o frontend após alterar; para produção, configure antes do build. Não coloque segredos nessa variável pública.

## Executar

```powershell
npm run dev
```

Acesse http://localhost:3001. O backend deve estar rodando com `npm run start:dev` dentro de `backend/`.

Se Node/npm não forem encontrados neste computador, ajuste o PATH no terminal atual:

```powershell
$env:Path = "$env:USERPROFILE\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;$(Resolve-Path ..\backend\.tmp);$env:Path"
npm.cmd run dev
```

Para executar o compilado: `npm run build` e depois `npm run start`.

## Login e sessão

- `/register`: escolha obrigatória de Cliente ou Freelancer; envia `name`, `email`, `password` e `accountType`.
- `/login`: entrada única com e-mail e senha; o tipo de conta vem do backend.
- `/admin`: início da área do freelancer. `/client`: início da área do cliente.
- A sessão mantém a chave `auth_token` da base. Tokens antigos, sem dados complementares do usuário, continuam aceitos quando válidos.
- A identidade é consultada em `GET /users` com Bearer token antes de liberar as áreas. `401` limpa a sessão; `403` informa falta de permissão e preserva o token. O backend continua responsável pela autorização.
- Sair limpa o token e retorna à vitrine. O acesso é conferido novamente ao navegar, voltar pelo histórico ou retomar a aba.

A vitrine continua pública. As telas antigas `/admin/users` e `/admin/profiles` foram preservadas como exemplos da aula e só abrem para freelancers; ainda precisam de adaptação dos CRUDs ao Freelike. Serviços, likes, projetos e pagamentos não foram implementados nesta etapa.

## Verificar

```powershell
npm run build
npm run lint
npm run test:auth
```

`test:auth` verifica o helper de sessão com respostas controladas, sem usar o banco. Para conferir a interface, cadastre uma conta de cada tipo, teste os destinos, logout e acesso direto às áreas. Nos testes desta etapa, as contas foram criadas em SQLite temporário; não foram adicionadas ao banco local. O aviso de lint sobre `<img>` em `ProductCard` pertence ao exemplo original, não usado na vitrine.
