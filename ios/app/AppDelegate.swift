import Expo
// @generated begin bootsplash-header - expo prebuild (DO NOT MODIFY) sync-7dde938c6b171704c935d950437931dd119f9ecd
import RNBootSplash
// @generated end bootsplash-header
import React
import ReactAppDependencyProvider
import KakaoSDKCommon
import KakaoSDKAuth

@UIApplicationMain
public class AppDelegate: ExpoAppDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ExpoReactNativeFactoryDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  public override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    // Kakao SDK 초기화
    if let kakaoAppKey = Bundle.main.object(forInfoDictionaryKey: "KAKAO_APP_KEY") as? String {
      KakaoSDK.initSDK(appKey: kakaoAppKey)
      print("✅ Kakao SDK 초기화 완료: \(kakaoAppKey)")
    } else {
      print("⚠️ KAKAO_APP_KEY를 Info.plist에서 찾을 수 없습니다")
    }

    let delegate = ReactNativeDelegate()
    let factory = ExpoReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory
    bindReactNativeFactory(factory)

#if os(iOS) || os(tvOS)
    window = UIWindow(frame: UIScreen.main.bounds)
    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: launchOptions)
#endif

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  // Linking API
  public override func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    // 🔑 카카오 로그인 Deep Link 처리 (카카오 SDK로 전달)
    if AuthApi.isKakaoTalkLoginUrl(url) {
      print("🔗 카카오 Deep Link 감지, SDK로 전달: \(url.absoluteString)")
      if AuthController.handleOpenUrl(url: url) {
        print("✅ 카카오 SDK가 URL 처리 완료")
        return true
      } else {
        print("❌ 카카오 SDK URL 처리 실패")
        return false
      }
    }

    // 다른 Deep Link는 React Native Linking으로 전달
    return super.application(app, open: url, options: options) || RCTLinkingManager.application(app, open: url, options: options)
  }

  // Universal Links
  public override func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {
    let result = RCTLinkingManager.application(application, continue: userActivity, restorationHandler: restorationHandler)
    return super.application(application, continue: userActivity, restorationHandler: restorationHandler) || result
  }
}

class ReactNativeDelegate: ExpoReactNativeFactoryDelegate {
// @generated begin bootsplash-init - expo prebuild (DO NOT MODIFY) sync-ed8abcac6539972aebf80ff9b977cac92fde8246
public override func customize(_ rootView: UIView) {
  super.customize(rootView)
  RNBootSplash.initWithStoryboard("BootSplash", rootView: rootView)
}
// @generated end bootsplash-init
  // Extension point for config-plugins

  override func sourceURL(for bridge: RCTBridge) -> URL? {
    // needed to return the correct URL for expo-dev-client.
    bridge.bundleURL ?? bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: ".expo/.virtual-metro-entry")
#else
    return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
