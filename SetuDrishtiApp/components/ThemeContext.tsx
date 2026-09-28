import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Appearance } from 'react-native';

export const lightTheme = {
    pageBg: '#F0F4F8', white: '#FFFFFF', offWhite: '#F7FAFC',
    blue900: '#0A2540', blue800: '#0D3B6E', blue700: '#1155A6', blue600: '#1565C0', blue500: '#1976D2', blue400: '#2196F3', blue100: '#BBDEFB', blue50: '#E3F2FD',
    critical: '#C62828', critBg: '#FFEBEE', critBdr: '#EF9A9A', 
    high: '#E65100', highBg: '#FFF3E0', highBdr: '#FFCC80', 
    watch: '#F57F17', watchBg: '#FFFDE7', watchBdr: '#FFF176', 
    safe: '#1B5E20', safeBg: '#E8F5E9', safeBdr: '#A5D6A7',
    textPrimary: '#0A2540', textSecondary: '#4A6080', textMuted: '#8A9BB0', textWhite: '#FFFFFF',
    border: '#D0DCE8', divider: '#E8EEF4', shadow: 'rgba(10,37,64,0.10)',
    docColor: '#1155A6', docBg: '#E3F2FD', 
    nurseColor: '#E65100', nurseBg: '#FFF3E0', 
    distColor: '#C62828', distBg: '#FFEBEE', 
    patientColor: '#1976D2', patientBg: '#E3F2FD',
    isDark: false,
};

export const darkTheme = {
    pageBg: '#09090b', white: '#121214', offWhite: '#1c1c1e',
    blue900: '#ffffff', blue800: '#e4e4e7', blue700: '#3399ff', blue600: '#3399ff', blue500: '#1976D2', blue400: '#2196F3', blue100: '#233350', blue50: '#1a2333',
    critical: '#ff3366', critBg: '#2a1a1f', critBdr: '#6b2b3c', 
    high: '#ffcc00', highBg: '#2e2715', highBdr: '#66551b', 
    watch: '#F57F17', watchBg: '#2a2213', watchBdr: '#634b17', 
    safe: '#00cc99', safeBg: '#132c25', safeBdr: '#1d5a49',
    textPrimary: '#ffffff', textSecondary: '#a1a1aa', textMuted: '#71717a', textWhite: '#FFFFFF',
    border: '#27272a', divider: '#27272a', shadow: '#000000',
    docColor: '#00cc99', docBg: 'rgba(0, 204, 153, 0.15)', 
    nurseColor: '#ffcc00', nurseBg: 'rgba(255, 204, 0, 0.15)', 
    distColor: '#ff3366', distBg: 'rgba(255, 51, 102, 0.15)', 
    patientColor: '#3399ff', patientBg: 'rgba(51, 153, 255, 0.15)',
    isDark: true,
};

type ThemeContextType = {
    theme: typeof lightTheme;
    isDark: boolean;
    toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
    theme: lightTheme,
    isDark: false,
    toggleTheme: () => {},
});

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    // Default to device preference
    const [isDark, setIsDark] = useState(Appearance.getColorScheme() === 'dark');

    const toggleTheme = () => setIsDark(prev => !prev);
    const theme = isDark ? darkTheme : lightTheme;

    return (
        <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useThemeContext = () => useContext(ThemeContext);
