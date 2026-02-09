import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';

// Web-specific implementation of the donation button
export default function DonateButtonWeb() {
  // Replace with your actual Stripe Payment Link
  const STRIPE_PAYMENT_LINK = 'https://donate.stripe.com/test_7sY7sLaOlbHy9i12B6cfK02';

  const handleDonate = () => {
    // Redirect to Stripe Payment Link
    if (typeof window !== 'undefined') {
      window.open(STRIPE_PAYMENT_LINK, '_blank');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.donateButton}
        onPress={handleDonate}
      >
        <Text style={styles.donateButtonText}>Support Us</Text>
      </TouchableOpacity>
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
});
