import { ColorSchemeName, useColorScheme as useColorSchemeCore } from 'react-native';

export function useColorScheme(): NonNullable<ColorSchemeName> {
  const coreScheme = useColorSchemeCore();
  return coreScheme ?? 'light';
}
