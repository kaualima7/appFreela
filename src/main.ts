import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';


//tudo inicia aqui neste método
async function bootstrap() { 
  const app = await NestFactory.create(AppModule); //cria a aplicação usando AppModule
  
  app.setGlobalPrefix('api'); //coloca /api no começo das rotas
  app.useGlobalPipes(new ValidationPipe()); //ativa validação dos dados recebidos

  await app.listen(process.env.PORT ?? 3000); //começa a receber requisições na porta 3000
  
}
void bootstrap();
