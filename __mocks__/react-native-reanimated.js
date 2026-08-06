// Manual Jest mock for react-native-reanimated.
//
// The library's own mock re-imports its index, which pulls in the native
// worklets module and crashes under jest-expo. This covers exactly the API
// surface the app uses, rendering animated components as plain views and
// resolving animations to their target value synchronously — enough for tests
// to assert on the committed output.
const React = require('react');
const { View, Text, ScrollView } = require('react-native');

// Strip animation-only props so they never reach the host component.
function stripAnimatedProps({ entering, exiting, layout, ...rest }) {
  return rest;
}

const AnimatedView = React.forwardRef((props, ref) =>
  React.createElement(View, { ref, ...stripAnimatedProps(props) })
);
const AnimatedText = React.forwardRef((props, ref) =>
  React.createElement(Text, { ref, ...stripAnimatedProps(props) })
);
const AnimatedScrollView = React.forwardRef((props, ref) =>
  React.createElement(ScrollView, { ref, ...stripAnimatedProps(props) })
);

const Animated = {
  View: AnimatedView,
  Text: AnimatedText,
  ScrollView: AnimatedScrollView,
  createAnimatedComponent: (Component) =>
    React.forwardRef((props, ref) =>
      React.createElement(Component, { ref, ...stripAnimatedProps(props) })
    ),
};

// A shared value that behaves like the real proxy for `.value` reads/writes.
function useSharedValue(initial) {
  const ref = React.useRef({ value: initial });
  return ref.current;
}

// Run the worklet once and return its result so styles are still applied.
function useAnimatedStyle(factory) {
  return factory();
}

// Animations resolve to their target immediately in tests.
const identity = (toValue) => toValue;

// Entering/exiting/layout builders: chainable no-ops that return themselves.
function makeAnimationBuilder() {
  const builder = {};
  const chain = () => builder;
  for (const method of ['duration', 'delay', 'easing', 'springify', 'damping', 'stiffness', 'mass', 'withInitialValues', 'build']) {
    builder[method] = chain;
  }
  return builder;
}

module.exports = {
  __esModule: true,
  default: Animated,
  useSharedValue,
  useAnimatedStyle,
  withSpring: identity,
  withTiming: identity,
  withDelay: (_delay, animation) => animation,
  Easing: {
    bezier: () => (t) => t,
    linear: (t) => t,
    inOut: (fn) => fn,
    out: (fn) => fn,
  },
  FadeIn: makeAnimationBuilder(),
  FadeInDown: makeAnimationBuilder(),
  FadeOut: makeAnimationBuilder(),
  LinearTransition: makeAnimationBuilder(),
};
