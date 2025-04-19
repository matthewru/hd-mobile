import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, Dimensions, ActivityIndicator, Modal, Alert } from 'react-native';
import MapView, { Marker, Callout, Region, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';

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
  const mapRef = useRef<MapView | null>(null);
  
  const backgroundColor = useThemeColor({ light: '#fff', dark: '#121212' }, 'background');
  const textColor = useThemeColor({ light: '#000', dark: '#fff' }, 'text');
  const primaryColor = useThemeColor({ light: '#0047AB', dark: '#0047AB' }, 'tint'); // Police blue
  const accentColor = useThemeColor({ light: '#B22222', dark: '#B22222' }, 'tint'); // Emergency red

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
          setIsLoading(false);
          Alert.alert(
            "Using Default Location",
            "Could not retrieve your current location. In an emulator, set a mock location in the Extended Controls (three dots) > Location."
          );
        }, 5000);

        try {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced, // Lower accuracy for faster response
          });
          
          clearTimeout(locationTimeout);
          
          setRegion({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.0222,
            longitudeDelta: 0.0121,
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

    return () => {
      clearTimeout(locationTimeout);
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

  const getMarkerColor = (type: string) => {
    // Since all reports are drunk driving, return red for all markers
    return 'red';
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <ActivityIndicator size="large" color={primaryColor} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Title Banner */}
      <View style={[styles.titleBanner, { backgroundColor: primaryColor }]}>
        <ThemedText style={styles.titleText}>Police View</ThemedText>
      </View>
      
      {/* Map View */}
      <MapView
        ref={mapRef}
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
      >
        {/* Location Marker */}
        <Marker
          coordinate={{
            latitude: region.latitude,
            longitude: region.longitude,
          }}
          title="Your location"
          description="You are here"
          pinColor="blue"
        />
        
        {/* Incident Report Markers */}
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
              <View style={[styles.calloutView, { backgroundColor }]}>
                <ThemedText style={styles.calloutTitle}>{report.type}</ThemedText>
                <ThemedText>{report.description}</ThemedText>
                <ThemedText style={styles.timestampText}>{report.timestamp}</ThemedText>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* Legend Panel */}
      <View style={[styles.legendPanel, { backgroundColor }]}>
        <ThemedText style={styles.legendTitle}>Drunk Driving Reports</ThemedText>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: 'red' }]} />
          <ThemedText>Drunk Driving</ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: 'blue' }]} />
          <ThemedText>Your Location</ThemedText>
        </View>
      </View>
      
      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity 
          style={[styles.controlButton, { backgroundColor }]} 
          onPress={goToMyLocation}
        >
          <Ionicons name="locate" size={24} color={primaryColor} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.controlButton, { backgroundColor }]} 
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add-circle" size={24} color={accentColor} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.controlButton, { backgroundColor }]} 
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
        <View style={styles.centeredView}>
          <View style={[styles.modalView, { backgroundColor }]}>
            <ThemedText style={styles.modalTitle}>Log New Incident</ThemedText>
            
            <ThemedText style={styles.label}>Type of Incident:</ThemedText>
            <View style={styles.reportTypeContainer}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
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
            
            <ThemedText style={styles.label}>Description:</ThemedText>
            <TextInput
              style={[styles.input, { borderColor: primaryColor, color: textColor }]}
              placeholder="Describe the incident..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
              value={reportDescription}
              onChangeText={setReportDescription}
            />
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: '#ccc' }]}
                onPress={() => setModalVisible(false)}
              >
                <ThemedText>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: primaryColor }]}
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
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>{errorMsg}</ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 90,
    paddingTop: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  titleText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  controls: {
    position: 'absolute',
    bottom: 30,
    right: 20,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    marginVertical: 5,
  },
  legendPanel: {
    position: 'absolute',
    top: 100,
    left: 10,
    padding: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  legendTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
    fontSize: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  calloutView: {
    width: 200,
    padding: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  calloutTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  timestampText: {
    fontSize: 12,
    marginTop: 5,
    fontStyle: 'italic',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    width: '90%',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  reportTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  typeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 10,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  errorContainer: {
    position: 'absolute',
    bottom: 100,
    backgroundColor: 'rgba(255, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 5,
  },
  errorText: {
    color: 'white',
    textAlign: 'center',
  },
});
