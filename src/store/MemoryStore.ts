import {makeAutoObservable, runInAction} from 'mobx';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {makePersistable} from 'mobx-persist-store';
import {v4 as uuidv4} from 'uuid';

export interface MemoryFact {
  id: string;
  text: string;
  createdAt: number;
}

/** Snapshot of the most recently finished turn, carried into a brand-new
 * chat so it isn't a total blank slate. Deliberately simple: the assistant's
 * last reply text, not an LLM-generated abstractive summary — running a
 * second completion through the single native context to summarize would
 * need real concurrency guarding against a user-initiated generation
 * starting on the newly active session. This carries forward instead. */
export interface RecentContext {
  sessionId: string;
  excerpt: string;
  savedAt: number;
}

// Facts are small, user-relevant statements — not a transcript. Both caps
// keep the persisted file and the per-turn injected block bounded regardless
// of how long someone uses the app.
const MAX_FACTS = 200;
const MAX_FACT_CHARS = 300;
const MAX_INJECTED_FACTS = 40;
const MAX_RECENT_CONTEXT_CHARS = 600;

/**
 * Durable, cross-session memory: a small store of things `remember` (a
 * talent, so a Pal opts in like any other tool) has written, plus a rolling
 * carry-forward of the last turn's content for a fresh chat. Persisted as
 * JSON via mobx-persist-store/AsyncStorage — the same mechanism every other
 * store in the app already uses, read once at store construction and kept
 * as a small in-memory array afterwards, not re-read per turn.
 *
 * Facts are read unconditionally (folded into every request's system
 * message in useChatSession, regardless of which Pal or talents are
 * active) — they're baseline continuity, not a tool result. Only the
 * *write* path (the `remember` talent) is Pal/talent-gated, consistent
 * with every other tool in the app. Deletion is deliberately not exposed
 * to the model — only the user can forget something, via the UI.
 */
export class MemoryStore {
  facts: MemoryFact[] = [];
  recentContext: RecentContext | undefined = undefined;

  constructor() {
    makeAutoObservable(this);

    makePersistable(this, {
      name: 'MemoryStore',
      properties: ['facts', 'recentContext'],
      storage: AsyncStorage,
    });
  }

  /** Called by the `remember` talent. Returns the stored fact (post-trim). */
  remember(rawText: string): MemoryFact | undefined {
    const text = rawText.trim().slice(0, MAX_FACT_CHARS);
    if (!text) {
      return undefined;
    }
    const fact: MemoryFact = {id: uuidv4(), text, createdAt: Date.now()};
    runInAction(() => {
      this.facts.push(fact);
      // Drop oldest beyond the cap rather than reject new ones — the model
      // has no way to know the store is full, so it must never see "remember"
      // silently fail.
      if (this.facts.length > MAX_FACTS) {
        this.facts.splice(0, this.facts.length - MAX_FACTS);
      }
    });
    return fact;
  }

  /** User-only: the model has no path to this. */
  forgetFact(id: string): void {
    runInAction(() => {
      this.facts = this.facts.filter(f => f.id !== id);
    });
  }

  /** User-only: clears every remembered fact. */
  clearAllFacts(): void {
    runInAction(() => {
      this.facts = [];
    });
  }

  /**
   * Folded into the leading system message on every turn (see
   * useChatSession.prepareCompletion) — independent of which talents are
   * enabled, since recalling what you already know about the user isn't a
   * tool call. Undefined when there's nothing to say, so callers can filter
   * it out like any other fragment.
   */
  get factsSystemPromptFragment(): string | undefined {
    if (this.facts.length === 0) {
      return undefined;
    }
    // Most-recent first isn't necessary for correctness, but keeps whichever
    // facts get trimmed by MAX_INJECTED_FACTS the oldest ones, not a random
    // cross-section.
    const injected = this.facts.slice(-MAX_INJECTED_FACTS);
    const lines = injected.map(f => `- ${f.text}`).join('\n');
    return `## Things you remember about this user (from earlier conversations)\n${lines}`;
  }

  /** Called once per finished turn (see useChatSession) so it's always
   * current, not tied to detecting "the user switched chats" — which has no
   * single reliable trigger (closing the app, starting a new chat, and
   * switching sessions all need to count). */
  captureRecentContext(sessionId: string, excerptSource: string): void {
    const excerpt = excerptSource.trim().slice(0, MAX_RECENT_CONTEXT_CHARS);
    if (!excerpt) {
      return;
    }
    runInAction(() => {
      this.recentContext = {sessionId, excerpt, savedAt: Date.now()};
    });
  }

  /** Undefined when there's nothing to carry forward, or when the saved
   * excerpt belongs to the session currently being read (a session's own
   * tail must never be reflected back into itself). */
  recentContextSystemPromptFragment(
    currentSessionId: string | null | undefined,
  ): string | undefined {
    const ctx = this.recentContext;
    if (!ctx || ctx.sessionId === currentSessionId) {
      return undefined;
    }
    return `## Continuing from your last conversation\n${ctx.excerpt}`;
  }
}

export const memoryStore = new MemoryStore();
