// Manual Jest mock for lottie-react-native — renders as a plain View so tests
// don't load the native Lottie player. Mirrors the pattern used for
// expo-linear-gradient and react-native-reanimated in this same directory.
const React = require('react');
const { View } = require('react-native');

const LottieView = React.forwardRef(({ source, autoPlay, loop, resizeMode, ...rest }, ref) => {
  React.useImperativeHandle(ref, () => ({
    play: () => {},
    reset: () => {},
    pause: () => {},
    resume: () => {},
  }));
  return React.createElement(View, rest);
});

module.exports = { __esModule: true, default: LottieView };
