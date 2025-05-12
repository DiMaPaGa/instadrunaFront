import React, { useEffect, useState } from 'react';
import { View, TextInput, FlatList, Text, Image, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const API_URL = 'http://51.120.11.157:8080/api';

const SuggestedUsersScreen = ({ route }) => {
  const { userId, givenName } = route.params;
  const navigation = useNavigation();
  const [searchTerm, setSearchTerm] = useState('');
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    buscarUsuarios(true);
  }, [searchTerm]);

  const buscarUsuarios = async (reset = false) => {
    if (loading || (!hasMore && !reset)) return;

    setLoading(true);
    const nombreParam = encodeURIComponent(searchTerm);
    const pageParam = reset ? 0 : page;

    try {
      const res = await fetch(`${API_URL}/usuarios/buscar?nombre=${nombreParam}&page=${pageParam}&size=10`);
      const data = await res.json();

      const usuariosConEstado = await Promise.all(
        data.content.map(async (usuario) => {
          if (usuario.userId === userId) {
            return { ...usuario, estadoSeguidor: 'yo' };
          }

          const resEstado = await fetch(`${API_URL}/seguidores/es-seguidor?seguidorId=${userId}&seguidoId=${usuario.userId}`);
          const yoLoSigo = await resEstado.json();

          const resInverso = await fetch(`${API_URL}/seguidores/es-seguidor?seguidorId=${usuario.userId}&seguidoId=${userId}`);
          const elMeSigue = await resInverso.json();

          if (yoLoSigo && elMeSigue) return { ...usuario, estadoSeguidor: 'seguido_mutuo' };
          if (yoLoSigo && !elMeSigue) return { ...usuario, estadoSeguidor: 'solicitud_enviada' };
          if (!yoLoSigo && elMeSigue) return { ...usuario, estadoSeguidor: 'solicitud_recibida' };
          return { ...usuario, estadoSeguidor: 'no_sigue' };
        })
      );

      if (reset) {
        setUsuarios(usuariosConEstado);
        setPage(1);
      } else {
        setUsuarios((prev) => [...prev, ...usuariosConEstado]);
        setPage((prev) => prev + 1);
      }

      setHasMore(!data.last);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const seguirUsuario = async (seguidoId) => {
    await fetch(`${API_URL}/seguidores/seguir?seguidorId=${userId}&seguidoId=${seguidoId}`, {
      method: 'POST',
    });
    buscarUsuarios(true);
  };

  const dejarDeSeguir = async (seguidoId) => {
    await fetch(`${API_URL}/seguidores/dejar-de-seguir?seguidorId=${userId}&seguidoId=${seguidoId}`, {
      method: 'DELETE',
    });
    buscarUsuarios(true);
  };

  const aceptarSolicitud = async (seguidorId) => {
    await fetch(`${API_URL}/seguidores/aceptar-solicitud?seguidorId=${seguidorId}&seguidoId=${userId}`, {
      method: 'PUT',
    });

    setUsuarios(prevUsuarios =>
      prevUsuarios.map(user =>
        user.userId === seguidorId
          ? { ...user, estadoSeguidor: 'no_sigue' } // el usuario ya te sigue, tú aún no
          : user
      )
    );
  };

  const renderBotonAccion = (item) => {
    switch (item.estadoSeguidor) {
      case 'yo':
        return <Text style={styles.accionText}>Es tu perfil</Text>;
      case 'seguido_mutuo':
        return (
          <View style={styles.botonDoble}>
            <TouchableOpacity onPress={() => dejarDeSeguir(item.userId)} style={styles.btnRojo}>
              <Text style={styles.btnText}>Dejar de seguir</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => iniciarChat(item)} style={styles.btnChat}>
              <Text style={styles.btnText}>Chat</Text>
            </TouchableOpacity>
          </View>
        );
      case 'solicitud_enviada':
        return (
          <TouchableOpacity onPress={() => dejarDeSeguir(item.userId)} style={styles.btnNaranja}>
            <Text style={styles.btnText}>Cancelar solicitud</Text>
          </TouchableOpacity>
        );
      case 'solicitud_recibida':
        return (
          <TouchableOpacity onPress={() => aceptarSolicitud(item.userId)} style={styles.btnVerde}>
            <Text style={styles.btnText}>Aceptar</Text>
          </TouchableOpacity>
        );
      default:
        return (
          <TouchableOpacity onPress={() => seguirUsuario(item.userId)} style={styles.btnVerde}>
            <Text style={styles.btnText}>Seguir</Text>
          </TouchableOpacity>
        );
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.usuarioItem}>
      <Image source={{ uri: item.profileImageUrl }} style={styles.avatar} />
      <View style={{ flex: 1 }}>
        <Text style={styles.nombre}>{item.givenName}</Text>
        <View style={{ width: '100%' }}>
        {renderBotonAccion(item)}
        </View>
      </View>
    </View>
  );

  const iniciarChat = (usuario) => {
    navigation.navigate('ChatScreen', {
      givenName: usuario.givenName,  // Nombre del usuario con el que chateas
      userId: userId,  // Tu userId
      otherUserId: usuario.userId,  // El userId del usuario con el que vas a chatear
      username: route.params.givenName, // TU nombre
    });
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Buscar usuarios..."
        value={searchTerm}
        onChangeText={(text) => {
          setSearchTerm(text);
          setPage(0);
          setHasMore(true);
        }}
        style={styles.input}
      />

      <FlatList
        data={usuarios}
        keyExtractor={(item) => item.userId}
        renderItem={renderItem}
        onEndReached={() => buscarUsuarios()}
        onEndReachedThreshold={0.3}
        ListFooterComponent={loading && <ActivityIndicator />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  usuarioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    paddingVertical: 10,
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  nombre: {
    fontWeight: 'bold',
  },
  btnVerde: {
    marginTop: 4,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  btnRojo: {
    marginTop: 4,
    backgroundColor: '#F10000',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    width: '48%',

  },
  btnNaranja: {
    marginTop: 4,
    backgroundColor: '#F19100',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  botonDoble: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 4,
    alignItems: 'center',
    flex: 1,
  },
  
  btnChat: {
    backgroundColor: '#6A1B9A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    width: '48%',

  },
  btnText: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
  },
  accionText: {
    marginTop: 4,
    fontSize: 12,
    color: '#999',
  },
});

export default SuggestedUsersScreen;
