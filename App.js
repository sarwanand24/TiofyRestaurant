import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import SplashScreen from './Screens/SplashScreen';
import Login from './Screens/Authentication/Login';
import Signup from './Screens/Authentication/Signup';
import AuthScreen from './Screens/Authentication/AuthScreen';
import RestroDashboard from './Screens/RestroDashboard';
import RestroProfile from './Screens/RestroProfile';
import OrderHistory from './Screens/OrderHistory';
import Loading from './Screens/Loading';

const Stack = createStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Auth" component={AuthScreen} /> 
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Signup" component={Signup} />
        <Stack.Screen name="RestroDashboard" component={RestroDashboard} />
        <Stack.Screen name="RestroProfile" component={RestroProfile} />
        <Stack.Screen name="OrderHistory" component={OrderHistory} />
        <Stack.Screen name="Loading" component={Loading} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
