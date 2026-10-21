//
//  ZenFocusScreenTimeBridge.m
//  ZenFocus - React Native Objective-C Export Bridge
//

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(ZenFocusScreenTimeBridge, NSObject)

RCT_EXTERN_METHOD(requestFamilyControlsAuthorization:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getScreenTimeCapabilities:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(setShieldedApplications:(NSArray *)bundleIdentifiers
                  enabled:(BOOL)enabled
                  resolve:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(setDenyAppRemoval:(BOOL)enabled
                  resolve:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(scheduleFocusActivity:(NSString *)activityName
                  startTime:(NSString *)startTime
                  endTime:(NSString *)endTime
                  resolve:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(clearAllShields:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(startStudySession:(double)durationMinutes
                  sessionName:(NSString *)sessionName
                  resolve:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(adjustStudySession:(double)deltaMinutes
                  resolve:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(stopStudySession:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(scanInstalledApplications:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end

