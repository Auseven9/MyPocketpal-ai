import React from 'react';

import {render} from '../../../../jest/test-utils';

import {InferenceSpectrum} from '../InferenceSpectrum';

describe('InferenceSpectrum', () => {
  it('renders the equalizer container with the documented testID', () => {
    const {getByTestId} = render(<InferenceSpectrum />);
    expect(getByTestId('inference-spectrum')).toBeTruthy();
  });

  it('renders more than one bar', () => {
    const {getByTestId} = render(<InferenceSpectrum />);
    const container = getByTestId('inference-spectrum');
    expect(container.children.length).toBeGreaterThan(1);
  });
});
