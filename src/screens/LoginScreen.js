import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

// Esta es la pantalla de login
const LoginScreen = ({ promptAsync, request }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bienvenido a la aplicación</Text>
      <Text style={styles.subtitle}>Inicia sesión con tu cuenta de Google</Text>

      {/* Botón para iniciar sesión con Google */}
      <TouchableOpacity
        style={styles.loginButton}
        onPress={() => promptAsync()} // Activar el flujo de Google
        disabled={!request}
      >
        <Text style={styles.loginText}>Iniciar sesión con Google</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f0f0f0",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 40,
    color: "#666",
  },
  loginButton: {
    backgroundColor: "#4285F4", // Color de Google
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 5,
  },
  loginText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default LoginScreen;
