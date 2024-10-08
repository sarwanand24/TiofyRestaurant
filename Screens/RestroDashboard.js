import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, SafeAreaView, StatusBar, TouchableOpacity, Button, FlatList, PermissionsAndroid, ActivityIndicator } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import socket from '../utils/Socket';
import { getAccessToken } from '../utils/auth';
import Loading from './Loading';

const RestroDashboard = (props) => {
  const [restaurant, setRestaurant] = useState({});
  const [orderInfo, setOrderInfo] = useState(false);
  const [orderData, setOrderData] = useState([]);
  const [refresh, setRefresh] = useState(false);
  const [loading, setLoading] = useState(false); 

  useEffect(() => {
    const fetchRestaurantDetails = async () => {
      try {
        setLoading(true)
        const token = await getAccessToken();
        const response = await axios.get('https://trioserver.onrender.com/api/v1/restaurants/current-restaurant', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setRestaurant(response.data.data);
      } catch (error) {
        console.error('Error fetching restaurant details:', error);
        setLoading(false);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurantDetails();
  }, []);

  const fetchAcceptReject = async () => {
    try {
      const token = await getAccessToken();
      const response = await axios.get('https://trioserver.onrender.com/api/v1/restaurants/fetchAccept-Reject', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setOrderData(response.data.data);
      setOrderInfo(response.data.data.length > 0);
    } catch (error) {
      console.log('Error fetching Accept/Reject:', error);
      alert('Error fetching Accept/Reject');
    }
  };

  useEffect(() => {
    fetchAcceptReject(); // Fetch orders initially
    const interval = setInterval(fetchAcceptReject, 10000); // Fetch orders every 10 seconds

    return () => clearInterval(interval); // Clear interval on component unmount
  }, [refresh]);

  useEffect(() => {
    const requestPermissions = async () => {
      await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    };

    const fetchToken = async () => {
      try {
        const token = await messaging().getToken();
        await saveTokenToDatabase(token);
      } catch (error) {
        console.error('Error fetching token:', error);
      }
    };

    requestPermissions();
    fetchToken();

    const unsubscribe = messaging().onTokenRefresh(async (token) => {
      await saveTokenToDatabase(token);
    });

    return () => unsubscribe();
  }, []);

  async function saveTokenToDatabase(token) {
    const jwtToken = await getAccessToken();
    try {
      const response = await fetch('https://trioserver.onrender.com/api/v1/restaurants/set-device-token', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });
      const data = await response.json();
      if (data.data.deviceToken) {
        await AsyncStorage.setItem('deviceToken', data.data.deviceToken);
      } else {
        alert(data.data);
      }
    } catch (error) {
      console.log('Error in Storing Device Token:', error);
      alert('Error in Storing Device Token');
    }
  }

  const OrderAccepted = (restro) => {
    const city = restaurant.city;
    const restroName = restaurant.restaurantName;
    const restroAddress = restaurant.address;
    socket.emit('RestaurantAcceptedOrder', {
      restroId: restro._id,
      userAddress: restro.userAddress,
      userId: restro.userId,
      foodItems: restro.foodItems,
      totalItems: restro.totalItems,
      bill: restro.bill,
      restroBill: restro.restroBill,
      riderEarning: restro.riderEarning,
      city,
      restroName,
      restroAddress,
    });
    setRefresh(true);
  };

  const OrderRejected = (restro) => {
    socket.emit('RestaurantRejectedOrder', { restroId: restro._id, userId: restro.userId });
    setRefresh(true);
  };

  const AcceptReject = ({ item }) => (
    <View style={styles.orderContainer}>
      <View style={styles.foodItemsContainer}>
        {item.foodItems.map((food, index) => (
          <Text key={index} style={styles.foodItem}>
            {food.name} : {food.quantity}
          </Text>
        ))}
      </View>
      <Text style={styles.totalItems}>Total Items: {item.totalItems}</Text>
      <Text style={styles.totalItems}>Earnings: Rs {item.restroBill}</Text>
      <View style={styles.buttonContainer}>
        <Button title="Accept" onPress={() => OrderAccepted(item)} color="#00FF00" />
        <Button title="Reject" onPress={() => OrderRejected(item)} color="#FF0000" />
      </View>
    </View>
  );

  if (loading) {
    return <Loading />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => props.navigation.push('RestroProfile')}>
        <Image
  style={styles.profileIcon}
  source={{
    uri: restaurant.restaurantPhoto
      ? restaurant.restaurantPhoto.replace("http://", "https://")
      : null
  }}
/>
        </TouchableOpacity>
        <Text style={styles.restaurantName}>{restaurant.restaurantName}</Text>
      </View>
      {orderInfo ? (
        <FlatList
          data={orderData}
          renderItem={AcceptReject}
          keyExtractor={(item, index) => index.toString()}
          style={styles.list}
        />
      ) : (
        <View style={styles.noOrdersContainer}>
          <Text style={styles.noOrdersText}>No orders yet.</Text>
        </View>
      )}
      <TouchableOpacity
        style={styles.historyButton}
        onPress={() => props.navigation.push('CancelledOrders')}
      >
        <Text style={styles.historyButtonText}>See All Cancelled Orders</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.historyButton}
        onPress={() => props.navigation.push('OrderHistory')}
      >
        <Text style={styles.historyButtonText}>See Order History</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1b003b',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#2d004f',
    borderBottomWidth: 2,
    borderBottomColor: '#7f00ff',
  },
  profileIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#ff009e',
  },
  restaurantName: {
    flex: 1,
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  orderContainer: {
    padding: 20,
    backgroundColor: '#2d004f',
    marginVertical: 10,
    borderRadius: 10,
  },
  foodItemsContainer: {
    marginBottom: 10,
  },
  foodItem: {
    color: '#ffffff',
    fontSize: 16,
  },
  totalItems: {
    color: '#ffffff',
    fontSize: 18,
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  list: {
    marginTop: 10,
  },
  noOrdersContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noOrdersText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  historyButton: {
    padding: 15,
    backgroundColor: '#7f00ff',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 20,
    borderRadius: 10,
  },
  historyButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default RestroDashboard;
