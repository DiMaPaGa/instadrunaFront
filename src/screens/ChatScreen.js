import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, FlatList, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient'; 
import useChatSocket from '../hooks/useChatSocket';
import dayjs from 'dayjs';
import 'dayjs/locale/es'; 
import isToday from 'dayjs/plugin/isToday';
import isYesterday from 'dayjs/plugin/isYesterday';
import { encode as btoa, decode as atob } from 'base-64'; 


dayjs.locale('es');
dayjs.extend(isToday);
dayjs.extend(isYesterday);


// NUEVAS funciones de cifrado y descifrado (compatibles con React Native)
const encryptMessage = (text) => {
  return btoa(unescape(encodeURIComponent(text)));
};

const decryptMessage = (ciphertext) => {
  try {
    return decodeURIComponent(escape(atob(ciphertext)));
  } catch (error) {
    return ciphertext; // Si algo falla, devuelve el texto tal cual
  }
};

export default function ChatScreen({ route, navigation }) {
  // Recibimos los parámetros de la navegación
  const { givenName, userId, otherUserId, username} = route.params;

  // Llamamos al hook pasando ambos userId para gestionar la conexión de socket
  const { messages, sendMessage } = useChatSocket(userId, otherUserId, username);

  const [text, setText] = useState('');
  const flatListRef = useRef(null);

  // Función para hacer scroll cuando se reciben nuevos mensajes
  useEffect(() => {
    if (messages.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages]);

  // Formatear fecha y hora
  const formatTime = (timestamp) => {
    const date = dayjs(timestamp);
    if (date.isToday()) {
      return date.format('HH:mm'); // Solo hora si es hoy
    }
    if (date.isYesterday()) {
      return `Ayer ${date.format('HH:mm')}`;
    }
    return date.format('DD MMM, HH:mm'); // Fecha corta + hora
  };

  // Función para agrupar mensajes consecutivos del mismo usuario
  const groupMessages = (messages) => {
    const grouped = [];
    let lastUser = null;

    messages.forEach((item) => {
      if (item.user === lastUser) {
        // Añadir al último grupo
        grouped[grouped.length - 1].messages.push(item);
      } else {
        // Crear nuevo grupo
        grouped.push({ user: item.user, messages: [item] });
        lastUser = item.user;
      }
    });

    return grouped;
  };

  const groupedMessages = groupMessages(messages);

  return (
    <View style={styles.chatContainer}>

      {/* ✅ Botón para volver atrás */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Text style={styles.backButtonText}>← Volver</Text>
      </TouchableOpacity>

      {/* Título con el nombre del otro usuario */}
      <Text style={styles.header}>{`Chat con ${givenName}`}</Text>
      
      {/* Lista de mensajes agrupados */}
      <FlatList
        ref={flatListRef}
        data={groupedMessages}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item }) => {
          const isOwnMessage = item.user === username;
          return (
            <View
              style={[
                styles.messageWrapper,
                { alignSelf: isOwnMessage ? 'flex-end' : 'flex-start' },
              ]}
            >
              <Text
                style={[
                  styles.messageUser,
                  { textAlign: isOwnMessage ? 'right' : 'left' },
                ]}
              >
                {item.user}
              </Text>

              {/* ✨ Burbujas agrupadas */}
              <LinearGradient
                colors={isOwnMessage ? ['#F19100', '#F7B733'] : ['#6A1B9A', '#8E24AA']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.messageContainer}
              >
                {item.messages.map((msg, index) => (
                  <Text key={index} style={styles.messageText}>
                    {decryptMessage(msg.msg.message)}
                  </Text>
                ))}
              </LinearGradient>

              <Text style={styles.messageTime}>
                {formatTime(item.messages[item.messages.length - 1].timestamp)}
              </Text>
            </View>
          );
        }}
      />

      {/* Barra de input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={text}
          onChangeText={setText}
          placeholder="Escribe tu mensaje"
          placeholderTextColor="#868686"
        />
        <TouchableOpacity
          style={styles.sendButton}
          onPress={() => {
            if (text.trim()) {
              sendMessage(encryptMessage(text.trim())); // 🔒 Enviar mensaje cifrado
              setText('');
            }
          }}
        >
          <Text style={styles.sendButtonText}>Enviar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}


// Estilos para la pantalla
const styles = StyleSheet.create({
  chatContainer: {
    flex: 1,
    backgroundColor: '#323639',
    padding: 16,
    paddingBottom: 32, // ✅ Más espacio debajo
  },
  backButton: {
    marginBottom: 12,
  },
  backButtonText: {
    color: '#9FC63B',
    fontSize: 16,
    fontFamily: 'AsapCondensed-Regular',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#9FC63B',
    alignSelf: 'center',
  },
  messageWrapper: {
    marginBottom: 20, // ✅ Más separación
    maxWidth: '80%',
  },
  messageUser: {
    fontFamily: 'AsapCondensed-Regular',
    fontSize: 14,
    color: '#DFDFDF',
    marginBottom: 4,
  },
  messageContainer: {
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  messageText: {
    fontFamily: 'AsapCondensed-Regular',
    fontSize: 16,
    color: '#DFDFDF',
    marginBottom: 4,
  },
  messageTime: {
    fontFamily: 'AsapCondensed-Regular',
    fontSize: 12,
    color: '#868686',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#323639',
    paddingTop: 8,
    paddingBottom: 12, // ✅ Más padding abajo
    backgroundColor: '#323639',
  },
  textInput: {
    flex: 1,
    height: 44,
    borderColor: '#868686',
    borderWidth: 1,
    borderRadius: 22,
    paddingLeft: 16,
    marginRight: 8,
    fontSize: 16,
    fontFamily: 'AsapCondensed-Regular',
    color: '#DFDFDF',
    backgroundColor: '#323639',
  },
  sendButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#9FC63B',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    fontFamily: 'AsapCondensed-Regular',
    color: '#23272A',
    fontSize: 16,
  },
});
