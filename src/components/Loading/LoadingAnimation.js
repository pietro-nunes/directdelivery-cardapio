import React from "react";
import { useLoading } from "../../contexts/LoadingContext";
import Lottie from "lottie-react";
import loadingAnimation from "../../lottie/loading.json"; // Substitua pelo seu arquivo Lottie

const LoadingAnimation = () => {
  const { isLoading } = useLoading();

  if (!isLoading) return null;

  return (
    <div style={styles.overlay}>
      <Lottie animationData={loadingAnimation} loop={true} style={styles.lottie} />
    </div>
  );
};

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.5)", // Fundo branco translúcido com blur
    backdropFilter: "blur(5px)",
    WebkitBackdropFilter: "blur(5px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  lottie: {
    width: 300,
    height: 300,
  },
};

export default LoadingAnimation;
