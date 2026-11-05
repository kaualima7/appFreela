# Freelike — backend acadêmico

API NestJS + Prisma + SQLite para freelancers publicarem serviços e organizarem contatos, projetos e pagamentos. Contas de clientes contratantes demonstram interesse e acompanham somente os projetos vinculados a elas. O frontend será implementado separadamente.

## Preparação e execução

Use Node.js 24 e npm. Execute os comandos na pasta `C:\TrabalhoProfile\TrabalhoDefinitivo\appFreela\backend`.

```powershell
npm ci
Copy-Item .env.example .env
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

Copie o segredo gerado para `JWT_SECRET` no `.env`. Não compartilhe esse valor. Não sobrescreva um `.env` já configurado. As variáveis são:

| Variável | Uso |
| --- | --- |
| `DATABASE_URL` | SQLite; padrão do exemplo: `file:./dev.db`, relativo à raiz do backend |
| `JWT_SECRET` | Segredo próprio com pelo menos 32 caracteres; obrigatório |
| `PORT` | Porta do backend; padrão `3000` |
| `FRONTEND_URL` | Origem permitida no CORS; padrão `http://localhost:3001` |

```powershell
npm run prisma:generate
# Para um banco NOVO no caminho padrão, crie o arquivo vazio antes da migration:
node -e "new (require('better-sqlite3'))('dev.db').close()"
npm run db:migrate
npm run start:dev
```

A abertura com `better-sqlite3` preserva um arquivo já existente. Neste computador, o Prisma 7.10 retornou `Schema engine error` ao tentar migrar um arquivo inexistente; criar o SQLite vazio antes resolveu. Se escolher outro `DATABASE_URL`, use o mesmo caminho na criação do arquivo. Para banco existente com histórico Prisma, aplique apenas as migrations pendentes com `npm run db:migrate`; não use `migrate reset` ou `db push --force-reset`. Se houver tabelas sem histórico de migrations, faça a conferência e o baseline antes de aplicar; não marque migrations como aplicadas sem comparar o esquema.

API: `http://localhost:3000/api`. Para executar o compilado:

```powershell
npm run build
npm run start:prod
```

### Situação deste computador

Foram instaladas as dependências do `package-lock.json`, sem atualizar suas versões. Prisma Client foi gerado; `.env` foi criado com segredo aleatório sem divulgá-lo; um `dev.db` novo recebeu as duas migrations. Nenhum banco anterior existia neste checkout. `.env`, bancos, `node_modules`, cliente gerado e arquivos temporários estão ignorados pelo Git.

O Node disponível é `24.22.1`. O npm não estava no PATH; uma cópia local do npm foi preparada em `.tmp`, sem instalação global. Para utilizar os comandos acima nesta sessão de PowerShell:

```powershell
Set-Location C:\TrabalhoProfile\TrabalhoDefinitivo\appFreela\backend
$env:Path = "$PWD\.tmp;$env:Path"
npm.cmd run start:dev
```

Também é possível iniciar diretamente com `node node_modules/@nestjs/cli/bin/nest.js start --watch`. A cópia em `.tmp` é apenas uma ferramenta local ignorada; em outro computador com Node e npm instalados, use os comandos normais. O campo `allowScripts` do `package.json` permite os scripts de instalação de Prisma e better-sqlite3 nas versões de npm que exigem essa autorização.

## Modelo e regras de acesso

