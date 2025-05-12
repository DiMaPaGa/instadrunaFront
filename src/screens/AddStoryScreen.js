import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';

const AddStoryScreen = ({ route }) => {
  const { userId } = route.params || {}; // ID numérico del usuario
  const navigation = useNavigation();
  const [images, setImages] = useState([]);
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!userId) {
      Alert.alert("Error", "No se pudo obtener la información del usuario.");
      navigation.goBack();
    }
  }, [userId]);

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log("Permisos de galería:", status);
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se necesita acceso a la galería.');
      }
    })();
  }, []);

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 5,
      quality: 1
    });

    if (!result.canceled) {
      const selected = result.assets.map(asset => asset.uri);
      setImages(prev => [...prev, ...selected]);
    }
  };

  const uploadToCloudinary = async (uri) => {
    const formData = new FormData();
    formData.append('file', { uri, name: 'image.jpg', type: 'image/jpeg' });
    formData.append('upload_preset', 'ml_default');
    formData.append('cloud_name', 'dpqj4thfg');

    const res = await fetch('https://api.cloudinary.com/v1_1/dpqj4thfg/image/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    return data.secure_url;
  };

  const handleSubmit = async () => {
    if (images.length === 0) {
      Alert.alert('Error', 'Selecciona al menos una imagen');
      return;
    }

    setIsLoading(true);
    try {
      const uploadedUrls = await Promise.all(images.map(uploadToCloudinary));

      const payload = {
        usuarioId: String(userId),
        imagenes: uploadedUrls.map((url, index) => ({
          imagenUrl: url,
          texto: text || '',
          orden: index
        }))
      };

      console.log('URLs de imágenes:', uploadedUrls);
      console.log('Payload final:', JSON.stringify(payload, null, 2));

      const res = await fetch('http://51.120.11.157:8080/api/historias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      const contentType = res.headers.get('content-type');
      
      if (res.ok) {
        let responseData = {};
        if (contentType && contentType.includes('application/json')) {
          responseData = await res.json();
          console.log('Respuesta JSON:', responseData);
        } else {
          const text = await res.text();
          console.log('Respuesta no JSON:', text);
        }
      
        Alert.alert('Éxito', 'Historia publicada');
        setImages([]);
        setText('');
        navigation.navigate('Main', { userId });
      } else {
        const errorText = await res.text();
        console.error('Error en respuesta:', errorText);
        Alert.alert('Error', errorText || 'No se pudo subir la historia');
      }
        } catch (err) {
        console.error(err);
        Alert.alert('Error', 'No se pudo subir la historia');
        } finally {
        setIsLoading(false);
        }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Nueva Historia</Text>

      <TouchableOpacity onPress={pickImages} style={styles.uploadBtn}>
        <Text style={styles.uploadBtnText}>Seleccionar Imágenes</Text>
      </TouchableOpacity>

      <ScrollView horizontal style={styles.previewContainer}>
        {images.map((uri, idx) => (
          <Image key={idx} source={{ uri }} style={styles.previewImage} />
        ))}
      </ScrollView>

      <TextInput
        style={styles.input}
        placeholder="Texto opcional (se aplicará a todas las imágenes)"
        placeholderTextColor="#AAA"
        multiline
        value={text}
        onChangeText={setText}
      />

      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={isLoading}>
        {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Publicar Historia</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#23272A',
    flexGrow: 1,
  },
  header: {
    color: '#9FC63B',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  uploadBtn: {
    backgroundColor: '#323639',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  uploadBtnText: {
    color: '#fff',
  },
  previewContainer: {
    marginTop: 15,
    marginBottom: 15,
  },
  previewImage: {
    width: 100,
    height: 100,
    marginRight: 10,
    borderRadius: 8,
  },
  input: {
    backgroundColor: '#323639',
    color: '#DFDFDF',
    borderRadius: 5,
    padding: 10,
    height: 100,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: '#9FC63B',
    padding: 15,
    marginTop: 20,
    alignItems: 'center',
    borderRadius: 5,
  },
  submitText: {
    color: '#000',
    fontWeight: 'bold',
  },
});

export default AddStoryScreen;
