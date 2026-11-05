# Backend

NestJS, Prisma e SQLite. Use Node.js 24 e npm.

## Configuração inicial

Execute nesta pasta:

```powershell
npm ci
Copy-Item .env.example .env
```

Não substitua um `.env` já configurado. Preencha `JWT_SECRET` com um segredo de pelo menos 32 caracteres. Para gerar:

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
npm run prisma:generate
node -e "new (require('better-sqlite3'))('dev.db').close()"
npm run db:migrate
```

## Executar

```powershell
npm run start:dev
```

API: http://localhost:3000/api

Neste computador, caso o npm não seja encontrado:

```powershell
$env:Path = "$PWD\.tmp;$env:Path"
npm.cmd run start:dev
```

## Verificar

```powershell
npm run build
npm run lint
npm test -- --runInBand
npm run test:integration
```

O `.env`, o banco local e as dependências não são versionados.
