import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, Image, StyleSheet, Alert, ScrollView, View } from 'react-native';
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';

const CLOUDINARY_UPLOAD_PRESET = 'ml_default';
const CLOUDINARY_CLOUD_NAME = 'dpqj4thfg';


const TicketFormScreen = ({ route }) => {
  const { userId, givenName, email, picture } = route.params || {};

  const navigation = useNavigation();

  const [equipoClase, setEquipoClase] = useState('');
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [imageUri, setImageUri] = useState(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setImageUri(uri);
    }
  };

  // Subir imagen a Cloudinary
const uploadImageToCloudinary = async (uri) => {
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
    const data = {
      file: `data:image/jpeg;base64,${base64}`,
      upload_preset: CLOUDINARY_UPLOAD_PRESET, // Reemplaza con el tuyo
    };
  
    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  
    const result = await response.json();
    return result.secure_url;
  };
  
  // Seleccionar imagen desde cámara
  const handlePickImageFromCamera = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permiso denegado", "Se necesita permiso para acceder a la cámara.");
      return;
    }
  
    const result = await ImagePicker.launchCameraAsync({ quality: 0.5, base64: false });
    if (!result.cancelled) {
      setImageUri(result.assets[0].uri);
    }
  };
  
  // Seleccionar imagen desde galería
  const handlePickImageFromLibrary = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permiso denegado", "Se necesita permiso para acceder a la galería.");
      return;
    }
  
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.5, base64: false });
    if (!result.cancelled) {
      setImageUri(result.assets[0].uri);
    }
  };
  
  // Eliminar imagen seleccionada
  const handleRemoveImage = () => {
    setImageUri(null);
  };
  

  const handleCreateTicket = async () => {
    if (!equipoClase || !titulo || !descripcion) {
      Alert.alert('Error', 'Por favor, completa todos los campos.');
      return;
    }

    setIsLoading(true);

    let imageUrl = null;
    if (imageUri) {
      imageUrl = await uploadImageToCloudinary(imageUri);
    }

    const ticketData = {
        autor: {
            userId,       
            email,        
            givenName,    
            profileImageUrl: picture  
          },
      equipoClase,
      titulo,
      descripcion,
      imagen: imageUrl || null,
      estado: 'EN_TRAMITE', 
    };

    console.log('Enviando ticket:', ticketData);

    try {
      const response = await fetch(`http://51.120.11.157:8080/api/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticketData),
      });

    const resText = await response.text();        
    console.log('Respuesta del servidor:', resText);

      if (response.ok) {
        Alert.alert('Éxito', 'Incidencia creada con éxito.');
        setEquipoClase('');
        setTitulo('');
        setDescripcion('');
        setImageUri(null);
        navigation.goBack();
      } else {
        Alert.alert('Error', 'No se pudo crear la incidencia.');
      }
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error al crear la incidencia.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>INCIDENCIA</Text>
       {/* Imagen interactiva */}
       <TouchableOpacity onPress={handlePickImageFromCamera}>
            {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.imageIcon} />
            ) : (
            <Image source={require('../../assets/images/addpub.png')} style={styles.imageIcon} />
            )}
        </TouchableOpacity>

        {/* Botones secundarios */}
        <View style={{ flexDirection: 'row', marginTop: 10 }}>
            <TouchableOpacity onPress={handlePickImageFromLibrary} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Galería</Text>
            </TouchableOpacity>
            {imageUri && (
            <TouchableOpacity onPress={handleRemoveImage} style={styles.secondaryButton}>
                <Ionicons name="trash-outline" size={20} color="#fff" />
                <Text style={[styles.secondaryButtonText, { marginLeft: 5 }]}>Eliminar</Text>
            </TouchableOpacity>
            )}
        </View>


      <Text style={styles.label}> Nº del Equipo / Clase:</Text>
      <TextInput
        style={styles.input}
        value={equipoClase}
        onChangeText={setEquipoClase}
      />

      <Text style={styles.label}>Título:</Text>
      <TextInput
        style={styles.input}
        placeholder="Máx. 40 Caracteres"
        placeholderTextColor="#DFDFDF"
        value={titulo}
        onChangeText={(text) => text.length <= 40 && setTitulo(text)}
      />

      <Text style={styles.label}>Descripción del problema:</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Máx. 250 Caracteres"
        placeholderTextColor="#DFDFDF"
        value={descripcion}
        onChangeText={(text) => text.length <= 250 && setDescripcion(text)}
        multiline
      />

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleCreateTicket}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>{isLoading ? 'Enviando...' : 'ENVIAR'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#23272A',
    padding: 25,
    paddingTop: 50,
    alignItems: 'center',
  },
  header: {
    fontFamily: 'Rajdhani_600SemiBold',
    color: '#9FC63B',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  imageIcon: {
    width: 120,
    height: 120,
    marginBottom: "10%",
    marginTop: "8%",
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#9FC63B',
  },
  label: {
    fontFamily: 'Rajdhani_400Regular',
    color: '#9FC63B',
    fontSize: 16,
    marginBottom: "3%",
    alignSelf: 'flex-start',
  },
  input: {
    backgroundColor: '#323639',
    color: '#FFFFFF',
    borderRadius: 5,
    padding: 10,
    marginBottom: "8%",
    width: '100%',
  },
  textArea: {
    height: 180,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#23272A',
    borderColor: '#9FC63B',
    borderWidth: 2,
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginVertical: "5%",
    width: '50%',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    backgroundColor: '#323639',
  },
  secondaryButton: {
    backgroundColor: '#323639',
    padding: 8,
    borderRadius: 5,
    marginHorizontal: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 14,
  },
});

export default TicketFormScreen;
