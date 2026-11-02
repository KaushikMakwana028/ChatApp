import React, { useEffect } from 'react';
import LoadingScreen from '../components/LoadingScreen';
import { useAuth } from '../contexts/AuthContext';

export const SplashScreen = ({ navigation }) => {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        if (isAuthenticated) {
          navigation.replace('Home');
        } else {
          navigation.replace('Login');
        }
      }, 1200);

      return () => clearTimeout(timer);
    }
  }, [isLoading, isAuthenticated, navigation]);

  return <LoadingScreen message="Loading conversations..." />;
};

export default SplashScreen;
