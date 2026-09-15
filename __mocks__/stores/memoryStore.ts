import {makeAutoObservable} from 'mobx';

import type {MemoryFact} from '../../src/store/MemoryStore';

class MockMemoryStore {
  facts: MemoryFact[] = [];
  recentContext:
    | {sessionId: string; excerpt: string; savedAt: number}
    | undefined = undefined;

  remember: jest.Mock;
  forgetFact: jest.Mock;
  clearAllFacts: jest.Mock;
  captureRecentContext: jest.Mock;
  recentContextSystemPromptFragment: jest.Mock;

  constructor() {
    makeAutoObservable(this, {
      remember: false,
      forgetFact: false,
      clearAllFacts: false,
      captureRecentContext: false,
      recentContextSystemPromptFragment: false,
    });

    this.remember = jest.fn((text: string) => {
      const fact = {
        id: `fact-${this.facts.length}`,
        text,
        createdAt: Date.now(),
      };
      this.facts.push(fact);
      return fact;
    });
    this.forgetFact = jest.fn((id: string) => {
      this.facts = this.facts.filter(f => f.id !== id);
    });
    this.clearAllFacts = jest.fn(() => {
      this.facts = [];
    });
    this.captureRecentContext = jest.fn();
    this.recentContextSystemPromptFragment = jest
      .fn()
      .mockReturnValue(undefined);
  }

  get factsSystemPromptFragment(): string | undefined {
    if (this.facts.length === 0) {
      return undefined;
    }
    return `## Things you remember about this user (from earlier conversations)\n${this.facts
      .map(f => `- ${f.text}`)
      .join('\n')}`;
  }
}

export const mockMemoryStore = new MockMemoryStore();
