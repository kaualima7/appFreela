import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';

@Module({
  imports: [UsersModule], //outros módulos
  controllers: [AppController], //quem recebe requisições http
  providers: [AppService], //serviços/lógica da aplicação
})
export class AppModule {}
