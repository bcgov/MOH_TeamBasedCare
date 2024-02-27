import { Injectable, CanActivate, ExecutionContext, Inject } from '@nestjs/common';
import { PlanningSessionService } from '../planning-session.service';
import { User } from 'src/user/entities/user.entity';

/**
 * @name SessionGuard
 * @description Use this guard if the endpoint contains sessionId access or updates,
 * @logic Only allow access if the session was created by the user accessing it
 */
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    @Inject(PlanningSessionService) private planningSessionService: PlanningSessionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // grab user id
    const userId = (request?.user as User)?.keycloakId;

    // if user id does not exist, restrict access
    if (!userId) return false;

    // grab session id
    const sessionId = request?.params?.sessionId;

    // if session id does not exist, restrict access
    if (!sessionId) return false;

    // fetch session from id
    const session = await this.planningSessionService.findOne(sessionId);

    // if session not found, restrict access
    if (!session) return false;

    // if session is created by the user accessing it, grant access; else restrict
    return session.createdBy === userId;
  }
}
