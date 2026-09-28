import { StyleSheet, View, Text, ScrollView, StatusBar, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import PulseWatch from '../components/PulseWatch';
import TrialBridge from '../components/TrialBridge';
import PrivacyLedger from '../components/PrivacyLedger';
import { useThemeContext } from '../components/ThemeContext';

export default function PatientPortal() {
    const router = useRouter();
    const { theme: T, isDark } = useThemeContext();
    const styles = getStyles(T);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={T.pageBg} />
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => router.push('/(tabs)?role=patient')}>
                        <ChevronLeft size={24} color={T.textPrimary} />
                    </TouchableOpacity>
                    <View style={styles.titleContainer}>
                        <Text style={styles.title}>Patient Terminal</Text>
                        <Text style={styles.subtitle}>Verified Health Passport & Privacy Manager</Text>
                    </View>
                </View>

                <View style={styles.moduleWrapper}>
                    <View style={styles.moduleHeaderBase}><Text style={styles.moduleTitle}>Aggregator Device Sync (PulseWatch)</Text></View>
                    <PulseWatch />
                </View>

                <View style={styles.moduleWrapper}>
                    <View style={styles.moduleHeaderBase}><Text style={styles.moduleTitle}>Clinical Trial Matches (TrialBridge)</Text></View>
                    <TrialBridge />
                </View>

                <View style={styles.moduleWrapper}>
                    <View style={styles.moduleHeaderBase}><Text style={styles.moduleTitle}>Privacy & Consent Ledger</Text></View>
                    <PrivacyLedger />
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const getStyles = (T: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: T.pageBg },
    scrollContent: { paddingBottom: 80, paddingTop: 10 },
    
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 30, gap: 15 },
    backBtn: { padding: 8, borderRadius: 8, backgroundColor: T.blue50 },
    
    titleContainer: { flex: 1 },
    title: { fontSize: 26, fontWeight: '900', color: T.textPrimary, letterSpacing: 0.5 },
    subtitle: { fontSize: 13, color: T.patientColor, fontWeight: '500', marginTop: 2 },
    
    moduleWrapper: { marginBottom: 40 },
    moduleHeaderBase: { backgroundColor: T.white, paddingVertical: 12, paddingHorizontal: 20, marginHorizontal: 15, borderTopLeftRadius: 16, borderTopRightRadius: 16, borderLeftWidth: 4, borderLeftColor: T.patientColor, marginBottom: -10, zIndex: 1, shadowColor: T.shadow, shadowOffset: {width: 0, height: 4}, shadowOpacity: 1, shadowRadius: 10, elevation: 3, borderWidth: 1, borderColor: T.border },
    moduleTitle: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, color: T.patientColor },
});
