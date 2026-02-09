import React, { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";

export default function CircleTimer({ progress }) {
  const size = 260;
  const strokeWidth = 10; // thinner stroke
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Animation to rotate the gradient
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 5000,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    ).start();
  }, []);

  // Convert animation value to rotation angle
  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.View
      style={{
        transform: [{ rotate }],
      }}
    >
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="rainbow" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#ff0000" />
            <Stop offset="25%" stopColor="#ffff00" />
            <Stop offset="50%" stopColor="#00ff00" />
            <Stop offset="75%" stopColor="#00ffff" />
            <Stop offset="100%" stopColor="#ff00ff" />
          </LinearGradient>
        </Defs>

        {/* Background ring */}
        <Circle
          stroke="#e5e5e5"
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />

        {/* Animated progress ring */}
        <Circle
          stroke="url(#rainbow)"
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
    </Animated.View>
  );
}