import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated, StatusBar } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

// Get screen dimensions for responsive styling
const { width } = Dimensions.get('window');

const AuthScreen = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current; // Initial opacity set to 0
  const scaleAnim = useRef(new Animated.Value(1)).current; // For subtle pulsing effect on text

  // Fade-in effect for main content
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Pulsing effect for text
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.08,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [scaleAnim]);

  return (
    <LinearGradient
      colors={['#68095f', '#9f0d91']}
      style={styles.gradientBackground}
    >
         <StatusBar color={'transparent'} backgroundColor={'#68095f'} />
      <Animated.View style={{ ...styles.container, opacity: fadeAnim }}>
        <Animated.Text style={[styles.title, { transform: [{ scale: scaleAnim }] }]}>
          Welcome to Tiofy Restaurant
        </Animated.Text>
        <Animated.Text style={[styles.subtitle, { transform: [{ scale: scaleAnim }] }]}>
          Where every meal is a melody
        </Animated.Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('Login')}
          >
            <LinearGradient
              colors={['#9f0d91', '#68095f']}
              style={styles.gradientButton}
            >
              <Text style={styles.buttonText}>Login</Text>
            </LinearGradient>
          </TouchableOpacity>
          <View style={styles.separator}>
            <Text style={styles.separatorText}>OR</Text>
          </View> 
          <TouchableOpacity
            style={[styles.button, styles.signupButton]}
            onPress={() => navigation.navigate('Signup')}
          >
            <LinearGradient
               colors={['#9f0d91', '#68095f']}
              style={styles.gradientButton}
            >
              <Text style={styles.buttonText}>Sign Up</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: width,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#F8ECC2',
    marginBottom: 10,
    textAlign: 'center',
    fontFamily: 'Cochin', // For a retro look
  },
  subtitle: {
    fontSize: 20,
    color: '#F8ECC2',
    marginBottom: 30,
    textAlign: 'center',
    fontFamily: 'Cochin',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  button: {
    width: '80%',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: '#ffff00',
  },
  gradientButton: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signupButton: {
    marginTop: 10,
  },
  buttonText: {
    color: '#F8ECC2',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Cochin',
  },
  separator: {
    marginVertical: 10,
  },
  separatorText: {
    color: '#F8ECC2',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Cochin',
  },
});

export default AuthScreen;
