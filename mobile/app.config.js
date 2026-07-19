export default ({ config }) => ({
  ...config,
  expo: {
    name: "NomNom Dash",
    slug: "uber-eats-clone",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "ubereatscloneapp",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      bundleIdentifier: "com.aiwithbasir.ubereatsclonefinal",
      supportsTablet: true,
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSLocationWhenInUseUsageDescription:
          "We need your location to show nearby restaurants and deliver food to you.",
        NSLocationAlwaysUsageDescription:
          "We need your location for real-time order tracking.",
      },
    },
    android: {
      package: "com.aiwithbasir.ubereatsclonefinal",
      permissions: ["ACCESS_COARSE_LOCATION", "ACCESS_FINE_LOCATION"],
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY,
        },
      },
      adaptiveIcon: {
        backgroundColor: "#06C167",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png",
      },
      predictiveBackGestureEnabled: false,
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-router",
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission:
            "Allow Uber Eats Clone to use your location.",
        },
      ],
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          dark: {
            backgroundColor: "#000000",
          },
        },
      ],
      "expo-font",
      "expo-image",
      "expo-status-bar",
      "expo-web-browser",
      [
        "@stripe/stripe-react-native",
        {
          merchantIdentifier: "merchant.com.aiwithbasir.ubereatsclonefinal",
          enableGooglePay: true,
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: "ca153cda-f4d4-4546-bd76-6b949ddc2116",
      },
    },
    owner: "basirjafarzadeh1",
  },
});