- `User` é a conta autenticada, com `accountType` igual a `FREELANCER` ou `CLIENT`. O cadastro sem esse campo continua criando um freelancer. O tipo não pode ser alterado pelas rotas de edição de usuário.
- `Client` continua sendo um contato particular do freelancer (`userId`). `clientUserId` é um vínculo opcional e explícito com uma conta `CLIENT`. E-mails coincidentes não criam vínculo.
- `Service` pertence a um freelancer (`freelancerId`). Nasce como rascunho se `published` for omitido. O catálogo e os detalhes públicos mostram somente publicados, com nome e perfil público selecionado do profissional; não mostram e-mail, senha ou nascimento.
- `ServiceInterest` liga serviço e conta contratante. O par `serviceId + clientUserId` é único no banco. Confirmar interesse não cria contato, projeto ou contratação.
- O proprietário do serviço vê apenas nome e e-mail das contas interessadas, além do identificador necessário para o vínculo. Retirar interesse remove essa entrada. Não há lista pública de contas ou interessados.
- Todos os projetos de um contato ficam disponíveis à conta indicada em `clientUserId`, inclusive projetos anteriores ao vínculo. A alteração explícita desse campo transfere o acesso desses projetos; `null` retira o acesso. O frontend deve informar esse efeito na edição do contato. O freelancer deve conferir a conta antes de vinculá-la.
- Excluir uma conta `CLIENT` remove seus interesses e torna seus vínculos `null`, preservando contatos, projetos e pagamentos do freelancer. As exclusões em cascata já existentes para conta freelancer → contatos → projetos → pagamentos continuam válidas. Excluir serviço remove seus interesses.
- A conta contratante usa somente consultas no portal. Respostas selecionadas omitem contato, notas internas, telefone e outros dados privados. `description` do projeto é visível ao contratante; use `Client.notes` para observações internas.
- O JWT identifica o usuário por `sub` e expira em um dia. O guard consulta a conta no banco a cada requisição protegida e aplica o tipo exigido pela rota. Recursos de outro proprietário retornam `404`; tipo de conta incompatível retorna `403`; token ausente ou inválido retorna `401`.
- Valores monetários são textos não negativos, com até 9 dígitos inteiros e 2 casas decimais: `"1500.50"`. São persistidos com `Prisma.Decimal` e retornados como texto com duas casas. Não envie números JSON ou vírgulas. Datas usam ISO 8601; prazo não pode preceder início. Pagamento `PAID` exige `paidAt`; demais estados não aceitam data de pagamento.

## Rotas para o frontend

Todas as rotas abaixo têm prefixo `/api`. Nas protegidas envie `Authorization: Bearer <access_token>`. `F` significa `FREELANCER`, `C` significa `CLIENT`, e `conta` aceita ambos. Listas retornam arrays JSON, inclusive `[]`. Criações retornam `201`; consultas, edições e exclusões retornam `200`.

| Método e rota | Autenticação | Campos principais | Resposta |
| --- | --- | --- | --- |
| `POST /auth/register` | pública | `name`, `email`, `password`, `accountType?` | `{ access_token, user: { id, name, email, accountType } }` |
| `POST /auth/login` | pública | `email`, `password` | mesmo formato do cadastro |
| `POST /users` | pública | mesmos campos do cadastro | usuário seguro, sem token ou hash |
| `GET /users` | conta | — | `[próprio usuário]`, com `accountType` |
| `PATCH /users/:id` | própria conta | `name?`, `email?` | próprio usuário seguro |
| `DELETE /users/:id` | própria conta | — | `{ message }` |
| `POST /profiles` | conta | `fullName`, `birthDate?`, `avatarUrl?` | perfil próprio |
| `GET /profiles/:id` / `PATCH /profiles/:id` | própria conta | edição: campos opcionais do perfil | perfil próprio |
| `GET /services` | pública | — | `PublicService[]` |
| `GET /services/:id` | pública | — | `PublicService` publicado |
| `GET /services/mine` / `GET /services/mine/:id` | F proprietário | — | `Service[]` / `Service`, incluindo rascunhos |
| `POST /services` | F | `title`, `description`, `category`, `startingPrice`, `imageUrl?`, `published?` | `Service` |
| `PATCH /services/:id` | F proprietário | mesmos campos, opcionais; `imageUrl: null` remove imagem | `Service` |
| `DELETE /services/:id` | F proprietário | — | `{ message }` |
| `POST /services/:id/interest` | C | corpo vazio; identidade vem do token | `{ id, serviceId, clientUserId, createdAt }` |
| `DELETE /services/:id/interest` | C, próprio interesse | — | `{ message }` |
| `GET /interests` | C | — | `[{ id, serviceId, createdAt, service: PublicService & { published } }]` |
| `GET /services/:id/interests` | F proprietário | — | `[{ id, serviceId, createdAt, clientUser: { id, name, email } }]` |
| `POST /clients` | F | `name`, `email?`, `phone?`, `company?`, `notes?`, `clientUserId?` | contato particular |
| `GET /clients` / `GET /clients/:id` | F proprietário | — | contatos / contato |
| `PATCH /clients/:id` / `DELETE /clients/:id` | F proprietário | edição: campos opcionais; `clientUserId: null` desvincula | contato / `{ message }` |
| `POST /projects` | F dono do contato | `clientId`, `title`, `value`, `description?`, `status?`, `startDate?`, `deadline?` | projeto com `value` textual |
| `GET /projects` / `GET /projects/:id` | F proprietário | lista: `clientId?` como filtro | projetos / projeto |
| `PATCH /projects/:id` / `DELETE /projects/:id` | F proprietário | edição: campos opcionais, exceto `clientId` | projeto / `{ message }` |
| `POST /payments` | F dono do projeto | `projectId`, `amount`, `dueDate`, `paidAt?`, `paymentMethod?`, `status?` | pagamento com `amount` textual |
| `GET /payments` / `GET /payments/:id` | F proprietário | lista: `projectId?` como filtro | pagamentos / pagamento |
| `PATCH /payments/:id` / `DELETE /payments/:id` | F proprietário | edição: campos opcionais, exceto `projectId`; `paidAt` aceita `null` | pagamento / `{ message }` |
| `GET /client-portal/projects` / `GET /client-portal/projects/:id` | C vinculado | — | `ClientProject[]` / `ClientProject` |
| `GET /client-portal/payments` / `GET /client-portal/payments/:id` | C vinculado | lista: `projectId?` | `ClientPayment[]` / `ClientPayment` |

