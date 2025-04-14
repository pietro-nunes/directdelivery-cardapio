import React from "react";
import { View, StyleSheet } from "react-native";
import Header from "./Header";

export default function Layout({
  children,
  showSearch = false,
  searchValue = "",
  setSearchValue = () => {},
}) {
  const toggleSearch = () => {
    if (searchValue.length > 0) {
      setSearchValue(""); // limpa a busca
    } else {
      setSearchValue(" "); // força ativação do input na tela
    }
  };

  return (
    <View style={styles.container}>
      <Header
        showSearch={showSearch}
        toggleSearch={() => {
          toggleSearch();
          onSearchIconPress?.();
        }}
      />
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  body: {
    flex: 1,
  },
});
