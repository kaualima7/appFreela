# Frontend

Next.js e Bootstrap. Execute os comandos nesta pasta.

## Configuração inicial

```powershell
npm ci
Copy-Item .env.example .env.local
```

Não substitua um `.env.local` já configurado. A variável `NEXT_PUBLIC_API_URL` deve apontar para http://localhost:3000/api.

## Executar

Inicie o backend em outro terminal e execute:

```powershell
npm run dev
```

Acesse http://localhost:3001.

Neste computador, também pode iniciar sem o npm:

```powershell
node node_modules/next/dist/bin/next dev -p 3001
```

## Verificar

```powershell
npm run build
npm run lint
```

A vitrine consulta os serviços publicados na API. Login, cadastro e administração ainda precisam ser adaptados ao fluxo de cliente e freelancer.
