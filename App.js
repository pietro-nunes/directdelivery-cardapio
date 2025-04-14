import React, { useEffect, useCallback, useState } from "react";
import { View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";

import MainScreen from "./screens/MainScreen";
import CartScreen from "./screens/CartScreen";
import QRCodeScreen from "./screens/QRCodeScreen";
import WelcomeScreen from "./screens/WelcomeScreen";
import TenantSetupScreen from "./screens/TenantSetupScreen"; // nova tela de configuração

import { CartProvider } from "./context/CartContext";
import { MesaProvider } from "./context/MesaContext";
import { CategoryProvider } from "./context/CategoryContext";
import { TenantProvider, useTenant } from "./context/TenantContext";

import Toast from "react-native-toast-message";
import { toastConfig } from "./components/toastconfig";

SplashScreen.preventAutoHideAsync();

const Stack = createStackNavigator();

function RootNavigation() {
  const { tenant } = useTenant();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!tenant ? (
          <Stack.Screen name="Setup" component={TenantSetupScreen} />
        ) : (
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Main" component={MainScreen} />
            <Stack.Screen name="Cart" component={CartScreen} />
            <Stack.Screen name="QRCode" component={QRCodeScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter: require("./assets/fonts/Inter-Regular.ttf"),
    "Inter-Bold": require("./assets/fonts/Inter-Bold.ttf"),
    "Inter-SemiBold": require("./assets/fonts/Inter-SemiBold.ttf"),
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) await SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
        <TenantProvider>
          <CategoryProvider>
            <MesaProvider>
              <CartProvider>
                <RootNavigation />
                <Toast config={toastConfig} />
              </CartProvider>
            </MesaProvider>
          </CategoryProvider>
        </TenantProvider>
    </View>
  );
}