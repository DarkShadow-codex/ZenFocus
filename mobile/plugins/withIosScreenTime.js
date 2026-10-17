// ============================================================================
// EXPO CONFIG PLUGIN: withIosScreenTime
// Configures iOS Screen Time, FamilyControls, and ManagedSettings entitlements
// ============================================================================

const { withEntitlementsPlist, withInfoPlist } = require('@expo/config-plugins');

const withIosScreenTime = (config) => {
  // 1. Inject Entitlements: FamilyControls & App Group
  config = withEntitlementsPlist(config, (config) => {
    // Apple FamilyControls entitlement required for Screen Time API access
    config.modResults['com.apple.developer.family-controls'] = true;

    // App Group for sharing shielded app tokens and schedule state with extensions
    const existingGroups = config.modResults['com.apple.security.application-groups'] || [];
    if (!existingGroups.includes('group.com.zenfocus.app')) {
      config.modResults['com.apple.security.application-groups'] = [
        ...existingGroups,
        'group.com.zenfocus.app',
      ];
    }

    return config;
  });

  // 2. Inject Info.plist Usage Descriptions
  config = withInfoPlist(config, (config) => {
    config.modResults['NSFamilyControlsUsageDescription'] =
      'ZenFocus uses Family Controls to help students eliminate digital distractions during study focus sessions and enforce parent-guided restrictions.';
    return config;
  });

  return config;
};

module.exports = withIosScreenTime;
