import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, SafeAreaView, ToastAndroid, Button,
   PermissionsAndroid, TextInput, TouchableOpacity, 
   StatusBar} from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import axios from 'axios';
import Loading from './Loading'; // Assuming you have a Loading component
import { getAccessToken } from '../utils/auth';

const RestroProfile = () => {
  const [restaurant, setRestaurant] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [email, setEmail] = useState('');
  const [mobileNo, setMobileNo] = useState('');
  const [address, setAddress] = useState('');
  const [cuisineType, setCuisineType] = useState('');
  const [openingTime, setOpeningTime] = useState('');
  const [closingTime, setClosingTime] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [loading, setLoading] = useState(false);
  const [availableStatus, setAvailableStatus] = useState(true);

  const checkLocationPermission = async () => {
    try {
      setLoading(true)
        // Check if permission is already granted
        const granted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
        
        if (!granted) {
            // Request permission if not granted
            const permissionResult = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
            );

            if (permissionResult !== PermissionsAndroid.RESULTS.GRANTED) {
                ToastAndroid.showWithGravity(
                    "Location permission not granted.",
                    ToastAndroid.SHORT,
                    ToastAndroid.CENTER
                );
                return; // Exit if permission is not granted
            }
        }

        // If permission is granted, get the current location
        Geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                const jwtToken = await getAccessToken();

                try {
                    const response = await fetch("https://trioserver.onrender.com/api/v1/restaurants/update-restro-location", {
                        method: "POST",
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${jwtToken}`
                        },
                        body: JSON.stringify({ latitude, longitude })
                    });

                    if (response.ok) {
                        // Show success toast message
                        ToastAndroid.showWithGravity(
                            "Location updated successfully!",
                            ToastAndroid.SHORT,
                            ToastAndroid.CENTER
                        );
                    } else {
                        // Check the content type of the response
                        const contentType = response.headers.get('content-type');
                        
                        if (contentType && contentType.includes('application/json')) {
                            // Parse JSON if the response is in JSON format
                            const errorData = await response.json();
                            console.error('Error updating location:', errorData);
                        } else {
                            // Handle non-JSON response (likely HTML error page)
                            const errorText = await response.text();
                            console.error('Error updating location (non-JSON):', errorText);
                        }

                        ToastAndroid.showWithGravity(
                            "Failed to update location. Please try again.",
                            ToastAndroid.SHORT,
                            ToastAndroid.CENTER
                        );
                    }
                } catch (error) {
                    console.error('Network error updating location:', error);

                    // Show error toast message
                    ToastAndroid.showWithGravity(
                        "Failed to update location due to network error.",
                        ToastAndroid.SHORT,
                        ToastAndroid.CENTER
                    );
                }
            },
            (error) => {
                console.error('Error getting location:', error);

                // Show error toast message
                ToastAndroid.showWithGravity(
                    "Error getting location. Please try again.",
                    ToastAndroid.SHORT,
                    ToastAndroid.CENTER
                );
            },
            { enableHighAccuracy: true, timeout: 30000, maximumAge: 10000 }
        );
    } catch (error) {
        console.warn('Error checking location permission:', error);

        // Show error toast message
        ToastAndroid.showWithGravity(
            "An error occurred. Please try again.",
            ToastAndroid.SHORT,
            ToastAndroid.CENTER
        );
    }
    finally{
      setLoading(false)
    }
};

  useEffect(() => {
    const fetchRestaurantDetails = async () => {
      try {
        setLoading(true);
        const token = await getAccessToken();
        
        const response = await axios.get('https://trioserver.onrender.com/api/v1/restaurants/current-restaurant', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setRestaurant(response.data.data);
        setAvailableStatus(response.data.data.availableStatus);
      } catch (error) {
        console.error('Error fetching restaurant details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurantDetails();
  }, []);

  const toggleAvailableStatus = async() => {
    try {
      const token = await getAccessToken();
      const response = await axios.post(
        'https://trioserver.onrender.com/api/v1/restaurants/toggle-availability',
        { availableStatus: !availableStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.status === 200) {
        setAvailableStatus(!availableStatus);
        ToastAndroid.showWithGravity(
          `Restaurant is now ${!availableStatus ? 'Available' : 'Not Available'}`,
          ToastAndroid.SHORT,
          ToastAndroid.CENTER
        );
      }
    } catch (error) {
      console.error('Error toggling availableStatus:', error);
      ToastAndroid.showWithGravity(
        "Failed to update availability.",
        ToastAndroid.SHORT,
        ToastAndroid.CENTER
      );
    }
  }

  const handleSave = async () => {
    try {
      const token = await getAccessToken();
      if (token) {
        const response = await axios.put(
          'https://trioserver.onrender.com/api/v1/restaurants/update-details',
          { email, mobileNo, address, cuisineType, restaurantName, openingTime, closingTime },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setRiderData(response.data.data);
        setIsEditing(false);
      }
    } catch (error) {
      console.log('Error updating rider data:', error);
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <SafeAreaView style={styles.container}>
         <StatusBar color={'transparent'} backgroundColor={'#68095f'} />
      <ScrollView>
        <View style={styles.header}>
        <Image
  style={styles.headerImage}
  source={{
    uri: restaurant.restaurantPhoto
      ? restaurant.restaurantPhoto.replace("http://", "https://")
      : null
  }}
/>
{isEditing ? (
            <TextInput
              style={styles.input}
              value={restaurantName}
              onChangeText={setRestaurantName}
            />
          ) : (
            <Text style={styles.restaurantName}>{restaurant.restaurantName}</Text>
          )}
        </View>

           <Button
          title="Update My Restro Location"
          onPress={checkLocationPermission}
          color="#68095f" // Neon pink color
          styles={{marginBottom: 10}}
        />

<Button
  title={availableStatus ? 'Available' : 'Not Available'}
  onPress={toggleAvailableStatus}
  color={availableStatus ? '#00FF00' : '#FF0000'} // Green for available, red for not available
/>

        <View style={styles.detailsContainer}>
          <View style={styles.card}>
            <Text style={styles.label}>Owner:</Text>
            <Text style={styles.value}>{restaurant.ownerName}</Text>
          </View>

          <View style={styles.row}>
            <View style={styles.halfCard}>
              <Text style={styles.label}>Contact:</Text>
              {isEditing ? (
            <TextInput
              style={styles.input}
              value={mobileNo}
              onChangeText={setMobileNo}
            />
          ) : (
            <Text style={styles.value}>{restaurant.mobileNo}</Text>
          )}
              <Text style={styles.value}>{restaurant?.alternateMobileNo}</Text>
            </View>

            <View style={styles.halfCard}>
              <Text style={styles.label}>Email:</Text>
              {isEditing ? (
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
            />
          ) : (
            <Text style={styles.value}>{restaurant.email}</Text>
          )}
            </View>

            <View style={styles.halfCard}>
              <Text style={styles.label}>Address:</Text>
              {isEditing ? (
            <TextInput
              style={styles.input}
              value={address}
              onChangeText={setAddress}
            />
          ) : (
            <Text style={styles.value}>{restaurant?.address || 'unknown'}</Text>
          )}
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.halfCard}>
              <Text style={styles.label}>Opening Time:</Text>
              {isEditing ? (
            <TextInput
              style={styles.input}
              value={openingTime}
              onChangeText={setOpeningTime}
            />
          ) : (
            <Text style={styles.value}>{restaurant.openingTime}</Text>
          )}
            </View>

            <View style={styles.halfCard}>
              <Text style={styles.label}>Closing Time:</Text>
              {isEditing ? (
            <TextInput
              style={styles.input}
              value={closingTime}
              onChangeText={setClosingTime}
            />
          ) : (
            <Text style={styles.value}>{restaurant.closingTime}</Text>
          )}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>CuisineType:</Text>
            {isEditing ? (
            <TextInput
              style={styles.input}
              value={cuisineType}
              onChangeText={setCuisineType}
            />
          ) : (
            <Text style={styles.value}>{restaurant?.cuisineType || 'unknown'}</Text>
          )}
          </View>

          {isEditing && (
            <TouchableOpacity
            style={{backgroundColor:'#9f0d91', marginVertical:10, width:'60%', borderRadius:20, padding:8, marginHorizontal:'auto'}}
             onPress={handleSave}
           >
             <Text style={{textAlign:'center', color:'white'}}>Save</Text>
           </TouchableOpacity>
        )}
        <TouchableOpacity
        style={{backgroundColor:'#9f0d91', marginVertical:10, width:'60%', borderRadius:20, padding:8, marginHorizontal:'auto'}}
          onPress={() => setIsEditing(!isEditing)}
        >
          <Text style={{textAlign:'center', color:'white'}}>{isEditing ? 'Cancel' : 'Edit'}</Text>
        </TouchableOpacity>

          <View style={styles.card}>
            <Text style={styles.label}>FSSAI Details</Text>
            <Text style={styles.value}>No: {restaurant.fssaiNo}</Text>
            <Text style={styles.value}>Expiry: {restaurant.fssaiExpiryDate}</Text>
          </View>

          <View style={styles.row}>
            <View style={styles.halfCard}>
              <Text style={styles.label}>Latitude:</Text>
              <Text style={styles.value}>{restaurant?.latitude}</Text>
            </View>

            <View style={styles.halfCard}>
              <Text style={styles.label}>Longitude:</Text>
              <Text style={styles.value}>{restaurant?.longitude}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.halfCard}>
              <Text style={styles.label}>Ratings:</Text>
              <Text style={styles.value}>{restaurant?.ratings}</Text>
            </View>

            <View style={styles.halfCard}>
              <Text style={styles.label}>Created At:</Text>
              <Text style={styles.value}>{new Date(restaurant.createdAt).toLocaleDateString()}</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Last Updated:</Text>
            <Text style={styles.value}>{new Date(restaurant.updatedAt).toLocaleDateString()}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#68095f', // Deep black background for the Noir effect
  },
  header: {
    alignItems: 'center',
    backgroundColor: '#9f0d91', // Darker shade for the header
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333333', // Border for slight contrast
  },
  headerImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#ffff00', // Neon pink border
  },
  restaurantName: {
    marginTop: 15,
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00FFFF', // Neon cyan color
    fontFamily: 'serif',
    textShadowColor: '#ffff00', // Neon shadow
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  detailsContainer: {
    padding: 20,
    backgroundColor: '#9f0d91', // Same as header for consistency
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  card: {
    padding: 15,
    marginBottom: 20,
    backgroundColor: '#68095f', // Card background
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333333',
  },
  halfCard: {
    flex: 1,
    padding: 15,
    backgroundColor: '#68095f', // Card background
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333333',
    marginRight: 10,
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF', // White text for clarity
    marginBottom: 5,
    fontFamily: 'serif',
  },
  value: {
    fontSize: 16,
    color: '#ffff00', // Neon pink for values
    fontFamily: 'serif',
    textShadowColor: '#333333', // Subtle shadow for depth
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  input:{
    backgroundColor:'#9f0d91',
    color:'white',
    width: '80%',
    borderRadius: 20
  },
});

export default RestroProfile;
