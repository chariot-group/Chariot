import { Controller, Post, Get, Param, Body, Req, Delete, Logger } from '@nestjs/common';
import { SessionService } from '@/resources/session/session.service';
import { CreateSessionDto } from '@/resources/session/dto/create-session.dto';
import { JoinSessionDto } from '@/resources/session/dto/join-session.dto';
import { SessionResponseDto, SessionListResponseDto } from '@/resources/session/dto/session-response.dto';
import { SessionParticipantsResponseDto } from '@/resources/session/dto/session-participants-response.dto';
import { ParseUUIDPipe } from '@/common/pipes/parse-uuid.pipe';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

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
    async create(@Body() createSessionDto: CreateSessionDto, @Req() req: any) {
        let start: number = Date.now();
        const session = await this.sessionService.create(createSessionDto, req.user.keycloakId);
        let duration: number = (Date.now() - start) / 1000;

        let message: string = `Session #${session.id} created in ${duration.toFixed(3)}s`;
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
    async findAll(@Req() req: any) {
        let start: number = Date.now();
        const sessions = await this.sessionService.findAllByUser(req.user.keycloakId);
        let duration: number = (Date.now() - start) / 1000;

        let message: string = `Found ${sessions.length} session(s) for user ${req.user.username} in ${duration.toFixed(3)}s`;
        this.logger.verbose(message, this.SERVICE_NAME);
        return {
            message: message,
            data: sessions,
        };
    }

    @Get(':id/participants')
    @ApiOperation({ summary: 'Récupérer les participants et l\'auteur d\'une session' })
    @ApiParam({ name: 'id', description: 'Session ID (UUID)' })
    @ApiResponse({ status: 200, type: SessionParticipantsResponseDto, description: 'Participants et auteur de la session' })
    @ApiResponse({ status: 404, description: 'Session introuvable' })
    @ApiResponse({ status: 500, description: 'Erreur interne du serveur' })
    async findParticipants(@Param('id', ParseUUIDPipe) id: string) {
        let start: number = Date.now();
        const result = await this.sessionService.findParticipants(id);
        let duration: number = (Date.now() - start) / 1000;

        let message: string = `Found ${result.participants.length} participant(s) for session #${id} in ${duration.toFixed(3)}s`;
        this.logger.verbose(message, this.SERVICE_NAME);
        return {
            message,
            data: result,
        };
    }

    @Get(':id')
    @ApiOperation({ summary: 'Récupérer une session par ID' })
    @ApiParam({ name: 'id', description: 'Session ID (UUID)' })
    @ApiResponse({ status: 200, type: SessionResponseDto, description: 'Session trouvée' })
    @ApiResponse({ status: 404, description: 'Session introuvable' })
    @ApiResponse({ status: 410, description: 'Session supprimée ou clôturée' })
    @ApiResponse({ status: 500, description: 'Erreur interne du serveur' })
    async findOne(@Param('id', ParseUUIDPipe) id: string) {
        let start: number = Date.now();
        const session = await this.sessionService.findOne(id);
        let duration: number = (Date.now() - start) / 1000;

        let message: string = `Session #${id} found in ${duration.toFixed(3)}s`;
        this.logger.verbose(message, this.SERVICE_NAME);
        return {
            message: message,
            data: session,
        };
    }

    @Post(':id/launch')
    @ApiOperation({ summary: 'Lancer une session (déclenche l\'expiration de 8h)' })
    @ApiParam({ name: 'id', description: 'Session ID (UUID)' })
    @ApiResponse({ status: 201, type: SessionResponseDto, description: 'Session lancée avec succès' })
    @ApiResponse({ status: 400, description: 'La session ne peut pas être lancée depuis son statut actuel' })
    @ApiResponse({ status: 403, description: 'Seul le créateur peut lancer la session' })
    @ApiResponse({ status: 404, description: 'Session introuvable' })
    @ApiResponse({ status: 410, description: 'Session supprimée ou clôturée' })
    @ApiResponse({ status: 500, description: 'Erreur interne du serveur' })
    async launch(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
        let start: number = Date.now();
        const session = await this.sessionService.launch(id, req.user.keycloakId);
        let duration: number = (Date.now() - start) / 1000;

        let message: string = `Session #${id} launched in ${duration.toFixed(3)}s, expires at ${session.expiresAt.toISOString()}`;
        this.logger.verbose(message, this.SERVICE_NAME);
        return {
            message: message,
            data: session,
        };
    }

    @Post(':id/join')
    @ApiOperation({ summary: 'Rejoindre une session' })
    @ApiParam({ name: 'id', description: 'Session ID (UUID)' })
    @ApiResponse({ status: 201, type: SessionResponseDto, description: 'Session rejointe avec succès' })
    @ApiResponse({ status: 400, description: 'Session clôturée ou utilisateur déjà participant' })
    @ApiResponse({ status: 404, description: 'Session introuvable' })
    @ApiResponse({ status: 410, description: 'Session supprimée ou clôturée' })
    @ApiResponse({ status: 500, description: 'Erreur interne du serveur' })
    async join(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() joinSessionDto: JoinSessionDto,
        @Req() req: any,
    ) {
        let start: number = Date.now();
        const session = await this.sessionService.join(id, joinSessionDto, req.user.keycloakId);
        let duration: number = (Date.now() - start) / 1000;

        let message: string = `User ${req.user.username} joined session #${id} in ${duration.toFixed(3)}s`;
        this.logger.verbose(message, this.SERVICE_NAME);
        return {
            message: message,
            data: session,
        };
    }

    @Post(':id/leave')
    @ApiOperation({ summary: 'Quitter une session' })
    @ApiParam({ name: 'id', description: 'Session ID (UUID)' })
    @ApiResponse({ status: 201, type: SessionResponseDto, description: 'Session quittée avec succès' })
    @ApiResponse({ status: 400, description: 'Utilisateur non participant à la session' })
    @ApiResponse({ status: 404, description: 'Session introuvable' })
    @ApiResponse({ status: 410, description: 'Session supprimée ou clôturée' })
    @ApiResponse({ status: 500, description: 'Erreur interne du serveur' })
    async leave(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
        let start: number = Date.now();
        const session = await this.sessionService.leave(id, req.user.keycloakId);
        let duration: number = (Date.now() - start) / 1000;

        let message: string = `User ${req.user.username} left session #${id} in ${duration.toFixed(3)}s`;
        this.logger.verbose(message, this.SERVICE_NAME);
        return {
            message: message,
            data: session,
        };
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Clôturer une session' })
    @ApiParam({ name: 'id', description: 'Session ID (UUID)' })
    @ApiResponse({ status: 200, type: SessionResponseDto, description: 'Session clôturée avec succès' })
    @ApiResponse({ status: 400, description: 'Session déjà clôturée' })
    @ApiResponse({ status: 403, description: 'Seul le créateur peut clôturer la session' })
    @ApiResponse({ status: 404, description: 'Session introuvable' })
    @ApiResponse({ status: 410, description: 'Session supprimée ou clôturée' })
    @ApiResponse({ status: 500, description: 'Erreur interne du serveur' })
    async close(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
        let start: number = Date.now();
        const session = await this.sessionService.close(id, req.user.keycloakId);
        let duration: number = (Date.now() - start) / 1000;

        let message: string = `Session #${id} closed by user ${req.user.username} in ${duration.toFixed(3)}s`;
        this.logger.verbose(message, this.SERVICE_NAME);
        return {
            message: message,
            data: session,
        };
    }
}
