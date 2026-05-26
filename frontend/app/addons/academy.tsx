// Phase 1I · Academy LMS — courses + my enrolments + progress.
import React, { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { AcademyApi, Course, Enrolment } from "@/src/api/extras";
import { Card, EmptyState, Eyebrow, MONO, Pill, ScreenHeader } from "@/src/components/ui";
import { TOKENS, COLORS, useAccent } from "@/src/theme/colors";

export default function AcademyScreen() {
  const accent = useAccent();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolments, setEnrolments] = useState<Enrolment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [c, e] = await Promise.all([AcademyApi.courses(), AcademyApi.myEnrolments().catch(() => [])]);
      setCourses(Array.isArray(c) ? c : []); setEnrolments(Array.isArray(e) ? e : []);
    } catch (er: any) { setError(er?.detail ?? "Could not load Academy."); }
    finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  const enrol = async (course_id: string) => {
    try { await AcademyApi.enrol(course_id); Alert.alert("Enrolled", "You're enrolled. Tap the course to start."); load(); }
    catch (er: any) { Alert.alert("Enrol failed", er?.detail ?? ""); }
  };

  const enrolmentFor = (cid: string) => enrolments.find(e => e.course_id === cid);

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={s.content}>
        <TouchableOpacity onPress={() => router.back()} style={s.back}><Ionicons name="chevron-back" size={22} color={COLORS.textSecondary} /></TouchableOpacity>
        <ScreenHeader eyebrow="Add-on" title="SafeBase Academy" subtitle="Microlearning courses on WHS, Food Safety, Fatigue, Customer Aggression, Aged-Care quality." accent={accent} />
        {loading ? <ActivityIndicator color={accent} style={{ marginTop: 24 }} /> :
          error ? <Card><Text style={{ color: TOKENS.destructive }}>{error}</Text></Card> :
          courses.length === 0 ? <EmptyState icon="school-outline" title="No courses available" body="Academy courses will appear here once your plan includes them." /> :
          courses.map((c) => {
            const e = enrolmentFor(c.course_id);
            return (
              <Card key={c.course_id} testID={`acad-${c.course_id}`}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.title}>{c.title}</Text>
                    <Text style={[s.meta, { fontFamily: MONO }]}>{c.duration_min ? `${c.duration_min} min` : ""}{c.tags?.length ? ` · ${c.tags.join(", ")}` : ""}</Text>
                    {e ? <Text style={s.sub}>Progress: {Math.round((e.progress ?? 0) * 100)}%{e.completed ? " · complete" : ""}</Text> : null}
                  </View>
                  {e ? <Pill label={e.completed ? "DONE" : "IN PROGRESS"} color={e.completed ? TOKENS.success : TOKENS.warnInk} /> : (
                    <TouchableOpacity onPress={() => enrol(c.course_id)} style={{ paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: accent }}>
                      <Text style={{ color: accent, fontWeight: "800", fontSize: 12, letterSpacing: 1.2 }}>ENROL</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </Card>
            );
          })}
        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: TOKENS.background },
  content: { padding: 20, paddingBottom: 40 },
  back: { padding: 4, marginBottom: 6 },
  title: { color: TOKENS.ink, fontSize: 15, fontWeight: "700" },
  meta: { color: COLORS.textSecondary, fontSize: 12, marginTop: 4 },
  sub: { color: COLORS.textMuted, fontSize: 12, marginTop: 4 },
});
