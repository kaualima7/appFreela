# Freelike — frontend, etapa 1

Base de Next.js da aula, extraída de `Trabalho aula/frontapp-final.zip` para uma pasta nova. Esta etapa entrega somente a preparação e a vitrine pública conectada ao backend.

## Como iniciar

Use dois terminais. No primeiro, inicie o backend:

```powershell
Set-Location C:\TrabalhoProfile\TrabalhoDefinitivo\appFreela\backend
node node_modules/@nestjs/cli/bin/nest.js start --watch
```

No segundo, inicie o frontend:

```powershell
Set-Location C:\TrabalhoProfile\TrabalhoDefinitivo\appFreela\frontend
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Não sobrescreva um `.env.local` já configurado. Neste computador as dependências e o `.env.local` já foram preparados, então basta iniciar os dois servidores. Abra [http://localhost:3001](http://localhost:3001). Os scripts `dev` e `start` já utilizam a porta 3001.

O npm não estava no PATH desta sessão. Para usar a cópia local preparada junto ao backend:

```powershell
$env:Path = "C:\TrabalhoProfile\TrabalhoDefinitivo\appFreela\backend\.tmp;$env:Path"
npm.cmd run dev
```

Também é possível iniciar diretamente com `node node_modules/next/dist/bin/next dev -p 3001`. Em outro computador, use Node e npm instalados normalmente. As versões de Next.js e React do ZIP foram mantidas. Bootstrap `5.3.8` e Bootstrap Icons `1.13.1`, já usados via CDN na aula, agora são dependências locais; a vitrine não depende de um CDN para estilos ou ícones.

## Configuração da API

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

A variável inclui `/api`. Ela é pública: não coloque senhas ou segredos nela. Reinicie o servidor de desenvolvimento após alterar. Para o compilado, configure antes de `npm run build`, pois o Next incorpora variáveis `NEXT_PUBLIC_*` ao JavaScript do navegador. O backend deve permitir a origem `http://localhost:3001` no CORS, como já configurado.

## O que a vitrine faz

Ao abrir `/`, consulta `GET /api/services`, sem autenticação, utilizando `API_URL` de `app/api.ts`. A resposta esperada é um array `PublicService[]`:

```typescript
{
  id: number;
  title: string;
  description: string;
  category: string;
  startingPrice: string;
  imageUrl: string | null;
  freelancer: {
    id: number;
    name: string;
    profile: { fullName: string; avatarUrl: string | null } | null;
  };
}
```

A página usa `useEffect` para a consulta e `useState` para serviços, carregamento, erro e nova tentativa, seguindo o estilo das telas da aula. Não envia token, não cria registros e não chama rotas de likes ou contratação. O carregamento é cancelado ao sair da página; uma consulta que exceda 15 segundos vira erro com opção de tentar novamente.

Cada `ServiceCard` recebe um serviço e apresenta título, descrição limitada a três linhas, categoria, preço inicial em reais e nome público do profissional. Usa `profile.fullName` quando disponível e `freelancer.name` como alternativa. A imagem é exibida diretamente pela URL fornecida, com `next/image` sem otimização remota, evitando configurar domínios de cada freelancer. URL ausente ou imagem que falha recebe uma alternativa visual simples. O preço continua vindo da API como texto e é convertido apenas para formatação na tela.

A grade Bootstrap usa uma coluna no celular, duas a partir de `md` e três a partir de `lg`. Há estados próprios para carregamento, catálogo vazio e falha, sem serviços fictícios de preenchimento. O símbolo utilizado é o arquivo `freelike-simbolo-braco-reto.png`, confirmado pelo usuário, copiado sem alteração para a marca e o ícone da aplicação.

## Arquivos principais

- `app/page.tsx`: vitrine, consulta e estados da página.
- `app/components/Header.tsx`: marca e acessos de entrada/cadastro.
- `app/components/service/ServiceCard.tsx`: apresentação de um serviço e alternativa de imagem.
- `app/types/service.ts`: tipo da resposta pública do backend.
- `app/layout.tsx` e `app/globals.css`: Bootstrap local, metadados e tema claro.
- `app/api.ts`: endereço configurável da API, reaproveitado da aula.
- `.env.example`: exemplo de configuração, permitido no `.gitignore`; `.env.local` continua ignorado.

As telas `/login`, `/register` e `/admin` da aula foram preservadas. Login e cadastro receberam apenas um aviso de preparação e um link para voltar à vitrine. Não foram implementados autenticação nova, cadastro por tipo de conta, likes, detalhes de serviço, painel ou CRUDs nesta etapa.

## Verificação executada

```powershell
npm run build
npm run lint
```

O build de produção passou. O lint terminou com zero erros e um aviso em `app/components/product/ProductCard.tsx`: a base da aula usa `<img>` nesse componente antigo, que não é utilizado na vitrine. Esse exemplo foi preservado.

A página compilada foi aberta no navegador em `http://localhost:3001` com o backend real. Foram conferidos:

- Catálogo vazio retornado pela API real e atualização da vitrine.
- Falha de conexão ao desligar o backend e botão de nova tentativa.
- Estado de carregamento usando uma resposta atrasada de uma API temporária de teste.
- Recuperação após erro, cartões, imagem válida, imagem ausente e imagem quebrada, nome com e sem perfil, textos longos e valores `0.00`, `1500.50` e `999999999.99`, com respostas de teste em memória.
- Erro HTTP `503` e resposta com formato inválido, tratados como falha de carregamento.
- Layout em desktop e larguras de 768, 390 e 320 pixels, sem rolagem horizontal; duas colunas no tablet e uma no celular.
- Navegação para as telas existentes de entrar/criar conta, seus avisos de preparação e retorno à vitrine, sem enviar formulários.

Os testes visuais com cartões usaram uma API descartável em memória, enquanto o backend real estava parado. Nenhum serviço fictício foi gravado no banco. Ao concluir, a API de teste foi encerrada e a página foi conferida novamente com o backend real. Os arquivos locais de teste e capturas ficam em `.tmp`, ignorada pelo Git. Nenhum ZIP, commit, push ou publicação foi produzido.

## Pendências para as próximas etapas

A tela de cadastro herdada envia `passwordHash`, mas o backend atual espera `password`; essa integração será corrigida na etapa de cadastro. A tela herdada de perfis também consulta `GET /profiles`, enquanto o backend atual fornece consultas por ID. Os fluxos de autenticação e administração não foram validados nem ampliados nesta etapa. O backend não precisou de alterações para servir a vitrine pública.
