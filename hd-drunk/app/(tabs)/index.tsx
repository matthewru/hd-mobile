import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, TouchableOpacity, ActivityIndicator, Modal, Alert } from 'react-native';
import MapView, { Marker, Callout, Region, Polyline } from 'react-native-maps';
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

// Sample incident reports
const SAMPLE_REPORTS = [
  {
    id: 1,
    type: 'Drunk Driving',
    description: 'Vehicle swerving between lanes on highway',
    latitude: 37.78825,
    longitude: -122.4324,
    timestamp: '2h ago',
  },
  {
    id: 2,
    type: 'Drunk Driving',
    description: 'Driver exhibiting erratic behavior at intersection',
    latitude: 37.79125,
    longitude: -122.4354,
    timestamp: '4h ago',
  },
  {
    id: 3,
    type: 'Drunk Driving',
    description: 'Vehicle swerving on Main Street',
    latitude: 37.78525,
    longitude: -122.4294,
    timestamp: '1d ago',
  },
  {
    id: 4,
    type: 'Drunk Driving',
    description: 'Car running red lights on Market Street',
    latitude: 37.7855,
    longitude: -122.4175,
    timestamp: '3h ago',
  },
  {
    id: 5,
    type: 'Drunk Driving',
    description: 'Suspected impaired driver weaving through traffic',
    latitude: 37.7895,
    longitude: -122.4275,
    timestamp: '5h ago',
  },
];

