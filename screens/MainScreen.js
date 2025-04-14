import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  Modal,
  Pressable,
} from "react-native";
import {
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useCart } from "../context/CartContext";
import Layout from "../components/Layout";
import Toast from "react-native-toast-message";
import * as Animatable from "react-native-animatable";
import HighlightCarousel from "../components/HighlightCarousel";
import { fetchTenantBySlug } from "../services/tenantServices";
import { fetchCategoriesByTenant } from "../services/categoriesServices";
import { useTenant } from "../context/TenantContext";
import { useCategory } from "../context/CategoryContext";
import config from "../services/config";


const getIconNameForCategory = (name) => {
  const normalized = name.toLowerCase();

  if (normalized.includes("doce") || normalized.includes("doces"))
    return "candy";
  if (normalized.includes("sobremesa") || normalized.includes("sorvete") || normalized.includes("açaí"))
    return "ice-cream";
  if (normalized.includes("bebida") || normalized.includes("drink"))
    return "cup";
  if (normalized.includes("pizza"))
    return "pizza";
  if (normalized.includes("paste"))
    return "food-croissant";
  if (normalized.includes("salgado"))
    return "food-croissant";
  if (normalized.includes("lanche") || normalized.includes("hamburguer"))
    return "hamburger";
  if (normalized.includes("prato") || normalized.includes("refeição"))
    return "silverware-fork-knife";
  if (normalized.includes("panini"))
    return "bread-slice";
  if (normalized.includes("sopa") || normalized.includes("caldo"))
    return "pot-steam";
  if (normalized.includes("carne") || normalized.includes("churrasco") || normalized.includes("grelhado"))
    return "food-steak";

  return "food"; // fallback
};



