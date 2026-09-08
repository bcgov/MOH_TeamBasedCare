import { ExecutionContext } from '@nestjs/common';
import { SessionGuard } from './session.guard';
import { PlanningSessionService } from '../planning-session.service';

describe('SessionGuard', () => {
  let guard: SessionGuard;
  let planningSessionService: { findOne: jest.Mock };

  const contextFor = (request: unknown): ExecutionContext =>
    ({
      switchToHttp: () => ({ getRequest: () => request }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    planningSessionService = { findOne: jest.fn() };
    guard = new SessionGuard(planningSessionService as unknown as PlanningSessionService);
  });

  it('should grant access to the owner of the session', async () => {
    planningSessionService.findOne.mockResolvedValue({ createdBy: { id: 'user-a' } });

    const allowed = await guard.canActivate(
      contextFor({ user: { id: 'user-a' }, params: { sessionId: 'session-1' } }),
    );

    expect(allowed).toBe(true);
  });

  // FR-041 / SC-005: acting directly on another planner's session id is refused
  it('should refuse a planner acting on a session owned by someone else', async () => {
    planningSessionService.findOne.mockResolvedValue({ createdBy: { id: 'user-b' } });

    const allowed = await guard.canActivate(
      contextFor({ user: { id: 'user-a' }, params: { sessionId: 'session-of-b' } }),
    );

    expect(allowed).toBe(false);
  });

  it('should refuse when the session does not exist', async () => {
    planningSessionService.findOne.mockResolvedValue(null);

    const allowed = await guard.canActivate(
      contextFor({ user: { id: 'user-a' }, params: { sessionId: 'missing' } }),
    );

    expect(allowed).toBe(false);
  });

  it('should refuse an unauthenticated request', async () => {
    const allowed = await guard.canActivate(contextFor({ params: { sessionId: 'session-1' } }));

    expect(allowed).toBe(false);
    expect(planningSessionService.findOne).not.toHaveBeenCalled();
  });

  it('should refuse when no session id is supplied', async () => {
    const allowed = await guard.canActivate(contextFor({ user: { id: 'user-a' }, params: {} }));

    expect(allowed).toBe(false);
  });
});
