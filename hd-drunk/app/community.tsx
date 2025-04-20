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
const SAMPLE_REPORTS = [
  {
    report_id: 1,
    descriptor: 'Car weaving through traffic on Highway 101',
    latitude: 37.78825,
    longitude: -122.4324,
    confirm_bool: "null",
    probability: 65
  },
  {
    report_id: 2,
    descriptor: 'Suspected impaired driver at stoplight',
    latitude: 37.79125,
    longitude: -122.4354,
    confirm_bool: "null",
    probability: 55
  },
  {
    report_id: 3,
    descriptor: 'Vehicle swerving on Main Street',
    latitude: 37.78525,
    longitude: -122.4294,
    confirm_bool: "null",
    probability: 70
  },
  {
    report_id: 4,
    descriptor: 'Erratic driving near the park',
    latitude: 37.78675,
    longitude: -122.4319,
    confirm_bool: "null",
    probability: 60
  },
  {
    report_id: 5,
    descriptor: 'Driver ran a red light',
    latitude: 37.78925,
    longitude: -122.4344,
    confirm_bool: "null",
    probability: 40
  }
];

// Define a type for the report
type Report = {
  report_id: number;
  descriptor: string;
  latitude: number;
  longitude: number;
  confirm_bool: string;
  probability?: number;
  // Keep these for backward compatibility with sample data
  id?: number;
  type?: string;
  description?: string;
  timestamp?: string;
  confirmed?: boolean;
};

export default function CitizenWatchScreen() {
  const [region, setRegion] = useState<Region>(DEFAULT_LOCATION);
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [reportType, setReportType] = useState('Impaired Driving');
  const [reportDescription, setReportDescription] = useState('');
  const [userLocation, setUserLocation] = useState({
    latitude: DEFAULT_LOCATION.latitude,
    longitude: DEFAULT_LOCATION.longitude,
  });
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const mapRef = useRef<MapView | null>(null);
  
  const backgroundColor = useThemeColor({ light: '#fff', dark: '#121212' }, 'background');
  const textColor = useThemeColor({ light: '#000', dark: '#fff' }, 'text');
  const primaryColor = useThemeColor({ light: '#A1CEDC', dark: '#1D3D47' }, 'tint');
  const accentColor = useThemeColor({ light: '#FF6347', dark: '#FF6347' }, 'tint');

  // Function to make all markers visible on the map
  const fitMapToMarkers = () => {
    if (mapRef.current && reports.length > 0) {
      const coordinates = reports.map(report => ({
        latitude: report.latitude,
        longitude: report.longitude,
      }));
      
      // Add user location to the coordinates
      coordinates.push({
        latitude: region.latitude,
        longitude: region.longitude,
      });
      
      // Calculate padding to ensure all markers are visible
      const edgePadding = { top: 100, right: 50, bottom: 100, left: 50 };
      
      try {
        mapRef.current.fitToCoordinates(coordinates, {
          edgePadding,
          animated: true,
        });
        console.log('Map fitted to show all markers');
      } catch (error) {
        console.error('Error fitting map to coordinates:', error);
      }
    }
  };

  // Function to fetch community reports from the API
  const fetchReports = async () => {
    setIsLoadingReports(true);
    try {
      // Replace with your actual API endpoint
      const response = await fetch('http://127.0.0.1:5000/api/reports/');
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status === 'success' && Array.isArray(data.reports)) {
        console.log(`Fetched ${data.reports.length} reports from API`);
        setReports(data.reports);
      } else {
        console.log('Using sample reports as fallback');
        // Fallback to sample data if the API response format is unexpected
        setReports(SAMPLE_REPORTS);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      Alert.alert(
        "Data Loading Error",
        "Could not load reports from server. Using sample data instead."
      );
      // Use sample data as fallback
      setReports(SAMPLE_REPORTS);
    } finally {
      setIsLoadingReports(false);
    }
  };

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
    
    // Fetch reports from API
    fetchReports();

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

  const handleReportSubmit = async () => {
    if (reportType && reportDescription) {
      // Generate a random probability between 30 and 70
      const probability = 30 + Math.floor(Math.random() * 41);
      
      const newReport = {
        report_id: Date.now(),
        descriptor: reportDescription,
        latitude: region.latitude,
        longitude: region.longitude,
        confirm_bool: "null",
        probability: probability,
      };

      try {
        // Send the report to the API
        await fetch('http://127.0.0.1:5000/api/reports/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newReport),
        });

        // Add the new report to the local state
        setReports([newReport, ...reports]);
        Alert.alert(
          "Report Submitted",
          "Thank you for reporting this incident. Law enforcement will review it."
        );
      } catch (error) {
        console.error('Error submitting report:', error);
        Alert.alert(
          "Submission Error",
          "There was a problem submitting your report. Please try again."
        );
      }
      
      // Close the modal and reset form fields
      setModalVisible(false);
      setReportType('Impaired Driving');
      setReportDescription('');
    } else {
      Alert.alert("Input Required", "Please provide a description of the incident.");
    }
  };

  const getMarkerColor = (type: string) => {
    // Since all reports are Impaired driving, return red for all markers
    return 'red';
  };

  // Add a refresh function to manually reload reports
  const refreshReports = () => {
    fetchReports();
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
        onMapReady={() => {
          console.log('Map is ready');
          // Ensure reports are visible by fitting the map to show all markers
          setTimeout(() => fitMapToMarkers(), 500);
        }}
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

        {/* Custom Location Marker */}
        <Marker
          coordinate={{
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
          }}
          title="Your location"
          description="You are here"
        >
          <View style={{
            backgroundColor: primaryColor,
            borderRadius: 50,
            padding: 8,
            borderWidth: 2,
            borderColor: 'white',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
          }}>
            <Ionicons name="person" size={18} color="white" />
          </View>
        </Marker>
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
          onPress={fitMapToMarkers}
        >
          <Ionicons name="eye" size={24} color={primaryColor} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[mapStyles.controlButton, { backgroundColor }]} 
          onPress={refreshReports}
          disabled={isLoadingReports}
        >
          {isLoadingReports ? (
            <ActivityIndicator size="small" color={primaryColor} />
          ) : (
            <Ionicons name="refresh" size={24} color={primaryColor} />
          )}
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
                disabled={!reportDescription}
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
