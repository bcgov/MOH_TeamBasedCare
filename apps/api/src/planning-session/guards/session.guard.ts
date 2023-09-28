import { Injectable, CanActivate, ExecutionContext, Inject } from '@nestjs/common';
import { PlanningSessionService } from '../planning-session.service';

/**
 * SessionGuard
 * If the endpoint
 */
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    @Inject(PlanningSessionService) private planningSessionService: PlanningSessionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // grab user id
    const userId = request?.user?.sub;

    // if user id does not exist, return
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
