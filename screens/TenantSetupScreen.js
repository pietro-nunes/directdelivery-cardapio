import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useTenant } from "../context/TenantContext";
import { useNavigation } from "@react-navigation/native";

export default function TenantSetupScreen() {
  const [email, setEmail] = useState("");
  const [apiKey, setApiKey] = useState("");
  const { saveTenant, saveTenantId } = useTenant();
  const navigation = useNavigation();

  const handleSubmit = async () => {
    try {
      const response = await fetch("https://direct-delivery-api-d59eac383c33.herokuapp.com/tenants/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, apiKey }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erro na autenticação");
      }

      await saveTenant(data.tenant.slug);
      await saveTenantId(data.tenant.id);
      navigation.navigate("Welcome");
    } catch (err) {
      Alert.alert("Erro", err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Configurar Restaurante</Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />
      <TextInput
        placeholder="API Key"
        value={apiKey}
        onChangeText={setApiKey}
        style={styles.input}
      />

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>SALVAR</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 20, marginBottom: 20, fontWeight: "bold", textAlign: "center", color: "#148f8f" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    fontSize: 15,
    fontFamily: "Inter",
  },
  button: {
    backgroundColor: "#148f8f",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontFamily: "Inter" },
});
