import React, { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet } from 'react-native';
import { CHARACTER_LAYOUTS, getCharacterSprite } from '../assets/storyAssets';

export default function CharacterSprite({ characterId, expression, isActive }) {
  const bob = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, {
          toValue: -6,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(bob, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();

    return () => {
      loop.stop();
    };
  }, [bob]);

  return (
    <Animated.View
      style={[
        styles.spriteWrap,
        CHARACTER_LAYOUTS[characterId],
        {
          opacity: isActive ? 1 : 0.45,
          transform: [{ translateY: bob }, { scale: isActive ? 1 : 0.94 }],
        },
      ]}
    >
      <Image
        source={getCharacterSprite(characterId, expression)}
        resizeMode="contain"
        style={styles.sprite}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  spriteWrap: {
    position: 'absolute',
    bottom: 0,
    height: '100%',
    justifyContent: 'flex-end',
  },
  sprite: {
    width: '100%',
    height: '82%',
  },
});
