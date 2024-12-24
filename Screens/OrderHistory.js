import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ScrollView, TouchableOpacity, Modal, StatusBar } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Loading from './Loading';
import DatePicker from 'react-native-date-picker';

const OrderHistory = () => {
    const [OrderHistory, setOrderHistory] = useState([]);
    const [filteredHistory, setFilteredHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState(new Date('2024-01-01')); // Start date set to January 1, 2024
    const [endDate, setEndDate] = useState(new Date()); // End date set to the current date
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);

    useEffect(() => {
        const fetchOrderHistory = async () => {
            try {
                // Get token from AsyncStorage
                const token = await AsyncStorage.getItem('token');

                // Check if the token is available
                if (!token) {
                    throw new Error('No token found');
                }

                // Make the API request with the token included in the Authorization header
                const response = await axios.get('https://trioserver.onrender.com/api/v1/restaurants/getOrderHistory', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    }
                });

                // Update the state with the fetched data
                console.log('response', response.data);

                setOrderHistory(response.data.data);
                setFilteredHistory(response.data.data);
            } catch (error) {
                console.error('Error fetching Order history:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrderHistory();
    }, []);

    useEffect(() => {
        // Filter history based on selected dates
        const filterByDate = () => {
            const filtered = OrderHistory.filter(item => {
                const orderDate = new Date(item.createdAt);
                return orderDate >= startDate && orderDate <= endDate;
            });
            setFilteredHistory(filtered);
        };

        filterByDate();
    }, [startDate, endDate, OrderHistory]);

    const handleDateChange = (date, setDate) => {
        setDate(date);
        setShowStartDatePicker(false);
        setShowEndDatePicker(false);
    };

    if (loading) {
        return (
            <Loading />
        );
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
               <StatusBar color={'transparent'} backgroundColor={'#68095f'} />
            <Text style={styles.title}>Your Order History</Text>

            <View style={styles.filterContainer}>
                <TouchableOpacity onPress={() => setShowStartDatePicker(true)} style={styles.dateButton}>
                    <Text style={styles.dateText}>Start Date: {startDate.toLocaleDateString()}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowEndDatePicker(true)} style={styles.dateButton}>
                    <Text style={styles.dateText}>End Date: {endDate.toLocaleDateString()}</Text>
                </TouchableOpacity>
            </View>

            {filteredHistory.length === 0 ? (
                <Text style={styles.noHistory}>No Order history available for the selected dates</Text>
            ) : (
                <FlatList
                    data={filteredHistory}
                    keyExtractor={(item) => item._id.toString()}
                    renderItem={({ item }) => (
                        <View style={styles.listItem}>
                            <Text style={styles.orderNumber}>Order ID: {item._id}</Text>
                            <Text style={styles.userName}>Ordered By: {item.user[0]?.fullName || 'Unknown User'}</Text>
                            {item.items.map((food, index) => (
                                <View key={index}>
                                    <Text style={styles.orderText}>{food.name} : {food.quantity}</Text>
                                </View>
                            ))}
                            <Text style={styles.status}>Status: {item.orderStatus}</Text>
                            <Text style={styles.earning}>Your Earning: Rs {item.restroEarning}</Text>
                            <Text style={styles.date}>Date: {new Date(item.createdAt).toLocaleDateString()}</Text>
                        </View>
                    )}
                />
            )}
            
            {/* Date Pickers */}
            <Modal visible={showStartDatePicker} transparent={true} animationType="slide">
                <View style={styles.modalContainer}>
                    <DatePicker
                        date={startDate}
                        onDateChange={(date) => handleDateChange(date, setStartDate)}
                    />
                    <TouchableOpacity onPress={() => setShowStartDatePicker(false)} style={styles.closeButton}>
                        <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </Modal>

            <Modal visible={showEndDatePicker} transparent={true} animationType="slide">
                <View style={styles.modalContainer}>
                    <DatePicker
                        date={endDate}
                        onDateChange={(date) => handleDateChange(date, setEndDate)}
                    />
                    <TouchableOpacity onPress={() => setShowEndDatePicker(false)} style={styles.closeButton}>
                        <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: '#68095f', // Dark background for night aesthetics
        padding: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ffff00', // Neon pink
        marginBottom: 20,
        textAlign: 'center',
    },
    noHistory: {
        fontSize: 18,
        color: '#ffff00', // Neon orange
        textAlign: 'center',
    },
    filterContainer: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        marginBottom: 20,
    },
    dateButton: {
        backgroundColor: '#9f0d91', // Neon yellow
        padding: 3,
        borderRadius: 5,
    },
    dateText: {
        fontSize: 16,
        color: 'white', // Black text for contrast
    },
    listItem: {
        backgroundColor: '#9f0d91', // Deep violet
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
    },
    restaurantName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white', // Neon green
    },
    orderNumber: {
        fontSize: 16,
        color: 'white', // Neon cyan
    },
    userName: {
        fontSize: 16,
        color: 'white', // Neon red
    },
    status: {
        fontSize: 16,
        color: 'white', // Neon orange
    },
    earning: {
        fontSize: 16,
        color: 'white', // Neon yellow
    },
    date: {
        fontSize: 16,
        color: '#ffff00', // Neon purple
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)', // Semi-transparent background
    },
    closeButton: {
        marginTop: 20,
        padding: 10,
        backgroundColor: '#ffff00', // Neon red
        borderRadius: 5,
    },
    closeButtonText: {
        fontSize: 16,
        color: '#FFFFFF', // White text
    },
});

export default OrderHistory;
