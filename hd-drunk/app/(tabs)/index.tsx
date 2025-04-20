import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, TouchableOpacity, ActivityIndicator, Modal, Alert, StyleSheet } from 'react-native';
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
    type: 'Impaired Driving',
    description: 'Vehicle swerving between lanes on highway',
    latitude: 37.78825,
    longitude: -122.4324,
    timestamp: '2h ago',
    confirmed: false,
    probability: 70,
  },
  {
    id: 2,
    type: 'Impaired Driving',
    description: 'Driver exhibiting erratic behavior at intersection',
    latitude: 37.79125,
    longitude: -122.4354,
    timestamp: '4h ago',
    confirmed: false,
    probability: 55,
  },
  {
    id: 3,
    type: 'Impaired Driving',
    description: 'Vehicle swerving across multiple lanes',
    latitude: 37.78525,
    longitude: -122.4294,
    timestamp: '1d ago',
    confirmed: false,
    probability: 45,
  },
  {
    id: 4,
    type: 'Impaired Driving',
    description: 'Car over-correcting in traffic and swerving erratically',
    latitude: 37.7855,
    longitude: -122.4175,
    timestamp: '3h ago',
    confirmed: false,
    probability: 65,
  },
  {
    id: 5,
    type: 'Impaired Driving',
    description: 'Driver unable to maintain lane position',
    latitude: 37.7895,
    longitude: -122.4275,
    timestamp: '5h ago',
    confirmed: false,
    probability: 30,
  },
];

// Define a type for the report
type Report = {
  id: number;
  type: string;
  description: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  confirmed: boolean;
  status?: string;
  probability?: number; // Probability of impaired driving (30-70%)
};

