const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function(env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);
  
  // Add an alias for stripe to use an empty module
  config.resolve.alias = config.resolve.alias || {};
  config.resolve.alias['@stripe/stripe-react-native'] = 'react-native-web';
  
  return config;
};
