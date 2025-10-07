import { AuthenticationsGuard } from './authentications.guard';

describe('AuthenticationsGuard', () => {
  it('should be defined', () => {
    expect(new AuthenticationsGuard()).toBeDefined();
  });
});
