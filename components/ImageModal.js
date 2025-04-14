import React from "react";
import {
    Modal,
    View,
    StyleSheet,
    Image,
    TouchableOpacity,
    Text,
    TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function ImageModal({ visible, imageUrl, onClose }) {
    return (
        <Modal visible={visible} transparent animationType="fade">
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                        <Ionicons name="close" size={28} color="#fff" />
                    </TouchableOpacity>

                    <TouchableWithoutFeedback>
                        <Image
                            source={{ uri: imageUrl }}
                            style={styles.image}
                            resizeMode="contain"
                        />
                    </TouchableWithoutFeedback>

                    <Text style={styles.tip}>Toque fora da imagem para fechar</Text>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.9)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    closeBtn: {
        position: "absolute",
        top: 40,
        right: 20,
        zIndex: 2,
    },
    image: {
        width: "100%",
        height: "70%",
        borderRadius: 12,
    },
    tip: {
        marginTop: 16,
        color: "#fff",
        fontFamily: "Inter",
        fontSize: 12,
        opacity: 0.6,
    },
});
