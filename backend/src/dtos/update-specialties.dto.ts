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
