import React, { useEffect, useRef } from 'react';
import { StyleSheet, Animated, Dimensions, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { height, width } = Dimensions.get('window');

type Props = {
  onFinish?: () => void;
};

export default function SplashAnimation({ onFinish }: Props) {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const rippleOpacity = useRef(new Animated.Value(0)).current;
  const onFinishRef = useRef(onFinish);
  const bubbleSoundRef = useRef<any>(null);
  const finishedRef = useRef(false);
  // Background continuous ripples (modern water effect)
  const bgRipples = useRef(
    Array.from({ length: 3 }, () => ({
      scale: new Animated.Value(0.8),
      opacity: new Animated.Value(0),
    }))
  ).current;

  // Floating bubble images
  const bubbles = useRef(
    Array.from({ length: 10 }, (_, i) => ({
      translateY: new Animated.Value(height + 50),
      translateX: new Animated.Value(Math.random() * (width - 60)),
      scale: new Animated.Value(0),
      opacity: new Animated.Value(0),
      rotate: new Animated.Value(0),
      size: 30 + Math.random() * 30, // Random size between 30-60
      delay: Math.random() * 3000, // Random delay up to 3 seconds
      duration: 4000 + Math.random() * 3000, // Random duration 4-7 seconds
      initialX: Math.random() * (width - 60),
    }))
  ).current;

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  useEffect(() => {
    finishedRef.current = false;

    const run = async () => {
      // Start bubble sound that plays during entire splash animation
      try {
        // Dynamically import expo-av so the app bundles even if it's not installed
        const { Audio } = await import('expo-av');
        try {
          // Ensure audio can play even if the device is in silent mode (iOS)
          await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
        } catch {}
        const { sound } = await Audio.Sound.createAsync(
          require('../../assets/audio/bubble-fx-343684.mp3'),
          { 
            shouldPlay: false, 
            volume: 0.4,
            isLooping: true // Loop the sound continuously
          }
        );
        bubbleSoundRef.current = sound;
        try { await sound.playAsync(); } catch {}
      } catch (error) {
        // Silently ignore if audio fails
      }

      // Start background ripple loops
      bgRipples.forEach((r, i) => {
        Animated.loop(
          Animated.sequence([
            Animated.delay(i * 450),
            Animated.parallel([
              Animated.timing(r.opacity, { toValue: 0.35, duration: 0, useNativeDriver: true }),
              Animated.timing(r.scale, { toValue: 0.8, duration: 0, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(r.opacity, { toValue: 0, duration: 2200, useNativeDriver: true }),
              Animated.timing(r.scale, { toValue: 2.4, duration: 2200, useNativeDriver: true }),
            ]),
          ])
        ).start();
      });

      // Start floating bubble animations
      // First pass: boosted speed right when audio starts, then normal loop
      const makeBubbleSequence = (bubble: typeof bubbles[number], speedFactor: number) => (
        Animated.sequence([
          Animated.delay(bubble.delay),
          // Fade in and scale up
          Animated.parallel([
            Animated.timing(bubble.opacity, { 
              toValue: 0.8, 
              duration: 800 * speedFactor, 
              useNativeDriver: true 
            }),
            Animated.timing(bubble.scale, { 
              toValue: 1, 
              duration: 800 * speedFactor, 
              useNativeDriver: true 
            }),
          ]),
          // Float up with gentle movement
          Animated.parallel([
            // Main upward movement
            Animated.timing(bubble.translateY, {
              toValue: -100,
              duration: bubble.duration * speedFactor,
              useNativeDriver: true,
            }),
            // Gentle horizontal sway
            Animated.sequence([
              Animated.timing(bubble.translateX, {
                toValue: bubble.initialX + (Math.random() - 0.5) * 80,
                duration: (bubble.duration / 3) * speedFactor,
                useNativeDriver: true,
              }),
              Animated.timing(bubble.translateX, {
                toValue: bubble.initialX + (Math.random() - 0.5) * 80,
                duration: (bubble.duration / 3) * speedFactor,
                useNativeDriver: true,
              }),
              Animated.timing(bubble.translateX, {
                toValue: bubble.initialX + (Math.random() - 0.5) * 80,
                duration: (bubble.duration / 3) * speedFactor,
                useNativeDriver: true,
              }),
            ]),
            // Gentle rotation
            Animated.timing(bubble.rotate, {
              toValue: 360,
              duration: bubble.duration * speedFactor,
              useNativeDriver: true,
            }),
            // Fade out near the top
            Animated.sequence([
              Animated.delay(bubble.duration * 0.7 * speedFactor),
              Animated.timing(bubble.opacity, {
                toValue: 0,
                duration: bubble.duration * 0.3 * speedFactor,
                useNativeDriver: true,
              }),
            ]),
          ]),
          // Reset for next loop
          Animated.parallel([
            Animated.timing(bubble.translateY, { 
              toValue: height + 50, 
              duration: 0, 
              useNativeDriver: true 
            }),
            Animated.timing(bubble.scale, { 
              toValue: 0, 
              duration: 0, 
              useNativeDriver: true 
            }),
            Animated.timing(bubble.opacity, { 
              toValue: 0, 
              duration: 0, 
              useNativeDriver: true 
            }),
            Animated.timing(bubble.rotate, { 
              toValue: 0, 
              duration: 0, 
              useNativeDriver: true 
            }),
          ]),
        ])
      );

      const fastFactor = 0.1; // 0.3x duration => 3x speed for the initial pass

      bubbles.forEach((bubble) => {
        // Run a faster first pass synced with audio start
        makeBubbleSequence(bubble, fastFactor).start(() => {
          // Then continue looping at faster speed
          Animated.loop(makeBubbleSequence(bubble, 0.6)).start();
        });
      });

      Animated.sequence([
        // Logo fade in
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Ripple after impact
        Animated.timing(rippleOpacity, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }).start(({ finished: rippleDone }) => {
          if (!finishedRef.current && rippleDone) {
            finishedRef.current = true;
            if (bubbleSoundRef.current) {
              bubbleSoundRef.current.stopAsync().then(() => {
                bubbleSoundRef.current?.unloadAsync();
              }).catch(() => {});
            }
            onFinishRef.current?.();
          }
        });

        playImpactSound();
      });
    };

    run();

    return () => {
      finishedRef.current = true;
      if (bubbleSoundRef.current) {
        bubbleSoundRef.current.stopAsync().then(() => {
          bubbleSoundRef.current?.unloadAsync();
        }).catch(() => {});
      }
    };
  }, [logoOpacity, rippleOpacity]);

  // Play impact sound
  const playImpactSound = async () => {
    try {
      // Dynamically import expo-av so the app bundles even if it's not installed
      const { Audio } = await import('expo-av');
      try {
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      } catch {}
      // Put your sound at assets/impact.mp3
      const { sound } = await Audio.Sound.createAsync(
        // @ts-ignore - optional asset, ok if missing in dev
        require('../../assets/impact.mp3')
      );
      try { await sound.playAsync(); } catch {}
    } catch (error) {
      // Silently ignore if asset missing
      // console.log('Sound error:', error);
    }
  };

  // Play bubble sound effect
  const playBubbleSound = async () => {
    try {
      // Dynamically import expo-av so the app bundles even if it's not installed
      const { Audio } = await import('expo-av');
      try {
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      } catch {}
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/audio/bubble-fx-343684.mp3'),
        { shouldPlay: false, volume: 0.5 } // Medium volume for startup sound
      );
      try { await sound.playAsync(); } catch {}
      
      // Unload sound after playing to free memory
      setTimeout(async () => {
        try {
          await sound.unloadAsync();
        } catch (e) {
          // Ignore unload errors
        }
      }, 3000);
    } catch (error) {
      // Silently ignore if asset missing or audio error
      // console.log('Bubble sound error:', error);
    }
  };

  return (
    <LinearGradient colors={['#6c2a84', '#4a1c5e']} style={styles.container}>
      {/* Floating bubble images */}
      {bubbles.map((bubble, idx) => {
        const bubbleRotate = bubble.rotate.interpolate({
          inputRange: [0, 360],
          outputRange: ['0deg', '360deg'],
        });
        
        return (
          <Animated.View
            key={`bubble-${idx}`}
            style={[
              styles.bubbleContainer,
              {
                left: bubble.initialX,
                opacity: bubble.opacity,
                transform: [
                  { translateY: bubble.translateY },
                  { translateX: bubble.translateX },
                  { scale: bubble.scale },
                  { rotate: bubbleRotate },
                ],
              },
            ]}
          >
            <Image
              source={require('../../assets/images/bubble.png')}
              style={[
                styles.bubbleImage,
                {
                  width: bubble.size,
                  height: bubble.size,
                },
              ]}
              resizeMode="contain"
            />
          </Animated.View>
        );
      })}

      {/* Background water ripples */}
      {bgRipples.map((r, idx) => (
        <Animated.View
          key={`bg-ripple-${idx}`}
          style={[
            styles.bgRipple,
            {
              opacity: r.opacity,
              transform: [{ scale: r.scale }],
            },
          ]}
        />
      ))}

      {/* Impact ripple */}
      <Animated.View
        style={[
          styles.ripple,
          {
            opacity: rippleOpacity,
            transform: [{ scale: rippleOpacity }],
          },
        ]}
      />

      {/* Logo */}
      <Animated.View
        style={[
          styles.logo,
          {
            opacity: logoOpacity,
          },
        ]}
      >
        <Image
          source={require('../../assets/images/Logo Naqiago White.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </Animated.View>

    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 160,
    height: 160,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: { width: '100%', height: '100%' },
  bgRipple: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  ripple: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  bubbleContainer: {
    position: 'absolute',
  },
  bubbleImage: {
    // Dynamic width and height will be set inline
  },
});
