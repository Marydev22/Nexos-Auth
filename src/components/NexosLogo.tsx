import { StyleSheet, View, ViewStyle } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { NEXOS_LOGO_XML } from '@/constants/logo';

export function NexosLogo({ size = 120 }: { size?: number }) {
  return (
    <View style={[styles.container, { width: size, height: size * (190 / 160) }]}>
      <SvgXml xml={NEXOS_LOGO_XML} width={size} height={size * (190 / 160)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
});