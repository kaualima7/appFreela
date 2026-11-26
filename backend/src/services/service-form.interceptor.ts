// Prepara o pedido que traz os dados do anúncio junto com uma imagem.
// Lê o campo service como JSON antes da validação do DTO.

import {
  BadRequestException,
  Injectable,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { serviceCoverLimit } from './service-cover';

//recebe o arquivo do campo cover; ServiceFormInterceptor lê o JSON do campo service antes da validação do DTO
export const ServiceCoverUpload = FileInterceptor('cover', {
  limits: {
    fileSize: serviceCoverLimit + 1,
    files: 1,
    fields: 1,
    fieldSize: 32 * 1024,
  },
});

@Injectable()
export class ServiceFormInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest<Request>();
    if (request.is('multipart/form-data')) {
      try {
        // O JSON preserva os tipos esperados pelos DTOs, inclusive boolean e null.
        const payload: unknown = JSON.parse(request.body.service);
        if (!payload || typeof payload !== 'object' || Array.isArray(payload))
          throw new Error();
        request.body = payload;
      } catch {
        throw new BadRequestException(
          'Confira os dados do anúncio e tente novamente.',
        );
      }
    }
    return next.handle();
  }
}
