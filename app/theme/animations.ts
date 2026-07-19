import { LayoutAnimation, Platform, UIManager } from 'react-native';

let enabled = false;

export function enableLayoutAnimations(): void {
  if (enabled) return;
  if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
  enabled = true;
}

export function animateLayout(): void {
  enableLayoutAnimations();
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
}

export const animationConfig = {
  durationFast: 150,
  durationNormal: 250,
  durationSlow: 400,
} as const;