export default function PoliceViewScreen() {
  const [region, setRegion] = useState<Region>(DEFAULT_LOCATION);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [reports, setReports] = useState(SAMPLE_REPORTS);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [reportType, setReportType] = useState('Impaired Driving');
  const [reportDescription, setReportDescription] = useState('');
  const [userLocation, setUserLocation] = useState({
    latitude: DEFAULT_LOCATION.latitude,
    longitude: DEFAULT_LOCATION.longitude,
  });
  const [markerPressed, setMarkerPressed] = useState(false); // Track marker press events
  const mapRef = useRef<MapView | null>(null);
  
  const backgroundColor = useThemeColor({ light: '#fff', dark: '#121212' }, 'background');
  const textColor = useThemeColor({ light: '#000', dark: '#fff' }, 'text');
  const primaryColor = useThemeColor({ light: '#0047AB', dark: '#0047AB' }, 'tint'); // Police blue
  const accentColor = useThemeColor({ light: '#B22222', dark: '#B22222' }, 'tint'); // Emergency red

  // Custom styles for confirmation UI and bottom panel
  const customStyles = StyleSheet.create({
    confirmedContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0, 128, 0, 0.1)',
      padding: 8,
      borderRadius: 5,
      marginTop: 8,
    },
    confirmedText: {
      marginLeft: 5,
      fontWeight: 'bold',
      color: 'green',
    },
    bottomPanel: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: 15,
      borderTopLeftRadius: 15,
      borderTopRightRadius: 15,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: -2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
      zIndex: 1000,
    },
    panelHandle: {
      width: 40,
      height: 5,
      borderRadius: 3,
      backgroundColor: '#ccc',
      alignSelf: 'center',
      marginBottom: 10,
    },
    panelTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 5,
    },
    panelDescription: {
      marginBottom: 5,
      fontSize: 14,
    },
    panelTimestamp: {
      fontSize: 12,
      color: '#888',
      marginBottom: 15,
    },
    actionButtonsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 10,
    },
    confirmButton: {
      backgroundColor: accentColor,
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
      flex: 1,
      marginRight: 5,
    },
    respondButton: {
      backgroundColor: primaryColor,
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
      flex: 1,
      marginLeft: 5,
    },
    buttonText: {
      color: 'white',
      fontWeight: 'bold',
      fontSize: 14,
    },
    closeButton: {
      position: 'absolute',
      top: 15,
      right: 15,
      zIndex: 1,
    },
    statusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0, 71, 171, 0.1)',
      padding: 8,
      borderRadius: 5,
      marginTop: 8,
    },
    statusText: {
      marginLeft: 5,
      fontWeight: 'bold',
      color: '#0047AB',
    },
    controls: {
      position: 'absolute',
      bottom: 100, // Increase distance from bottom to avoid overlap with panel
      right: 20,
      zIndex: 900, // High z-index but below the panel
    },
  });

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
    
    // Sample descriptions for impaired driving incidents
    const impairedDrivingDescriptions = [
      "Vehicle swerving between lanes",
      "Car driving erratically and unable to maintain lane",
      "Driver over-correcting at turns",
      "Vehicle weaving through traffic erratically",
      "Car drifting across lane markers repeatedly",
      "Vehicle making sudden lane changes without signaling",
      "Driver showing erratic speed changes and lane position",
      "Car swerving to avoid imaginary obstacles",
      "Vehicle unable to maintain consistent speed and position",
      "Driver exhibiting delayed reactions at intersections"
    ];
    
    // Generate 6-10 random reports around the location
    const numReports = 6 + Math.floor(Math.random() * 5);
    const newReports = [];
    
    for (let i = 0; i < numReports; i++) {
      const description = impairedDrivingDescriptions[Math.floor(Math.random() * impairedDrivingDescriptions.length)];
      const hours = Math.floor(Math.random() * 12) + 1;
      // Generate a random probability between 30 and 70
      const probability = 30 + Math.floor(Math.random() * 41);
      
      newReports.push({
        id: Date.now() + i,
        type: 'Impaired Driving',
        description,
        latitude: randomLocation.latitude + (Math.random() - 0.5) * 0.03,
        longitude: randomLocation.longitude + (Math.random() - 0.5) * 0.03,
        timestamp: `${hours}h ago`,
        confirmed: false,
        probability,
      });
    }
    
    setReports(newReports);
    setRegion(newRegion);
    mapRef.current?.animateToRegion(newRegion, 1000);
    
    Alert.alert(
      "Mock Location Set",
      `Now viewing ${randomLocation.name} (${numReports} impaired driving reports generated)`
    );
  };
  
  const handleReportSubmit = () => {
    if (reportType && reportDescription) {
      // Generate a random probability between 30 and 70
      const probability = 30 + Math.floor(Math.random() * 41);
      
      const newReport = {
        id: Date.now(),
        type: reportType,
        description: reportDescription,
        latitude: region.latitude + (Math.random() - 0.5) * 0.01,
        longitude: region.longitude + (Math.random() - 0.5) * 0.01,
        timestamp: 'Just now',
        confirmed: false,
        probability,
      };
      
      setReports([newReport, ...reports]);
      setModalVisible(false);
      setReportType('Impaired Driving');
      setReportDescription('');
    }
  };

  // Handle map press events
  const handleMapPress = (e: any) => {
    // Only clear selection if we didn't just press a marker
    if (!markerPressed) {
      setSelectedReport(null);
    }
    // Reset the marker pressed flag
    setMarkerPressed(false);
  };

  // Handle marker press to show report details
  const handleMarkerPress = (report: Report, e: any) => {
    // Stop event propagation to prevent map press from triggering
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    
    console.log("Marker pressed for report", report.id);
    setMarkerPressed(true); // Set the flag to prevent map press from clearing selection
    setSelectedReport(report);
  };

  const handleConfirmIncident = () => {
    if (selectedReport) {
      Alert.alert(
        "Incident Confirmed",
        `Thank you for confirming this impaired driving incident. This helps us validate our reports.`,
        [
          { 
            text: "OK", 
            onPress: () => {
              // Update the report status to confirmed
              const updatedReports = reports.map(r => 
                r.id === selectedReport.id 
                  ? {...r, confirmed: true} 
                  : r
              );
              setReports(updatedReports);
              // Update the selected report too
              setSelectedReport({...selectedReport, confirmed: true});
            } 
          }
        ]
      );
    }
  };

  const getMarkerColor = (report: Report) => {
    // If the report is confirmed, use deep red
    if (report.confirmed) {
      return '#8B0000'; // Dark red for confirmed reports
    }
    
    // For unconfirmed reports, color based on probability
    const probability = report.probability || 50; // Default to 50 if not specified
    
    if (probability >= 65) {
      return '#FF0000'; // Bright red for high probability (65-70%)
    } else if (probability >= 50) {
      return '#FF4500'; // Orange-red for medium-high probability (50-64%)
    } else if (probability >= 40) {
      return '#FF8C00'; // Dark orange for medium probability (40-49%)
    } else {
      return '#FFA500'; // Orange for lower probability (30-39%)
    }
  };

  if (isLoading) {
    return (
      <View style={[mapStyles.container, { backgroundColor }]}>
        <ActivityIndicator size="large" color={primaryColor} />
        <ThemedText style={{ marginTop: 10 }}>Loading map and impaired driving reports...</ThemedText>
      </View>
    );
  }

  // Debug log for markers
  console.log(`Rendering ${reports.length} impaired driving markers`);
  
  return (
    <View style={[mapStyles.container, { position: 'relative' }]}>
      
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
        onPress={handleMapPress}
      >
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
              pinColor={getMarkerColor(report)}
              onPress={(e) => {
                // Pass the event object to the handler
                handleMarkerPress(report, e);
                // Return true to prevent the map's onPress from firing
                return true;
              }}
              tracksViewChanges={false}
            >
              <Callout tooltip>
                <View style={[mapStyles.calloutView, { backgroundColor }]}>
                  <ThemedText style={mapStyles.calloutTitle}>{report.type}</ThemedText>
                  <ThemedText>{report.description}</ThemedText>
                  <ThemedText style={mapStyles.timestampText}>{report.timestamp}</ThemedText>
                  
                  {/* Display the probability */}
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(0, 0, 0, 0.05)',
                    padding: 4,
                    borderRadius: 4,
                    marginTop: 5,
                  }}>
                    <Ionicons name="analytics-outline" size={12} color="#777" />
                    <ThemedText style={{ marginLeft: 4, fontSize: 12, color: '#777' }}>
                      {report.probability || 50}% probability
                    </ThemedText>
                  </View>
                  
                  {report.confirmed && (
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: 'rgba(0, 128, 0, 0.1)',
                      padding: 5,
                      borderRadius: 4,
                      marginTop: 8,
                    }}>
                      <Ionicons name="checkmark-circle" size={14} color="green" />
                      <ThemedText style={{ marginLeft: 4, color: 'green', fontSize: 12 }}>
                        Confirmed
                      </ThemedText>
                    </View>
                  )}
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>

      {/* Floating Confirm Button */}
      {selectedReport && !selectedReport.confirmed && (
        <View style={{
          position: 'absolute',
          bottom: 100,
          alignSelf: 'center',
          flexDirection: 'row',
          gap: 10,
        }}>
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: primaryColor,
              paddingVertical: 8,
              paddingHorizontal: 16,
              borderRadius: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5,
            }}
            onPress={() => {
              // Update the report status to confirmed
              const updatedReports = reports.map(r => 
                r.id === selectedReport.id 
                  ? {...r, confirmed: true} 
                  : r
              );
              setReports(updatedReports);
              
              // Immediately deselect the report after confirmation
              setSelectedReport(null);
            }}
          >
            <Ionicons name="checkmark-circle" size={18} color="white" />
            <ThemedText style={{
              marginLeft: 5,
              fontWeight: 'bold',
              color: 'white',
            }}>
              Confirm Event
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: accentColor,
              width: 36,
              height: 36,
              borderRadius: 18,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5,
            }}
            onPress={() => {
              Alert.alert(
                "Delete Incident",
                "Are you sure you want to delete this incident report?",
                [
                  {
                    text: "Cancel",
                    style: "cancel"
                  },
                  {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => {
                      // Remove the report from the reports array
                      const updatedReports = reports.filter(r => r.id !== selectedReport.id);
                      setReports(updatedReports);
                      
                      // Deselect the report after deletion
                      setSelectedReport(null);
                    }
                  }
                ]
              );
            }}
          >
            <Ionicons name="trash" size={18} color="white" />
          </TouchableOpacity>
        </View>
      )}
      
      {/* Controls */}
      <View style={customStyles.controls}>
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
            <ThemedText style={mapStyles.modalTitle}>Report an Impaired Driving Incident</ThemedText>
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
