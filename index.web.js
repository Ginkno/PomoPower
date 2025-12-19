import { registerRootComponent } from 'expo';
import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Modal } from 'react-native';
import CircleTimer from './components/CircleTimer';

// A simple version for web that doesn't use any native modules
const SimpleApp = () => {
  // Timer configurations for each tab
  const TIMER_CONFIGS = {
    pomodoro: { work: 25 * 60, break: 5 * 60, longBreak: 15 * 60, label: "PomoDoro" },
    shorterDoro: { work: 5, break: 5, longBreak: 5, label: "ShorterDoro" },
    longerDoro: { work: 45 * 60, break: 10 * 60, longBreak: 30 * 60, label: "LongerDoro" },
  };

  const [activeTab, setActiveTab] = useState("pomodoro");
  const currentConfig = TIMER_CONFIGS[activeTab];
  
  // Timer state
  const [timeLeft, setTimeLeft] = useState(currentConfig.work);
  const [mode, setMode] = useState("work");
  const [workSessionCount, setWorkSessionCount] = useState(1); // Starting from 1 instead of 0
  const [completedCycles, setCompletedCycles] = useState(0); // Track completed cycles
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);
  
  // Dialog state for end of session
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogMessage, setDialogMessage] = useState("");
  const [dialogActions, setDialogActions] = useState([]);

  // Calculate progress
  let maxTime;
  if (mode === "work") {
    maxTime = currentConfig.work;
  } else {
    if (workSessionCount % 4 === 0 && workSessionCount > 0) {
      maxTime = currentConfig.longBreak;
    } else {
      maxTime = currentConfig.break;
    }
  }
  const progress = timeLeft / maxTime;
  
  // Determine if the current break is a long break
  const isLongBreak = mode === "break" && workSessionCount % 4 === 0 && workSessionCount > 0;

  // Effect for tab changes
  useEffect(() => {
    if (running) {
      setRunning(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    
    setTimeLeft(TIMER_CONFIGS[activeTab].work);
    setMode("work");
  }, [activeTab]);

  // Timer effect
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            
            // Show dialog instead of auto-transitioning
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
  }, [running, mode, currentConfig]);

  function toggleStartPause() {
    setRunning(r => !r);
  }

  function resetTimer() {
    setRunning(false);
    setMode("work");
    setTimeLeft(currentConfig.work);
    setWorkSessionCount(1); // Reset to 1 instead of 0
    setCompletedCycles(0);  // Reset completed cycles
  }

  function formatTime(sec) {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  // Play a notification sound using Web Audio API
  function playNotificationSound() {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Create a simple beep sound with three tones
      const now = audioContext.currentTime;
      const frequency = 800; // Hz
      const duration = 0.3; // seconds
      
      // Create oscillator
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'square';
      
      // Play three quick beeps
      for (let i = 0; i < 3; i++) {
        const startTime = now + (i * duration * 1.5);
        gainNode.gain.setValueAtTime(0.3, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      }
      
      oscillator.start(now);
      oscillator.stop(now + duration * 4.5);
    } catch (e) {
      console.log("Sound notification not available:", e);
    }
  }
  
  // Show dialog at the end of a session
  function showTimerEndDialog() {
    // Play notification sound
    playNotificationSound();
    if (mode === "work") {
      // After work session
      setDialogTitle("Work Session Complete!");
      setDialogMessage("Start break time?");
      setDialogActions([
        {
          text: "No",
          onPress: () => {
            // For "No", still transition to break time but don't start timer automatically
            setDialogVisible(false);
            setMode("break");
            
            if (workSessionCount % 3 === 0) {
              // Long break for session 3, 6, 9, etc.
              setTimeLeft(currentConfig.longBreak);
            } else {
              // Regular break
              setTimeLeft(currentConfig.break);
            }
            // Timer remains paused until user presses start
          }
        },
        {
          text: "Yes",
          onPress: () => {
            // Do NOT increment session count here - we only increment after completing both work and break
            
            // Start break time - use long break if it's the current session
            setDialogVisible(false);
            setMode("break");
            
            if (workSessionCount % 3 === 0) {
              // Long break for session 3, 6, 9, etc.
              setTimeLeft(currentConfig.longBreak);
            } else {
              // Regular break
              setTimeLeft(currentConfig.break);
            }
            
            // Start timer automatically
            setRunning(true);
          }
        }
      ]);
    } else {
      // After break session
      setDialogTitle("Break Complete!");
      setDialogMessage("Start a new work session?");
      setDialogActions([
        {
          text: "No",
          onPress: () => {
            // For "No", still transition to next work session but don't start timer automatically
            // If completing a long break, increment completed cycles
            if (isLongBreak) {
              setCompletedCycles(prev => prev + 1);
            }
            
            // Increment session count after completing both work and break
            const newCount = workSessionCount + 1;
            setWorkSessionCount(newCount);
            
            // Start work time but don't automatically start timer
            setDialogVisible(false);
            setMode("work");
            setTimeLeft(currentConfig.work);
            // Timer remains paused until user presses start
          }
        },
        {
          text: "Yes",
          onPress: () => {
            // If completing a long break, increment completed cycles
            if (isLongBreak) {
              setCompletedCycles(prev => prev + 1);
            }
            
            // Increment session count after completing both work and break
            const newCount = workSessionCount + 1;
            setWorkSessionCount(newCount);
            
            // Start work time
            setDialogVisible(false);
            setMode("work");
            setTimeLeft(currentConfig.work);
            
            // Start timer automatically
            setRunning(true);
          }
        }
      ]);
    }
    
    // Show the dialog
    setDialogVisible(true);
  }

  // Timer info text
  function getTimerInfo() {
    const workMin = Math.floor(currentConfig.work / 60);
    const breakMin = Math.floor(currentConfig.break / 60);
    const longBreakMin = Math.floor(currentConfig.longBreak / 60);
    
    let infoText = `${currentConfig.label}: ${workMin}min work / ${breakMin}min break / ${longBreakMin}min long break`;
    
    if (workSessionCount > 0) {
      infoText += ` (Session ${workSessionCount})`;
    }
    
    return infoText;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>PomoPower</Text>
      
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {Object.keys(TIMER_CONFIGS).map((tabKey) => (
          <TouchableOpacity
            key={tabKey}
            style={[
              styles.tab,
              activeTab === tabKey && styles.activeTab,
            ]}
            onPress={() => setActiveTab(tabKey)}
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
      
      <View style={{ height: 65 }} />
      
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
      
      <View style={{ height: 15 }} />

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

      {/* Completed Cycles Counter */}
      {completedCycles > 0 && (
        <View style={styles.cyclesContainer}>
          <Text style={styles.cyclesText}>Completed Cycles: {completedCycles}</Text>
        </View>
      )}

      <View style={{ height: 30 }} />
      <View style={styles.row}>
        <TouchableOpacity style={styles.button} onPress={toggleStartPause}>
          <Text style={styles.buttonText}>{running ? "Pause" : "Start"}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.secondary]} onPress={resetTimer}>
          <Text style={styles.buttonText}>Reset</Text>
        </TouchableOpacity>
      </View>

      {/* Simple support button without Stripe */}
      <View style={{ marginTop: 20 }}>
        <TouchableOpacity style={styles.donateButton}>
          <Text style={styles.donateButtonText}>Support Us</Text>
        </TouchableOpacity>
      </View>

      {/* Timer Info */}
      <Text style={styles.hint}>{getTimerInfo()}</Text>
      
      {/* Session End Dialog */}
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
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#fff", 
    alignItems: "center", 
    justifyContent: "flex-start", 
    padding: 24,
    paddingTop: 20
  },
  tabContainer: { 
    flexDirection: "row", 
    marginBottom: 20, 
    marginTop: 10,
    backgroundColor: "#f0f0f0", 
    borderRadius: 12, 
    padding: 4,
    position: "absolute",
    top: 60,
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
  title: { 
    fontSize: 28, 
    fontWeight: "700", 
    marginBottom: 8 
  },
  mode: { 
    color: "#666", 
    marginBottom: 6, 
    letterSpacing: 1.5 
  },
  sessionCount: { 
    color: "#888", 
    fontSize: 12,
    marginBottom: 5
  },
  timer: { 
    position: "absolute", 
    fontSize: 72, 
    fontWeight: "700", 
    marginVertical: 12 
  },
  row: { 
    flexDirection: "row", 
    marginTop: 20 
  },
  button: { 
    backgroundColor: "#1e90ff", 
    paddingHorizontal: 22, 
    paddingVertical: 12, 
    borderRadius: 10, 
    marginHorizontal: 8 
  },
  secondary: { 
    backgroundColor: "#444" 
  },
  buttonText: { 
    color: "#fff", 
    fontWeight: "600" 
  },
  hint: { 
    marginTop: 26, 
    color: "#444" 
  },
  donateButton: {
    backgroundColor: "#27ae60",
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 10,
  },
  donateButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  cyclesContainer: {
    marginTop: 30,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0f8ff',
  },
  cyclesText: {
    color: '#1e90ff',
    fontWeight: '600',
    fontSize: 16,
  },
  // Modal styles
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

// Register the component
registerRootComponent(SimpleApp);
