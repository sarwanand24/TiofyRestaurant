import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import axios from 'axios';
import auth from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import Loading from '../Loading';

 const Login = (props) => {
  const [mobileNo, setMobileNo] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [restroDetails, setRestroDetails] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [loading, setLoading] = useState(false); // Add loading state
  const [error, setError] = useState(''); // Add error state

  // Animations
  const buttonAnimation = useRef(new Animated.Value(1)).current;
  const inputAnimation = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Button scaling animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(buttonAnimation, {
          toValue: 1.05,
          duration: 500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(buttonAnimation, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    ).start();

    // Input field fade-in animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(inputAnimation, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(inputAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    ).start();
  }, []);

  // Handle user authentication state change
  async function onAuthStateChanged(user) {
    if (user) {
      // await AsyncStorage.setItem("token", restroDetails.accessToken);
      // await AsyncStorage.setItem("Restrodata", JSON.stringify(restroDetails.restro));
      // props.navigation.replace('RestroDashboard'); 
    }
  }

  // Handle sending OTP
  const handleSendOtp = async () => {
    setLoading(true); // Set loading true when API call starts
    setError(''); // Clear any previous errors
    try {
      // Step 1: Get Restro Details from your API
      console.log(mobileNo)
      const response = await axios.post('https://trioserver.onrender.com/api/v1/restaurants/login', { mobileNo });
      setRestroDetails(response.data.data);
      console.log("checking1")
      // Step 2: Send OTP using Firebase
      const subscriber = auth().onAuthStateChanged(onAuthStateChanged);
      console.log("checking2")
      signInWithPhoneNumber(`+91 ${mobileNo}`);
      console.log("checking3")
      setIsOtpSent(true);
    } catch (error) {
      setError('Failed to send OTP. Please try again.'); 
    } finally {
      setLoading(false); // Set loading false after API call ends
    }
  };

  // Send OTP via Firebase
  async function signInWithPhoneNumber(phoneNumber) {
    const confirmation = await auth().signInWithPhoneNumber(phoneNumber);
    setConfirm(confirmation);
  }

  // Verify OTP
  async function handleVerifyOtp() {
    setLoading(true); // Set loading true when verifying OTP
    setError(''); // Clear any previous errors
    try {
      const enteredOtp = otp.join('');
      await confirm.confirm(enteredOtp);
      await AsyncStorage.setItem("token", restroDetails.refreshToken);
      await AsyncStorage.setItem("Restrodata", JSON.stringify(restroDetails.Restaurant));
      props.navigation.pop(); 
      props.navigation.replace('RestroDashboard'); 
    } catch (error) {
      setError('Invalid OTP. Please try again.'); 
    } finally {
      setLoading(false); // Set loading false after OTP verification ends
    }
  }

  const otpRefs = useRef([]);

  // Handle OTP input change
  const handleOtpChange = (value, index) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value !== '' && index < otp.length - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };
  
  if(loading){
    return (
      <Loading />
    )
  }

  return (
    <LinearGradient colors={['#9E6F21', '#FFF4E3']} style={styles.container}>
      <Text style={styles.title}>Login</Text>
        <View>
        {error ? (
          <Text style={styles.error}>{error}</Text> // Display error message
        ) : null}
          {!isOtpSent ? (
            <>
              <Animated.View style={[styles.inputContainer, { transform: [{ scale: inputAnimation }] }]}>
                <TextInput
                  style={styles.input}
                  placeholder="Mobile Number"
                  placeholderTextColor="#8B4513"
                  value={mobileNo}
                  onChangeText={setMobileNo}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </Animated.View>
              <Animated.View style={[styles.button, { transform: [{ scale: buttonAnimation }] }]}>
                <TouchableOpacity style={styles.buttonInner} onPress={handleSendOtp}>
                  <Text style={styles.buttonText}>Proceed</Text>
                </TouchableOpacity>
              </Animated.View>
            </>
          ) : (
            <>
              <Text style={styles.otpTitle}>Enter OTP</Text>
              <View style={styles.otpContainer}>
                {otp.map((value, index) => (
                  <Animated.View key={index} style={{ transform: [{ scale: inputAnimation }] }}>
                    <TextInput
                      ref={ref => otpRefs.current[index] = ref}
                      style={styles.otpInput}
                      value={value}
                      onChangeText={(text) => handleOtpChange(text, index)}
                      keyboardType="numeric"
                      maxLength={1}
                      autoFocus={index === 0} // Automatically focus the first input
                    />
                  </Animated.View>
                ))}
              </View>
              <Animated.View style={[styles.button, { transform: [{ scale: buttonAnimation }] }]}>
                <TouchableOpacity style={styles.buttonInner} onPress={handleVerifyOtp}>
                  <Text style={styles.buttonText}>Verify OTP</Text>
                </TouchableOpacity>
              </Animated.View>
            </>
          )}
          {isOtpSent && (
            <TouchableOpacity onPress={() => setIsOtpSent(false)} style={styles.changeNumberButton}>
              <Text style={styles.link}>Change Mobile Number</Text>
            </TouchableOpacity>
          )}
        </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#4B0082', // Rich indigo for title
    textAlign: 'center',
    fontFamily: 'serif', // Classic serif font for Art Nouveau style
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    height: 50,
    borderColor: '#8B4513',
    borderWidth: 2,
    padding: 10,
    borderRadius: 25, // Rounded input field with more organic shape
    color: '#4B0082', // Deep indigo for input text
    backgroundColor: '#FFF8DC', // Creamy background color
    fontFamily: 'serif', // Classic serif font for input
  },
  otpTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4B0082', // Rich indigo for OTP title
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: 'serif', // Classic serif font for OTP title
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  otpInput: {
    height: 50,
    width: 40,
    borderColor: '#8B4513',
    borderWidth: 2,
    textAlign: 'center',
    color: '#4B0082', // Deep indigo for OTP text
    backgroundColor: '#FFF8DC', // Creamy background color
    borderRadius: 10, // Rounded OTP input for organic feel
    fontFamily: 'serif', // Classic serif font for OTP input
  },
  button: {
    marginTop: 20,
    borderRadius: 25,
    overflow: 'hidden',
  },
  buttonInner: {
    height: 50,
    borderRadius: 25,
    backgroundColor: '#8B4513', // Earthy brown background for the button
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF4E3', // Creamy white text color for contrast
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'serif', // Classic serif font
  },
  changeNumberButton: {
    marginTop: 10,
    alignItems: 'center',
  },
  link: {
    color: '#4B0082', // Rich indigo for link text
    textDecorationLine: 'underline',
    fontFamily: 'serif', // Classic serif font
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: 'serif',
  },
});

export default Login;