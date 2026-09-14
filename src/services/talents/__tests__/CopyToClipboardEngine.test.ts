import Clipboard from '@react-native-clipboard/clipboard';

import {CopyToClipboardEngine} from '../CopyToClipboardEngine';

describe('CopyToClipboardEngine', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('exposes the copy_to_clipboard schema with a required text param', () => {
    const def = new CopyToClipboardEngine().toToolDefinition();
    expect(def.function.name).toBe('copy_to_clipboard');
    expect(def.function.parameters.required).toEqual(['text']);
  });

  it('copies text to the clipboard', async () => {
    const setStringMock = jest.spyOn(Clipboard, 'setString');
    const result = await new CopyToClipboardEngine().execute({
      text: 'hello world',
    });
    expect(setStringMock).toHaveBeenCalledWith('hello world');
    expect(result.type).toBe('text');
  });

  it('returns an error result on empty text', async () => {
    const result = await new CopyToClipboardEngine().execute({text: ''});
    expect(result.type).toBe('error');
  });

  it('truncates text longer than the clipboard cap and reports truncation', async () => {
    const longText = 'a'.repeat(6000);
    const setStringMock = jest.spyOn(Clipboard, 'setString');
    const result = await new CopyToClipboardEngine().execute({
      text: longText,
    });
    expect(setStringMock).toHaveBeenCalledWith('a'.repeat(5000));
    expect(result.type).toBe('text');
    if (result.type === 'text') {
      expect(result.summary).toMatch(/first 5000/i);
    }
  });

  it('returns an error result when the clipboard write throws', async () => {
    jest.spyOn(Clipboard, 'setString').mockImplementation(() => {
      throw new Error('boom');
    });
    const result = await new CopyToClipboardEngine().execute({
      text: 'hello',
    });
    expect(result.type).toBe('error');
  });
});