Formatos de resposta:

- `PublicService`: `{ id, title, description, category, startingPrice, imageUrl, freelancer: { id, name, profile: { fullName, avatarUrl } | null } }`.
- `Service`: `{ id, freelancerId, title, description, category, startingPrice, imageUrl, published, createdAt, updatedAt }`.
- `ClientProject`: `{ id, title, description, status, startDate, deadline, value, projectOwner: { id, name } }`.
- `ClientPayment`: `{ id, projectId, amount, dueDate, paidAt, paymentMethod, status }`.
- Erros NestJS: `{ statusCode, message, error }`; erros de DTO podem trazer um array em `message`. Interesse duplicado retorna `409`; retirar interesse inexistente retorna `404`. A retirada continua permitida após despublicação. Os próprios interesses mantêm os dados do serviço e o campo `published` para o cliente perceber a indisponibilidade.

Estados de projeto: `PLANNED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`. Estados de pagamento: `PENDING`, `PAID`, `CANCELLED`. Filtros de painel agora são opcionais; omitindo-os, o freelancer recebe todos os seus registros. Campos de identidade ou proprietário enviados fora dos DTOs não são usados para mudar a autoria.

## Exemplo do fluxo principal

Os IDs abaixo são ilustrativos; use os retornados pela API. Primeiro crie um freelancer e um contratante com `POST /auth/register`:

```json
{ "name": "Ana Freelancer", "email": "ana@example.com", "password": "SenhaExemplo123", "accountType": "FREELANCER" }
```

```json
{ "name": "Bruno Cliente", "email": "bruno@example.com", "password": "SenhaExemplo123", "accountType": "CLIENT" }
```

Com o token da Ana, `POST /services`:

```json
{ "title": "Site institucional", "description": "Desenvolvimento de site para empresas", "category": "Web", "startingPrice": "1500.50", "published": true }
```

O visitante usa `GET /services` e `GET /services/1`. Com o token do Bruno, `POST /services/1/interest` com `{}` confirma interesse; `GET /interests` o consulta e `DELETE /services/1/interest` o retira. Ao confirmar, seu nome e e-mail ficam disponíveis ao freelancer dono desse serviço. O frontend deve comunicar isso antes da confirmação.

Ana consulta `GET /services/1/interests`. Após combinar a contratação, usa o `clientUser.id` retornado para criar explicitamente um contato com `POST /clients` (ou atualizar um contato próprio em `PATCH /clients/:id`):

```json
{ "name": "Bruno - contato", "email": "bruno@example.com", "clientUserId": 2, "notes": "Observação interna do freelancer" }
```

