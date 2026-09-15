import {StyleSheet} from 'react-native';

import {Theme} from '../../utils/types';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: {
      padding: 16,
      paddingBottom: 32,
    },
    description: {
      marginBottom: 16,
      color: theme.colors.onSurface,
    },
    emptyText: {
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      marginTop: 24,
    },
    factRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.outlineVariant,
    },
    factTextContainer: {
      flex: 1,
      marginRight: 8,
    },
    factText: {
      color: theme.colors.onSurface,
    },
    factDate: {
      color: theme.colors.onSurfaceVariant,
      marginTop: 2,
    },
    deleteButton: {
      padding: 8,
    },
    clearAllButton: {
      width: '100%',
    },
  });
};
