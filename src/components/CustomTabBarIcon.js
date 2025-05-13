import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

const CustomTabBarIcon = ({ focused, activeIcon, inactiveIcon, label }) => (
  <View style={styles.iconContainer}>
    <Image source={focused ? activeIcon : inactiveIcon} style={styles.icon} />
    <Text style={[styles.iconLabel, focused ? styles.iconLabelActive : styles.iconLabelInactive]} numberOfLines={1}>
      {label || 'Sin etiqueta'}
    </Text>
  </View>
);

// Validación de las propiedades
CustomTabBarIcon.propTypes = {
  focused: PropTypes.bool.isRequired,
  activeIcon: PropTypes.any.isRequired,
  inactiveIcon: PropTypes.any.isRequired,
  label: PropTypes.string.isRequired,
};

const styles = StyleSheet.create({
  iconContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: 50,
  },
  icon: {
    width: 24,
    height: 24,
    marginBottom: 2,
  },
  iconLabel: {
    fontSize: 11,
    lineHeight: 13,
    textAlign: 'center',
    width: 60,
  },
  iconLabelActive: {
    color: '#9FC63B',
  },
  iconLabelInactive: {
    color: '#868686',
  },
});

export default CustomTabBarIcon;