import React from "react";
import {
  View,
  Text,
  ImageBackground,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import Carousel from "react-native-reanimated-carousel";
import Toast from "react-native-toast-message";
import { useCart } from "../context/CartContext";
import config from "../services/config";

export default function HighlightCarousel({ produtos }) {
  const { width, height } = useWindowDimensions();
  const productsAreaWidth = width - 200; // remover largura da sidebar

  const { addToCart } = useCart();

  return (
    <View style={{ flex: 1 }}>
      <Carousel
        loop
        autoPlay
        width={productsAreaWidth}
        height={height - 50} // praticamente tela cheia
        scrollAnimationDuration={1200}
        data={produtos}
        renderItem={({ item }) => (
          <ImageBackground
            source={{ uri: config.baseURL + item.image }}
            style={styles.imageBackground}
            resizeMode="cover"
          >
            <View style={styles.overlay}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.description}>{item.description}</Text>
              <Text style={styles.price}>R$ {item.price}</Text>
              <TouchableOpacity
                style={styles.button}
                onPress={() => {
                  addToCart(item);
                  Toast.show({
                    type: "success",
                    text1: `${item.name} adicionado ao carrinho`,
                    visibilityTime: 1500,
                    position: "top",
                  });
                }}
              >
                <Text style={styles.buttonText}>ADICIONAR AO CARRINHO</Text>
              </TouchableOpacity>
            </View>
          </ImageBackground>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  imageBackground: {
    flex: 1,
    justifyContent: "flex-end",
    borderRadius: 0,
    overflow: "hidden",
  },
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    padding: 32,
  },
  name: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#fff",
    fontFamily: "Inter",
    marginBottom: 8,
  },
  description: {
    fontSize: 18,
    color: "#ddd",
    fontFamily: "Inter",
    marginBottom: 12,
  },
  price: {
    fontSize: 22,
    color: "#fff",
    fontWeight: "bold",
    fontFamily: "Inter",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#d32f2f",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  buttonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "bold",
    fontFamily: "Inter",
  },
});
