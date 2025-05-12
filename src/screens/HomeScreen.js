import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  FlatList as RNFlatList,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Dimensions,
  Alert,
} from "react-native";
import PropTypes from "prop-types";
import { useNavigation } from '@react-navigation/native';
import StoryCarousel from "./StoryCarousel";
import { useFocusEffect } from '@react-navigation/native';

// Crear un FlatList animado
const AnimatedFlatList = Animated.createAnimatedComponent(RNFlatList);

const API_URL = "http://51.120.11.157:8080/api";
const USER_API_URL = "http://51.120.11.157:8080/api/usuarios";
const STORIES_API_URL = "http://51.120.11.157:8080/api/historias"; 

const { width } = Dimensions.get("window");
const fontSize = width * 0.1;  

const HomeScreen = ({ route, onLogout }) => {
  const navigation = useNavigation();
  const { givenName, profileImageUrl, userId  } = route.params || {};

  useEffect(() => {
    console.log("Datos del usuario:", givenName, profileImageUrl, userId);
  }, [givenName, profileImageUrl, userId]);
  
  const [publicaciones, setPublicaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [stories, setStories] = useState([]); // Estado para las historias
  const flatListRef = useRef(null);  // Referencia para FlatList
  const offsetY = useRef(0); // Usamos ref para almacenar la posición

  const fetchPublicaciones = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/publicaciones/all/${userId}`);
  
      if (!response.ok) {
        throw new Error(`Error en la respuesta: ${response.statusText}`);
      }
  
      const text = await response.text();
      console.log('Respuesta del servidor:', text);
  
      const publicacionesData = JSON.parse(text);
  
      const publicacionesConUsuario = publicacionesData.map(publicacion => {
        // 🔍 Aseguramos compatibilidad: si los likes vienen como objetos, sacamos solo los userIds
        const likesArray = Array.isArray(publicacion.likes)
          ? publicacion.likes.map(l => typeof l === 'object' ? l.userId : l)
          : [];
  
        return {
          ...publicacion,
          autor: publicacion.autor || {
            givenName: "Usuario desconocido",
            profileImageUrl: "",
          },
          likes: likesArray,
          likesCount: likesArray.length,
          hasLiked: likesArray.includes(userId),
        };
      });
  
      setPublicaciones(Array.isArray(publicacionesConUsuario) ? publicacionesConUsuario : []);
    } catch (error) {
      console.error("Error al cargar publicaciones:", error);
      setError("Ocurrió un error al cargar las publicaciones.");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserData = async (userId) => {
    try {
      const response = await fetch(`${USER_API_URL }/${userId}`); // Aquí deberías poner tu URL para obtener los detalles del usuario
      if (!response.ok) {
        throw new Error(`Error al obtener datos del usuario: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error al cargar los datos del usuario:", error);
      return null;  // En caso de error, devolveremos null
    }
  };

   // Cargar las historias
   const fetchStories = async () => {
    try {
      const response = await fetch(STORIES_API_URL);

      if (!response.ok) {
        throw new Error(`Error en la respuesta: ${response.statusText}`);
      }

      const historiasData = await response.json();
      console.log("Datos de las historias:", historiasData);

     // Aquí haremos un mapa de historias y buscaremos los datos del autor
     const historiasConUsuario = await Promise.all(historiasData.map(async (story) => {
      const userData = await fetchUserData(story.userId);  // Usamos el userId para obtener el dato del usuario
      return {
        ...story,
        autor: userData ? {
          givenName: userData.givenName || "Anónimo", // Usamos el nombre del usuario o 'Anónimo' si no tiene nombre
          profileImageUrl: userData.profileImageUrl || ""  // Usamos la imagen de perfil del usuario o una cadena vacía
        } : {
          givenName: "Anónimo",
          profileImageUrl: ""
        }
      };
    }));

      setStories(historiasConUsuario || []); // Guardamos las historias, si existen
    } catch (error) {
      console.error("Error al cargar historias:", error);
      setError("Ocurrió un error al cargar las historias.");
    } finally {
      setLoading(false);
    }
  };
  

  useEffect(() => {
    console.log("user_id recibido:", userId);
    fetchPublicaciones();
    fetchStories();  // Llamamos a la función que carga las historias
  }, [userId]);

  // Agrega el useFocusEffect después de este bloque
  useFocusEffect(
    React.useCallback(() => {
      fetchStories();  // Esto recarga las historias cada vez que el usuario regresa
    }, [])
  );


  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPublicaciones();
    await fetchStories();  // Refrescamos también las historias
    setRefreshing(false);

    // Después de actualizar las publicaciones, restauramos la posición
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: offsetY.current, animated: false });
    }
  };

  const toggleLike = async (publicacionId) => {
    try {
      const pubActual = publicaciones.find(p => p.id === publicacionId);
      const userHasLiked = pubActual?.hasLiked;
  
      const updatedPublicaciones = publicaciones.map(pub => {
        if (pub.id !== publicacionId) return pub;
        const updatedLikes = userHasLiked
          ? pub.likes.filter(id => id !== userId)
          : [...(pub.likes || []), userId];
  
        return {
          ...pub,
          hasLiked: !userHasLiked,
          likes: updatedLikes,
          likesCount: updatedLikes.length,
        };
      });
      setPublicaciones(updatedPublicaciones);
  
      const options = userHasLiked
        ? {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
          }
        : {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userId: userId,
              publicacionId: publicacionId,
            }),
          };
  
      const url = userHasLiked
        ? `${API_URL}/likes/${userId}/${publicacionId}`
        : `${API_URL}/likes`;
  
      console.log("Haciendo solicitud a:", url);
      console.log("Con body:", options.body);
  
      const response = await fetch(url, options);
  
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error al actualizar like: ${errorText}`);
      }
  
      await fetchPublicaciones();
    } catch (error) {
      console.error("Error al modificar like:", error);
      Alert.alert("Error", error.message);
    }
  };
  const renderItem = ({ item }) => {
    const daysAgo = Math.round((new Date() - new Date(item.createdAt)) / (1000 * 60 * 60 * 24));
    const likesCount = item.likesCount ?? 0;
    const commentsCount = Array.isArray(item.comentarios) ? item.comentarios.length : 0;

    return (
      <View style={styles.card}>
        <View style={styles.headerUserContainer}>
          <Image
            source={item.autor.profileImageUrl
              ? { uri: item.autor.profileImageUrl }
              : require("../../assets/images/iconUser.png")}
            style={styles.avatar}
          />
          <View style={styles.userTextContainer}>
            <Text style={styles.publishedBy}>Publicado por</Text>
            <Text style={styles.user_id}>{item.autor?.givenName || "Anónimo"}</Text>
            <Text style={styles.timeAgo}>Hace {daysAgo} días</Text>
          </View>
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('SinglePublication', { id: item.id , userInfo:{userId, givenName, profileImageUrl}})}>
        <Image
            source={item.imageUrl
              ? { uri: item.imageUrl }
              : require("../../assets/images/addpub.png")}
            style={styles.image}
          />
        </TouchableOpacity>

        <View style={styles.likesContainer}>
        
          <TouchableOpacity onPress={() => toggleLike(item.id)} style={styles.likeButton}>
            <Image
              source={item.hasLiked
                ? require("../../assets/images/Favorite.png")
                : require("../../assets/images/FavoriteBorder.png")}
              style={styles.likeIcon}
            />
          </TouchableOpacity>
        
        <Text style={styles.likesCount}>{likesCount} Me gusta</Text>
      </View>

        <Text style={styles.title}>{item.titulo}</Text>
        <Text style={styles.comment}>{item.comentario}</Text>
        <Text style={styles.commentsCount}>{commentsCount} comentarios</Text>
      </View>
    );
  };

  // Función para manejar el click en una historia
  const handleStoryPress = (storyId) => {
    // Busca la historia completa usando el ID
    const selectedStory = stories.find(story => story.id === storyId);
  
    // Si encuentras la historia, navega a StoryViewer pasando la historia completa
    if (selectedStory) {
      navigation.navigate('StoryViewer', { story: selectedStory });
    } else {
      console.log("Historia no encontrada", storyId);
    }
  };

  return (
    <View style={styles.container}>
        <View style={styles.headerContainer}>
          <View style={styles.headerContent}>
            <View style={styles.logoContainer}>
              <Image source={require('../../assets/images/logo.png')} style={styles.logo} />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.nick}>{givenName}</Text>
              <Text style={[styles.titleHeader, { fontSize }]} adjustsFontSizeToFit numberOfLines={1}>VEDRUNA</Text>
            </View>
            <TouchableOpacity onPress={onLogout} style={[styles.logoutButton, { zIndex: 1 }]}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
      </View>

      {/* Carrusel de historias */}
      <View style={styles.carouselContainer}>
        <TouchableOpacity onPress={() => navigation.navigate('AddStoryScreen', { userId })}>
          <Image 
            source={profileImageUrl ? { uri: profileImageUrl } : require("../../assets/images/iconUser.png")} 
            style={styles.avatar}
          />
          <Text style={styles.addStoryText}>Añadir historia</Text>
        </TouchableOpacity>

        {/* Si el usuario tiene historias, las mostramos en el carrusel */}
        {Array.isArray(stories) && stories.length > 0 && (
          <StoryCarousel 
            stories={stories} 
            onStoryPress={handleStoryPress} // Asegúrate de que este funcione bien
          />
        )}
      </View>



      {loading ? (
        <ActivityIndicator size="large" color="#559687" />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <AnimatedFlatList
          ref={flatListRef}
          data={publicaciones}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          initialNumToRender={5}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          contentContainerStyle={styles.listContent}
          onScroll={(e) => {
            offsetY.current = e.nativeEvent.contentOffset.y;  // Guarda la posición del scroll
          }}
          ListFooterComponent={<View style={{ height: 60 }} />} // Antes estaba en 60
          //scrollEventThrottle={16}
        />
      )}
    </View>
  );
};

HomeScreen.propTypes = {
  route: PropTypes.shape({
    params: PropTypes.shape({
      given_name: PropTypes.string,
      picture: PropTypes.string,
      user_id: PropTypes.string,
    }),
  }).isRequired,
  onLogout: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#23272A",
  },
  headerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    width: width,
    height: 120,
    backgroundColor: "#23272A",
    zIndex: 10,
    paddingHorizontal: 15,
    justifyContent: "center",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
  },
  logoContainer: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: 50,
    marginLeft: 4,
    marginVertical: 30,
  },
  logo: {
    marginTop: 30,
    width: 60,
    height: 60,
  },
  textContainer: {
    flex: 1,
    alignItems: "flex-start",
  },
  nick: {
    fontFamily: "AsapCondensed-Regular",
    fontSize: 13,
    color: "#FFFFFF",
    marginBottom: 2,
    marginHorizontal: 25,
    marginTop: 30,
  },
  titleHeader: {
    fontFamily: "AsapCondensed-Regular",
    fontSize: 45,
    fontWeight: "900",
    color: "#DFDFDF",
    textAlign: "left",
    marginHorizontal: 25,
  },
  listContent: {
    paddingTop: 30,  // Esto le da espacio para el header
    paddingBottom: 20,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginTop: 20,
    fontSize: 18,
  },
  card: {
    position: "relative",
    width: width,
    marginBottom: 10,
    backgroundColor: "#23272A",
    overflow: "hidden",
    marginTop: 10,
    paddingBottom: 20,
  },
  headerUserContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: "transparent",
    zIndex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#9FC63B',
    marginRight: 10,
  },
  userTextContainer: {
    flex: 1,
  },
  publishedBy: {
    fontFamily: "AsapCondensed-Regular",
    fontSize: 15,
    color: "#DFDFDF",
  },
  user_id: {
    fontFamily: "AsapCondensed-Regular",
    fontSize: 20,
    fontWeight: "700",
    color: "#DFDFDF",
  },
  timeAgo: {
    fontFamily: "AsapCondensed-Regular",
    fontSize: 11,
    color: "#868686",
  },
  image: {
    width: "100%",
    height: 300,
    resizeMode: "cover",
  },
  title: {
    fontFamily: "AsapCondensed-Regular",
    fontSize: 24,
    fontWeight: "700",
    color: "#9FC63B",
    marginHorizontal: 15,
    marginTop: 10,
    textTransform: "uppercase",
  },
  likesContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    marginLeft: 15,
  },
  likeIcon: {
    width: 20,
    height: 20,
    marginRight: 5,
  },
  likesCount: {
    fontSize: 14,
    color: "gray",
  },
  comment: {
    fontSize: 14,
    textTransform: 'capitalize',
    marginVertical: 5,
    color: "gray",
    marginLeft: 15,
  },
  commentsCount: {
    fontFamily: "AsapCondensed-Regular",
    fontSize: 11,
    color: "#868686",
    fontWeight: "normal",
    marginLeft: 15,
  },
  carouselContainer: {
    marginTop: 120,  // Ajusta el margen para que no se solape con el header
    alignItems: 'center',
  },
  addStoryText: {
    fontSize: 14,
    color: "#9FC63B",
    marginTop: 5,
    textAlign: 'center',
    fontFamily: "AsapCondensed-Regular",
  },
  logoutButton: {
    backgroundColor: "#9FC63B",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",

  },
  logoutText: {
    fontFamily: "AsapCondensed-Regular",
    fontSize: 14,
    color: "#FFFFFF",
  },
});

export default HomeScreen;


