// Marca as rotas que podem ser acessadas sem token, como login e vitrine.

import { SetMetadata } from '@nestjs/common';
export const IS_PUBLIC = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC, true);
