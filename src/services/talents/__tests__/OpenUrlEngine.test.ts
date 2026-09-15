import {Linking} from 'react-native';

import {OpenUrlEngine} from '../OpenUrlEngine';

describe('OpenUrlEngine', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('exposes the open_url schema with a required url param', () => {
    const def = new OpenUrlEngine().toToolDefinition();
    expect(def.function.name).toBe('open_url');
    expect(def.function.parameters.required).toEqual(['url']);
  });

  it('opens an allowed http(s) url', async () => {
    jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);
    const openURLMock = jest
      .spyOn(Linking, 'openURL')
      .mockResolvedValue(undefined);
    const result = await new OpenUrlEngine().execute({
      url: 'https://example.com',
    });
    expect(openURLMock).toHaveBeenCalledWith('https://example.com');
    expect(result.type).toBe('text');
    if (result.type === 'text') {
      expect(result.summary).toContain('https://example.com');
    }
  });

  it('returns an error result on an empty url', async () => {
    const result = await new OpenUrlEngine().execute({url: ''});
    expect(result.type).toBe('error');
  });

  it('returns an error result when no app can open the url', async () => {
    jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(false);
    const openURLMock = jest.spyOn(Linking, 'openURL');
    const result = await new OpenUrlEngine().execute({
      url: 'https://example.com',
    });
    expect(result.type).toBe('error');
    expect(openURLMock).not.toHaveBeenCalled();
  });

  it('returns an error result when Linking throws', async () => {
    jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);
    jest.spyOn(Linking, 'openURL').mockRejectedValue(new Error('boom'));
    const result = await new OpenUrlEngine().execute({
      url: 'https://example.com',
    });
    expect(result.type).toBe('error');
  });

  it.each([
    'file:///etc/passwd',
    'data:text/html,x',
    'http://user:pass@e.com',
    'ftp://e.com',
    'tel:12345',
    'not a url',
  ])(
    'rejects a non-http(s) or credentialed URL before opening (%s)',
    async badUrl => {
      const openURLMock = jest.spyOn(Linking, 'openURL');
      const result = await new OpenUrlEngine().execute({url: badUrl});
      expect(result.type).toBe('error');
      if (result.type === 'error') {
        expect(result.summary).toMatch(/only http/i);
      }
      expect(openURLMock).not.toHaveBeenCalled();
    },
  );
});
