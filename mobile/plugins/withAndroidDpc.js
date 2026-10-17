// ============================================================================
// EXPO CONFIG PLUGIN: withAndroidDpc
// Injects Android Device Policy Controller (DPC) DeviceAdminReceiver into AndroidManifest
// ============================================================================

const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withAndroidDpc = (config) => {
  // 1. Inject Receiver into AndroidManifest.xml
  config = withAndroidManifest(config, async (config) => {
    const mainApplication = config.modResults.manifest.application[0];

    // Ensure device_admin receiver isn't duplicated
    const existingReceiver = mainApplication.receiver?.find(
      (r) => r.$['android:name'] === '.EnterpriseDeviceAdminReceiver'
    );

    if (!existingReceiver) {
      if (!mainApplication.receiver) {
        mainApplication.receiver = [];
      }

      mainApplication.receiver.push({
        $: {
          'android:name': '.EnterpriseDeviceAdminReceiver',
          'android:label': 'ZenFocus Focus Admin',
          'android:description': '@string/device_admin_description',
          'android:permission': 'android.permission.BIND_DEVICE_ADMIN',
          'android:exported': 'true',
        },
        'meta-data': [
          {
            $: {
              'android:name': 'android.app.device_admin',
              'android:resource': '@xml/device_admin',
            },
          },
        ],
        'intent-filter': [
          {
            action: [
              {
                $: {
                  'android:name': 'android.app.action.DEVICE_ADMIN_ENABLED',
                },
              },
              {
                $: {
                  'android:name': 'android.app.action.PROFILE_PROVISIONING_COMPLETE',
                },
              },
            ],
          },
        ],
      });
    }

    return config;
  });

  // 2. Create res/xml/device_admin.xml in native Android resources
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const resXmlDir = path.join(
        config.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'res',
        'xml'
      );

      if (!fs.existsSync(resXmlDir)) {
        fs.mkdirSync(resXmlDir, { recursive: true });
      }

      const deviceAdminXmlContent = `<?xml version="1.0" encoding="utf-8"?>
<device-admin xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-policies>
        <limit-password />
        <watch-login />
        <reset-password />
        <force-lock />
        <wipe-data />
        <expire-password />
        <encrypted-storage />
        <disable-camera />
    </uses-policies>
</device-admin>`;

      fs.writeFileSync(path.join(resXmlDir, 'device_admin.xml'), deviceAdminXmlContent);
      return config;
    },
  ]);

  return config;
};

module.exports = withAndroidDpc;
