import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthContext } from '../contexts/AuthContext';
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import SessionsListScreen from '../screens/sessions/SessionsListScreen';
import SessionDetailScreen from '../screens/sessions/SessionDetailScreen';
import CreateSessionScreen from '../screens/sessions/CreateSessionScreen';

const Stack = createNativeStackNavigator();

export const AppNavigator = () => {
  const { token, loading } = useContext(AuthContext);

  if (loading) {
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {token == null ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="SessionsList" component={SessionsListScreen} />
            <Stack.Screen name="SessionDetail" component={SessionDetailScreen} />
            <Stack.Screen name="CreateSession" component={CreateSessionScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
