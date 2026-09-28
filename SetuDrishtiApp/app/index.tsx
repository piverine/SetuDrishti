import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { User, Activity, Moon, Sun } from 'lucide-react-native';
import { useThemeContext } from '../components/ThemeContext';

export default function RoleSelectionScreen() {
    const router = useRouter();
    const { theme: T, isDark, toggleTheme } = useThemeContext();
    const styles = getStyles(T);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={T.pageBg} />
            
            <TouchableOpacity style={styles.themeToggle} onPress={toggleTheme}>
                {isDark ? <Sun size={24} color={T.blue700} /> : <Moon size={24} color={T.blue700} />}
            </TouchableOpacity>

            <View style={styles.heroSection}>
                <View style={styles.brandBadge}>
                    <Text style={styles.brandText}>SETU-DRISHTI PLATFORM</Text>
                </View>
                <Text style={styles.title}>Select Your Role</Text>
                <Text style={styles.subtitle}>Unified entry for clinical and patient systems</Text>
            </View>

            <View style={styles.rolesContainer}>
                {/* DOCTOR PORTAL */}
                <TouchableOpacity 
                    activeOpacity={0.8} 
                    style={styles.roleCard} 
                    onPress={() => router.push({ pathname: '/(tabs)', params: { role: 'doctor' } })}
                >
                    <View style={styles.cardHeader}>
                        <View style={[styles.iconWrapper, { backgroundColor: T.docBg }]}>
                            <Activity size={32} color={T.docColor} />
                        </View>
                        <View style={{flexShrink: 1}}>
                            <Text style={styles.roleTitle}>Doctor Login</Text>
                            <Text style={styles.roleSub}>Access Setu-Drishti ICU & OmniMed OS</Text>
                        </View>
                    </View>
                </TouchableOpacity>

                {/* PATIENT PORTAL */}
                <TouchableOpacity 
                    activeOpacity={0.8} 
                    style={styles.roleCard} 
                    onPress={() => router.push({ pathname: '/(tabs)', params: { role: 'patient' } })}
                >
                    <View style={styles.cardHeader}>
                        <View style={[styles.iconWrapper, { backgroundColor: T.patientBg }]}>
                            <User size={32} color={T.patientColor} />
                        </View>
                        <View style={{flexShrink: 1}}>
                            <Text style={styles.roleTitle}>Patient Login</Text>
                            <Text style={styles.roleSub}>Access Sepsis Dashboard & Triage Interface</Text>
                        </View>
                    </View>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const getStyles = (T: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: T.pageBg, paddingHorizontal: 24, justifyContent: 'center' },
    themeToggle: { position: 'absolute', top: 20, right: 24, padding: 10, backgroundColor: T.blue50, borderRadius: 24, borderWidth: 1, borderColor: T.border },
    heroSection: { alignItems: 'center', marginBottom: 50 },
    brandBadge: { backgroundColor: T.blue50, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 16, borderWidth: 1, borderColor: T.blue100 },
    brandText: { color: T.blue700, fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
    title: { fontSize: 32, fontWeight: '900', color: T.textPrimary, letterSpacing: 0.5, marginBottom: 8 },
    subtitle: { fontSize: 15, color: T.textSecondary, fontWeight: '500', textAlign: 'center' },
    
    rolesContainer: { gap: 20 },
    roleCard: {
        padding: 24,
        backgroundColor: T.white,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: T.border,
        shadowColor: T.shadow,
        shadowOpacity: 1,
        shadowRadius: 15,
        shadowOffset: { width: 0, height: 6 },
        elevation: 5,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center' },
    iconWrapper: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    roleTitle: { fontSize: 22, fontWeight: '800', color: T.textPrimary, letterSpacing: 0.3, marginBottom: 4 },
    roleSub: { fontSize: 13, color: T.textSecondary, lineHeight: 18 }
});
