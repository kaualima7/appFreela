import {
  BadRequestException,
  FileTypeValidator,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export const serviceCoverLimit = 5 * 1024 * 1024;
const coverPath = '/services/covers/';
const coverNamePattern =
  /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.(jpg|png|webp)$/;
const extensions = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
} as const;
const mimeTypes = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
} as const;
const coverValidator = new FileTypeValidator({
  fileType: /^image\/(jpeg|png|webp)$/,
  overrideMimeType: true,
});
const logger = new Logger('ServiceCover');

export type ServiceCoverFile = {
  mimetype: string;
  size: number;
  buffer: Buffer;
};

function coverDirectory() {
  return resolve(process.env.SERVICE_COVERS_DIR ?? 'uploads/service-covers');
}

function storedCoverName(imageUrl: string | null) {
  if (!imageUrl?.startsWith(coverPath)) return null;
  const name = imageUrl.slice(coverPath.length);
  return coverNamePattern.test(name) ? name : null;
}

export function publicCoverUrl(imageUrl: string | null) {
  if (!storedCoverName(imageUrl)) return imageUrl;
  const apiUrl =
    process.env.PUBLIC_API_URL ??
    `http://localhost:${process.env.PORT ?? 3000}/api`;
  return apiUrl.replace(/\/$/, '') + imageUrl;
}

export async function storeServiceCover(cover: ServiceCoverFile) {
  if (cover.size > serviceCoverLimit)
    throw new BadRequestException('Escolha uma imagem de até 5 MB.');
  if (!(await coverValidator.isValid(cover)))
    throw new BadRequestException('Escolha uma imagem JPEG, PNG ou WebP.');

  const extension = extensions[cover.mimetype as keyof typeof extensions];
  const name = `${randomUUID()}.${extension}`;
  const directory = coverDirectory();
  try {
    await mkdir(directory, { recursive: true });
    await writeFile(resolve(directory, name), cover.buffer, { flag: 'wx' });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST')
      await removeServiceCover(coverPath + name);
    logger.error('Falha ao gravar a capa do serviço.', error);
    throw new InternalServerErrorException(
      'Não foi possível salvar a imagem. Tente novamente.',
    );
  }
  return coverPath + name;
}

export async function removeServiceCover(imageUrl: string | null) {
  const name = storedCoverName(imageUrl);
  if (!name) return;
  try {
    await rm(resolve(coverDirectory(), name), { force: true });
  } catch (error) {
    logger.error('Falha ao limpar a capa do serviço.', error);
  }
}

export async function readServiceCover(name: string) {
  if (!coverNamePattern.test(name))
    throw new NotFoundException('Imagem não encontrada.');
  const extension = name.slice(
    name.lastIndexOf('.') + 1,
  ) as keyof typeof mimeTypes;
  try {
    const image = await readFile(resolve(coverDirectory(), name));
    return new StreamableFile(image, { type: mimeTypes[extension] });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT')
      throw new NotFoundException('Imagem não encontrada.');
    throw error;
  }
}
