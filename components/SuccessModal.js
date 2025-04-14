import React from "react";
import { View, Text, StyleSheet, Modal, TouchableOpacity } from "react-native";
import { Platform } from "react-native";

let Lottie;

if (Platform.OS === "web") {
  Lottie = require("@lottiefiles/react-lottie-player").Player;
} else {
  Lottie = require("lottie-react-native").default;
}

export default function SuccessModal({ visible, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.box}>
          {Platform.OS === "web" ? (
            <Lottie
              autoplay
              loop={true}
              src="/assets/animations/completed.json"
              style={{ width: 150, height: 150 }}
            />
          ) : (
            <Lottie
              source={require("../assets/animations/completed.json")}
              autoPlay
              loop={true}
              style={{ width: 150, height: 150 }}
            />
          )}

          <Text style={styles.text}>Pedido enviado com sucesso!</Text>

          <TouchableOpacity style={styles.btn} onPress={onClose}>
            <Text style={styles.btnText}>Voltar ao Cardápio</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "#00000088",
    justifyContent: "center",
    alignItems: "center",
  },
  box: {
    backgroundColor: "#fff",
    padding: 30,
    borderRadius: 16,
    alignItems: "center",
    width: "80%",
  },
  lottie: {
    width: 150,
    height: 150,
  },
  text: {
    fontSize: 18,
    fontFamily: "Inter",
    fontWeight: "bold",
    color: "#148f8f",
    textAlign: "center",
    marginTop: 10,
  },
  btn: {
    backgroundColor: "#148f8f",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  btnText: {
    color: "#fff",
    fontFamily: "Inter",
    fontWeight: "bold",
    fontSize: 14,
  },
});
