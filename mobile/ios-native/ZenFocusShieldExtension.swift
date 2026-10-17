//
//  ZenFocusShieldExtension.swift
//  ZenFocus - Apple Shield Configuration Extension
//
//  Customizes the native iOS block screen presented when a student attempts
//  to launch an app protected by ZenFocus ManagedSettings shields.
//

import ManagedSettings
import ManagedSettingsUI
import UIKit

class ZenFocusShieldExtension: ShieldConfigurationDataSource {
    
    // Customization for individual shielded applications
    override func configuration(shielding application: Application) -> ShieldConfiguration {
        return ShieldConfiguration(
            backgroundBlurStyle: .systemUltraThinMaterialDark,
            backgroundColor: UIColor(red: 0.07, green: 0.07, blue: 0.12, alpha: 0.96),
            icon: UIImage(systemName: "shield.fill")?.withTintColor(
                UIColor(red: 0.32, green: 0.27, blue: 0.90, alpha: 1.0),
                renderingMode: .alwaysOriginal
            ),
            title: ShieldConfiguration.Label(
                text: "Study Focus Active",
                color: .white
            ),
            subtitle: ShieldConfiguration.Label(
                text: "This app is restricted by ZenFocus to protect your study flow. Notifications are silenced.",
                color: UIColor(white: 0.75, alpha: 1.0)
            ),
            primaryButtonLabel: ShieldConfiguration.Label(
                text: "Request Study Exception",
                color: .white
            ),
            primaryButtonBackgroundColor: UIColor(red: 0.32, green: 0.27, blue: 0.90, alpha: 1.0),
            secondaryButtonLabel: ShieldConfiguration.Label(
                text: "Return to Focus Hub",
                color: UIColor(white: 0.6, alpha: 1.0)
            )
        )
    }
    
    // Customization for category-level restrictions
    override func configuration(shielding application: Application, in category: ActivityCategory) -> ShieldConfiguration {
        return ShieldConfiguration(
            backgroundBlurStyle: .systemUltraThinMaterialDark,
            backgroundColor: UIColor(red: 0.07, green: 0.07, blue: 0.12, alpha: 0.96),
            icon: UIImage(systemName: "hourglass")?.withTintColor(
                UIColor(red: 0.33, green: 0.84, blue: 0.75, alpha: 1.0),
                renderingMode: .alwaysOriginal
            ),
            title: ShieldConfiguration.Label(
                text: "Category Restricted",
                color: .white
            ),
            subtitle: ShieldConfiguration.Label(
                text: "All apps in this category are blocked during your scheduled focus interval.",
                color: UIColor(white: 0.75, alpha: 1.0)
            ),
            primaryButtonLabel: ShieldConfiguration.Label(
                text: "Open ZenFocus Hub",
                color: .white
            ),
            primaryButtonBackgroundColor: UIColor(red: 0.32, green: 0.27, blue: 0.90, alpha: 1.0),
            secondaryButtonLabel: nil
        )
    }
    
    // Customization for web domain shields
    override func configuration(shielding webDomain: WebDomain) -> ShieldConfiguration {
        return ShieldConfiguration(
            backgroundBlurStyle: .systemMaterialDark,
            backgroundColor: UIColor(red: 0.07, green: 0.07, blue: 0.12, alpha: 0.96),
            icon: UIImage(systemName: "globe.badge.chevron.backward"),
            title: ShieldConfiguration.Label(text: "Website Blocked", color: .white),
            subtitle: ShieldConfiguration.Label(text: "Access to this website is blocked during focus time.", color: .lightGray),
            primaryButtonLabel: ShieldConfiguration.Label(text: "Return to Study", color: .white),
            primaryButtonBackgroundColor: UIColor(red: 0.32, green: 0.27, blue: 0.90, alpha: 1.0),
            secondaryButtonLabel: nil
        )
    }
}
