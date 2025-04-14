
import React, { useEffect } from 'react';
import { View, StyleSheet, Text, Button } from 'react-native';

export default function QRCodeScreen({ navigation, route }) {
  const { onScan } = route.params;

  useEffect(() => {
    // Simula leitura de QR code
    setTimeout(() => {
      onScan('COMANDA1234');
      navigation.goBack();
    }, 2000);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Lendo QR Code...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 18,
    fontFamily: 'Inter',
  },
});
