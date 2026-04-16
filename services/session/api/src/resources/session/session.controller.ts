import { Controller, Post, Get, Param, Body, Req, Delete } from '@nestjs/common';
import { SessionService } from '@/resources/session/session.service';
import { CreateSessionDto } from '@/resources/session/dto/create-session.dto';
import { JoinSessionDto } from '@/resources/session/dto/join-session.dto';
import { SessionResponseDto, SessionListResponseDto } from '@/resources/session/dto/session-response.dto';
import { SessionParticipantsResponseDto } from '@/resources/session/dto/session-participants-response.dto';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { SessionWithParticipants, SessionParticipantsDetails } from '@/resources/session/entities/session.model';
import { IResponse } from '@/common/dtos/response.dto';

@ApiTags('sessions')
@Controller('sessions')
export class SessionController {
    constructor(private readonly sessionService: SessionService) { }

    @Post()
    @ApiOperation({ summary: 'Créer une nouvelle session' })
    @ApiResponse({ status: 201, type: SessionResponseDto, description: 'Session créée avec succès' })
    @ApiResponse({ status: 400, description: 'Données invalides' })
    @ApiResponse({ status: 500, description: 'Erreur interne du serveur' })
    create(@Body() createSessionDto: CreateSessionDto, @Req() req: any): Promise<IResponse<SessionWithParticipants>> {
        return this.sessionService.create(createSessionDto, req.user.keycloakId);
    }

    @Get()
    @ApiOperation({ summary: "Récupérer les sessions de l'utilisateur" })
    @ApiResponse({ status: 200, type: SessionListResponseDto, description: 'Liste des sessions de l\'utilisateur' })
    @ApiResponse({ status: 500, description: 'Erreur interne du serveur' })
    findAll(@Req() req: any): Promise<IResponse<SessionWithParticipants[]>> {
        return this.sessionService.findAllByUser(req.user.keycloakId);
    }

    @Get(':code/participants')
    @ApiOperation({ summary: "Récupérer les participants et l'auteur d'une session" })
    @ApiParam({ name: 'code', description: 'Session code (OTP)' })
    @ApiResponse({ status: 200, type: SessionParticipantsResponseDto, description: 'Participants et auteur de la session' })
    @ApiResponse({ status: 404, description: 'Session introuvable' })
    @ApiResponse({ status: 500, description: 'Erreur interne du serveur' })
    findParticipants(@Param('code') code: string): Promise<IResponse<SessionParticipantsDetails>> {
        return this.sessionService.findParticipants(code);
    }

    @Get(':code')
    @ApiOperation({ summary: 'Récupérer une session par code OTP' })
    @ApiParam({ name: 'code', description: 'Session code (OTP)' })
    @ApiResponse({ status: 200, type: SessionResponseDto, description: 'Session trouvée' })
    @ApiResponse({ status: 404, description: 'Session introuvable' })
    @ApiResponse({ status: 410, description: 'Session supprimée ou clôturée' })
    @ApiResponse({ status: 500, description: 'Erreur interne du serveur' })
    findOne(@Param('code') code: string): Promise<IResponse<SessionWithParticipants>> {
        return this.sessionService.findOne(code);
    }

    @Post(':code/launch')
    @ApiOperation({ summary: "Lancer une session (déclenche l'expiration de 8h)" })
    @ApiParam({ name: 'code', description: 'Session code (OTP)' })
    @ApiResponse({ status: 201, type: SessionResponseDto, description: 'Session lancée avec succès' })
    @ApiResponse({ status: 400, description: 'La session ne peut pas être lancée depuis son statut actuel' })
    @ApiResponse({ status: 403, description: 'Seul le créateur peut lancer la session' })
    @ApiResponse({ status: 404, description: 'Session introuvable' })
    @ApiResponse({ status: 410, description: 'Session supprimée ou clôturée' })
    @ApiResponse({ status: 500, description: 'Erreur interne du serveur' })
    launch(@Param('code') code: string, @Req() req: any): Promise<IResponse<SessionWithParticipants>> {
        return this.sessionService.launch(code, req.user.keycloakId);
    }

    @Post(':code/join')
    @ApiOperation({ summary: 'Rejoindre une session' })
    @ApiParam({ name: 'code', description: 'Session code (OTP)' })
    @ApiResponse({ status: 201, type: SessionResponseDto, description: 'Session rejointe avec succès' })
    @ApiResponse({ status: 400, description: 'Session clôturée ou utilisateur déjà participant' })
    @ApiResponse({ status: 404, description: 'Session introuvable' })
    @ApiResponse({ status: 410, description: 'Session supprimée ou clôturée' })
    @ApiResponse({ status: 500, description: 'Erreur interne du serveur' })
    join(
        @Param('code') code: string,
        @Body() joinSessionDto: JoinSessionDto,
        @Req() req: any,
    ): Promise<IResponse<SessionWithParticipants>> {
        return this.sessionService.join(code, joinSessionDto, req.user.keycloakId);
    }

    @Post(':code/leave')
    @ApiOperation({ summary: 'Quitter une session' })
    @ApiParam({ name: 'code', description: 'Session code (OTP)' })
    @ApiResponse({ status: 201, type: SessionResponseDto, description: 'Session quittée avec succès' })
    @ApiResponse({ status: 400, description: 'Utilisateur non participant à la session' })
    @ApiResponse({ status: 404, description: 'Session introuvable' })
    @ApiResponse({ status: 410, description: 'Session supprimée ou clôturée' })
    @ApiResponse({ status: 500, description: 'Erreur interne du serveur' })
    leave(@Param('code') code: string, @Req() req: any): Promise<IResponse<SessionWithParticipants>> {
        return this.sessionService.leave(code, req.user.keycloakId);
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
    close(@Param('code') code: string, @Req() req: any): Promise<IResponse<SessionWithParticipants>> {
        return this.sessionService.close(code, req.user.keycloakId);
    }
}
