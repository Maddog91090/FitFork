import React from 'react';
import { render } from '@testing-library/react-native';
import { Sparkline } from '../components/ui/Sparkline';

describe('Sparkline', () => {
  it('renders nothing below two points or before layout', async () => {
    const single = await render(<Sparkline values={[80]} width={200} accessibilityLabel="trend" />);
    expect(single.queryByLabelText('trend')).toBeNull();

    const unmeasured = await render(<Sparkline values={[80, 81]} width={0} accessibilityLabel="trend" />);
    expect(unmeasured.queryByLabelText('trend')).toBeNull();
  });

  it('draws one segment between each pair of points', async () => {
    const { getByLabelText } = await render(
      <Sparkline values={[80, 81, 79, 82]} width={300} accessibilityLabel="trend" />
    );
    // Three segments for four points, plus the current-point marker.
    expect(getByLabelText('trend').children).toHaveLength(4);
  });

  it('centres a flat series instead of collapsing it onto an edge', async () => {
    const { getByLabelText } = await render(
      <Sparkline values={[80, 80, 80]} width={300} height={64} accessibilityLabel="trend" />
    );
    const segments = getByLabelText('trend').children as any[];
    const tops = segments.slice(0, 2).map((s) => s.props.style.find((v: any) => v?.top)?.top);
    expect(new Set(tops).size).toBe(1);
    expect(tops[0]).toBeCloseTo(64 / 2 - 1, 5);
  });
});
