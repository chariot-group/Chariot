import { Module } from '@nestjs/common';
import { SessionService } from '@/resources/session/session.service';
import { SessionController } from '@/resources/session/session.controller';
import { SessionGateway } from '@/resources/session/session.gateway';
import { ConfigModule } from '@nestjs/config';
import { AdventureUserService } from '@/common/adventure/adventure-user.service';

@Module({
    imports: [ConfigModule],
    controllers: [SessionController],
    providers: [SessionService, SessionGateway, AdventureUserService],
    exports: [SessionService],
})
export class SessionModule { }
