import { decideNotification } from '../lib/notificationSchedule';

describe('decideNotification', () => {
  it('returns none when a session was already completed today', () => {
    expect(decideNotification('2026-08-06', '2026-08-06')).toBe('none');
  });

  it('returns reminder when the last session was yesterday', () => {
    expect(decideNotification('2026-08-05', '2026-08-06')).toBe('reminder');
  });

  it('returns streak-risk when the last session was 2 days ago', () => {
    expect(decideNotification('2026-08-04', '2026-08-06')).toBe('streak-risk');
  });

  it('returns streak-risk when the last session was 5 days ago', () => {
    expect(decideNotification('2026-08-01', '2026-08-06')).toBe('streak-risk');
  });

  it('returns streak-risk when no session has ever been completed', () => {
    expect(decideNotification(null, '2026-08-06')).toBe('streak-risk');
  });
});
