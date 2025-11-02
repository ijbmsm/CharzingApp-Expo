module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Expo SDK 54: babel-preset-expo automatically handles Reanimated
    // No need to add 'react-native-reanimated/plugin' manually
  };
};
