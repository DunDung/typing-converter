const { withAppDelegate, withInfoPlist } = require('expo/config-plugins');
const fs = require('node:fs');
const path = require('node:path');

const manifest = {
  UIApplicationSupportsMultipleScenes: false,
  UISceneConfigurations: {
    UIWindowSceneSessionRoleApplication: [{
      UISceneConfigurationName: 'Default Configuration',
      UISceneDelegateClassName: 'TypingConverterSceneDelegate',
    }],
  },
};

function migrate(contents) {
  if (contents.includes('class TypingConverterSceneDelegate:')) return contents;
  const legacy = /#if os\(iOS\) \|\| os\(tvOS\)\s+window = UIWindow\(frame: UIScreen.main.bounds\)[\s\S]*?#endif/;
  if (!legacy.test(contents)) throw new Error('Unexpected AppDelegate startup; review scene migration before building.');
  return contents.replace('var window: UIWindow?', 'var window: UIWindow?\n  var reactLaunchOptions: [UIApplication.LaunchOptionsKey: Any]?')
    .replace(legacy, '    reactLaunchOptions = launchOptions\n    // SceneDelegate creates the window and starts React Native after scene connection.')
    + '\n' + fs.readFileSync(path.join(__dirname, 'SceneDelegate.swift'), 'utf8');
}

module.exports = function withSceneLifecycle(config) {
  config = withInfoPlist(config, mod => {
    mod.modResults.UIApplicationSceneManifest = manifest;
    return mod;
  });
  return withAppDelegate(config, mod => {
    if (mod.modResults.language !== 'swift') throw new Error('Scene lifecycle requires Swift AppDelegate.');
    mod.modResults.contents = migrate(mod.modResults.contents);
    return mod;
  });
};
module.exports.migrate = migrate;
module.exports.manifest = manifest;
