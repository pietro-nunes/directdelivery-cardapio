import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useMesa } from "../context/MesaContext";
import { useCart } from "../context/CartContext";
import { useTenant } from "../context/TenantContext";
import config from "../services/config";


export default function Header({ showSearch, toggleSearch }) {
  const navigation = useNavigation();
  const route = useRoute();
  const { mesa, setMesa } = useMesa();
  const { tenantData } = useTenant();
  const { items } = useCart();
  const cartCount = items.reduce((total, item) => total + item.qty, 0);

  const handleMesaPress = () => {
    Alert.alert("Alterar Mesa", "Deseja alterar o número da mesa?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sim",
        onPress: () => {
          setMesa(null);
          navigation.replace("Welcome");
        },
      },
    ]);
  };

  return (
    <View style={styles.header}>
        <View style={styles.tenantInfo}>
          {tenantData?.logo && (
            <Image source={{ uri: config.baseURL + tenantData.logo }} style={styles.logoImg} />
          )}
          <Text style={styles.tenantName}>{tenantData?.legalName
            || "DirectDelivery"}</Text>
        </View>

      <TouchableOpacity onPress={handleMesaPress}>
        <Text style={styles.mesa}>MESA {mesa || "-"}</Text>
      </TouchableOpacity>

      <View style={styles.actions}>
        {route.name === "Main" && (
          <TouchableOpacity onPress={toggleSearch}>
            <Ionicons name="search" size={20} color="white" />
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.button}>
          <Text style={styles.text}>
            <FontAwesome5 name="concierge-bell" size={15} color="#fff" /> CHAMAR GARÇOM
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.text}>
            <FontAwesome5 name="clipboard-list" size={15} color="#fff" /> MEUS PEDIDOS
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.cartButton}
          onPress={() => navigation.navigate("Cart")}
        >
          <FontAwesome5 name="shopping-cart" size={18} color="#fff" />
          {cartCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#135959",
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tenantInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoImg: {
    width: 32,
    height: 32,
    borderRadius: 6,
    marginRight: 8,
  },
  tenantName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "Inter",
  },
  mesa: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "Inter",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  button: {
    backgroundColor: "#148f8f",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  text: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
    fontFamily: "Inter",
  },
  cartButton: {
    backgroundColor: "#148f8f",
    padding: 8,
    borderRadius: 20,
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#ff4d4d",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    zIndex: 1,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
    fontFamily: "Inter",
    textAlign: "center",
  },
});
