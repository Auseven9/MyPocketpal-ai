import {Alert} from 'react-native';

import {confirmDestructiveAction} from '../confirmDestructiveAction';

describe('confirmDestructiveAction', () => {
  beforeEach(() => {
    jest.spyOn(Alert, 'alert');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows a cancel button and a destructive confirm button', () => {
    const onConfirm = jest.fn();
    confirmDestructiveAction({
      title: 'Delete this?',
      message: 'This cannot be undone.',
      cancelLabel: 'Cancel',
      confirmLabel: 'Delete',
      onConfirm,
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      'Delete this?',
      'This cannot be undone.',
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Delete', style: 'destructive', onPress: onConfirm},
      ],
    );
  });

  it('does not invoke onConfirm just by showing the dialog', () => {
    const onConfirm = jest.fn();
    confirmDestructiveAction({
      title: 'Delete this?',
      cancelLabel: 'Cancel',
      confirmLabel: 'Delete',
      onConfirm,
    });
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('invokes onConfirm only when the destructive button is pressed', () => {
    const onConfirm = jest.fn();
    confirmDestructiveAction({
      title: 'Delete this?',
      cancelLabel: 'Cancel',
      confirmLabel: 'Delete',
      onConfirm,
    });

    const buttons = (Alert.alert as jest.Mock).mock.calls[0][2];
    const destructive = buttons.find((b: any) => b.style === 'destructive');
    destructive.onPress();
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
