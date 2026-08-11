// Manual Jest mock for react-native-safe-area-context.
//
// The library's own bundled jest mock (jest/mock.tsx) only has a default
// export; imported via named destructuring (`import { useSafeAreaInsets }
// from ...`) that resolves to `undefined` under this project's Babel/CJS
// interop, not the mock's implementation. This covers exactly the API
// surface the app uses, with insets pinned at zero — enough for tests to
// assert on rendered output without needing a real device frame.
const React = require('react');
const { View } = require('react-native');

const ZERO_INSETS = { top: 0, right: 0, bottom: 0, left: 0 };
const MOCK_FRAME = { x: 0, y: 0, width: 320, height: 640 };

module.exports = {
  __esModule: true,
  SafeAreaProvider: ({ children }) => children,
  SafeAreaView: React.forwardRef((props, ref) => React.createElement(View, { ref, ...props })),
  useSafeAreaInsets: () => ZERO_INSETS,
  useSafeAreaFrame: () => MOCK_FRAME,
  initialWindowMetrics: { frame: MOCK_FRAME, insets: ZERO_INSETS },
};
