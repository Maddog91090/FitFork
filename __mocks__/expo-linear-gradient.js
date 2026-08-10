// Manual Jest mock for expo-linear-gradient — renders as a plain View so
// tests can assert on structure and layout without a native gradient
// renderer. Jest applies this automatically to every test file for any
// node_modules import of 'expo-linear-gradient', the same mechanism as
// __mocks__/react-native-reanimated.js.
const React = require('react');
const { View } = require('react-native');

const LinearGradient = React.forwardRef(({ colors, locations, start, end, ...rest }, ref) =>
  React.createElement(View, { ref, ...rest })
);

module.exports = { __esModule: true, LinearGradient };
