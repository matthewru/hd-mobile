import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, TouchableOpacity, ActivityIndicator, Modal, Alert } from 'react-native';
import MapView, { Marker, Callout, Region, Circle } from 'react-native-maps';import * as Location from 'expo-location';
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
  {
    id: 4,
    type: 'Impaired Driving',
    description: 'Erratic driving near the park',
    latitude: 37.78675,
    longitude: -122.4319,
    timestamp: '30m ago',
  },
  {
    id: 5,
    type: 'Impaired Driving',
    description: 'Driver ran a red light',
    latitude: 37.78925,
    longitude: -122.4344,
    timestamp: '15m ago',
  },
  {
    id: 6,
    type: 'Impaired Driving',
    description: 'Car speeding in residential area',
    latitude: 37.78725,
    longitude: -122.4334,
    timestamp: '10m ago',
  },
  {
    id: 7,
    type: 'Impaired Driving',
    description: 'Driver almost hit a pedestrian',
    latitude: 37.78425,
    longitude: -122.4304,
    timestamp: '5m ago',
  },
  {
    id: 8,
    type: 'Impaired Driving',
    description: 'Car stopped in the middle of the road',
    latitude: 37.79025,
    longitude: -122.4364,
    timestamp: '1h ago',
  },
  {
    id: 9,
    type: 'Impaired Driving',
    description: 'Driver swerving between lanes',
    latitude: 37.78875,
    longitude: -122.4329,
    timestamp: '3h ago',
  },
  {
    id: 10,
    type: 'Impaired Driving',
    description: 'Car driving on the wrong side of the road',
    latitude: 37.78975,
    longitude: -122.4339,
    timestamp: '2h ago',
  },
  {
    id: 11,
    type: 'Impaired Driving',
    description: 'Driver honking excessively',
    latitude: 37.78775,
    longitude: -122.4314,
    timestamp: '45m ago',
  },
  {
    id: 12,
    type: 'Impaired Driving',
    description: 'Car parked in the middle of the intersection',
    latitude: 37.78625,
    longitude: -122.4299,
    timestamp: '20m ago',
  },
  {
    id: 13,
    type: 'Impaired Driving',
    description: 'Erratic driving near the park',
    latitude: 38.5001,
    longitude: -121.7501,
    timestamp: '10m ago',
  },
  {
    id: 14,
    type: 'Impaired Driving',
    description: 'Driver ran a red light',
    latitude: 38.5015,
    longitude: -121.7512,
    timestamp: '15m ago',
  },
  {
    id: 15,
    type: 'Impaired Driving',
    description: 'Car speeding in residential area',
    latitude: 38.5023,
    longitude: -121.7523,
    timestamp: '20m ago',
  },
  {
    id: 16,
    type: 'Impaired Driving',
    description: 'Driver almost hit a pedestrian',
    latitude: 38.5031,
    longitude: -121.7534,
    timestamp: '25m ago',
  },
  {
    id: 17,
    type: 'Impaired Driving',
    description: 'Car stopped in the middle of the road',
    latitude: 38.5042,
    longitude: -121.7545,
    timestamp: '30m ago',
  },
  {
    id: 18,
    type: 'Impaired Driving',
    description: 'Driver swerving between lanes',
    latitude: 38.5053,
    longitude: -121.7556,
    timestamp: '35m ago',
  },
  {
    id: 19,
    type: 'Impaired Driving',
    description: 'Car driving on the wrong side of the road',
    latitude: 38.5064,
    longitude: -121.7567,
    timestamp: '40m ago',
  },
  {
    id: 20,
    type: 'Impaired Driving',
    description: 'Driver honking excessively',
    latitude: 38.5075,
    longitude: -121.7578,
    timestamp: '45m ago',
  },
];

export default function CitizenWatchScreen() {
  const [region, setRegion] = useState<Region>(DEFAULT_LOCATION);
  const [reports, setReports] = useState(SAMPLE_REPORTS);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [reportType, setReportType] = useState('Impaired Driving');
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
      
      {/* Map View */}
      <MapView
  ref={mapRef}
  style={mapStyles.map}
  region={region}
  showsUserLocation={false} // Disable default user location blue dot
  onRegionChangeComplete={setRegion}
>
  {/* Custom Heatmap using Circles */}
  {reports.map((report, index) => (
    <Circle
      key={`heatmap-${index}`}
      center={{
        latitude: report.latitude,
        longitude: report.longitude,
      }}
      radius={500} // Adjust radius to represent density
      fillColor="rgba(255, 0, 0, 0.3)" // Semi-transparent red
      strokeColor="rgba(255, 0, 0, 0.1)" // Optional: lighter stroke
    />
  ))}

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

  {/* Report Markers
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
        </View>
      </Callout>
    </Marker>
  ))} */}
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
            <ThemedText style={mapStyles.modalTitle}>Report an Impaired Driving Incident</ThemedText>
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
      {/* <View style={[mapStyles.legendPanel, { backgroundColor }]}>
        <ThemedText style={mapStyles.legendTitle}>Nearby Incidents</ThemedText>
        <View style={mapStyles.legendItem}>
          <View style={[mapStyles.legendDot, { backgroundColor: 'red' }]} />
          <ThemedText>Impaired Driving</ThemedText>
        </View>
        <View style={mapStyles.legendItem}>
          <View style={[mapStyles.legendDot, { backgroundColor: 'green' }]} />
          <ThemedText>Your Location</ThemedText>
        </View>
      </View> */}
    </View>
  );
}
