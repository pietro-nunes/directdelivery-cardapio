import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useMesa } from "../context/MesaContext";

const WelcomeScreen = () => {
  const [mesaInput, setMesaInput] = useState("");
  const navigation = useNavigation();
  const { setMesa } = useMesa();

  const handleConfirm = () => {
    if (!mesaInput.trim()) return alert("Informe o número da mesa!");
    setMesa(mesaInput.trim());
    navigation.navigate("Main");
  };

  return (
    <View style={styles.container}>
      {/* IMAGEM */}
      <Image
        source={{
          uri: "https://images.unsplash.com/photo-1600891964599-f61ba0e24092",
        }}
        style={styles.image}
        resizeMode="cover"
      />

      {/* CONTEÚDO */}
      <View style={styles.content}>
        <Text style={styles.title}>🍽️ Bem-vindo ao DirectDelivery</Text>
        <Text style={styles.subtitle}>Informe o número da sua mesa:</Text>

        <TextInput
          placeholder="Número da mesa"
          style={styles.input}
          keyboardType="numeric"
          value={mesaInput}
          onChangeText={setMesaInput}
        />

        <TouchableOpacity style={styles.button} onPress={handleConfirm}>
          <Text style={styles.buttonText}>Confirmar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default WelcomeScreen;

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#148f8f",
  },
  image: {
    width: width * 0.5,
    height: "100%",
  },
  content: {
    width: width * 0.5,
    padding: 40,
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#135959",
    fontFamily: "Inter",
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    color: "#333",
    fontFamily: "Inter",
    marginBottom: 20,
  },
  input: {
    backgroundColor: "#f2f2f2",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: "Inter",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#148f8f",
    paddingVertical: 12,
    borderRadius: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "Inter",
    textAlign: "center",
  },
});
