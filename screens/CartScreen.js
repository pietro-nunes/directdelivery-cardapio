import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from "react-native";
import { useCart } from "../context/CartContext";
import { useNavigation } from "@react-navigation/native";
import Layout from "../components/Layout";
import QRCodeScannerModal from "../components/QRCodeScannerModal";
import SuccessModal from "../components/SuccessModal";
import config from "../services/config";

export default function CartScreen() {
  const { items, total, removeFromCart, clearCart, addToCart } = useCart();
  const navigation = useNavigation();

  const [showScanner, setShowScanner] = useState(false);
  const [successModal, setSuccessModal] = useState(false);

  const handleBarCodeScanned = ({ data }) => {
    setShowScanner(false);
    setTimeout(() => {
      setSuccessModal(true);
      clearCart();
    }, 500);
  };

  return (
    <Layout>
      <View style={styles.container}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>← Voltar</Text>
        </TouchableOpacity>

        <Text style={styles.title}>🛒 Meu Carrinho</Text>

        {items.length === 0 ? (
          <Text style={styles.empty}>Seu carrinho está vazio.</Text>
        ) : (
          <>
            <FlatList
              data={items}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <View style={styles.item}>
                  <Image source={{ uri: config.baseURL + item.image }} style={styles.image} />
                  <View style={styles.details}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.price}>
                      R$ {Number(item.price * item.qty).toFixed(2)}{" "}
                      <Text style={styles.unit}>
                        ({item.qty}x R$ {Number(item.price).toFixed(2)})
                      </Text>
                    </Text>
                    <View style={styles.qtyControl}>
                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => removeFromCart(item.id)}
                      >
                        <Text style={styles.qtyText}>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.qtyNumber}>{item.qty}</Text>
                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => addToCart(item)}
                      >
                        <Text style={styles.qtyText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
            />

            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Total do Pedido:</Text>
              <Text style={styles.totalValue}>R$ {total.toFixed(2)}</Text>
            </View>

            <TouchableOpacity
              style={styles.btn}
              onPress={() => setShowScanner(true)}
            >
              <Text style={styles.btnText}>Enviar Pedido</Text>
            </TouchableOpacity>
          </>
        )}

        <QRCodeScannerModal
          visible={showScanner}
          onCancel={() => setShowScanner(false)}
          onScanned={handleBarCodeScanned}
        />

        <SuccessModal
          visible={successModal}
          onClose={() => {
            setSuccessModal(false);
            navigation.navigate("Main");
          }}
        />
      </View>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#135959",
    fontFamily: "Inter",
  },
  backButton: {
    marginBottom: 12,
  },
  backText: {
    color: "#148f8f",
    fontFamily: "Inter",
    fontSize: 14,
    fontWeight: "bold",
  },
  empty: {
    fontSize: 16,
    color: "#777",
    fontFamily: "Inter",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    backgroundColor: "#f4f4f4",
    borderRadius: 10,
    padding: 10,
  },
  image: {
    width: 70,
    height: 70,
    borderRadius: 10,
    marginRight: 10,
  },
  details: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "Inter",
    marginBottom: 4,
  },
  price: {
    fontSize: 14,
    color: "#148f8f",
    fontFamily: "Inter",
  },
  unit: {
    fontSize: 12,
    color: "#555",
  },
  qtyControl: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  qtyBtn: {
    backgroundColor: "#148f8f",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  qtyText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "Inter",
  },
  qtyNumber: {
    marginHorizontal: 12,
    fontSize: 16,
    fontFamily: "Inter",
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
    marginBottom: 12,
    paddingVertical: 12,
    borderTopColor: "#ccc",
    borderTopWidth: 1,
  },
  totalLabel: {
    fontSize: 18,
    fontFamily: "Inter",
    fontWeight: "bold",
    color: "#333",
  },
  totalValue: {
    fontSize: 18,
    fontFamily: "Inter",
    fontWeight: "bold",
    color: "#148f8f",
  },
  btn: {
    backgroundColor: "#148f8f",
    padding: 14,
    borderRadius: 8,
  },
  btnText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
    fontFamily: "Inter",
    fontSize: 15,
  },
});
