import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Modal, TextInput } from 'react-native';

// Web-specific implementation of the donation button
export default function DonateButtonWeb() {
  const [amount, setAmount] = useState('5');
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // Predefined donation amounts
  const donationAmounts = ['2', '5', '10', '25', '50'];

  const handleDonate = async () => {
    setLoading(true);
    
    // For web version, we'll redirect to a simple payment page
    // In a real implementation, you would use Stripe.js for web
    try {
      alert(`This is a demo: In production, this would open a Stripe.js payment form for $${amount}`);
      
      // Simulate a successful payment after a short delay
      setTimeout(() => {
        setLoading(false);
        alert('Thank you for your support!');
        setModalVisible(false);
      }, 1000);
    } catch (e) {
      console.error(e);
      setLoading(false);
      alert('An error occurred. Please try again later.');
    }
  };

  const handleSelectAmount = (selectedAmount) => {
    setAmount(selectedAmount);
  };

  const showDonationModal = () => {
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.donateButton}
        onPress={showDonationModal}
      >
        <Text style={styles.donateButtonText}>Support Us</Text>
      </TouchableOpacity>

      {/* Modal for donation selection */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Support PomoPower</Text>
            <Text style={styles.modalMessage}>
              Your donation helps us maintain and improve the app. Thank you for your support!
            </Text>
            
            {/* Predefined amounts */}
            <View style={styles.amountButtons}>
              {donationAmounts.map((value) => (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.amountButton,
                    amount === value && styles.selectedAmountButton,
                  ]}
                  onPress={() => handleSelectAmount(value)}
                >
                  <Text style={[
                    styles.amountButtonText,
                    amount === value && styles.selectedAmountButtonText,
                  ]}>
                    ${value}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom amount input */}
            <View style={styles.customAmountContainer}>
              <Text style={styles.customAmountLabel}>Custom Amount:</Text>
              <TextInput
                style={styles.customAmountInput}
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
                placeholder="Enter amount"
              />
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalButtonSecondary}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalButtonPrimary}
                onPress={handleDonate}
                disabled={loading}
              >
                <Text style={styles.modalButtonText}>
                  {loading ? 'Processing...' : 'Donate'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  donateButton: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 10,
  },
  donateButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
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
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: '#555',
    lineHeight: 22,
  },
  amountButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 15,
  },
  amountButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 5,
    marginBottom: 10,
    minWidth: 60,
    alignItems: 'center',
  },
  selectedAmountButton: {
    backgroundColor: '#1e90ff',
  },
  amountButtonText: {
    color: '#444',
    fontWeight: '600',
  },
  selectedAmountButtonText: {
    color: '#fff',
  },
  customAmountContainer: {
    marginVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  customAmountLabel: {
    fontSize: 16,
    color: '#444',
  },
  customAmountInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    width: '60%',
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  modalButtonPrimary: {
    backgroundColor: '#1e90ff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    minWidth: 100,
    alignItems: 'center',
  },
  modalButtonSecondary: {
    backgroundColor: '#6c757d',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    minWidth: 100,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
