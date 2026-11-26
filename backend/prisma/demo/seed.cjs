const bcrypt = require('bcryptjs');
const { constants } = require('node:fs');
const { copyFile, mkdir, readFile } = require('node:fs/promises');
const { resolve } = require('node:path');
const { PrismaService } = require('../../dist/database/prisma.service');

const password = 'FreelikeDemo123!';
const accounts = [
  ['marina', 'Marina Valença', 'FREELANCER'],
  ['bruno', 'Bruno Campelo', 'FREELANCER'],
  ['iris', 'Íris Monteiro', 'FREELANCER'],
  ['lia', 'Lia Ferraz', 'CLIENT'],
  ['davi', 'Davi Menezes', 'CLIENT'],
  ['helena', 'Helena Siqueira', 'CLIENT'],
];

const services = [
  {
    owner: 'marina',
    cover: 'design-interfaces',
    category: 'Design de interfaces',
    title: 'Protótipo de app para agendamentos',
    description:
      'Desenho o fluxo de agendamento no Figma, com calendário, escolha de horários e confirmação da reserva.',
    startingPrice: '850',
  },
  {
    owner: 'marina',
    cover: 'design-grafico',
    category: 'Design gráfico',
    title: 'Identidade visual para cafeteria',
    description:
      'Crio marca, paleta e aplicações para copos e embalagens de cafeterias de bairro, como as da Vila Rodrigues, em Passo Fundo.',
    startingPrice: '1250',
  },
  {
    owner: 'bruno',
    cover: 'desenvolvimento-mobile',
    category: 'Desenvolvimento mobile',
    title: 'Cardápio digital para celular',
    description:
      'Desenvolvo um cardápio com fotos, preços e seções para restaurantes e lancherias de Passo Fundo.',
    startingPrice: '1600',
  },
  {
    owner: 'bruno',
    cover: 'desenvolvimento-web',
    category: 'Desenvolvimento web',
    title: 'Site institucional para pequenos negócios',
    description:
      'Entrego um site responsivo com apresentação da empresa, serviços e formulário de contato. Ideal para negócios do Centro de Passo Fundo.',
    startingPrice: '1900',
  },
  {
    owner: 'iris',
    cover: 'edicao-video',
    category: 'Edição de vídeo',
    title: 'Edição de três vídeos curtos para redes sociais',
    description:
      'Transformo o material gravado em três vídeos verticais com cortes, legendas e ajuste de cor.',
    startingPrice: '420',
  },
  {
    owner: 'iris',
    cover: 'fotografia',
    category: 'Fotografia',
    title: 'Fotos de produtos para catálogo',
    description:
      'Fotografo até dez produtos em fundo neutro e entrego os arquivos tratados para catálogo e loja online.',
    startingPrice: '580',
  },
  {
    owner: 'marina',
    cover: 'marketing-digital',
    category: 'Marketing digital',
    title: 'Campanha de lançamento para loja online',
    description:
      'Planejo uma semana de divulgação e entrego peças para feed, stories e banner de lançamento.',
    startingPrice: '720',
  },
  {
    owner: 'marina',
    cover: 'redacao-revisao',
    category: 'Redação e revisão',
    title: 'Revisão editorial de textos para sites',
    description:
      'Reviso até cinco páginas de um site, com sugestões de clareza, correções e uma versão pronta para publicar.',
    startingPrice: '280',
  },
  {
    owner: 'iris',
    cover: 'audio-musica',
    category: 'Áudio e música',
    title: 'Edição e limpeza de áudio para podcast',
    description:
      'Edito um episódio de até 45 minutos, removo ruídos e ajusto o volume das vozes para publicação.',
    startingPrice: '260',
  },
  {
    owner: 'bruno',
    cover: 'suporte-tecnico',
    category: 'Suporte técnico',
    title: 'Configuração de Wi-Fi para pequenos escritórios',
    description:
      'Configuro o roteador, separo a rede de visitantes e testo a cobertura para pequenos escritórios em Passo Fundo.',
    startingPrice: '350',
  },
];

