import {MemoryStore} from '../MemoryStore';

const flush = () => new Promise(resolve => setImmediate(resolve));

describe('MemoryStore', () => {
  const newStore = async () => {
    const store = new MemoryStore();
    await flush();
    return store;
  };

  describe('initial state', () => {
    it('starts with no facts and no recent context', async () => {
      const store = await newStore();
      expect(store.facts).toEqual([]);
      expect(store.recentContext).toBeUndefined();
      expect(store.factsSystemPromptFragment).toBeUndefined();
    });
  });

  describe('remember()', () => {
    it('stores a trimmed fact and returns it', async () => {
      const store = await newStore();
      const fact = store.remember('  Prefers concise answers  ');
      expect(fact?.text).toBe('Prefers concise answers');
      expect(store.facts).toHaveLength(1);
      expect(store.facts[0]).toEqual(fact);
    });

    it('returns undefined and stores nothing for blank input', async () => {
      const store = await newStore();
      const fact = store.remember('   ');
      expect(fact).toBeUndefined();
      expect(store.facts).toHaveLength(0);
    });

    it('truncates a fact past the per-fact character cap', async () => {
      const store = await newStore();
      const long = 'a'.repeat(400);
      const fact = store.remember(long);
      expect(fact?.text.length).toBe(300);
    });

    it('drops the oldest facts once the store exceeds its cap', async () => {
      const store = await newStore();
      for (let i = 0; i < 205; i++) {
        store.remember(`fact ${i}`);
      }
      expect(store.facts).toHaveLength(200);
      expect(store.facts[0].text).toBe('fact 5');
      expect(store.facts[store.facts.length - 1].text).toBe('fact 204');
    });
  });

  describe('forgetFact() / clearAllFacts()', () => {
    it('removes a single fact by id', async () => {
      const store = await newStore();
      const fact = store.remember('remove me')!;
      store.remember('keep me');
      store.forgetFact(fact.id);
      expect(store.facts.map(f => f.text)).toEqual(['keep me']);
    });

    it('clears every fact', async () => {
      const store = await newStore();
      store.remember('one');
      store.remember('two');
      store.clearAllFacts();
      expect(store.facts).toEqual([]);
    });
  });

  describe('factsSystemPromptFragment', () => {
    it('is undefined with no facts', async () => {
      const store = await newStore();
      expect(store.factsSystemPromptFragment).toBeUndefined();
    });

    it('lists remembered facts as bullet lines', async () => {
      const store = await newStore();
      store.remember('Likes short answers');
      store.remember('Building an app called Alesis');
      const fragment = store.factsSystemPromptFragment;
      expect(fragment).toContain('Likes short answers');
      expect(fragment).toContain('Building an app called Alesis');
    });

    it('caps the injected facts to the most recent 40', async () => {
      const store = await newStore();
      for (let i = 0; i < 45; i++) {
        store.remember(`fact ${i}`);
      }
      const fragment = store.factsSystemPromptFragment!;
      expect(fragment).not.toContain('fact 4\n');
      expect(fragment).toContain('fact 44');
      expect(fragment).toContain('fact 5');
    });
  });

  describe('captureRecentContext() / recentContextSystemPromptFragment()', () => {
    it('stores a trimmed excerpt tied to a session id', async () => {
      const store = await newStore();
      store.captureRecentContext('session-1', '  final reply text  ');
      expect(store.recentContext).toEqual(
        expect.objectContaining({
          sessionId: 'session-1',
          excerpt: 'final reply text',
        }),
      );
    });

    it('does nothing on a blank excerpt', async () => {
      const store = await newStore();
      store.captureRecentContext('session-1', '   ');
      expect(store.recentContext).toBeUndefined();
    });

    it('truncates the excerpt past its character cap', async () => {
      const store = await newStore();
      store.captureRecentContext('session-1', 'a'.repeat(1000));
      expect(store.recentContext?.excerpt.length).toBe(600);
    });

    it('returns the fragment for a different session', async () => {
      const store = await newStore();
      store.captureRecentContext('session-1', 'wrapped up the plan');
      const fragment = store.recentContextSystemPromptFragment('session-2');
      expect(fragment).toContain('wrapped up the plan');
    });

    it('returns undefined when the current session owns the saved context', async () => {
      const store = await newStore();
      store.captureRecentContext('session-1', 'wrapped up the plan');
      expect(
        store.recentContextSystemPromptFragment('session-1'),
      ).toBeUndefined();
    });

    it('returns undefined when nothing has been captured yet', async () => {
      const store = await newStore();
      expect(
        store.recentContextSystemPromptFragment('session-1'),
      ).toBeUndefined();
    });
  });
});
