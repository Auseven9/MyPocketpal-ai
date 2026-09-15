import {StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    alignSelf: 'flex-start',
    height: 16,
    paddingTop: 6,
    // Same bottom padding as PendingIndicator so swapping between the two
    // (prefill/tool-call vs. streaming_text) doesn't shift the input up/down.
    paddingBottom: 16,
    paddingHorizontal: 12,
    gap: 3,
  },
  bar: {
    width: 3,
    borderRadius: 1.5,
    // So the scaleY pulse grows the bar upward from its base, like a real
    // level meter, rather than expanding from its vertical center.
    transformOrigin: 'bottom',
  },
});