export default function MainScreen() {
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [search, setSearch] = useState("");
  const { addToCart } = useCart();
  const inputRef = useRef(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalImage, setModalImage] = useState(null);
  const { tenant, tenantId, setTenantData } = useTenant();
  const { categoryDataWithProducts, setCategoryDataWithProducts } = useCategory();

  const openImageModal = (img) => {
    setModalImage(img);
    setModalVisible(true);
  };

  useEffect(() => {
    const loadTenant = async () => {
      const slug = tenant
      const data = await fetchTenantBySlug(slug);
      setTenantData(data);
    };

    const loadCategoriesWithProducts = async () => {
      const id = tenantId
      const data = await fetchCategoriesByTenant(id);
      setCategoryDataWithProducts(data);
    };

    loadTenant();
    loadCategoriesWithProducts();

  }, []);

  const allProducts = (categoryDataWithProducts || []).flatMap((cat) => cat.products);

  const filtered = allProducts.filter((p) => {
    const name = p.name.toLowerCase();
    const query = search.toLowerCase().trim();
    return search ? name.startsWith(query) : p.categoryId === selectedCategory;
  });

  return (
    <Layout
      showSearch={true}
      searchValue={search}
      setSearchValue={setSearch}
      onSearchIconPress={() => inputRef.current?.focus()}
    >
      <View style={styles.content}>
        <View style={styles.sidebar}>
          <ScrollView>
            <TouchableOpacity
              style={[styles.categoryItem, selectedCategory === 0 && styles.categoryActive]}
              onPress={() => setSelectedCategory(0)}
            >
              <View style={styles.iconWrapper}>
                <MaterialCommunityIcons name="star" size={20} color={selectedCategory === 0 ? "#fff" : "#148f8f"} />
              </View>
              <Text style={[styles.categoryText, selectedCategory === 0 && styles.categoryTextActive]}>DESTAQUES</Text>
            </TouchableOpacity>

            {categoryDataWithProducts.map((cat, i) => (
              <TouchableOpacity
                key={cat.id || i}
                style={[styles.categoryItem, selectedCategory === cat.id && styles.categoryActive]}
                onPress={() => {
                  setSearch("");
                  setSelectedCategory(cat.id);
                }}
              >
                <View style={styles.iconWrapper}>
                  <MaterialCommunityIcons
                    name={getIconNameForCategory(cat.name)}
                    size={20}
                    color={selectedCategory === cat.id ? "#fff" : "#148f8f"}
                  />
                </View>
                <Text style={[styles.categoryText, selectedCategory === cat.id && styles.categoryTextActive]}>
                  {cat.name.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {selectedCategory === 0 ? (
          <View style={{ flex: 1 }}>
            <HighlightCarousel produtos={allProducts.slice(0, 5)} />
          </View>
        ) : (
          <View style={styles.products}>
            {search.length > 0 ? (
              <View style={styles.searchWrapper}>
                <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
                <TextInput
                  ref={inputRef}
                  placeholder="Buscar no cardápio..."
                  placeholderTextColor="#aaa"
                  value={search}
                  onChangeText={setSearch}
                  style={styles.searchInput}
                />
              </View>
            ) : (
              <Text style={styles.sectionTitle}>
                {
                  categoryDataWithProducts.find((cat) => cat.id === selectedCategory)?.name?.toUpperCase() || ""
                }
              </Text>
            )}

            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <Animatable.View animation="fadeInUp" duration={600} delay={item.id * 100} style={styles.card}>
                  <TouchableOpacity onPress={() => openImageModal(item.image)}>
                    <Image
                      source={
                        item.image
                          ? { uri: config.baseURL + item.image }
                          : require("../assets/images/pizza_placeholder.png") // caminho relativo à pasta onde está este arquivo
                      }
                      style={styles.cardImg}
                    />

                  </TouchableOpacity>
                  <View style={styles.cardBody}>
                    <Text style={styles.cardCategory}>{item.category?.name}</Text>
                    <Text style={styles.cardTitle}>{item.name}</Text>
                    <Text style={styles.cardDesc}>{item.description}</Text>
                    <Text style={styles.cardPrice}>R$ {Number(item.price).toFixed(2)}</Text>
                    <TouchableOpacity
                      style={styles.btnAdd}
                      onPress={() => {
                        addToCart(item);
                        Toast.show({
                          type: "success",
                          text1: `${item.name} adicionado ao carrinho`,
                          visibilityTime: 1500,
                          position: "top",
                          text1Style: { fontFamily: "Inter" },
                        });
                      }}
                    >
                      <Text style={styles.btnAddText}>ADICIONAR AO CARRINHO</Text>
                    </TouchableOpacity>
                  </View>
                </Animatable.View>
              )}
            />
          </View>
        )}
      </View>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <Pressable style={styles.backdrop} onPress={() => setModalVisible(false)} />
          <Image source={
            modalImage
              ? { uri: config.baseURL + modalImage }
              : require("../assets/images/pizza_placeholder.png") // caminho relativo à pasta onde está este arquivo
          } style={styles.modalImage} resizeMode="contain" />
        </View>
      </Modal>
    </Layout>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#ffffff",
  },
  sidebar: {
    width: 200,
    backgroundColor: "#f5f5f5",
    paddingTop: 20,
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomColor: "#eee",
    borderBottomWidth: 1,
  },
  categoryActive: {
    backgroundColor: "#148f8f",
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
  },
  iconWrapper: {
    marginRight: 8,
  },
  categoryText: {
    fontSize: 13,
    fontFamily: "Inter",
    color: "#333",
  },
  categoryTextActive: {
    color: "#fff",
    fontWeight: "bold",
  },
  products: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    color: "#135959",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    fontFamily: "Inter",
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Inter",
    fontSize: 15,
    color: "#333",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    marginBottom: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: "row",
  },
  cardImg: {
    width: 140,
    height: 140,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  cardBody: {
    flex: 1,
    padding: 12,
    justifyContent: "center",
  },
  cardCategory: {
    fontSize: 12,
    color: "#888",
    fontFamily: "Inter",
    marginBottom: 2,
  },
  cardTitle: {
    color: "#222",
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "Inter",
    marginBottom: 4,
  },
  cardDesc: {
    color: "#555",
    fontSize: 13,
    fontFamily: "Inter",
    marginBottom: 8,
  },
  cardPrice: {
    color: "#148f8f",
    fontSize: 14,
    fontWeight: "bold",
    fontFamily: "Inter",
    marginBottom: 10,
  },
  btnAdd: {
    backgroundColor: "#d32f2f",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  btnAddText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
    fontFamily: "Inter",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalImage: {
    width: "90%",
    height: "70%",
    borderRadius: 12,
  },
});
