import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View, TouchableOpacity, Modal, Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as SplashScreen from "expo-splash-screen";
import CircleTimer from "./components/CircleTimer";
// Removed DonateButtonWeb import temporarily to fix blank page issue

// IMPORTANT: This file is specifically for web platforms
// It must NOT import @stripe/stripe-react-native or any native modules

SplashScreen.preventAutoHideAsync().catch(() => {});

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: true }),
});

// Timer configurations for each tab, now with long break
const TIMER_CONFIGS = {
  pomodoro: { work: 25 * 60, break: 5 * 60, longBreak: 15 * 60, label: "PomoDoro" },
  shorterDoro: { work: 15 * 60, break: 3 * 60, longBreak: 5 * 60, label: "ShorterDoro" },
  longerDoro: { work: 45 * 60, break: 10 * 60, longBreak: 30 * 60, label: "LongerDoro" },
};

export default function AppWeb() {
  const [activeTab, setActiveTab] = useState("pomodoro");
  const config = TIMER_CONFIGS[activeTab];

  // Store timer state for each tab
  const [tabTimers, setTabTimers] = useState({
    pomodoro: { timeLeft: TIMER_CONFIGS.pomodoro.work, mode: "work", workSessionCount: 0 },
    shorterDoro: { timeLeft: 15 * 60, mode: "work", workSessionCount: 0 },
    longerDoro: { timeLeft: 45 * 60, mode: "work", workSessionCount: 0 },
  });
  
  // Use the active tab's timer values
  const [timeLeft, setTimeLeft] = useState(tabTimers[activeTab].timeLeft);
  const [mode, setMode] = useState(tabTimers[activeTab].mode);
  const [workSessionCount, setWorkSessionCount] = useState(tabTimers[activeTab].workSessionCount);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);
  
  // Custom dialog state
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogMessage, setDialogMessage] = useState("");
  const [dialogActions, setDialogActions] = useState([]);

  // This effect runs once on initial render
  useEffect(() => {
    // hide splash after first render
    SplashScreen.hideAsync().catch(() => {});
    
    // Add visibility change listener to pause timer when user leaves the app
    const handleVisibilityChange = () => {
      if (document.hidden && running) {
        // User switched away from the app and timer is running - pause it
        setRunning(false);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [running]);

  // Handle tab changes - update UI with stored tab timer values
  useEffect(() => {
    // Stop the timer if it's running when changing tabs
    if (running) {
      setRunning(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    
    // Load the saved time, mode and session count for this tab
    setTimeLeft(tabTimers[activeTab].timeLeft);
    setMode(tabTimers[activeTab].mode);
    setWorkSessionCount(tabTimers[activeTab].workSessionCount);
  }, [activeTab]);

  // Timer effect
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            // end of session
            clearInterval(intervalRef.current);
            setRunning(false);
            
            // Show the end of session dialog
            showTimerEndDialog();
            
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  // Update stored tab timer values whenever time, mode or session count changes
  useEffect(() => {
    setTabTimers(prev => ({
      ...prev,
      [activeTab]: { timeLeft, mode, workSessionCount }
    }));
  }, [timeLeft, mode, workSessionCount, activeTab]);

  function showTimerEndDialog() {
    const currentConfig = TIMER_CONFIGS[activeTab];
    
    if (mode === "work") {
      // After work session
      sendNotification("Work session finished", "Take a break!");
      
      setDialogTitle("Work Session Complete!");
      setDialogMessage("Start break time?");
      setDialogActions([
        {
          text: "No",
          onPress: () => {
            // Reset to a new work session without increasing count
            setDialogVisible(false);
            setMode("work");
            setTimeLeft(currentConfig.work);
          }
        },
        {
          text: "Yes",
          onPress: () => {
            // Increment work session count
            const newCount = workSessionCount + 1;
            setWorkSessionCount(newCount);
            
            // Start break time - use long break if it's the 3rd session
            setDialogVisible(false);
            setMode("break");
            
            if (newCount % 3 === 0) {
              // 3rd work session completed - use long break
              setTimeLeft(currentConfig.longBreak);
            } else {
              // Regular break
              setTimeLeft(currentConfig.break);
            }
          }
        }
      ]);
    } else {
      // After break session
      sendNotification("Break finished", "Back to work!");
      
      setDialogTitle("Break Complete!");
      setDialogMessage("Start a new work session?");
      setDialogActions([
        {
          text: "No",
          onPress: () => {
            // Stay in break mode but reset timer
            setDialogVisible(false);
            setMode("break");
            
            // If it was a long break, reset to normal break length
            if (workSessionCount % 3 === 0) {
              setTimeLeft(currentConfig.break);
            } else {
              setTimeLeft(timeLeft > 0 ? timeLeft : currentConfig.break);
            }
          }
        },
        {
          text: "Yes",
          onPress: () => {
            // Start work time
            setDialogVisible(false);
            setMode("work");
            setTimeLeft(currentConfig.work);
          }
        }
      ]);
    }
    
    // Show the dialog
    setDialogVisible(true);
  }

  async function sendNotification(title, body) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: title,
          body: body,
        },
        trigger: null,
      });
    } catch (e) {
      console.warn("Notification error", e);
    }
  }

  function toggleStartPause() {
    // request notification permission when we start for first time
    if (!running) {
      registerForPushNotificationsAsync().catch(() => {});
    }
    setRunning(r => !r);
  }

  function resetTimer() {
    const currentConfig = TIMER_CONFIGS[activeTab];
    setRunning(false);
    setMode("work");
    setTimeLeft(currentConfig.work);
    setWorkSessionCount(0); // Reset work session count
  }

  function formatTime(sec) {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  async function registerForPushNotificationsAsync() {
    if (Platform.OS === "web") return;
    try {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== "granted") {
        const res = await Notifications.requestPermissionsAsync();
        if (res.status !== "granted") {
          alert("Notifications disabled. Enable notifications to get alerts when a session ends.");
        }
      }
    } catch (e) {
      console.warn("Permission request failed", e);
    }
  }

  function switchTab(tabKey) {
    // Skip if already on this tab
    if (tabKey === activeTab) return;
    
    // If timer is running, pause it
    if (running) {
      setRunning(false);
    }
    
    // Switch tabs immediately
    setActiveTab(tabKey);
  }

  // Calculate progress based on current config
  const currentConfig = TIMER_CONFIGS[activeTab];
  let maxTime;
  
  // Determine max time based on mode and work session count
  if (mode === "work") {
    maxTime = currentConfig.work;
  } else {
    // Break mode - check if it's a long break
    if (workSessionCount % 3 === 0 && workSessionCount > 0) {
      maxTime = currentConfig.longBreak;
    } else {
      maxTime = currentConfig.break;
    }
  }
  
  const progress = timeLeft / maxTime;

  // Determine if the current break is a long break
  const isLongBreak = mode === "break" && workSessionCount % 3 === 0 && workSessionCount > 0;

  // Determine the timer info text
  function getTimerInfo() {
    const workMin = Math.floor(currentConfig.work / 60);
    const breakMin = Math.floor(currentConfig.break / 60);
    const longBreakMin = Math.floor(currentConfig.longBreak / 60);
    
    let infoText = `${currentConfig.label}: ${workMin}min work / ${breakMin}min break`;
    
    // Add long break info
    infoText += ` / ${longBreakMin}min long break`;
    
    // Add current session count
    if (workSessionCount > 0) {
      infoText += ` (Session ${workSessionCount})`;
    }
    
    return infoText;
  }

  return (
    <View style={styles.container}>
      {/* Tab Navigation */}
      <Text style={styles.title}>PomoPower</Text>

      <View style={styles.tabContainer}>
        {Object.keys(TIMER_CONFIGS).map((tabKey) => (
          <TouchableOpacity
            key={tabKey}
            style={[
              styles.tab,
              activeTab === tabKey && styles.activeTab,
            ]}
            onPress={() => switchTab(tabKey)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tabKey && styles.activeTabText,
              ]}
            >
              {TIMER_CONFIGS[tabKey].label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      
      <Text style={styles.mode}>
        {mode === "work" 
          ? "FOCUS" 
          : (isLongBreak ? "LONG BREAK" : "BREAK")}
      </Text>
      
      {/* Session counter */}
      <Text style={styles.sessionCount}>
        {workSessionCount > 0 ? `Session ${workSessionCount}` : "Session 0"}
        {isLongBreak ? " - Long Break" : ""}
      </Text>
      
      <View style={{ height: 30 }} />

      <View style={{ justifyContent: "center", alignItems: "center" }}>
        <View style={{ justifyContent: "center", alignItems: "center" }}>
          <CircleTimer progress={progress} />

          <View
            style={{
              position: "absolute",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text style={[styles.timer, { fontSize: 42 }]}>
              {formatTime(timeLeft)}
            </Text>
          </View>
        </View>
      </View>

      <View style={{ height: 30 }} />
      <View style={styles.row}>
        <TouchableOpacity style={styles.button} onPress={toggleStartPause}>
          <Text style={styles.buttonText}>{running ? "Pause" : "Start"}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.secondary]} onPress={resetTimer}>
          <Text style={styles.buttonText}>Reset</Text>
        </TouchableOpacity>
      </View>

      {/* Donate Button - Temporarily removed to fix blank page issue */}
      <View style={{ marginTop: 20 }}>
        <TouchableOpacity style={{ backgroundColor: "#27ae60", paddingHorizontal: 22, paddingVertical: 12, borderRadius: 10 }}>
          <Text style={{ color: "#fff", fontWeight: "600" }}>Support Us</Text>
        </TouchableOpacity>
      </View>

      {/* Timer Info */}
      <Text style={styles.hint}>{getTimerInfo()}</Text>

      {/* Custom Dialog Modal for Web */}
      <Modal
        visible={dialogVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDialogVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{dialogTitle}</Text>
            <Text style={styles.modalMessage}>{dialogMessage}</Text>
            <View style={styles.modalButtons}>
              {dialogActions.map((action, index) => (
                <TouchableOpacity 
                  key={index}
                  style={[
                    styles.modalButton,
                    index === 0 ? styles.modalButtonSecondary : styles.modalButtonPrimary
                  ]}
                  onPress={action.onPress}
                >
                  <Text style={styles.modalButtonText}>{action.text}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", padding: 24 },
  tabContainer: { 
    flexDirection: "row", 
    marginBottom: 20, 
    backgroundColor: "#f0f0f0", 
    borderRadius: 12, 
    padding: 4,
    // position: "absolute",
    // top: 60,
  },
  tab: { 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderRadius: 10,
  },
  activeTab: { 
    backgroundColor: "#1e90ff",
  },
  tabText: { 
    color: "#666", 
    fontWeight: "600",
    fontSize: 13,
  },
  activeTabText: { 
    color: "#fff",
  },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 8 },
  mode: { color: "#666", marginBottom: 6, letterSpacing: 1.5 },
  sessionCount: { 
    color: "#888", 
    fontSize: 12,
    marginBottom: 5
  },
  timer: { position: "absolute", fontSize: 72, fontWeight: "700", marginVertical: 12 },
  row: { flexDirection: "row", marginTop: 20 },
  button: { backgroundColor: "#1e90ff", paddingHorizontal: 22, paddingVertical: 12, borderRadius: 10, marginHorizontal: 8 },
  secondary: { backgroundColor: "#444" },
  buttonText: { color: "#fff", fontWeight: "600" },
  hint: { marginTop: 26, color: "#444" },
  
  // Modal styles for web
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    width: '80%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    minWidth: 100,
    alignItems: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: '#1e90ff',
  },
  modalButtonSecondary: {
    backgroundColor: '#6c757d',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
