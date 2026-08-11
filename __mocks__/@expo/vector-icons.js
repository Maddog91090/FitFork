// Manual Jest mock for @expo/vector-icons — renders MaterialIcons as a plain
// host element so tests can assert on its props (name, testID, etc.) without
// pulling in the real icon font renderer. Jest applies this automatically to
// every test file for any node_modules import of '@expo/vector-icons', the
// same mechanism as __mocks__/react-native-reanimated.js and
// __mocks__/expo-linear-gradient.js.
const React = require('react');

module.exports = {
  __esModule: true,
  MaterialIcons: (props) => React.createElement('MaterialIcon', props),
};
