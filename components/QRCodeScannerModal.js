import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Camera } from "expo-camera";

export default function QRCodeScannerModal({ visible, onCancel, onScanned }) {
  const [permission, requestPermission] = Camera.useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const cameraRef = useRef(null);

  useEffect(() => {
    if (visible) {
      setScanned(false);

      // Simula leitura em 3 segundos
      const timer = setTimeout(() => {
        if (!scanned) {
          setScanned(true);
          onScanned({ type: "simulado", data: "comanda123" });
        }
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!permission) return null;

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Text>Permissão para câmera negada.</Text>
        <TouchableOpacity onPress={requestPermission}>
          <Text style={{ color: "#148f8f", marginTop: 10 }}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Lógica real comentada
  // const handleBarCodeScanned = ({ type, data }) => {
  //   if (!scanned && type === "org.iso.QRCode") {
  //     setScanned(true);
  //     onScanned({ type, data });
  //   }
  // };

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        <Text style={styles.title}>📲 Leitura de Comanda</Text>
        <Text style={styles.info}>
          Aponte a câmera frontal para o QR Code da comanda individual.
        </Text>

        <View style={styles.cameraWrapper}>
          <Camera
            ref={cameraRef}
            type="front"
            style={StyleSheet.absoluteFillObject}
            // onBarCodeScanned={handleBarCodeScanned}
            barCodeScannerSettings={{
              barCodeTypes: ["qr"],
            }}
          />
          {!permission.granted && <ActivityIndicator />}
        </View>

        <TouchableOpacity style={styles.btn} onPress={onCancel}>
          <Text style={styles.btnText}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    fontFamily: "Inter",
    marginBottom: 10,
    color: "#135959",
  },
  info: {
    fontSize: 14,
    fontFamily: "Inter",
    color: "#444",
    textAlign: "center",
    marginBottom: 20,
  },
  cameraWrapper: {
    width: "100%",
    height: 300,
    overflow: "hidden",
    borderRadius: 16,
    backgroundColor: "#000",
  },
  btn: {
    marginTop: 20,
    backgroundColor: "#148f8f",
    padding: 12,
    borderRadius: 10,
  },
  btnText: {
    color: "#fff",
    fontFamily: "Inter",
    fontWeight: "bold",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