const coverDirectory = resolve(
  process.env.SERVICE_COVERS_DIR ?? 'uploads/service-covers',
);

// Datas fixas de criação identificam os registros da demo mesmo após edições.
const demoCreatedAt = new Date('2024-01-01T00:00:00.001Z');

async function copyCover(slug, filename) {
  const source = resolve(__dirname, 'covers', `${slug}.jpg`);
  const destination = resolve(coverDirectory, filename);
  try {
    await copyFile(source, destination, constants.COPYFILE_EXCL);
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
    const [original, stored] = await Promise.all([
      readFile(source),
      readFile(destination),
    ]);
    if (!stored.equals(original)) {
      throw new Error(`Já existe uma capa diferente em ${destination}.`);
    }
  }
}

async function seedDemo(prisma) {
  const passwordHash = await bcrypt.hash(password, 10);
  await mkdir(coverDirectory, { recursive: true });

  await prisma.$transaction(async (db) => {
    const demoUsers = {};
    for (const [key, name, accountType] of accounts) {
      const email = `${key}.demo@freelike.example`;
      const existing = await db.user.findUnique({ where: { email } });
      if (
        existing &&
        (existing.createdAt.getTime() !== demoCreatedAt.getTime() ||
          existing.accountType !== accountType)
      ) {
        throw new Error(`O e-mail ${email} já pertence a outra conta.`);
      }
      demoUsers[key] =
        existing ??
        (await db.user.create({
          data: {
            name,
            email,
            accountType,
            passwordHash,
            createdAt: demoCreatedAt,
          },
        }));
    }

    for (const [index, service] of services.entries()) {
      const { owner, cover, ...fields } = service;
      const freelancerId = demoUsers[owner].id;
      const createdAt = new Date(demoCreatedAt.getTime() + index + 1);
      const filename = `7125de10-f4aa-4c23-9712-${String(index + 1).padStart(12, '0')}.jpg`;
      const imageUrl = `/services/covers/${filename}`;
      const existing = await db.service.findFirst({
        where: { freelancerId, createdAt },
      });

      if (!existing || existing.imageUrl === imageUrl)
        await copyCover(cover, filename);
      if (!existing) {
        await db.service.create({
          data: {
            ...fields,
            freelancerId,
            createdAt,
            imageUrl,
            published: true,
          },
        });
      }
    }

    const contactKey = {
      userId: demoUsers.bruno.id,
      clientUserId: demoUsers.lia.id,
      createdAt: demoCreatedAt,
    };
    const contact =
      (await db.client.findFirst({ where: contactKey })) ??
      (await db.client.create({
        data: {
          ...contactKey,
          name: demoUsers.lia.name,
          email: demoUsers.lia.email,
        },
      }));

    const projectKey = { clientId: contact.id, createdAt: demoCreatedAt };
    const project =
      (await db.project.findFirst({ where: projectKey })) ??
      (await db.project.create({
        data: {
          ...projectKey,
          title: 'Cardápio digital da Casa Ipê',
          description:
            'Cardápio para uma lancheria fictícia em Passo Fundo, com fotos e categorias de produtos.',
          status: 'IN_PROGRESS',
          value: '1800',
        },
      }));

    const paymentKey = { projectId: project.id, createdAt: demoCreatedAt };
    if (!(await db.payment.findFirst({ where: paymentKey }))) {
      const receivedAt = new Date();
      await db.payment.create({
        data: {
          ...paymentKey,
          amount: '600',
          dueDate: receivedAt,
          paidAt: receivedAt,
          paymentMethod: 'Pix',
          status: 'PAID',
        },
      });
    }
  });
}

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('O seed de demonstração é apenas para desenvolvimento.');
  }
  const prisma = new PrismaService();
  try {
    await seedDemo(prisma);
    console.log(
      'Demo pronta: 6 contas, 10 anúncios e 1 projeto com recebimento parcial.',
    );
    console.log('Senha inicial das contas de teste: ' + password);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Não foi possível preparar a demo:', error.message);
  process.exitCode = 1;
});
