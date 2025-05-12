import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, Alert, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';


const AddPublicationScreen = ({ route }) => {
  const { userId, givenName, profileImageUrl, email } = route.params || {};
  const navigation = useNavigation();
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [privacy, setPrivacy] = useState('PUBLICA'); // Estado para la privacidad



  // Solicitar permisos para acceder a la cámara y galería
  useEffect(() => {
    const getPermissions = async () => {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: mediaLibraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (cameraStatus !== 'granted' || mediaLibraryStatus !== 'granted') {
        Alert.alert('Permiso denegado', 'Se necesitan permisos para acceder a la cámara y la galería.');
      }
    };
  
    getPermissions();
  }, []);

  // Seleccionar imagen desde la galería o cámara
  const handleImagePick = async () => {
    Alert.alert(
      'Selecciona una opción',
      '¿Deseas elegir una imagen de la galería o tomar una nueva foto?',
      [
        {
          text: 'Galería',
          onPress: async () => {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              quality: 1,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
              setSelectedImage(result.assets[0].uri);
            }
          },
        },
        {
          text: 'Cámara',
          onPress: async () => {
            const result = await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              quality: 1,
            });

            if (!result.canceled) {
              setSelectedImage(result.assets[0].uri);
            }
          },
        },
        {
          text: 'Cancelar',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const uploadImageToCloudinary = async (imageUri) => {
    const formData = new FormData();
    formData.append('file', { uri: imageUri, name: 'image.jpg', type: 'image/jpeg' });
    formData.append('upload_preset', 'ml_default');
    formData.append('cloud_name', 'dpqj4thfg');

    try {
      const response = await fetch('https://api.cloudinary.com/v1_1/dpqj4thfg/image/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      throw new Error('Error al subir la imagen');
    }
  };

  const handleCreatePublication = async () => {
    if (!title.trim() || !comment.trim()) {
      Alert.alert('Error', 'Por favor, completa todos los campos.');
      return;
    }
  
    setIsLoading(true);
  
    try {
      let imageUrl = null;
  
      // Si hay imagen seleccionada, la subimos
      if (selectedImage) {
        console.log('Subiendo imagen...');
        imageUrl = await uploadImageToCloudinary(selectedImage);
      } else {
        // Si no hay imagen, usamos la imagen predeterminada
        console.log('Usando imagen predeterminada...');
        const defaultImageUrl = 'https://res.cloudinary.com/dpqj4thfg/image/upload/v1744957782/addpub_use0xr.png';
        imageUrl = defaultImageUrl;
      }
  
      const usuarioData = {
        userId: userId,
        email: email,
        givenName: givenName,
        profileImageUrl: profileImageUrl,
      };
  
      const publicationData = {
        autor: usuarioData,
        titulo: title,
        comentario: comment,
        imageUrl: imageUrl,
        privacidad: privacy,
      };
  
      console.log('Datos de la publicación:', publicationData);
  
      const response = await fetch('http://51.120.11.157:8080/api/publicaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(publicationData),
      });
  
  
      if (response.ok) {
        const responseData = await response.json();
        console.log("Datos de la respuesta:", responseData);
  
        // Lógica después de recibir la respuesta correctamente
        Alert.alert('Éxito', 'Publicación creada con éxito.', [
          {
            text: 'OK',
            onPress: () => {
              setTitle('');
              setComment('');
              setSelectedImage(null);
              navigation.navigate('Home', {
                userId: userId,
                givenName: givenName,
                profileImageUrl: profileImageUrl,
              });
            },
          },
        ]);
      } else {
        const responseText = await response.text();
        console.error('Error en el servidor:', responseText);
        Alert.alert('Error', 'No se pudo procesar la solicitud correctamente.');
      }
    } catch (error) {
      console.error('Ocurrió un error al crear la publicación:', error);
      Alert.alert('Error', 'Ocurrió un error al crear la publicación.');
    } finally {
      setIsLoading(false);
    }
  };
  

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>PUBLICACIÓN</Text>

      {/* Imagen seleccionada (clickeable) */}
      <TouchableOpacity onPress={handleImagePick}>
        <Image 
          source={selectedImage ? { uri: selectedImage } : require('../../assets/images/addpub.png')} 
          style={styles.imageIcon} 
        />
      </TouchableOpacity>

      <Text style={styles.label}>Título</Text>
      <TextInput
        style={styles.input}
        placeholder="Máx. 40 Caracteres"
        placeholderTextColor="#DFDFDF"
        value={title}
        onChangeText={(text) => text.length <= 40 && setTitle(text)}
      />

      <Text style={styles.label}>Descripción</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Máx. 250 Caracteres"
        placeholderTextColor="#DFDFDF"
        value={comment}
        onChangeText={(text) => text.length <= 250 && setComment(text)}
        multiline
      />

       {/* Selector de privacidad */}
       <Text style={styles.label}>Privacidad</Text>
        <View style={styles.privacyOptions}>
          <TouchableOpacity
            style={[styles.privacyButton, privacy === 'PUBLICA' && styles.selectedButton]}
            onPress={() => setPrivacy('PUBLICA')}
          >
            <Text style={styles.privacyText}>Pública</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.privacyButton, privacy === 'PRIVADA' && styles.selectedButton]}
            onPress={() => setPrivacy('PRIVADA')}
          >
            <Text style={styles.privacyText}>Privada</Text>
          </TouchableOpacity>
        </View>

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleCreatePublication}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>{isLoading ? 'Creando...' : 'PUBLICAR'}</Text>
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
    marginBottom: 20,
  },
  label: {
    fontFamily: 'Rajdhani_400Regular',
    color: '#9FC63B',
    fontSize: 16,
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#323639',
    color: '#DFDFDF',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    width: '100%',
  },
  textArea: {
    height: 80,
  },
  button: {
    backgroundColor: '#23272A',
    borderColor: '#9FC63B',
    borderWidth: 2,
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginVertical: 10,
    width: '50%',
  },
  buttonText: {
    color: '#DFDFDF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    backgroundColor: '#555',
  },
  imagePreview: {
    width: '100%',
    height: 150,
    marginVertical: 10,
    borderRadius: 5,
  },
  privacyOptions: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  privacyButton: {
    backgroundColor: '#323639',
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 10,
  },
  selectedButton: {
    backgroundColor: '#9FC63B',
  },
  privacyText: {
    color: '#DFDFDF',
    fontSize: 16,
  },
});

export default AddPublicationScreen;
