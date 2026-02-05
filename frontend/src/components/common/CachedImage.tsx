import React from 'react';
import { Image, type ImageProps, type ImageSource } from 'expo-image';
import { StyleSheet, View, type ViewStyle, type StyleProp } from 'react-native';

interface CachedImageProps extends Omit<ImageProps, 'source'> {
  uri?: string;
  source?: ImageSource;
  fallbackIcon?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
}

/**
 * CachedImage - Image component with built-in caching via expo-image
 *
 * Benefits:
 * - Automatic disk and memory caching
 * - Smooth transitions with fade-in
 * - Placeholder blur hash support
 * - Better memory management than RN Image
 *
 * Usage:
 * <CachedImage
 *   uri="https://example.com/avatar.jpg"
 *   style={{ width: 50, height: 50, borderRadius: 25 }}
 *   fallbackIcon={<Ionicons name="person" size={24} />}
 * />
 */
const CachedImage: React.FC<CachedImageProps> = ({
  uri,
  source,
  style,
  fallbackIcon,
  containerStyle,
  placeholder,
  contentFit = 'cover',
  transition = 200,
  ...rest
}) => {
  // If no URI and no source, show fallback
  if (!uri && !source) {
    if (fallbackIcon) {
      return (
        <View style={[styles.fallbackContainer, containerStyle, style]}>
          {fallbackIcon}
        </View>
      );
    }
    return null;
  }

  const imageSource = source ?? { uri };

  return (
    <Image
      source={imageSource}
      style={style}
      contentFit={contentFit}
      transition={transition}
      placeholder={placeholder}
      // Enable caching
      cachePolicy="memory-disk"
      // Recycle images for better performance in lists
      recyclingKey={uri}
      {...rest}
    />
  );
};

const styles = StyleSheet.create({
  fallbackContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
  },
});

export default CachedImage;
