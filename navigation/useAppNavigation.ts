import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';

/**
 * Typed navigation handle for the root stack, usable from any screen
 * (including ones nested inside the bottom-tab navigator — React Navigation
 * automatically bubbles `navigate()` calls up to the ancestor that owns the
 * requested route, so tab-root screens can push full-screen flows like
 * NewMother/CameraScreening/MotherDetail directly).
 */
export function useAppNavigation() {
  return useNavigation<NativeStackNavigationProp<RootStackParamList>>();
}
