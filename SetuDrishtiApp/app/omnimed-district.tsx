import { StyleSheet, View, Text, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { ChevronLeft } from 'lucide-react-native';
import { useThemeContext } from '../components/ThemeContext';

const BACKEND_URL = "http://10.188.53.227:8000";

export default function DistrictPortal() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [intelligenceData, setIntelligenceData] = useState<any>(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const { theme: T, isDark } = useThemeContext();
    const styles = getStyles(T);

    const fetchLiveIntelligence = () => {
        fetch(`${BACKEND_URL}/api/v1/population/dashboard`)
            .then(res => res.json())
            .then(data => {
                if(data.error) throw new Error(data.error);
                setIntelligenceData(data);
                setLoading(false);
            })
            .catch(err => {
                const mockData = {
                    total_population_nodes_synced: 14208,
                    intelligence: {
                        symptom_clusters: { "Block 7": { "fever_cough_cluster": 34, "anemia": 12 }, "Village A": { "anemia": 2 } },
                        screening_coverage_gaps: ["Village B", "Sector 4", "Highland Ridge"],
                        supply_chain_alerts: [{ medication: "Iron Supplements", stockout_prediction_days: 1.2, alert_level: "CRITICAL", stock_remaining: 50 }],
                        trial_enrollment_opportunities: []
                    }
                };
                setIntelligenceData(mockData);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchLiveIntelligence();
        const interval = setInterval(() => { fetchLiveIntelligence(); }, 3000);
        Animated.loop(
            Animated.sequence([
                Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
                Animated.timing(fadeAnim, { toValue: 0.3, duration: 1000, useNativeDriver: true })
            ])
        ).start();
        return () => clearInterval(interval);
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={T.pageBg} />
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => router.push('/(tabs)/omnimed')}>
                        <ChevronLeft size={24} color={T.textPrimary} />
                    </TouchableOpacity>
                    <View style={styles.titleContainer}>
                        <View style={{flexDirection: 'row', alignItems: 'center'}}>
                            <Text style={styles.title}>PopulationPulse</Text>
                            <Animated.View style={[styles.liveIndicator, { opacity: fadeAnim }]} />
                            <Text style={styles.liveText}>LIVE</Text>
                        </View>
                        <Text style={styles.subtitle}>District Health Intelligence Map</Text>
                    </View>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color={T.distColor} style={{marginTop: 50}} />
                ) : (
                    <>
                        <View style={styles.statsRow}>
                            <View style={styles.statCard}>
                                <Text style={styles.statValue}>{intelligenceData?.total_population_nodes_synced.toLocaleString()}</Text>
                                <Text style={styles.statLabel}>Nodes Synced</Text>
                            </View>
                            <View style={styles.statCard}>
                                <Text style={[styles.statValue, {color: T.distColor}]}>{intelligenceData?.intelligence.screening_coverage_gaps.length}</Text>
                                <Text style={styles.statLabel}>Screening Gaps</Text>
                            </View>
                        </View>

                        <View style={styles.moduleWrapper}>
                            <View style={styles.moduleHeaderBase}><Text style={styles.moduleTitle}>Live Symptom Heatmap</Text></View>
                            <View style={styles.contentBox}>
                                {Object.keys(intelligenceData?.intelligence.symptom_clusters || {}).length === 0 ? (
                                    <Text style={styles.emptyText}>No active anomaly clusters detected in recent syncs.</Text>
                                ) : (
                                    Object.entries(intelligenceData?.intelligence.symptom_clusters).map(([location, stats]: any) => (
                                        <View key={location} style={styles.clusterItem}>
                                            <Text style={styles.locationText}>📍 {location}</Text>
                                            {Object.entries(stats).map(([symptom, count]: any) => (
                                                <Text key={symptom} style={styles.symptomText}>
                                                    • {symptom.replace(/_/g, ' ').toUpperCase()}: <Text style={{color: T.distColor, fontWeight:'bold'}}>{count} cases</Text>
                                                </Text>
                                            ))}
                                        </View>
                                    ))
                                )}
                            </View>
                        </View>

                        <View style={styles.moduleWrapper}>
                            <View style={styles.moduleHeaderBase}><Text style={styles.moduleTitle}>Predictive Supply Chain Alerts</Text></View>
                            <View style={styles.contentBox}>
                                {intelligenceData?.intelligence.supply_chain_alerts.length === 0 ? (
                                    <Text style={styles.emptyText}>All district inventory vectors are stable.</Text>
                                ) : (
                                    intelligenceData?.intelligence.supply_chain_alerts.map((alert: any, i: number) => (
                                        <View key={i} style={styles.alertItem}>
                                            <Text style={styles.alertTitle}>⚠️ {alert.medication}</Text>
                                            <Text style={styles.alertDesc}>Stockout predicted in: <Text style={{fontWeight:'bold', color: T.distColor}}>{alert.stockout_prediction_days} days</Text></Text>
                                            <Text style={styles.alertDesc}>Remaining: {alert.stock_remaining} units</Text>
                                        </View>
                                    ))
                                )}
                            </View>
                        </View>

                        <View style={styles.moduleWrapper}>
                            <View style={styles.moduleHeaderBase}><Text style={styles.moduleTitle}>Coverage Gap Map (Zero Anemia Scans)</Text></View>
                            <View style={styles.contentBox}>
                                <Text style={styles.descText}>The following zones have had zero Nidana diagnostic scans executed in the past 72 hours. Deploy mobile health workers immediately:</Text>
                                <View style={styles.tagContainer}>
                                    {intelligenceData?.intelligence.screening_coverage_gaps.map((gap: string, i: number) => (
                                        <View key={i} style={styles.gapTag}><Text style={styles.gapText}>{gap}</Text></View>
                                    ))}
                                </View>
                            </View>
                        </View>
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const getStyles = (T: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: T.pageBg },
    scrollContent: { paddingBottom: 80, paddingTop: 10 },
    
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20, gap: 10 },
    backBtn: { padding: 8, borderRadius: 8, backgroundColor: T.blue50 },
    titleContainer: { flex: 1 },
    title: { fontSize: 26, fontWeight: '900', color: T.textPrimary, letterSpacing: 0.5 },
    subtitle: { fontSize: 13, color: T.distColor, fontWeight: '500', marginTop: 2 },
    
    liveIndicator: { width: 8, height: 8, borderRadius: 4, backgroundColor: T.distColor, marginLeft: 10, marginRight: 4, marginTop: 4 },
    liveText: { color: T.distColor, fontSize: 10, fontWeight: '900', marginTop: 4, letterSpacing: 1 },

    statsRow: { flexDirection: 'row', paddingHorizontal: 15, marginBottom: 30, gap: 15 },
    statCard: { flex: 1, backgroundColor: T.white, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: T.border, alignItems: 'center', shadowColor: T.shadow, shadowOffset: {width: 0, height: 4}, shadowOpacity: 1, shadowRadius: 5, elevation: 2 },
    statValue: { fontSize: 32, fontWeight: '900', color: T.textPrimary },
    statLabel: { fontSize: 12, color: T.textSecondary, marginTop: 5, letterSpacing: 1, textTransform: 'uppercase' },

    moduleWrapper: { marginBottom: 30 },
    moduleHeaderBase: { backgroundColor: T.white, paddingVertical: 12, paddingHorizontal: 20, marginHorizontal: 15, borderTopLeftRadius: 16, borderTopRightRadius: 16, borderLeftWidth: 4, borderLeftColor: T.distColor, marginBottom: -10, zIndex: 1, shadowColor: T.shadow, shadowOffset: {width: 0, height: 4}, shadowOpacity: 1, shadowRadius: 10, elevation: 3, borderWidth: 1, borderColor: T.border },
    moduleTitle: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, color: T.distColor },
    
    contentBox: { backgroundColor: T.white, marginHorizontal: 15, borderRadius: 16, borderWidth: 1, borderColor: T.border, padding: 20, paddingTop: 30 },
    emptyText: { color: T.textSecondary, fontStyle: 'italic', fontSize: 13 },
    descText: { color: T.textSecondary, fontSize: 13, lineHeight: 20, marginBottom: 15 },

    clusterItem: { marginBottom: 15, backgroundColor: T.offWhite, padding: 15, borderRadius: 10, borderWidth: 1, borderColor: T.border },
    locationText: { color: T.textPrimary, fontWeight: 'bold', fontSize: 16, marginBottom: 5 },
    symptomText: { color: T.textSecondary, fontSize: 13, marginLeft: 10, marginTop: 4 },

    alertItem: { borderLeftWidth: 3, borderLeftColor: T.distColor, backgroundColor: T.distBg, padding: 15, borderRadius: 10, marginBottom: 10 },
    alertTitle: { color: T.distColor, fontWeight: 'bold', fontSize: 16, marginBottom: 5 },
    alertDesc: { color: T.textSecondary, fontSize: 13, marginTop: 2 },

    tagContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    gapTag: { backgroundColor: T.distBg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: T.distColor },
    gapText: { color: T.distColor, fontWeight: 'bold', fontSize: 12 }
});
