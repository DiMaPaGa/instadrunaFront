import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Guarda el JWT en AsyncStorage.
 * @param {string} jwt El token JWT a guardar.
 */
export const saveJwtToStorage = async (jwt) => {
    try {
      await AsyncStorage.setItem('jwt_token', jwt); // Guardamos el JWT bajo la clave 'jwt_token'
    } catch (error) {
      console.error("Error al guardar el JWT en AsyncStorage", error);
    }
  };

/**
 * Recupera el JWT desde AsyncStorage.
 * @returns {string|null} El JWT guardado o null si no existe.
 */
export const getJwtFromStorage = async () => {
    try {
      const jwt = await AsyncStorage.getItem('jwt_token');
      return jwt;
    } catch (error) {
      console.error("Error al obtener el JWT de AsyncStorage", error);
      return null;
    }
  };

/**
 * Elimina el JWT de AsyncStorage.
 */
export const removeJwtFromStorage = async () => {
    try {
      await AsyncStorage.removeItem('jwt_token'); // Eliminamos el JWT
    } catch (error) {
      console.error("Error al eliminar el JWT de AsyncStorage", error);
    }
  };
