import {RememberEngine} from '../RememberEngine';
import type {MemoryAccess} from '../RememberEngine';

const makeAccess = (overrides: Partial<MemoryAccess> = {}): MemoryAccess => ({
  remember: jest.fn(),
  ...overrides,
});

describe('RememberEngine', () => {
  it('exposes the remember schema with a required fact param', () => {
    const def = new RememberEngine(makeAccess()).toToolDefinition();
    expect(def.function.name).toBe('remember');
    expect(def.function.parameters.required).toEqual(['fact']);
  });

  it('forwards a trimmed fact to the memory access and returns a text result', async () => {
    const access = makeAccess();
    const result = await new RememberEngine(access).execute({
      fact: '  Prefers concise answers  ',
    });
    expect(access.remember).toHaveBeenCalledWith('Prefers concise answers');
    expect(result.type).toBe('text');
    if (result.type === 'text') {
      expect(result.summary).toContain('Prefers concise answers');
    }
  });

  it('returns an error result on an empty fact and does not call remember', async () => {
    const access = makeAccess();
    const result = await new RememberEngine(access).execute({fact: '   '});
    expect(result.type).toBe('error');
    expect(access.remember).not.toHaveBeenCalled();
  });

  it('returns an error result when fact is missing entirely', async () => {
    const access = makeAccess();
    const result = await new RememberEngine(access).execute({});
    expect(result.type).toBe('error');
    expect(access.remember).not.toHaveBeenCalled();
  });

  it('exposes a non-empty system prompt fragment', () => {
    const fragment = new RememberEngine(makeAccess()).systemPromptFragment?.();
    expect(fragment).toBeTruthy();
    expect(fragment).toMatch(/remember/i);
  });
});
