import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { ProfilesModule } from './profiles/profiles.module';
import { ClientsModule } from './clients/clients.module';
import { ProjectsModule } from './projects/projects.module';
import { PaymentsModule } from './payments/payments.module';
import { ServicesModule } from './services/services.module';
import { ClientPortalModule } from './client-portal/client-portal.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    UsersModule,
    ProfilesModule,
    ClientsModule,
    ProjectsModule,
    PaymentsModule,
    ServicesModule,
    ClientPortalModule,
  ], //outros módulos
  controllers: [AppController], //quem recebe requisições http
  providers: [AppService], //serviços/lógica da aplicação
})
export class AppModule {}
