import {Linking} from 'react-native';

import {TalentEngine, TalentResult, ToolDefinition} from './types';

/**
 * Reject non-http(s) schemes and embedded credentials — same posture as
 * ReadUrlEngine. This tool actually launches the browser, so beyond the
 * exfiltration concerns read_url guards against, an unrestricted scheme
 * would let a model-crafted call trigger a phone call, SMS compose, or a
 * deep link into another installed app with no clear user intent behind it.
 */
const isAllowedOpenUrl = (raw: string): boolean => {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return false;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return false;
  }
  if (parsed.username || parsed.password) {
    return false;
  }
  return parsed.hostname.length > 0;
};

export class OpenUrlEngine implements TalentEngine {
  readonly name = 'open_url';

  async execute(args: Record<string, any>): Promise<TalentResult> {
    const url = typeof args.url === 'string' ? args.url.trim() : '';
    if (!url) {
      return {
        type: 'error',
        summary: 'open_url: missing or empty "url" argument',
        errorMessage: 'url argument is required and must be a non-empty string',
      };
    }

    if (!isAllowedOpenUrl(url)) {
      const summary = 'open_url: only http(s) URLs are allowed';
      return {type: 'error', summary, errorMessage: summary};
    }

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        const summary = `open_url: no app available to open "${url}"`;
        return {type: 'error', summary, errorMessage: summary};
      }
      await Linking.openURL(url);
      return {type: 'text', summary: `open_url: opened ${url}`};
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      return {
        type: 'error',
        summary: `open_url: failed to open "${url}"`,
        errorMessage: errMsg,
      };
    }
  }

  toToolDefinition(): ToolDefinition {
    return {
      type: 'function',
      function: {
        name: 'open_url',
        description:
          'Open a web link in the browser, on the device, so the user can see it. ' +
          'Use this when the user asks you to open, show, or take them to a page — ' +
          'not for reading a page yourself (use read_url for that).',
        parameters: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'The http(s) URL to open.',
            },
          },
          required: ['url'],
        },
      },
    };
  }
}
