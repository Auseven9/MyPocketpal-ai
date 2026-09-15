import {Alert} from 'react-native';

interface ConfirmDestructiveActionOptions {
  title: string;
  message?: string;
  cancelLabel: string;
  confirmLabel: string;
  onConfirm: () => void;
}

/**
 * Shared shape for every "delete this?" confirm dialog in the app: a
 * cancel button plus one destructive-styled button that runs onConfirm.
 */
export function confirmDestructiveAction({
  title,
  message,
  cancelLabel,
  confirmLabel,
  onConfirm,
}: ConfirmDestructiveActionOptions): void {
  Alert.alert(title, message, [
    {text: cancelLabel, style: 'cancel'},
    {text: confirmLabel, style: 'destructive', onPress: onConfirm},
  ]);
}
