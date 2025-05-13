import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet } from 'react-native';
import PropTypes from 'prop-types'; // Importamos PropTypes

// Importa las pantallas
import HomeScreen from '../HomeScreen';
import TicketScreen from '../TicketScreen';
import ProfileScreen from '../ProfileScreen';
import AddPublicationScreen from '../AddPublicationScreen';
import SuggestedUsersScreen from '../SuggestedUsersScreen'; 


//componentes
import CustomTabBarIcon from '../../components/CustomTabBarIcon';

const Tab = createBottomTabNavigator();

const TabNavigator = ({ userInfo, onLogout }) => {
  if (!userInfo) return null; // protección extra
  
  const { givenName, userId, profileImageUrl, email } = userInfo;

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarShowLabel: false,
        headerShown: false,
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tab.Screen
        name="Home"
        options={{
          tabBarIcon: ({ focused }) => (
            <CustomTabBarIcon
              focused={focused}
              activeIcon={require('../../../assets/images/publicaciones.png')}
              inactiveIcon={require('../../../assets/images/publicacionesgris.png')}
              label="Home"
            />
          ),
        }}
      >
        {() => (
          <HomeScreen
            route={{
              params: { givenName, profileImageUrl, userId, email}  // Pasamos los valores en route.params
            }}
            onLogout={onLogout}  // Pasamos onLogout
          />
        )}
      </Tab.Screen>

      <Tab.Screen
        name="Add"
        options={{
          tabBarIcon: ({ focused }) => (
            <CustomTabBarIcon
              focused={focused}
              activeIcon={require('../../../assets/images/addg.png')}
              inactiveIcon={require('../../../assets/images/addgris.png')}
              label="Agregar"
            />
          ),
        }}
      >
        {() => (
          <AddPublicationScreen
            route={{
              params: { givenName, profileImageUrl, userId, email }  // Pasamos el id correctamente aquí
            }}
          />
        )}
      </Tab.Screen>
      
      <Tab.Screen
        name="Ajustes"
        component={TicketScreen}
        initialParams={{ userId, givenName, email, profileImageUrl }}
        options={{
          tabBarIcon: ({ focused }) => (
            <CustomTabBarIcon
              focused={focused}
              activeIcon={require('../../../assets/images/ajustes.png')}
              inactiveIcon={require('../../../assets/images/ajustesgris.png')}
              label="Ticket"
            />
          ),
        }}
      />

    <Tab.Screen
      name="Perfil"
      options={{
        tabBarIcon: ({ focused }) => (
          <CustomTabBarIcon
            focused={focused}
            activeIcon={require('../../../assets/images/PerfilGreen.png')}
            inactiveIcon={require('../../../assets/images/PerfilGris.png')}
            label="Perfil"
          />
        ),
      }}
    >
      {() => (
        <ProfileScreen
          route={{
            params: { userId, givenName, email, profileImageUrl },
          }}
          onLogout={onLogout}
        />
      )}
    </Tab.Screen>

    {/* Nueva pantalla de sugerencias */}
    <Tab.Screen
        name="People"
        options={{
          tabBarIcon: ({ focused }) => (
            <CustomTabBarIcon
              focused={focused}
              activeIcon={require('../../../assets/images/PeopleGreen.png')} // Cambia por el ícono de sugerencias
              inactiveIcon={require('../../../assets/images/PeopleGris.png')} // Cambia por el ícono de sugerencias gris
              label="People"
            />
          ),
        }}
      >
        {() => (
        <SuggestedUsersScreen
          route={{
            params: { userId, givenName, email, profileImageUrl },
          }}
          onLogout={onLogout}
        />
      )}
      </Tab.Screen>
        
    </Tab.Navigator>
  );
};

// Validación de las propiedades de TabNavigator
TabNavigator.propTypes = {
  userInfo: PropTypes.shape({
    userId: PropTypes.string,
    email: PropTypes.string,
    givenName: PropTypes.string,
    profileImageUrl: PropTypes.string,
  }),
  onLogout: PropTypes.func,
  promptAsync: PropTypes.func,
  request: PropTypes.object,
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#23272A',
    height: 75,
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 0,
    paddingTop: 10,
  },
});

export default TabNavigator;

