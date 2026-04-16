import { Controller, Post, Get, Param, Body, Req, Delete, Logger } from '@nestjs/common';
import { SessionService } from '@/resources/session/session.service';
import { CreateSessionDto } from '@/resources/session/dto/create-session.dto';
import { JoinSessionDto } from '@/resources/session/dto/join-session.dto';
import { SessionResponseDto, SessionListResponseDto } from '@/resources/session/dto/session-response.dto';
import { SessionParticipantsResponseDto } from '@/resources/session/dto/session-participants-response.dto';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { SessionWithParticipants, SessionParticipantsDetails } from '@/resources/session/entities/session.model';
import { GenericResponseDto } from '@/common/dto/generic-response.dto';

@ApiTags('sessions')
@Controller('sessions')
export class SessionController {
    private readonly logger = new Logger(SessionController.name);
    private readonly SERVICE_NAME = SessionController.name;

    constructor(private readonly sessionService: SessionService) { }

    @Post()
    @ApiOperation({ summary: 'Créer une nouvelle session' })
    @ApiResponse({ status: 201, type: SessionResponseDto, description: 'Session créée avec succès' })
    @ApiResponse({ status: 400, description: 'Données invalides' })
    @ApiResponse({ status: 500, description: 'Erreur interne du serveur' })
    async create(@Body() createSessionDto: CreateSessionDto, @Req() req: any): Promise<GenericResponseDto<SessionWithParticipants>> {
        const start: number = Date.now();
        const session: SessionWithParticipants = await this.sessionService.create(createSessionDto, req.user.keycloakId);
        const duration: number = (Date.now() - start) / 1000;

        const message: string = `Session #${session.id} created in ${duration.toFixed(3)}s`;
        this.logger.verbose(message, this.SERVICE_NAME);
        return {
            message,
            data: session
        };
    }

    @Get()
    @ApiOperation({ summary: 'Récupérer les sessions de l\'utilisateur' })
    @ApiResponse({ status: 200, type: SessionListResponseDto, description: 'Liste des sessions de l\'utilisateur' })
    @ApiResponse({ status: 500, description: 'Erreur interne du serveur' })
    async findAll(@Req() req: any): Promise<GenericResponseDto<SessionWithParticipants[]>> {
        const start: number = Date.now();
        const sessions: SessionWithParticipants[] = await this.sessionService.findAllByUser(req.user.keycloakId);
        const duration: number = (Date.now() - start) / 1000;

        const message: string = `Found ${sessions.length} session(s) for user ${req.user.username} in ${duration.toFixed(3)}s`;
        this.logger.verbose(message, this.SERVICE_NAME);
        return {
            message: message,
            data: sessions,
        };
    }

    @Get(':code/participants')
    @ApiOperation({ summary: 'Récupérer les participants et l\'auteur d\'une session' })
    @ApiParam({ name: 'code', description: 'Session code (OTP)' })
    @ApiResponse({ status: 200, type: SessionParticipantsResponseDto, description: 'Participants et auteur de la session' })
    @ApiResponse({ status: 404, description: 'Session introuvable' })
    @ApiResponse({ status: 500, description: 'Erreur interne du serveur' })
    async findParticipants(@Param('code') code: string): Promise<GenericResponseDto<SessionParticipantsDetails>> {
        const start: number = Date.now();
        const result: SessionParticipantsDetails = await this.sessionService.findParticipants(code);
        const duration: number = (Date.now() - start) / 1000;

        const message: string = `Found ${result.participants.length} participant(s) for session with code ${code} in ${duration.toFixed(3)}s`;
        this.logger.verbose(message, this.SERVICE_NAME);
        return {
            message,
            data: result,
        };
    }

    @Get(':code')
    @ApiOperation({ summary: 'Récupérer une session par code OTP' })
    @ApiParam({ name: 'code', description: 'Session code (OTP)' })
    @ApiResponse({ status: 200, type: SessionResponseDto, description: 'Session trouvée' })
    @ApiResponse({ status: 404, description: 'Session introuvable' })
    @ApiResponse({ status: 410, description: 'Session supprimée ou clôturée' })
    @ApiResponse({ status: 500, description: 'Erreur interne du serveur' })
    async findOne(@Param('code') code: string): Promise<GenericResponseDto<SessionWithParticipants>> {
        const start: number = Date.now();
        const session: SessionWithParticipants = await this.sessionService.findOne(code);
        const duration: number = (Date.now() - start) / 1000;

        const message: string = `Session with code ${code} found in ${duration.toFixed(3)}s`;
        this.logger.verbose(message, this.SERVICE_NAME);
        return {
            message: message,
            data: session,
        };
    }

