import { useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Configuración básica de cómo se mostrarán las notificaciones si la app está abierta
Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  
  export function usePushNotifications() {
    const [expoPushToken, setExpoPushToken] = useState(null);
    const [error, setError] = useState(null);
  
    useEffect(() => {
      const getPushToken = async () => {
          try {
              const token = await registerForPushNotificationsAsync();
              if (token) {
                  setExpoPushToken(token);
                  console.log('Expo Push Token:', token);
              }
          } catch (err) {
              console.error('Error obteniendo el token de push:', err);
              setError(err.message);
          }
      };

      getPushToken();
  }, []);

  return { expoPushToken, error };
}

// Función auxiliar para pedir permisos y obtener token
async function registerForPushNotificationsAsync() {
  let token;
  if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
      }
      if (finalStatus !== 'granted') {
          throw new Error('¡Se necesitan permisos para recibir notificaciones!');
      }
      token = (await Notifications.getExpoPushTokenAsync()).data;
  } else {
      throw new Error('¡Debes usar un dispositivo físico para recibir notificaciones push!');
  }

  if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
      });
  }

  return token;
}

export default usePushNotifications;