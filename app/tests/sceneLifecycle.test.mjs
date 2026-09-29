import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { migrate, manifest } = require('../plugins/withSceneLifecycle.js');
const original = readFileSync(new URL('./fixtures/sdk54-AppDelegate.swift', import.meta.url), 'utf8');

test('legacy SDK 54 launch migrates to one scene-owned React window and is idempotent', () => {
  const migrated = migrate(original);
  assert.ok(!migrated.includes('UIWindow(frame: UIScreen.main.bounds)'));
  assert.equal((migrated.match(/factory.startReactNative\(/g) || []).length, 1);
  assert.ok(migrated.includes('UIWindow(windowScene: windowScene)'));
  assert.equal(migrate(migrated), migrated);
  assert.equal(migrated, readFileSync(new URL('../ios/app/AppDelegate.swift', import.meta.url), 'utf8'));
});

test('scene manifest resolves the native class and enables only one window', () => {
  const plist = JSON.parse(execFileSync('plutil', ['-convert', 'json', '-o', '-', new URL('../ios/app/Info.plist', import.meta.url).pathname]));
  assert.deepEqual(plist.UIApplicationSceneManifest, manifest);
  assert.equal(manifest.UIApplicationSupportsMultipleScenes, false);
  assert.ok(readFileSync(new URL('../plugins/SceneDelegate.swift', import.meta.url), 'utf8').includes('@objc('+manifest.UISceneConfigurations.UIWindowSceneSessionRoleApplication[0].UISceneDelegateClassName+')'));
});

test('unexpected startup fails prebuild instead of silently shipping without migration', () => {
  assert.throws(() => migrate('class AppDelegate {}'), /Unexpected AppDelegate/);
});
