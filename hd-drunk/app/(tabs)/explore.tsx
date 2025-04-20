import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, TouchableOpacity, ActivityIndicator, Modal, Alert } from 'react-native';
import MapView, { Marker, Callout, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { mapStyles } from '@/styles/mapStyles';

// Default San Francisco location for fallback
const DEFAULT_LOCATION = {
  latitude: 37.78825,
  longitude: -122.4324,
  latitudeDelta: 0.0222,
  longitudeDelta: 0.0121,
};

// Sample mock data for citizen reports
const SAMPLE_REPORTS = [
  {
    id: 1,
    type: 'Impaired Driving',
    description: 'Car weaving through traffic on Highway 101',
    latitude: 37.78825,
    longitude: -122.4324,
    timestamp: '2h ago',
  },
  {
    id: 2,
    type: 'Impaired Driving',
    description: 'Suspected impaired driver at stoplight',
    latitude: 37.79125,
    longitude: -122.4354,
    timestamp: '4h ago',
  },
  {
    id: 3,
    type: 'Impaired Driving',
    description: 'Vehicle swerving on Main Street',
    latitude: 37.78525,
    longitude: -122.4294,
    timestamp: '1d ago',
  },
];

export default function CitizenWatchScreen() {
  const [region, setRegion] = useState<Region>(DEFAULT_LOCATION);
  const [reports, setReports] = useState(SAMPLE_REPORTS);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [reportType, setReportType] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [userLocation, setUserLocation] = useState({
    latitude: DEFAULT_LOCATION.latitude,
    longitude: DEFAULT_LOCATION.longitude,
  });
  const mapRef = useRef<MapView | null>(null);
  
  const backgroundColor = useThemeColor({ light: '#fff', dark: '#121212' }, 'background');
  const textColor = useThemeColor({ light: '#000', dark: '#fff' }, 'text');
  const primaryColor = useThemeColor({ light: '#A1CEDC', dark: '#1D3D47' }, 'tint');
  const accentColor = useThemeColor({ light: '#FF6347', dark: '#FF6347' }, 'tint');

  useEffect(() => {
    let locationTimeout: NodeJS.Timeout;
    
    const getLocation = async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Permission to access location was denied');
          setIsLoading(false);
          return;
        }

        // Set a timeout in case location retrieval takes too long (common in emulators)
        locationTimeout = setTimeout(() => {
          console.log('Location retrieval timed out, using default location');
          setRegion(DEFAULT_LOCATION);
          setUserLocation({
            latitude: DEFAULT_LOCATION.latitude,
            longitude: DEFAULT_LOCATION.longitude,
          });
          setIsLoading(false);
          // No need to show alert again if shown in the other tab
        }, 5000);

        try {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          
          clearTimeout(locationTimeout);
          
          const newRegion = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.0222,
            longitudeDelta: 0.0121,
          };
          
          setRegion(newRegion);
          setUserLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        } catch (error) {
          console.log('Error getting location:', error);
          setErrorMsg('Could not get your location. Using default location.');
          // Keep the default location that was set in state
        } finally {
          clearTimeout(locationTimeout);
          setIsLoading(false);
        }
      } catch (error) {
        console.log('Error in location permission flow:', error);
        setIsLoading(false);
      }
    };

    getLocation();

    // Set up a location subscription to keep tracking user's position
    let locationSubscription: Location.LocationSubscription;
    
    const startLocationUpdates = async () => {
      try {
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            distanceInterval: 10, // Update every 10 meters
          },
          (location) => {
            setUserLocation({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            });
          }
        );
      } catch (error) {
        console.log('Error setting up location tracking:', error);
      }
    };
    
    startLocationUpdates();

    return () => {
      clearTimeout(locationTimeout);
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);
  
  const goToMyLocation = async () => {
    try {
      setIsLoading(true);
      
      const locationPromise = Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      // Set a timeout for location retrieval
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Location retrieval timed out')), 5000);
      });
      
      // Race between location retrieval and timeout
      const location = await Promise.race([
        locationPromise,
        timeoutPromise,
      ]) as Location.LocationObject;
      
      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      
      mapRef.current?.animateToRegion(newRegion, 1000);
      setIsLoading(false);
    } catch (error) {
      console.log('Error getting current location:', error);
      setErrorMsg('Could not update location. Using the current map view.');
      setIsLoading(false);
    }
  };

  const setMockLocation = () => {
    // Sample mock locations
    const mockLocations = [
      { name: "San Francisco", latitude: 37.7749, longitude: -122.4194 },
      { name: "New York", latitude: 40.7128, longitude: -74.0060 },
      { name: "London", latitude: 51.5074, longitude: -0.1278 },
      { name: "Tokyo", latitude: 35.6762, longitude: 139.6503 },
    ];
    
    // Randomly select a location
    const randomLocation = mockLocations[Math.floor(Math.random() * mockLocations.length)];
    
    const newRegion = {
      latitude: randomLocation.latitude,
      longitude: randomLocation.longitude,
      latitudeDelta: 0.0222,
      longitudeDelta: 0.0121,
    };
    
    // Update the reports to be around the new location
    const updatedReports = SAMPLE_REPORTS.map(report => ({
      ...report,
      latitude: randomLocation.latitude + (Math.random() - 0.5) * 0.02,
      longitude: randomLocation.longitude + (Math.random() - 0.5) * 0.02,
    }));
    
    setReports(updatedReports);
    setRegion(newRegion);
    mapRef.current?.animateToRegion(newRegion, 1000);
    
    Alert.alert(
      "Mock Location Set",
      `Community reports now showing for ${randomLocation.name}`
    );
  };

  const handleReportSubmit = () => {
    if (reportType && reportDescription) {
      const newReport = {
        id: Date.now(),
        type: reportType,
        description: reportDescription,
        latitude: region.latitude,
        longitude: region.longitude,
        timestamp: 'Just now',
      };
      
      setReports([newReport, ...reports]);
      setModalVisible(false);
      setReportType('');
      setReportDescription('');
    }
  };

  const getMarkerColor = (type: string) => {
    // Since all reports are Impaired driving, return red for all markers
    return 'red';
  };

  if (isLoading) {
    return (
      <View style={[mapStyles.container, { backgroundColor }]}>
        <ActivityIndicator size="large" color={primaryColor} />
      </View>
    );
  }

  return (
    <View style={mapStyles.container}>
      {/* Title Banner */}
      <View style={[mapStyles.titleBanner, { backgroundColor: primaryColor }]}>
        <ThemedText style={mapStyles.titleText}>Citizen Watch</ThemedText>
      </View>
      
      {/* Map View */}
      <MapView
        ref={mapRef}
        style={mapStyles.map}
        region={region}
        showsUserLocation={false} // Disable default user location blue dot
        onRegionChangeComplete={setRegion}
      >
        {/* User Location Marker */}
        <Marker
          coordinate={{
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
          }}
          title="Your location"
          description="You are here"
          pinColor="blue"
        />
        {reports.map((report) => (
          <Marker
            key={report.id}
            coordinate={{
              latitude: report.latitude,
              longitude: report.longitude,
            }}
            pinColor={getMarkerColor(report.type)}
          >
            <Callout tooltip>
              <View style={[mapStyles.calloutView, { backgroundColor }]}>
                <ThemedText style={mapStyles.calloutTitle}>{report.type}</ThemedText>
                <ThemedText>{report.description}</ThemedText>
                <ThemedText style={mapStyles.timestampText}>{report.timestamp}</ThemedText>
                
                <TouchableOpacity
                  style={mapStyles.calloutButton}
                  onPress={() => {
                    Alert.alert(
                      "Incident Confirmed",
                      "Thank you for confirming this Impaired driving incident. This helps us validate our reports.",
                      [{ text: "OK" }]
                    );
                  }}
                >
                  <ThemedText style={mapStyles.calloutButtonText}>Confirm Incident</ThemedText>
                </TouchableOpacity>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
      
      {/* Controls */}
      <View style={mapStyles.controls}>
        <TouchableOpacity 
          style={[mapStyles.controlButton, { backgroundColor }]} 
          onPress={goToMyLocation}
        >
          <Ionicons name="locate" size={24} color={primaryColor} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[mapStyles.controlButton, { backgroundColor }]} 
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="alert-circle" size={24} color={accentColor} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[mapStyles.controlButton, { backgroundColor }]} 
          onPress={setMockLocation}
        >
          <Ionicons name="location" size={24} color={primaryColor} />
        </TouchableOpacity>
      </View>
      
      {/* Report Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={mapStyles.centeredView}>
          <View style={[mapStyles.modalView, { backgroundColor }]}>
            <ThemedText style={mapStyles.modalTitle}>Report an Incident</ThemedText>
            
            <ThemedText style={mapStyles.label}>Type of Incident:</ThemedText>
            <View style={mapStyles.reportTypeContainer}>
              <TouchableOpacity
                style={[
                  mapStyles.typeButton,
                  { 
                    backgroundColor: primaryColor,
                    borderColor: primaryColor 
                  }
                ]}
                onPress={() => setReportType('Impaired Driving')}
              >
                <ThemedText style={{ color: 'white' }}>
                  Impaired Driving
                </ThemedText>
              </TouchableOpacity>
            </View>
            
            <ThemedText style={mapStyles.label}>Description:</ThemedText>
            <TextInput
              style={[mapStyles.input, { borderColor: primaryColor, color: textColor }]}
              placeholder="Describe what you saw..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
              value={reportDescription}
              onChangeText={setReportDescription}
            />
            
            <View style={mapStyles.buttonContainer}>
              <TouchableOpacity
                style={[mapStyles.button, { backgroundColor: '#ccc' }]}
                onPress={() => setModalVisible(false)}
              >
                <ThemedText>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[mapStyles.button, { backgroundColor: primaryColor }]}
                onPress={handleReportSubmit}
                disabled={!reportType || !reportDescription}
              >
                <ThemedText style={{ color: 'white', fontWeight: 'bold' }}>Submit</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Error Message */}
      {errorMsg && (
        <View style={mapStyles.errorContainer}>
          <ThemedText style={mapStyles.errorText}>{errorMsg}</ThemedText>
        </View>
      )}
      
      {/* Legend Panel */}
      <View style={[mapStyles.legendPanel, { backgroundColor }]}>
        <ThemedText style={mapStyles.legendTitle}>Nearby Incidents</ThemedText>
        <View style={mapStyles.legendItem}>
          <View style={[mapStyles.legendDot, { backgroundColor: 'red' }]} />
          <ThemedText>Impaired Driving</ThemedText>
        </View>
        <View style={mapStyles.legendItem}>
          <View style={[mapStyles.legendDot, { backgroundColor: 'green' }]} />
          <ThemedText>Your Location</ThemedText>
        </View>
      </View>
    </View>
  );
}
