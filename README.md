# Freelike

Um repositório para o backend e o frontend do projeto acadêmico Freelike.

```text
appFreela/
├── backend/   # NestJS, Prisma e SQLite
└── frontend/  # Next.js e Bootstrap
```

Cada aplicação mantém seu próprio `package.json` e `package-lock.json`. Execute os comandos dentro da pasta correspondente. Não é necessário usar workspaces ou instalar dependências na raiz.

## Executar neste computador

Backend, em um terminal:

```powershell
cd C:\TrabalhoProfile\TrabalhoDefinitivo\appFreela\backend
node node_modules/@nestjs/cli/bin/nest.js start --watch
```

Frontend, em outro terminal:

```powershell
cd C:\TrabalhoProfile\TrabalhoDefinitivo\appFreela\frontend
node node_modules/next/dist/bin/next dev -p 3001
```

Abra http://localhost:3001. A API fica em http://localhost:3000/api.

Com Node e npm no PATH, os comandos habituais são `npm run start:dev` no backend e `npm run dev` no frontend. A cópia temporária do npm deste computador está em `backend/.tmp`; ela não é versionada.

## Preparar em outro computador

Siga o [README do backend](backend/README.md) para instalar dependências e preparar Prisma, variáveis de ambiente e banco. Siga o [README do frontend](frontend/README.md) para instalar e configurar a interface. Em cada pasta, use `npm ci` para respeitar as versões do respectivo lockfile.

Arquivos `.env`, bancos SQLite, dependências e saídas de build são locais e não são enviados ao GitHub. Os exemplos `.env.example` são versionados. O banco permanece em `backend/dev.db`; execute os comandos do backend nessa pasta para manter a resolução correta do caminho relativo.

## Verificação

Em cada aplicação, execute `npm run build` e `npm run lint`. O backend também possui os comandos de testes documentados em seu README.

O histórico anterior do backend permanece no mesmo repositório. A primeira versão do frontend foi incorporada nesta reorganização.
