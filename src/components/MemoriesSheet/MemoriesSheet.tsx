import React, {useContext} from 'react';
import {Alert, TouchableOpacity, View} from 'react-native';
import {Button, Text} from 'react-native-paper';
import {observer} from 'mobx-react';

import {Sheet} from '../Sheet';
import {useTheme} from '../../hooks';
import {memoryStore} from '../../store';
import {L10nContext} from '../../utils';
import {timeAgo} from '../../utils/formatters';
import {TrashIcon} from '../../assets/icons';

import {createStyles} from './styles';

interface MemoriesSheetProps {
  isVisible: boolean;
  onDismiss: () => void;
}

/**
 * User-only management surface for MemoryStore.facts — the model can only
 * write (via the `remember` talent), never delete, so this sheet is the
 * sole way a fact ever goes away.
 */
export const MemoriesSheet: React.FC<MemoriesSheetProps> = observer(
  ({isVisible, onDismiss}) => {
    const theme = useTheme();
    const l10n = useContext(L10nContext);
    const styles = createStyles(theme);
    const strings = l10n.settings.memories;

    const facts = memoryStore.facts;

    const handleDeleteFact = (id: string, text: string) => {
      Alert.alert(strings.deleteFactTitle, text, [
        {text: l10n.common.cancel, style: 'cancel'},
        {
          text: l10n.common.delete,
          style: 'destructive',
          onPress: () => memoryStore.forgetFact(id),
        },
      ]);
    };

    const handleClearAll = () => {
      Alert.alert(strings.clearAllTitle, strings.clearAllMessage, [
        {text: l10n.common.cancel, style: 'cancel'},
        {
          text: l10n.common.delete,
          style: 'destructive',
          onPress: () => memoryStore.clearAllFacts(),
        },
      ]);
    };

    return (
      <Sheet
        isVisible={isVisible}
        onClose={onDismiss}
        title={strings.title}
        snapPoints={['50%', '90%']}>
        <Sheet.ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.description}>{strings.sheetDescription}</Text>
          {facts.length === 0 ? (
            <Text style={styles.emptyText}>{strings.emptyState}</Text>
          ) : (
            facts
              .slice()
              .reverse()
              .map(fact => (
                <View
                  key={fact.id}
                  style={styles.factRow}
                  testID="memory-fact-row">
                  <View style={styles.factTextContainer}>
                    <Text style={styles.factText}>{fact.text}</Text>
                    <Text variant="labelSmall" style={styles.factDate}>
                      {timeAgo(fact.createdAt, l10n, 'short')}
                    </Text>
                  </View>
                  <TouchableOpacity
                    testID={`memory-fact-delete-${fact.id}`}
                    style={styles.deleteButton}
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel={strings.deleteFactAccessibilityLabel}
                    onPress={() => handleDeleteFact(fact.id, fact.text)}>
                    <TrashIcon
                      width={20}
                      height={20}
                      stroke={theme.colors.error}
                    />
                  </TouchableOpacity>
                </View>
              ))
          )}
        </Sheet.ScrollView>
        {facts.length > 0 && (
          <Sheet.Actions>
            <Button
              testID="memories-clear-all-button"
              mode="text"
              textColor={theme.colors.error}
              style={styles.clearAllButton}
              onPress={handleClearAll}>
              {strings.clearAllButton}
            </Button>
          </Sheet.Actions>
        )}
      </Sheet>
    );
  },
);
