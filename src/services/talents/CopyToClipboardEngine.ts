import Clipboard from '@react-native-clipboard/clipboard';

import {TalentEngine, TalentResult, ToolDefinition} from './types';

const MAX_CLIPBOARD_CHARS = 5000;

export class CopyToClipboardEngine implements TalentEngine {
  readonly name = 'copy_to_clipboard';

  async execute(args: Record<string, any>): Promise<TalentResult> {
    const text = typeof args.text === 'string' ? args.text : '';
    if (!text) {
      return {
        type: 'error',
        summary: 'copy_to_clipboard: missing or empty "text" argument',
        errorMessage:
          'text argument is required and must be a non-empty string',
      };
    }

    const truncated = text.length > MAX_CLIPBOARD_CHARS;
    const clipped = text.slice(0, MAX_CLIPBOARD_CHARS);

    try {
      Clipboard.setString(clipped);
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      return {
        type: 'error',
        summary: 'copy_to_clipboard: failed to write to the clipboard',
        errorMessage: errMsg,
      };
    }

    return {
      type: 'text',
      summary: truncated
        ? `copy_to_clipboard: copied the first ${MAX_CLIPBOARD_CHARS} characters to the clipboard`
        : 'copy_to_clipboard: copied to the clipboard',
    };
  }

  toToolDefinition(): ToolDefinition {
    return {
      type: 'function',
      function: {
        name: 'copy_to_clipboard',
        description:
          'Copy text to the device clipboard so the user can paste it elsewhere. ' +
          'Use this when the user explicitly asks you to copy something.',
        parameters: {
          type: 'object',
          properties: {
            text: {
              type: 'string',
              description: 'The exact text to copy to the clipboard.',
            },
          },
          required: ['text'],
        },
      },
    };
  }
}
