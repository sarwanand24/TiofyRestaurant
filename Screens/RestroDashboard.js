import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, SafeAreaView, StatusBar, TouchableOpacity, Button, FlatList,
   PermissionsAndroid, ActivityIndicator, ToastAndroid, ScrollView, Alert } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import socket from '../utils/Socket';
import { getAccessToken } from '../utils/auth';
import Loading from './Loading';
import { Switch } from 'react-native-paper';
import LottieView from 'lottie-react-native';

const RestroDashboard = (props) => {
  const [restaurant, setRestaurant] = useState({});
  const [orderInfo, setOrderInfo] = useState(false);
  const [orderData, setOrderData] = useState([]);
  const [refresh, setRefresh] = useState(false);
  const [loading, setLoading] = useState(false); 
  const [online, setOnline] = useState(null);
  const [toggle, setToggle] = useState(null);
  const [greeting, setGreeting] = useState('');
  const [earningOf, setEarningOf] = useState('Today');
  const [earningData, setEarningData] = useState(null);
  const [orderLoader, setOrderLoader] = useState(false);

  useEffect(() => {
    const updateGreeting = async() => {
      let restro = await AsyncStorage.getItem('Restrodata')
      console.log('Restro..', restro)
      const restrodata = JSON.parse(restro);
      setRestaurant(restrodata);
      const hour = new Date().getHours();
      if (hour < 12) {
        setGreeting('Good Morning');
      } else if (hour < 18) {
        setGreeting('Good Afternoon');
      } else if (hour < 21) {
        setGreeting('Good Evening');
      } else {
        setGreeting('Good Night');
      }
    };
  
    updateGreeting();
  
    // Optionally, update greeting every hour
    const intervalId = setInterval(updateGreeting, 3600000); // 1 hour
  
    return () => clearInterval(intervalId); // cleanup on unmount
  }, []);

  useEffect(() => {
    const fetchEarnings = async () => {
    if(restaurant._id){
      try {
        const response = await axios.get(
          "https://trioserver.onrender.com/api/v1/restaurants/get-earnings",
          {
            params: { restroId: restaurant?._id },
          }
        );
        setEarningData(response.data);
        console.log('earnings data.........', response.data)
      } catch (error) {
        console.error("Error fetching earnings:", error);
      } finally {
        setLoading(false);
      }
    }
    };
  
    fetchEarnings();
  }, [restaurant?._id]);

  useEffect(() => {
    const fetchRestaurantData = async () => {
        try {
            // Retrieve the token from AsyncStorage
            const token = await getAccessToken();
            
            if (token) {
                // Make the API call with the token
                const response = await axios.get('https://trioserver.onrender.com/api/v1/restaurants/current-restaurant', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                // Update the state with the fetched data
                
                setRestaurant(response.data.data);
                setOnline(response.data.data?.availableStatus);
            } else {
                console.log("No token found.");
            }
        } catch (error) {
            console.log("Error fetching restaurant data:", error);
        }
    };

    fetchRestaurantData();
}, []);

  useEffect(()=>{
    const toggleStatus = async() => {
     try {
      setLoading(true);
     if(online !== null){
       const token = await getAccessToken();
       const response = await axios.post(
         'https://trioserver.onrender.com/api/v1/restaurants/toggle-availability',
         { availableStatus: online },
         {
           headers: {
             Authorization: `Bearer ${token}`,
           },
         }
       );
       if (response.status === 200) {
         ToastAndroid.showWithGravity(
           `You are now ${online ? 'Online, and will receive orders soon.' : 'Offline, and will not receive any orders.'}`,
           ToastAndroid.SHORT,
           ToastAndroid.CENTER
         );
       }
     }
     } catch (error) {
       console.error('Error toggling availableStatus:', error);
       setOnline(!online)
       ToastAndroid.showWithGravity(
         "Failed to update Online Status.",
         ToastAndroid.SHORT,
         ToastAndroid.CENTER
       );
     }finally{setLoading(false);}
    }
    toggleStatus();
   }, [toggle])
 
   const onToggleSwitch = () => {
     setOnline(!online);
     setToggle(!toggle);
 };

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
      Alert.alert('Error fetching Accept/Reject');
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
        console.log('no device token found!')
      }
    } catch (error) {
      console.log('Error in Storing Device Token:', error);
      alert('Error in Storing Device Token');
    }
  }

  const OrderAccepted = (restro) => {
    setOrderLoader(true);
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
    setOrderLoader(false);
  };

  const OrderRejected = (restro) => {
    socket.emit('RestaurantRejectedOrder', { restroId: restro._id, userId: restro.userId });
    setRefresh(true);
  };

  const AcceptReject = ({ item }) => (
    orderLoader ? (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="white" />
      </View>
    ) : (
      <View style={styles.orderContainer}>
        <Text style={styles.totalItems}>OrderId: {item._id}</Text>
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
    )
  );
  

  if (loading) {
    return <Loading />;
  }

  return (
    <View style={styles.container}>
       <StatusBar color={'transparent'} backgroundColor={'#68095f'} />
     {restaurant?.verified ? (
  <ScrollView>
  <View style={styles.header}>
  <View style={styles.toggle}>
                 <Switch value={online} onValueChange={onToggleSwitch} color='#ffff00' />
                 <Text style={{color:'#ffff00'}}>{online ? 'Online' : 'Offline'}</Text>
            </View>
    <Text style={styles.restaurantName}>{restaurant.restaurantName}</Text>
  </View>
     {/*** Greeting *****/}
     <View>
  <Text style={styles.greetingText}>{greeting} {restaurant?.ownerName}!</Text>
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

<View style={styles.progressContainer}>
      <Text style={{color:'white', fontSize:16, fontWeight:'bold'}}>My Progress</Text>
      <View style={styles.progressBtn}>
        <TouchableOpacity 
        onPress={()=>{setEarningOf('Today')}}
        style={[styles.progressBtn2, earningOf == 'Today' ? {backgroundColor:'#68095f'} : null]}>
          <Text style={earningOf == 'Today' ? {color:'white'} : {color:'white'}}>Today</Text>
        </TouchableOpacity>

        <TouchableOpacity
         onPress={()=>{setEarningOf('This Week')}}
         style={[styles.progressBtn2, earningOf == 'This Week' ? {backgroundColor:'#68095f'} : null]}>
          <Text style={earningOf == 'This Week' ? {color:'white'} : {color:'white'}}>This Week</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.horizontalLine} >
      <View style={{width: '80%'}} />
    </View>

      <View style={styles.earningContainer}>
        <View>
           <Text style={{color:'white'}}>
            Rs {earningOf == 'Today'? earningData?.todayEarnings : earningData?.totalEarnings}
            </Text>
           <Text style={{color:'#ffff00'}}>Earnings</Text>
        </View>
        <View>
           <Text style={{color:'white'}}>
            {earningOf == 'Today'? earningData?.todayOrders : earningData?.totalOrders}
            </Text>
           <Text style={{color:'#ffff00'}}>Orders</Text>
        </View>
      </View>
    </View>

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
</ScrollView>
     ) : (
      <View style={styles.verificationContainer}>
      <LottieView source={require('../assets/Animations/verifying.json')}
      style={styles.lottie} autoPlay loop />
 
   <Text style={{padding:10 ,color:'white', textAlign:'center', fontStyle: 'italic', fontSize:20, fontWeight:'800'}}>
     Your RestaurantId verification is under process. It may take few hours to verify.
     </Text>
 </View>
     )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#68095f',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#9f0d91',
    borderBottomWidth: 2,
    borderBottomColor: '#ffff00',
  },
  profileIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'white',
  },
  restaurantName: {
    flex: 1,
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  orderContainer: {
    padding: 20,
    backgroundColor: '#9f0d91',
    marginVertical: 10,
    borderRadius: 10,
  },
  foodItemsContainer: {
    marginBottom: 10,
  },
  foodItem: {
    color: 'white',
    fontSize: 16,
  },
  totalItems: {
    color: 'white',
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
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  historyButton: {
    padding: 15,
    backgroundColor: '#9f0d91',
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
  greetingText: {
    textAlign: 'center',
    color: '#68095f',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10
  },
  progressContainer: {
    padding: 15,
    backgroundColor: '#9f0d91',
    borderRadius: 20,
    width: '90%',
    marginHorizontal: '5%'
  },
  progressBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: 10
  },
  progressBtn2: {
   padding: 8,
   borderWidth: 2,
   borderColor: '#ffff00',
   borderRadius: 15
  },
  earningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    padding: 10
  },
  horizontalLine: {
    height: 1,
    marginHorizontal: 30,
    backgroundColor: 'white',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#9f0d91',
},
verificationContainer: {
  flex: 1,
 justifyContent:'center',
 alignItems: 'center'
},
lottie: {
  width: '60%',
  height: '60%',
}
});

export default RestroDashboard;
