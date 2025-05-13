import React from 'react';
import { ScrollView, TouchableOpacity, Image, Text, StyleSheet, View } from 'react-native';

// Componente del carrusel de historias
const StoryCarousel = ({ stories, onStoryPress }) => {
    if (!Array.isArray(stories) || stories.length === 0) {
      return <Text style={styles.noStories}>No hay historias disponibles.</Text>;
    }
  
    return (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.carousel}
          contentContainerStyle={styles.carouselContent}
        >
          {stories.map((story, index) => {
          console.log('Story en el carousel:', story); // Añade esto temporalmente
          return (
            <TouchableOpacity 
              key={index} 
              onPress={() => onStoryPress(story.id)}
              style={styles.storyItem}
            >
              <View style={styles.imageWrapper}>
                <Image
                  source={
                    story.autor?.profileImageUrl
                      ? { uri: story.autor.profileImageUrl }
                      : require('../../assets/images/iconUser.png')
                  }
                  style={styles.storyImage}
                />
              </View>
    
              <Text style={styles.userName}>
                {story.autor?.givenName || 'Anónimo'}
              </Text>
            </TouchableOpacity>
  );
})}
        </ScrollView>
      );
    };
    
    const styles = StyleSheet.create({
        carousel: {
          marginTop: 20,
          paddingHorizontal: 10,
        },
        noStories: {
          textAlign: 'center',
          color: '#ccc',
          fontSize: 14,
          paddingVertical: 10,
        },
        carouselContent: {
          flexDirection: 'row',  // Esto asegura que los elementos se alineen horizontalmente
          paddingVertical: 5,    // Esto da un poco de espacio en los lados
        },
        storyItem: {
          alignItems: 'center',
          marginRight: 15,
          marginLeft: 2, // Le da un pequeño espacio a la izquierda para que no esté pegado al borde
        },
        imageWrapper: {
          borderWidth: 3,
          borderColor: '#9FC63B',
          borderRadius: 40,
          padding: 2,
        },
        storyImage: {
          width: 70,
          height: 70,
          borderRadius: 35,
        },
        userName: {
          textAlign: 'center',
          fontSize: 12,
          color: '#ccc',
          marginTop: 5,
          maxWidth: 80,
        },
      });
      
      export default StoryCarousel;