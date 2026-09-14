import {TalentEngine, TalentResult, ToolDefinition} from './types';

/**
 * Injected at `registerDefaultTalents()` so this engine never imports
 * `MemoryStore` directly — same reasoning as `SearchAccess` for the search
 * talents: keeps `execute()` free of MobX/store coupling.
 */
export interface MemoryAccess {
  remember(text: string): void;
}

/**
 * `remember` talent: the model's only write path into persistent memory.
 * Deliberately one-directional — there is no matching `forget`/`recall` tool.
 * Reading back what's remembered happens automatically (MemoryStore folds
 * every stored fact into the system message on every turn, regardless of
 * which talents are enabled), so the model doesn't need to ask for it. And
 * only the user can delete a memory (via Settings), not the model — a Pal
 * built to be over-eager about "remembering" things should not also be able
 * to quietly erase them.
 */
export class RememberEngine implements TalentEngine {
  readonly name = 'remember';

  constructor(private access: MemoryAccess) {}

  async execute(args: Record<string, any>): Promise<TalentResult> {
    const fact = typeof args.fact === 'string' ? args.fact.trim() : '';
    if (!fact) {
      return {
        type: 'error',
        summary: 'remember: missing or empty "fact" argument',
        errorMessage:
          'fact argument is required and must be a non-empty string',
      };
    }

    this.access.remember(fact);

    return {
      type: 'text',
      summary: `remember: saved "${fact}". You'll see this in future conversations too.`,
    };
  }

  systemPromptFragment(): string {
    return (
      'You can call remember to save a short, durable fact about the user ' +
      "(preferences, ongoing projects, things they've told you to keep in " +
      'mind) for future conversations — not for anything already obvious ' +
      'from context or likely to change within this same chat.'
    );
  }

  toToolDefinition(): ToolDefinition {
    return {
      type: 'function',
      function: {
        name: 'remember',
        description:
          'Save a short, durable fact about the user for future conversations ' +
          '(e.g. their name, a preference, an ongoing project). Write it as a ' +
          "standalone statement, not a copy of the user's own words.",
        parameters: {
          type: 'object',
          properties: {
            fact: {
              type: 'string',
              description:
                'The fact to remember, written as a short standalone statement (e.g. "Prefers concise answers", "Working on a React Native app called Alesis").',
            },
          },
          required: ['fact'],
        },
      },
    };
  }
}
