import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Modal, TextInput, Alert, Platform } from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';

export default function DonateButton() {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [amount, setAmount] = useState('5');
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // Predefined donation amounts
  const donationAmounts = ['2', '5', '10', '25', '50'];

  // This function would call your backend to create a payment intent
  const fetchPaymentSheetParams = async (donationAmount) => {
    // In a real app, you would make an API call to your server here
    // Your server would create a payment intent and return the client secret
    
    // For demo purposes, we're returning mock data
    // In production, replace this with actual API call to your server
    return {
      paymentIntent: 'mock_payment_intent_client_secret',
      ephemeralKey: 'mock_ephemeral_key',
      customer: 'mock_customer_id',
    };
  };

  const initializePaymentSheet = async (donationAmount) => {
    setLoading(true);
    try {
      // Fetch payment intent from your backend
      const { paymentIntent, ephemeralKey, customer } = 
        await fetchPaymentSheetParams(donationAmount);

      // Initialize payment sheet
      const { error } = await initPaymentSheet({
        merchantDisplayName: 'PomoPower',
        customerId: customer,
        customerEphemeralKeySecret: ephemeralKey,
        paymentIntentClientSecret: paymentIntent,
        allowsDelayedPaymentMethods: true,
        defaultBillingDetails: {
          name: 'PomoPower User',
        }
      });

      if (error) {
        Alert.alert(`Error code: ${error.code}`, error.message);
      }
    } catch (e) {
      console.log(e);
      Alert.alert('Something went wrong', 'Please try again later');
    } finally {
      setLoading(false);
    }
  };

  const handleDonate = async () => {
    // Make sure amount is valid
    const donationAmount = parseFloat(amount);
    if (isNaN(donationAmount) || donationAmount <= 0) {
      Alert.alert('Invalid amount', 'Please enter a valid donation amount');
      return;
    }

    await initializePaymentSheet(donationAmount);
    
    // Present the payment sheet
    const { error } = await presentPaymentSheet();

    if (error) {
      if (error.code === 'Canceled') {
        // User canceled the payment - no need to show an error
        return;
      }
      Alert.alert(`Error code: ${error.code}`, error.message);
    } else {
      Alert.alert('Success!', 'Thank you for your donation!');
      setModalVisible(false);
    }
  };

  const handleSelectAmount = (selectedAmount) => {
    setAmount(selectedAmount);
  };

  // Custom modal dialog for web and custom Alert for native
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
                keyboardType="decimal-pad"
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
