import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import axios from 'axios';

const CancelledOrders = () => {
  const [cancelledOrders, setCancelledOrders] = useState([]);

  useEffect(() => {
    const fetchCancelledOrders = async () => {
      try {
        const response = await axios.get(`https://trioserver.onrender.com/api/v1/foodyCancelledOrder/get-all-restaurant-CancelledOrders`);
        setCancelledOrders(response.data);
      } catch (error) {
        console.error('Error fetching cancelled orders:', error);
      }
    };

    fetchCancelledOrders();
  }, []);

  const renderOrder = ({ item }) => (
    <View style={styles.orderContainer}>
      <Text style={styles.orderText}>Ordered From: {item.orderedFromLocation}</Text>
      {item.items.map((food, index) => (
        <Text key={index} style={styles.foodItem}>
          {food.name} : {food.quantity}
        </Text>
      ))}
      <Text style={styles.orderText}>Restaurant Earning: Rs {item.restroEarning}</Text>
      <Text style={styles.orderText}>Reason: {item.reason}</Text>
      <Text style={styles.orderText}>Order Status: {item.orderStatus}</Text>
      <Text style={styles.orderText}>Date: {new Date(item.createdAt).toLocaleDateString()}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cancelled Orders</Text>
      <FlatList
        data={cancelledOrders}
        renderItem={renderOrder}
        keyExtractor={(item) => item._id}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F5F5F5', // Light grey background
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#003366', // Dark blue for the title
  },
  orderContainer: {
    padding: 16,
    marginBottom: 8,
    backgroundColor: '#FFFFFF', // White background for each order
    borderRadius: 8,
    shadowColor: '#000000', // Subtle shadow effect
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  orderText: {
    fontSize: 16,
    color: '#333333', // Dark grey text
    marginBottom: 8,
  },
  foodItem: {
    fontSize: 16,
    color: '#0066CC', // Light blue for food items
    marginBottom: 4,
  },
});

export default CancelledOrders;
