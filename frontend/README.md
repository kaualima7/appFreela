# Frontend

Next.js e Bootstrap.

## Instalar

```powershell
npm ci
Copy-Item .env.example .env.local
```

Se `.env.local` já existir, mantenha o arquivo. Configure `NEXT_PUBLIC_API_URL=http://localhost:3000/api`.

## Executar

Com o backend ligado em outro terminal:

```powershell
npm run dev
```

Acesse http://localhost:3001.

## Verificar

```powershell
npm run build
npm run lint
npm run test:auth
```
