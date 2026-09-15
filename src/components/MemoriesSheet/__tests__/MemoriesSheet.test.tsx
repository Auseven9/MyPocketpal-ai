import React from 'react';
import {Alert} from 'react-native';
import {fireEvent} from '@testing-library/react-native';

import {render} from '../../../../jest/test-utils';
import {L10nContext} from '../../../utils';
import {l10n} from '../../../locales';

import {MemoriesSheet} from '../MemoriesSheet';
import {memoryStore} from '../../../store';

// Render the Sheet body inline so rows/buttons are reachable, mirroring
// SearchProviderKeySheet's test mock.
jest.mock('../../Sheet/Sheet', () => {
  const {View} = require('react-native');
  const MockSheet = ({children, isVisible, title}: any) => {
    if (!isVisible) {
      return null;
    }
    return (
      <View testID="sheet">
        <View testID="sheet-title">{title}</View>
        {children}
      </View>
    );
  };
  MockSheet.ScrollView = ({children}: any) => <View>{children}</View>;
  MockSheet.Actions = ({children}: any) => <View>{children}</View>;
  return {Sheet: MockSheet};
});

jest.mock('../../../store', () => ({
  memoryStore: {
    facts: [],
    forgetFact: jest.fn(),
    clearAllFacts: jest.fn(),
  },
}));

const forgetFactMock = memoryStore.forgetFact as jest.Mock;
const clearAllFactsMock = memoryStore.clearAllFacts as jest.Mock;

const renderSheet = () =>
  render(
    <L10nContext.Provider value={l10n.en}>
      <MemoriesSheet isVisible onDismiss={jest.fn()} />
    </L10nContext.Provider>,
  );

// Invokes the destructive button's onPress from the last Alert.alert call.
const confirmDestructiveAlert = () => {
  const call = (Alert.alert as jest.Mock).mock.calls.at(-1);
  const buttons = call?.[2] as Array<{style?: string; onPress?: () => void}>;
  const destructive = buttons?.find(b => b.style === 'destructive');
  destructive?.onPress?.();
};

describe('MemoriesSheet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert');
    (memoryStore.facts as any) = [];
  });

  it('shows the empty state when there are no facts', () => {
    const {getByText} = renderSheet();
    expect(getByText(l10n.en.settings.memories.emptyState)).toBeTruthy();
  });

  it('lists remembered facts, most recent first', () => {
    (memoryStore.facts as any) = [
      {id: '1', text: 'Likes short answers', createdAt: 1000},
      {id: '2', text: 'Building an app called Alesis', createdAt: 2000},
    ];
    const {getAllByTestId, getByText} = renderSheet();
    expect(getByText('Likes short answers')).toBeTruthy();
    expect(getByText('Building an app called Alesis')).toBeTruthy();
    const rows = getAllByTestId('memory-fact-row');
    expect(rows).toHaveLength(2);
  });

  it('deletes a fact only after confirming the destructive alert', () => {
    (memoryStore.facts as any) = [
      {id: 'fact-1', text: 'Prefers concise answers', createdAt: 1000},
    ];
    const {getByTestId} = renderSheet();

    fireEvent.press(getByTestId('memory-fact-delete-fact-1'));
    expect(Alert.alert).toHaveBeenCalled();
    expect(forgetFactMock).not.toHaveBeenCalled();

    confirmDestructiveAlert();
    expect(forgetFactMock).toHaveBeenCalledWith('fact-1');
  });

  it('does not show a Clear All button when there are no facts', () => {
    const {queryByTestId} = renderSheet();
    expect(queryByTestId('memories-clear-all-button')).toBeNull();
  });

  it('clears every fact only after confirming the destructive alert', () => {
    (memoryStore.facts as any) = [
      {id: '1', text: 'one', createdAt: 1000},
      {id: '2', text: 'two', createdAt: 2000},
    ];
    const {getByTestId} = renderSheet();

    fireEvent.press(getByTestId('memories-clear-all-button'));
    expect(clearAllFactsMock).not.toHaveBeenCalled();

    confirmDestructiveAlert();
    expect(clearAllFactsMock).toHaveBeenCalled();
  });
});
