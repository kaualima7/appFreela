// Valida a lista de áreas de atuação, sem repetições e com opções aceitas pela API.
// O ValidationPipe de main.ts aplica essas regras e responde 400 se os dados forem inválidos.

import { ArrayUnique, IsArray, IsIn } from 'class-validator';
import { freelancerSpecialties } from '../profiles/freelancer-specialties';

export class UpdateSpecialtiesDto {
  @IsArray({ message: 'Selecione as áreas de atuação.' })
  @ArrayUnique({ message: 'Cada área pode ser selecionada apenas uma vez.' })
  @IsIn(freelancerSpecialties, {
    each: true,
    message: 'Selecione apenas áreas de atuação disponíveis.',
  })
  specialties: string[];
}