    @Post(':code/launch')
    @ApiOperation({ summary: 'Lancer une session (déclenche l\'expiration de 8h)' })
    @ApiParam({ name: 'code', description: 'Session code (OTP)' })
    @ApiResponse({ status: 201, type: SessionResponseDto, description: 'Session lancée avec succès' })
    @ApiResponse({ status: 400, description: 'La session ne peut pas être lancée depuis son statut actuel' })
    @ApiResponse({ status: 403, description: 'Seul le créateur peut lancer la session' })
    @ApiResponse({ status: 404, description: 'Session introuvable' })
    @ApiResponse({ status: 410, description: 'Session supprimée ou clôturée' })
    @ApiResponse({ status: 500, description: 'Erreur interne du serveur' })
    async launch(@Param('code') code: string, @Req() req: any): Promise<GenericResponseDto<SessionWithParticipants>> {
        const start: number = Date.now();
        const session: SessionWithParticipants = await this.sessionService.launch(code, req.user.keycloakId);
        const duration: number = (Date.now() - start) / 1000;

        const message: string = `Session with code ${code} launched in ${duration.toFixed(3)}s, expires at ${session.expiresAt.toISOString()}`;
        this.logger.verbose(message, this.SERVICE_NAME);
        return {
            message: message,
            data: session,
        };
    }

    @Post(':code/join')
    @ApiOperation({ summary: 'Rejoindre une session' })
    @ApiParam({ name: 'code', description: 'Session code (OTP)' })
    @ApiResponse({ status: 201, type: SessionResponseDto, description: 'Session rejointe avec succès' })
    @ApiResponse({ status: 400, description: 'Session clôturée ou utilisateur déjà participant' })
    @ApiResponse({ status: 404, description: 'Session introuvable' })
    @ApiResponse({ status: 410, description: 'Session supprimée ou clôturée' })
    @ApiResponse({ status: 500, description: 'Erreur interne du serveur' })
    async join(
        @Param('code') code: string,
        @Body() joinSessionDto: JoinSessionDto,
        @Req() req: any,
    ): Promise<GenericResponseDto<SessionWithParticipants>> {
        const start: number = Date.now();
        const session: SessionWithParticipants = await this.sessionService.join(code, joinSessionDto, req.user.keycloakId);
        const duration: number = (Date.now() - start) / 1000;

        const message: string = `User ${req.user.username} joined session with code ${code} in ${duration.toFixed(3)}s`;
        this.logger.verbose(message, this.SERVICE_NAME);
        return {
            message: message,
            data: session,
        };
    }

    @Post(':code/leave')
    @ApiOperation({ summary: 'Quitter une session' })
    @ApiParam({ name: 'code', description: 'Session code (OTP)' })
    @ApiResponse({ status: 201, type: SessionResponseDto, description: 'Session quittée avec succès' })
    @ApiResponse({ status: 400, description: 'Utilisateur non participant à la session' })
    @ApiResponse({ status: 404, description: 'Session introuvable' })
    @ApiResponse({ status: 410, description: 'Session supprimée ou clôturée' })
    @ApiResponse({ status: 500, description: 'Erreur interne du serveur' })
    async leave(@Param('code') code: string, @Req() req: any): Promise<GenericResponseDto<SessionWithParticipants>> {
        const start: number = Date.now();
        const session: SessionWithParticipants = await this.sessionService.leave(code, req.user.keycloakId);
        const duration: number = (Date.now() - start) / 1000;

        const message: string = `User ${req.user.username} left session with code ${code} in ${duration.toFixed(3)}s`;
        this.logger.verbose(message, this.SERVICE_NAME);
        return {
            message: message,
            data: session,
        };
    }

    @Delete(':code')
    @ApiOperation({ summary: 'Clôturer une session' })
    @ApiParam({ name: 'code', description: 'Session code (OTP)' })
    @ApiResponse({ status: 200, type: SessionResponseDto, description: 'Session clôturée avec succès' })
    @ApiResponse({ status: 400, description: 'Session déjà clôturée' })
    @ApiResponse({ status: 403, description: 'Seul le créateur peut clôturer la session' })
    @ApiResponse({ status: 404, description: 'Session introuvable' })
    @ApiResponse({ status: 410, description: 'Session supprimée ou clôturée' })
    @ApiResponse({ status: 500, description: 'Erreur interne du serveur' })
    async close(@Param('code') code: string, @Req() req: any): Promise<GenericResponseDto<SessionWithParticipants>> {
        const start: number = Date.now();
        const session: SessionWithParticipants = await this.sessionService.close(code, req.user.keycloakId);
        const duration: number = (Date.now() - start) / 1000;

        const message: string = `Session with code ${code} closed by user ${req.user.username} in ${duration.toFixed(3)}s`;
        this.logger.verbose(message, this.SERVICE_NAME);
        return {
            message: message,
            data: session,
        };
    }
}