export default function PoliceViewScreen() {
  const [region, setRegion] = useState<Region>(DEFAULT_LOCATION);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [reports, setReports] = useState(SAMPLE_REPORTS);
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
  const primaryColor = useThemeColor({ light: '#0047AB', dark: '#0047AB' }, 'tint'); // Police blue
  const accentColor = useThemeColor({ light: '#B22222', dark: '#B22222' }, 'tint'); // Emergency red

  // Ensure sample reports are loaded
  useEffect(() => {
    // Initialize with sample reports
    setReports(SAMPLE_REPORTS);
  }, []);
  
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
          
          // Ensure reports are spread around the default location
          const localizedReports = SAMPLE_REPORTS.map(report => ({
            ...report,
            latitude: DEFAULT_LOCATION.latitude + (Math.random() - 0.5) * 0.02,
            longitude: DEFAULT_LOCATION.longitude + (Math.random() - 0.5) * 0.02,
          }));
          setReports(localizedReports);
          
          setIsLoading(false);
          Alert.alert(
            "Using Default Location",
            "Could not retrieve your current location. Sample reports are shown around San Francisco."
          );
        }, 5000);

        try {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced, // Lower accuracy for faster response
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
          
          // Adjust sample reports to be around the user's actual location
          const localizedReports = SAMPLE_REPORTS.map(report => ({
            ...report,
            latitude: location.coords.latitude + (Math.random() - 0.5) * 0.02,
            longitude: location.coords.longitude + (Math.random() - 0.5) * 0.02,
          }));
          setReports(localizedReports);
          
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
      
      Alert.alert(
        "Location Not Available",
        "Could not retrieve your current location. If using an emulator, set a mock location in the Extended Controls > Location."
      );
    }
  };

  const setMockLocation = () => {
    // Sample mock locations
    const mockLocations = [
      { name: "San Francisco", latitude: 37.7749, longitude: -122.4194 },
    ];
    
    // Randomly select a location
    const randomLocation = mockLocations[Math.floor(Math.random() * mockLocations.length)];
    
    const newRegion = {
      latitude: randomLocation.latitude,
      longitude: randomLocation.longitude,
      latitudeDelta: 0.0222,
      longitudeDelta: 0.0121,
    };
    
    // Sample descriptions for drunk driving incidents
    const drunkDrivingDescriptions = [
      "Vehicle swerving between lanes",
      "Car driving erratically on main road",
      "Driver running red lights",
      "Vehicle speeding and weaving through traffic",
      "Car driving on wrong side of the road",
      "Vehicle stopped in middle of highway",
      "Driver showing signs of impairment at stoplight",
      "Car making dangerous turns and cutting off other drivers",
      "Vehicle driving with headlights off at night",
      "Driver exhibiting dangerous behavior at intersection"
    ];
    
    // Generate 6-10 random reports around the location
    const numReports = 6 + Math.floor(Math.random() * 5);
    const newReports = [];
    
    for (let i = 0; i < numReports; i++) {
      const description = drunkDrivingDescriptions[Math.floor(Math.random() * drunkDrivingDescriptions.length)];
      const hours = Math.floor(Math.random() * 12) + 1;
      
      newReports.push({
        id: Date.now() + i,
        type: 'Drunk Driving',
        description,
        latitude: randomLocation.latitude + (Math.random() - 0.5) * 0.03,
        longitude: randomLocation.longitude + (Math.random() - 0.5) * 0.03,
        timestamp: `${hours}h ago`,
      });
    }
    
    setReports(newReports);
    setRegion(newRegion);
    mapRef.current?.animateToRegion(newRegion, 1000);
    
    Alert.alert(
      "Mock Location Set",
      `Now viewing ${randomLocation.name} (${numReports} drunk driving reports generated)`
    );
  };
  
  const handleReportSubmit = () => {
    if (reportType && reportDescription) {
      const newReport = {
        id: Date.now(),
        type: reportType,
        description: reportDescription,
        latitude: region.latitude + (Math.random() - 0.5) * 0.01,
        longitude: region.longitude + (Math.random() - 0.5) * 0.01,
        timestamp: 'Just now',
      };
      
      setReports([newReport, ...reports]);
      setModalVisible(false);
      setReportType('');
      setReportDescription('');
    }
  };

  const handleConfirmIncident = (reportId: number) => {
    // Find the report
    const report = reports.find(r => r.id === reportId);
    if (report) {
      Alert.alert(
        "Incident Confirmed",
        `Thank you for confirming this drunk driving incident. This helps us validate our reports.`,
        [
          { 
            text: "OK", 
            onPress: () => {
              // Update the report status to confirmed
              const updatedReports = reports.map(r => 
                r.id === reportId 
                  ? {...r, confirmed: true} 
                  : r
              );
              setReports(updatedReports);
            } 
          }
        ]
      );
    }
  };

  const handleRespondToIncident = (reportId: number) => {
    // Find the report
    const report = reports.find(r => r.id === reportId);
    if (report) {
      Alert.alert(
        "Responding to Incident",
        `Officers dispatched to respond to ${report.type} incident: ${report.description}`,
        [
          { 
            text: "OK", 
            onPress: () => {
              // Update the report status if needed
              const updatedReports = reports.map(r => 
                r.id === reportId 
                  ? {...r, status: 'Officers Dispatched'} 
                  : r
              );
              setReports(updatedReports);
            } 
          }
        ]
      );
    }
  };

  const getMarkerColor = (type: string) => {
    // Since all reports are drunk driving, return red for all markers
    return 'red';
  };

  if (isLoading) {
    return (
      <View style={[mapStyles.container, { backgroundColor }]}>
        <ActivityIndicator size="large" color={primaryColor} />
        <ThemedText style={{ marginTop: 10 }}>Loading map and drunk driving reports...</ThemedText>
      </View>
    );
  }

  // Debug log for markers
  console.log(`Rendering ${reports.length} drunk driving markers`);
  
  return (
    <View style={mapStyles.container}>
      
      {/* Map View */}
      <MapView
        ref={mapRef}
        style={mapStyles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation={false} // Disable default user location blue dot
        onMapReady={() => {
          console.log('Map is ready');
          // Ensure reports are visible by fitting the map to show all markers
          setTimeout(() => fitMapToMarkers(), 500);
        }}
      >
        {/* Custom Location Marker */}
        <Marker
          coordinate={{
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
          }}
          title="Your location"
          description="You are here"
          pinColor="blue"
        />
        
        {/* Incident Report Markers */}
        {reports.map((report) => {
          console.log(`Rendering marker at ${report.latitude}, ${report.longitude}`);
          return (
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
                    onPress={() => handleConfirmIncident(report.id)}
                  >
                    <ThemedText style={mapStyles.calloutButtonText}>Confirm Incident</ThemedText>
                  </TouchableOpacity>
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>

      {/* Legend Panel */}
      <View style={[mapStyles.legendPanel, { backgroundColor }]}>
        <ThemedText style={mapStyles.legendTitle}>Impaired Driving Reports</ThemedText>
        <View style={mapStyles.legendItem}>
          <View style={[mapStyles.legendDot, { backgroundColor: 'red' }]} />
          <ThemedText>Impaired Driving</ThemedText>
        </View>
        <View style={mapStyles.legendItem}>
          <View style={[mapStyles.legendDot, { backgroundColor: 'blue' }]} />
          <ThemedText>Your Location</ThemedText>
        </View>
      </View>
      
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
          <Ionicons name="add-circle" size={24} color={accentColor} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[mapStyles.controlButton, { backgroundColor }]} 
          onPress={setMockLocation}
        >
          <Ionicons name="location" size={24} color={primaryColor} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[mapStyles.controlButton, { backgroundColor }]} 
          onPress={fitMapToMarkers}
        >
          <Ionicons name="eye" size={24} color={primaryColor} />
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
            <ThemedText style={mapStyles.modalTitle}>Log New Incident</ThemedText>
            
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
                onPress={() => setReportType('Drunk Driving')}
              >
                <ThemedText style={{ color: 'white' }}>
                  Drunk Driving
                </ThemedText>
              </TouchableOpacity>
            </View>
            
            <ThemedText style={mapStyles.label}>Description:</ThemedText>
            <TextInput
              style={[mapStyles.input, { borderColor: primaryColor, color: textColor }]}
              placeholder="Describe the incident..."
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
    </View>
  );
}
