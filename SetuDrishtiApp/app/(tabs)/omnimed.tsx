import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Activity, ShieldPlus, Map, ChevronLeft } from 'lucide-react-native';
import { useThemeContext } from '../../components/ThemeContext';

export default function HomeScreen() {
    const router = useRouter();
    const { theme: T, isDark } = useThemeContext();
    const styles = getStyles(T);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={T.pageBg} />
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
                <TouchableOpacity style={styles.backBtn} onPress={() => router.push('/(tabs)')}>
                    <ChevronLeft size={24} color={T.textPrimary} />
                </TouchableOpacity>

                <View style={styles.heroSection}>
                    <View style={styles.brandBadge}>
                        <Text style={styles.brandText}>INTELLIGENCE OS</Text>
                    </View>
                    <Text style={styles.title}>OmniMed Edge</Text>
                    <Text style={styles.subtitle}>Select your operational environment</Text>
                </View>

                <View style={styles.rolesContainer}>
                    {/* DOCTOR PORTAL */}
                    <TouchableOpacity activeOpacity={0.8} style={styles.roleCard} onPress={() => router.push('/omnimed-doctor')}>
                        <View style={styles.cardHeader}>
                            <View style={[styles.iconWrapper, { backgroundColor: T.docBg }]}>
                                <Activity size={32} color={T.docColor} />
                            </View>
                            <Text style={styles.roleTitle}>Physician{"\n"}Portal</Text>
                        </View>
                        <View style={styles.bulletList}>
                            <Text style={styles.bulletItem}><Text style={[styles.bulletDot, {color: T.docColor}]}>•</Text> AI Trial Matches</Text>
                            <Text style={styles.bulletItem}><Text style={[styles.bulletDot, {color: T.docColor}]}>•</Text> Neural Vision Analysis</Text>
                            <Text style={styles.bulletItem}><Text style={[styles.bulletDot, {color: T.docColor}]}>•</Text> Vital Anomalies</Text>
                            <Text style={styles.bulletItem}><Text style={[styles.bulletDot, {color: T.docColor}]}>•</Text> Risk Stratification</Text>
                        </View>
                    </TouchableOpacity>

                    {/* NURSE PORTAL */}
                    <TouchableOpacity activeOpacity={0.8} style={styles.roleCard} onPress={() => router.push('/omnimed-nurse')}>
                        <View style={styles.cardHeader}>
                            <View style={[styles.iconWrapper, { backgroundColor: T.nurseBg }]}>
                                <ShieldPlus size={32} color={T.nurseColor} />
                            </View>
                            <Text style={styles.roleTitle}>Frontline{"\n"}Triage</Text>
                        </View>
                        <View style={styles.bulletList}>
                            <Text style={styles.bulletItem}><Text style={[styles.bulletDot, {color: T.nurseColor}]}>•</Text> Neural Audio Intake</Text>
                            <Text style={styles.bulletItem}><Text style={[styles.bulletDot, {color: T.nurseColor}]}>•</Text> Contactless Vitals Scan</Text>
                            <Text style={styles.bulletItem}><Text style={[styles.bulletDot, {color: T.nurseColor}]}>•</Text> Post-Op Patient Recovery</Text>
                        </View>
                    </TouchableOpacity>

                    {/* DISTRICT PUSLE PORTAL */}
                    <TouchableOpacity activeOpacity={0.8} style={styles.roleCard} onPress={() => router.push('/omnimed-district')}>
                        <View style={styles.cardHeader}>
                            <View style={[styles.iconWrapper, { backgroundColor: T.distBg }]}>
                                <Map size={32} color={T.distColor} />
                            </View>
                            <Text style={styles.roleTitle}>District{"\n"}Health Pulse</Text>
                        </View>
                        <View style={styles.bulletList}>
                            <Text style={styles.bulletItem}><Text style={[styles.bulletDot, {color: T.distColor}]}>•</Text> Geo-tagged Outbreak Data</Text>
                            <Text style={styles.bulletItem}><Text style={[styles.bulletDot, {color: T.distColor}]}>•</Text> Supply Chain Predictors</Text>
                            <Text style={styles.bulletItem}><Text style={[styles.bulletDot, {color: T.distColor}]}>•</Text> District-wide Auto-Surveillance</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const getStyles = (T: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: T.pageBg },
    scrollContent: { paddingHorizontal: 24, paddingBottom: 60, paddingTop: 20 },
    backBtn: { marginBottom: 15, padding: 8, alignSelf: 'flex-start', borderRadius: 8, backgroundColor: T.blue50 },
    
    heroSection: { alignItems: 'center', marginBottom: 40 },
    brandBadge: { backgroundColor: T.blue50, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 16, borderWidth: 1, borderColor: T.blue100 },
    brandText: { color: T.blue700, fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
    title: { fontSize: 36, fontWeight: '900', color: T.textPrimary, letterSpacing: 0.5, marginBottom: 8 },
    subtitle: { fontSize: 16, color: T.textSecondary, fontWeight: '500' },
    
    rolesContainer: { gap: 20 },
    
    roleCard: {
        flexDirection: 'column',
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

    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    iconWrapper: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginRight: 18 },
    roleTitle: { fontSize: 24, fontWeight: '800', color: T.textPrimary, letterSpacing: 0.5 },
    
    bulletList: { marginLeft: 10 },
    bulletItem: { fontSize: 14, color: T.textSecondary, marginBottom: 8, fontWeight: '600', letterSpacing: 0.2 },
    bulletDot: { fontWeight: '900', marginRight: 6, fontSize: 16 }
});
