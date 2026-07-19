import { useEffect, useRef, useState } from 'react';
import { Image, View } from 'react-native';

const frames = [
  require('../assets/loader/frame_1.png'),
  require('../assets/loader/frame_2.png'),
  require('../assets/loader/frame_3.png'),
  require('../assets/loader/frame_4.png'),
  // require('../assets/loader/frame_5.png'),
];

export default function MotoLoader({ size = 220, fps = 8 }) {
  const [index, setIndex] = useState(0);
  const ref = useRef();

  useEffect(() => {
    ref.current = setInterval(() => {
      setIndex((i) => (i + 1) % frames.length);
    }, 1000 / fps);
    return () => clearInterval(ref.current);
  }, [fps]);

  return (
    <View style={{ width: size, height: size * 0.7 }}>
      <Image
        source={frames[index]}
        style={{ width: '100%', height: '100%' }}
        resizeMode="contain"
      />
    </View>
  );
}