Com o `id` do contato, Ana cria o projeto em `POST /projects`:

```json
{ "clientId": 1, "title": "Site da empresa", "description": "Etapa inicial: apresentação do layout", "value": "1500.50", "startDate": "2026-11-05", "deadline": "2026-11-20" }
```

Registra a parcela em `POST /payments`:

```json
{ "projectId": 1, "amount": "750.25", "dueDate": "2026-11-10" }
```

Ana usa `PATCH /projects/1` com `{ "status": "IN_PROGRESS" }` e `PATCH /payments/1` com `{ "status": "PAID", "paidAt": "2026-11-10" }` para atualizar os registros. Bruno acompanha com `GET /client-portal/projects`, `GET /client-portal/projects/1` e `GET /client-portal/payments?projectId=1`. Não recebe as notas do contato e não pode editar esses recursos. Para os painéis da Ana, `GET /projects` e `GET /payments` dispensam filtro.

## Migrations e verificações

`20261001004209_init` permanece intacta. A migration nova `20261105030000_marketplace` adiciona `User.accountType` com padrão `FREELANCER`, `Client.clientUserId` anulável com chave estrangeira, tabelas `Service` e `ServiceInterest` e seus índices, incluindo unicidade do interesse. Usa `ALTER TABLE ... ADD COLUMN`, sem apagar ou reconstruir tabelas antigas. Não relaciona registros por e-mail.

```powershell
npm run build
npm run lint
npm run test:integration
npm test -- --runInBand
npm run test:e2e -- --runInBand
```

A integração cria bancos exclusivos em `.tmp/freelike-*`, aplica as migrations e os remove ao terminar. Não copia nem altera `dev.db`; não requer dados ou credenciais locais. Cada execução usa um segredo temporário. Execute após `prisma:generate`. A suíte verifica preservação da migration sobre dados antigos, autenticação, duas contas freelancer e duas cliente, autoria, valores, prazos, estados, cascatas, catálogo público, interesse duplicado no HTTP e no banco, retirada, vínculo explícito, consultas de painel, privacidade e CORS. Os testes Jest cobrem o acesso protegido e a compatibilidade do cadastro antigo. O teste inicial foi ajustado porque a rota raiz já exigia autenticação.

## Roteiro para explicar demonstrar interesse

1. O frontend envia `POST /api/services/:id/interest` com Bearer token e corpo vazio. O cliente não escolhe o `clientUserId` na requisição.
2. Antes do controller, `JwtAuthGuard` valida assinatura e expiração do JWT, consulta `UsersService.findById` e preenche `request.user` com `sub` e `accountType` vindos da conta existente. O decorator `@AccountTypes('CLIENT')` exige a conta contratante.
3. `ServicesController.confirmInterest` recebe o parâmetro com `ParseIntPipe` e chama `ServicesService.confirmInterest(serviceId, request.user.sub)`. O controller trata HTTP; a regra fica no service. A injeção de dependências do Nest fornece o service pelo construtor.
4. O service verifica se o serviço existe e está publicado. Depois usa `PrismaService.serviceInterest.create` para gravar os IDs. As chaves estrangeiras garantem as relações; `@@unique([serviceId, clientUserId])` impede duplicação mesmo em requisições simultâneas. O erro Prisma `P2002` vira `ConflictException` (`409`). A criação normal retorna `201`.
5. O banco guarda somente o interesse. Nenhum projeto é criado. Em outra operação, o freelancer consulta os interessados; o service verifica o proprietário e usa `select` para devolver somente nome, e-mail e identificador da conta.

Conceitos das aulas usados: módulos NestJS, controllers e decorators de rotas, services com injeção de dependências, DTOs com class-validator/ValidationPipe, parâmetros validados, autenticação JWT e bcrypt, consultas Prisma, relações e migrations. As decisões adicionais são permissões por tipo de conta, filtro por proprietário, respostas selecionadas para privacidade e restrição única no banco. A distinção essencial é: `Client` é o contato particular; `User` é a conta que autentica; `ServiceInterest` registra intenção; `Project` registra o trabalho combinado pelo freelancer.
