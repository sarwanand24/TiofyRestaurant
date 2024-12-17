import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Animated, Easing, ActivityIndicator, Image,
  ScrollView, Alert
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import axios from 'axios';
import ImagePicker from 'react-native-image-crop-picker';
import Autocomplete from 'react-native-autocomplete-input';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Loading from '../Loading';

const Signup = (props) => {
  const [restroName, setRestroName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [cuisineType, setCuisineType] = useState('');
  const [fssaiNo, setFssaiNo] = useState('');
  const [fssaiExpiryDate, setFssaiExpiryDate] = useState('');
  const [openingTime, setOpeningTime] = useState('');
  const [closingTime, setClosingTime] = useState('');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [restaurantImage, setRestaurantImage] = useState(null);
  const [address, setAddress] = useState('');
  const [mobileNo, setMobileNo] = useState('');
  const [alternativeMobileNo, setAlternativeMobileNo] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [city, setCity] = useState('');
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [query, setQuery] = useState('');
  const [restroDetails, setRestroDetails] = useState(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [bankName, setBankName] = useState('');
  const [branch, setBranch] = useState('');
  const [ifscError, setIfscError] = useState('');

  // Animations
  const buttonAnimation = useRef(new Animated.Value(1)).current;

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
  }, []);

  const validateEmail = (email) => {
    // Regex for validating email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSignup = async () => {
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address.');
      return;
    } else {
      setEmailError('');
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('restaurantName', restroName);
      formData.append('ownerName', ownerName);
      formData.append('email', email);
      formData.append('address', address);
      formData.append('mobileNo', mobileNo);
      formData.append('alternativeMobileNo', alternativeMobileNo);
      formData.append('password', password);
      formData.append('openingTime', openingTime);
      formData.append('closingTime', closingTime);
      formData.append('fssaiNo', fssaiNo);
      formData.append('fssaiExpiryDate', fssaiExpiryDate);
      formData.append('restaurantPhotoImg', restaurantImage);
      formData.append('city', city);
      formData.append('accountNumber', accountNumber);
      formData.append('ifscCode', ifscCode);
      formData.append('bankName', bankName);
      formData.append('branch', branch);
      formData.append('cuisineType', cuisineType);


      const response = await axios.post('https://trioserver.onrender.com/api/v1/restaurants/register', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log(response.data.data.Restro);
      // Handle successful signup
      setRestroDetails(response.data.data);
      console.log('SUCCESS SIGNUP');
      await AsyncStorage.setItem("token", response.data.data.refreshToken);
      await AsyncStorage.setItem("Restrodata", JSON.stringify(response.data.data.Restaurant));
      props.navigation.pop();
      props.navigation.replace('MainApp');
    } catch (error) {
      Alert.alert('Error in Signup Process, Please try again later.')
      console.error(error);
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  const pickImage = (type) => {
    const options = {
      cropping: true,
      mediaType: 'photo',
      includeBase64: true,
    };


    ImagePicker.openPicker(options).then(image => {
      const data = `data:${image.mime};base64,${image.data}`;
      setRestaurantImage(data);
    }).catch(err => console.log(err));
  };

  const fetchCities = async (text) => {
    setQuery(text);
    if (text.length >= 2) {
      try {
        const response = await axios.get(
          `https://nominatim.openstreetmap.org/search`, {
          params: {
            q: text,
            format: 'json',
            addressdetails: 1,
            limit: 10,
          },
          headers: {
            'User-Agent': 'TiofyRestaurant/1.0'  // Replace with your app's name
          }
        }
        );
        setCitySuggestions(response.data || []);
      } catch (error) {
        console.error('Error fetching city data: ', error);
      }
    } else {
      setCitySuggestions([]);
    }
  };

  const handleCitySelection = (selectedCity) => {
    const formattedCity = `${selectedCity.name}, ${selectedCity.address.state}, ${selectedCity.address.country}`;
    setCity(formattedCity);
    setQuery(formattedCity);
    setCitySuggestions([]); // Clear suggestions after selection
  };

  const fetchBankDetails = async () => {
    if (!ifscCode.trim() || !(ifscCode?.length === 11)) {
      setIfscError('Please enter a valid IFSC code.');
      return;
    }

    try {
      console.log('code---', ifscCode)
      const response = await axios.get(`https://ifsc.razorpay.com/${ifscCode}`,
        {
          headers: {
            'User-Agent': 'TiofyRider/1.0',  // Replace with your app's name
            'Content': 'application/json',
          }
        }
      );
      console.log(response)
      setBankName(response.data.BANK || '');
      setBranch(response.data.BRANCH || '');
      setIfscError(''); // Clear error if successful
    } catch (error) {
      console.error('Error fetching bank details:', error);
      setIfscError('Invalid IFSC code. Please try again.');
      setBankName('');
      setBranch('');
    }
  };

  useEffect(() => {
    fetchBankDetails();
  }, [ifscCode])

  if (loading) {
    return (
      <Loading />
    )
  }

  return (
    <LinearGradient colors={['#1e1e1e', '#292929']} style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>Signup</Text>
        <View>
          <TextInput
            style={styles.input}
            placeholder="Restro Name"
            placeholderTextColor="#ccc"
            value={restroName}
            onChangeText={setRestroName}
          />
          <TextInput
            style={styles.input}
            placeholder="Owner Name"
            placeholderTextColor="#ccc"
            value={ownerName}
            onChangeText={setOwnerName}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#ccc"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />
          {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
          <TouchableOpacity style={styles.uploadButton} onPress={() => pickImage('restroPhoto')}>
            <Text style={styles.uploadButtonText}>{restaurantImage ? 'Change Restaurant Photo' : 'Upload Restaurant Photo'}</Text>
          </TouchableOpacity>
          {restaurantImage && (
            <Image source={{ uri: restaurantImage }} style={styles.imagePreview} />
          )}
          <TextInput
            style={styles.input}
            placeholder="Address"
            placeholderTextColor="#ccc"
            value={address}
            onChangeText={setAddress}
          />
          <TextInput
            style={styles.input}
            placeholder="Mobile No"
            placeholderTextColor="#ccc"
            value={mobileNo}
            onChangeText={setMobileNo}
            keyboardType="phone-pad"
            maxLength={10}
          />
          <TextInput
            style={styles.input}
            placeholder="Alternative Mobile No (Optional)"
            placeholderTextColor="#ccc"
            value={alternativeMobileNo}
            onChangeText={setAlternativeMobileNo}
            keyboardType="phone-pad"
            maxLength={10}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#ccc"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TextInput
            style={styles.input}
            placeholder="FSSAI NO"
            placeholderTextColor="#ccc"
            value={fssaiNo}
            onChangeText={setFssaiNo}
          />
          <TextInput
            style={styles.input}
            placeholder="FSSAI Expiry Date"
            placeholderTextColor="#ccc"
            value={fssaiExpiryDate}
            onChangeText={setFssaiExpiryDate}
          />
          <TextInput
            style={styles.input}
            placeholder="Opening Time"
            placeholderTextColor="#ccc"
            value={openingTime}
            onChangeText={setOpeningTime}
          />
          <TextInput
            style={styles.input}
            placeholder="Closing Time"
            placeholderTextColor="#ccc"
            value={closingTime}
            onChangeText={setClosingTime}
          />
          <TextInput
            style={styles.input}
            placeholder="CuisineType"
            placeholderTextColor="#ccc"
            value={cuisineType}
            onChangeText={setCuisineType}
          />

          <Autocomplete
            data={citySuggestions}
            defaultValue={query}
            onChangeText={fetchCities}
            flatListProps={{
              keyExtractor: (item) => item.place_id.toString(), // Ensure unique key for each item
              renderItem: ({ item }) => (
                <TouchableOpacity onPress={() => handleCitySelection(item)}>
                  <Text style={styles.suggestionItem}>
                    {item.name}, {item.address.state}, {item.address.country}
                  </Text>
                </TouchableOpacity>
              ),
            }}
            inputContainerStyle={styles.inputContainer}
            listStyle={styles.listStyle}
            style={styles.input}
            placeholder="City"
            placeholderTextColor="#ccc"
          />

          <TextInput
            style={styles.input}
            placeholder="Enter Bank Account Number"
            placeholderTextColor="#ccc"
            value={accountNumber}
            onChangeText={setAccountNumber}
          />

          <TextInput
            style={styles.input}
            placeholder="Enter IFSC Code"
            placeholderTextColor="#ccc"
            value={ifscCode}
            onChangeText={(value) => {
              setIfscCode(value);
              if (value.length === 11) { // Trigger fetch when IFSC code is 11 characters long
                fetchBankDetails();
              }
            }}
          />
          {ifscError ? <Text style={styles.errorText}>{ifscError}</Text> : null}

          <TextInput
            style={[styles.input, { backgroundColor: '#f0f0f0', color: 'black' }]} // Disabled styling
            placeholder="Bank Name"
            placeholderTextColor="#999"
            value={bankName}
            onChangeText={setBankName}
          />

          <TextInput
            style={[styles.input, { backgroundColor: '#f0f0f0', color: 'black' }]} // Disabled styling
            placeholder="Branch"
            placeholderTextColor="#999"
            value={branch}
            onChangeText={setBranch}
          />

          <Animated.View style={[styles.button, { transform: [{ scale: buttonAnimation }] }]}>
            <TouchableOpacity style={styles.buttonInner} onPress={handleSignup}>
              <Text style={styles.buttonText}>Sign Up</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#121212', // Dark background
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ff4081', // Bright neon pink
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'sans-serif', // Modern font style
    textShadowColor: '#ff8c00', // Orange shadow
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
  },
  input: {
    height: 50,
    borderColor: '#6200ea', // Neon purple
    borderWidth: 2,
    borderRadius: 25,
    paddingHorizontal: 15,
    marginBottom: 15,
    color: '#ffffff', // White text
    backgroundColor: '#282828', // Dark gray background
    fontFamily: 'sans-serif', // Modern font style
  },
  uploadButton: {
    backgroundColor: '#ff4081', // Bright neon pink
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#ff8c00', // Orange shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
  },
  uploadButtonText: {
    color: '#ffffff', // White text
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'sans-serif', // Modern font style
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginBottom: 15,
    borderColor: '#6200ea', // Neon purple border
    borderWidth: 2,
  },
  button: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  buttonInner: {
    height: 50,
    borderRadius: 25,
    backgroundColor: '#6200ea', // Neon purple
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ff8c00', // Orange shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
  },
  buttonText: {
    color: '#ffffff', // White text
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'sans-serif', // Modern font style
  },
  errorText: {
    color: '#ff1744', // Bright red for errors
    fontSize: 14,
    marginBottom: 10,
    textAlign: 'center',
  },
  inputContainer: {
    borderWidth: 0,
  },
  listStyle: {
    borderWidth: 1,
    borderColor: '#6200ea', // Neon purple border
    borderRadius: 5,
    backgroundColor: '#282828', // Dark gray background for the list
    marginTop: 5,
    paddingVertical: 5,
  },
  suggestionItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#6200ea', // Neon purple for divestro
    color: 'black', // White text
  },
});


export default Signup;
