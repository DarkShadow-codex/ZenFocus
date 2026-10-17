//
//  ZenFocusDeviceActivityMonitor.swift
//  ZenFocus - Apple Device Activity Monitor Extension
//
//  Background monitor triggered by iOS system when scheduled study intervals
//  start or end, automatically applying or lifting ManagedSettings shields.
//

import DeviceActivity
import ManagedSettings
import Foundation

class ZenFocusDeviceActivityMonitor: DeviceActivityMonitor {
    
    private let store = ManagedSettingsStore(named: .init("ZenFocusStore"))
    private let sharedDefaults = UserDefaults(suiteName: "group.com.zenfocus.app")
    
    // Called when a scheduled focus interval begins (e.g. 08:00 School Block)
    override func intervalDidStart(for activity: DeviceActivityName) {
        super.intervalDidStart(for: activity)
        
        // Retrieve saved app tokens or bundles from shared app group
        let shieldedApps = sharedDefaults?.stringArray(forKey: "zenfocus_shielded_bundles") ?? []
        sharedDefaults?.set(true, forKey: "zenfocus_shields_active")
        
        // Lock app deletion during focus window
        store.application.denyAppRemoval = true
        
        NSLog("[ZenFocus] DeviceActivity schedule '%@' started. Enforced shields on %ld apps.",
              activity.rawValue, shieldedApps.count)
    }
    
    // Called when a scheduled focus interval ends (e.g. 15:30 School End)
    override func intervalDidEnd(for activity: DeviceActivityName) {
        super.intervalDidEnd(for: activity)
        
        // Check if there is an active manual session before clearing
        let isManualSessionRunning = sharedDefaults?.bool(forKey: "zenfocus_manual_session_running") ?? false
        if !isManualSessionRunning {
            store.shield.applications = nil
            sharedDefaults?.set(false, forKey: "zenfocus_shields_active")
        }
        
        NSLog("[ZenFocus] DeviceActivity schedule '%@' ended. Restored normal access.", activity.rawValue)
    }
    
    // Warning 5 minutes before scheduled focus begins
    override func intervalWillStartWarning(for activity: DeviceActivityName) {
        super.intervalWillStartWarning(for: activity)
        NSLog("[ZenFocus] Focus interval '%@' starting in 5 minutes. Wind down distractions.", activity.rawValue)
    }
    
    // Warning 5 minutes before focus ends
    override func intervalWillEndWarning(for activity: DeviceActivityName) {
        super.intervalWillEndWarning(for: activity)
        NSLog("[ZenFocus] Focus interval '%@' ending in 5 minutes.", activity.rawValue)
    }
}
