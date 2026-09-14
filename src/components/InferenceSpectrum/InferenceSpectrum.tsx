import React, {useEffect, useRef} from 'react';
import {Animated, View} from 'react-native';

import {useTheme} from '../../hooks';

import {styles} from './styles';

// One bar per entry: [peak scaleY, cycle duration ms, start delay ms].
// Durations/delays are irregular on purpose so the bars don't move in
// lockstep — reads as "live audio" rather than a mechanical bounce.
const BARS: Array<{peak: number; duration: number; delay: number}> = [
  {peak: 1.6, duration: 420, delay: 0},
  {peak: 2.6, duration: 560, delay: 90},
  {peak: 3.4, duration: 480, delay: 40},
  {peak: 2.2, duration: 600, delay: 150},
  {peak: 1.4, duration: 440, delay: 60},
];

const BASE_HEIGHT = 3;

const SpectrumBar: React.FC<{
  peak: number;
  duration: number;
  delay: number;
  color: string;
}> = ({peak, duration, delay, color}) => {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const cycle = Animated.sequence([
      Animated.timing(scale, {
        toValue: peak,
        duration: duration / 2,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: duration / 2,
        useNativeDriver: true,
      }),
    ]);
    const loop = Animated.loop(cycle);
    loop.start();
    return () => loop.stop();
  }, [scale, peak, duration, delay]);

  return (
    <Animated.View
      style={[
        styles.bar,
        {
          height: BASE_HEIGHT,
          backgroundColor: color,
          transform: [{scaleY: scale}],
        },
      ]}
    />
  );
};

/**
 * Lightweight animated equalizer shown while the model is actively
 * streaming tokens — the one generation state that otherwise has zero
 * visual feedback beyond the text itself (PendingIndicator is explicitly
 * hidden during streaming_text so it doesn't compete with the token
 * stream). Pure decoration, native-driven so it stays smooth even while
 * the JS thread is busy applying incoming tokens.
 */
export const InferenceSpectrum: React.FC = () => {
  const theme = useTheme();
  const color = theme.colors.primary;

  return (
    <View style={styles.container} testID="inference-spectrum">
      {BARS.map((bar, i) => (
        <SpectrumBar key={i} color={color} {...bar} />
      ))}
    </View>
  );
};
