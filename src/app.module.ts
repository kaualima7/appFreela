import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { ProfilesModule } from './profiles/profiles.module';

@Module({
  imports: [UsersModule, ProfilesModule], //outros módulos
  controllers: [AppController], //quem recebe requisições http
  providers: [AppService], //serviços/lógica da aplicação
})
export class AppModule {}
