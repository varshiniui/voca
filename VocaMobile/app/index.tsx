// @ts-nocheck
import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, Animated, Easing,
} from 'react-native';
import { Audio } from 'expo-av';
import { useRouter } from 'expo-router';
import LanguagePicker, { Language, LANGUAGES } from '../components/LanguagePicker';
import { summarizeAudio } from '../services/api';

const MOOD_COLORS: Record<string, string> = {
  Focused:'#3b6ea5', Excited:'#b45309', Casual:'#2d7a5a',
  Professional:'#4a2d4e', Urgent:'#b91c1c', Reflective:'#1e5f74',
};

type Stage = 'idle' | 'recording' | 'preview' | 'loading' | 'result';

export default function HomeScreen() {
  const router = useRouter();
  const [stage, setStage]       = useState<Stage>('idle');
  const [language, setLanguage] = useState<Language>(LANGUAGES[0]);
  const [recTime, setRecTime]   = useState('00:00');
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [results, setResults]   = useState<any>(null);
  const [error, setError]       = useState<string | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef     = useRef<any>(null);
  const secondsRef   = useRef(0);
  const pulseAnim    = useRef(new Animated.Value(1)).current;

  const startPulse = () => Animated.loop(
    Animated.sequence([
      Animated.timing(pulseAnim, { toValue:1.12, duration:700, easing:Easing.inOut(Easing.ease), useNativeDriver:true }),
      Animated.timing(pulseAnim, { toValue:1,    duration:700, easing:Easing.inOut(Easing.ease), useNativeDriver:true }),
    ])
  ).start();

  const stopPulse = () => { pulseAnim.stopAnimation(); pulseAnim.setValue(1); };

  const startRecording = async () => {
    setError(null);
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) { setError('Microphone permission denied.'); return; }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      recordingRef.current = recording;
      secondsRef.current = 0;
      timerRef.current = setInterval(() => {
        secondsRef.current++;
        const m = Math.floor(secondsRef.current / 60);
        const s = secondsRef.current % 60;
        setRecTime(`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`);
      }, 1000);
      setStage('recording');
      startPulse();
    } catch (e: any) {
      setError('Could not start recording: ' + e.message);
    }
  };

  const stopRecording = async () => {
    clearInterval(timerRef.current);
    stopPulse();
    try {
      await recordingRef.current?.stopAndUnloadAsync();
      const uri = recordingRef.current?.getURI();
      setAudioUri(uri || null);
      setStage('preview');
    } catch (e: any) {
      setError('Failed to stop recording.');
      setStage('idle');
    }
  };

  const summarize = async () => {
    if (!audioUri) return;
    setStage('loading');
    setError(null);
    try {
      const data = await summarizeAudio(audioUri, language.code);
      setResults(data);
      setStage('result');
    } catch (e: any) {
      setError(e.message);
      setStage('preview');
    }
  };

  const reset = () => {
    setStage('idle'); setResults(null);
    setError(null); setRecTime('00:00'); setAudioUri(null);
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>

      {/* Header */}
      <View style={s.header}>
        <Text style={s.logo}>Voca</Text>
        <TouchableOpacity style={s.histBtn} onPress={() => router.push('/history')}>
          <Text style={s.histBtnText}>Notes ›</Text>
        </TouchableOpacity>
      </View>

      {/* Hero */}
      {stage === 'idle' && (
        <View style={s.hero}>
          <Text style={s.heroTag}>VOICE · INTELLIGENCE · CLARITY</Text>
          <Text style={s.heroTitle}>Speak your mind.</Text>
          <Text style={s.heroSub}>Your words, beautifully organised.</Text>
        </View>
      )}

      {/* Card */}
      <View style={s.card}>

        {/* Idle / Recording */}
        {(stage === 'idle' || stage === 'recording') && (
          <View style={s.recWrap}>
            {stage === 'idle' && (
              <View style={s.langRow}><LanguagePicker selected={language} onSelect={setLanguage} /></View>
            )}
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity
                style={[s.micBtn, stage === 'recording' && s.micBtnActive]}
                onPress={stage === 'recording' ? stopRecording : startRecording}
                activeOpacity={0.85}
              >
                <Text style={s.micIcon}>{stage === 'recording' ? '■' : '🎙'}</Text>
              </TouchableOpacity>
            </Animated.View>
            {stage === 'recording' ? (
              <View style={s.recInfo}>
                <View style={s.recDot} />
                <Text style={s.recTime}>{recTime}</Text>
              </View>
            ) : (
              <Text style={s.tapText}>Tap to record your note</Text>
            )}
            {stage === 'idle' && (
              <View style={s.pillRow}>
                {['◎ Transcribe','◈ Summarise','◇ Actions'].map((p,i) => (
                  <View key={i} style={s.pill}><Text style={s.pillText}>{p}</Text></View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Preview */}
        {stage === 'preview' && (
          <View style={s.previewWrap}>
            <Text style={s.previewTitle}>Recording ready · {recTime}</Text>
            <TouchableOpacity style={s.primaryBtn} onPress={summarize}>
              <Text style={s.primaryBtnText}>✦  Summarize Note</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.secondaryBtn} onPress={reset}>
              <Text style={s.secondaryBtnText}>Re-record</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Loading */}
        {stage === 'loading' && (
          <View style={s.loadingWrap}>
            <ActivityIndicator color="#4a2d4e" size="small" />
            <Text style={s.loadingText}>Working on your note…</Text>
            {['Transcribing your voice','Understanding your message','Organising your insights'].map((t,i) => (
              <View key={i} style={s.loadStep}>
                <View style={s.loadDot} />
                <Text style={s.loadStepText}>{t}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Result */}
        {stage === 'result' && results && (
          <View>
            <View style={s.resultHeader}>
              <View style={s.resultDot} />
              <Text style={s.resultHeaderText}>NOTE SUMMARY</Text>
              <TouchableOpacity onPress={() => router.push('/history')}>
                <Text style={s.viewAll}>View all →</Text>
              </TouchableOpacity>
            </View>
            {results.mood && (
              <View style={[s.moodTag, { borderColor:(MOOD_COLORS[results.mood]||'#6b5c52')+'40' }]}>
                <Text style={[s.moodText, { color: MOOD_COLORS[results.mood]||'#6b5c52' }]}>{results.mood}</Text>
              </View>
            )}
            <Text style={s.secLabel}>SUMMARY</Text>
            <Text style={s.summaryText}>{results.summary}</Text>
            <View style={s.divider} />
            <Text style={s.secLabel}>KEY POINTS</Text>
            {results.keyPoints?.map((pt: string, i: number) => (
              <View key={i} style={s.bulletRow}>
                <View style={s.bulletNum}><Text style={s.bulletNumText}>{i+1}</Text></View>
                <Text style={s.bulletText}>{pt}</Text>
              </View>
            ))}
            <View style={s.divider} />
            <Text style={s.secLabel}>ACTION ITEMS</Text>
            {results.actionItems?.map((a: string, i: number) => (
              <View key={i} style={s.bulletRow}>
                <View style={s.checkbox} />
                <Text style={s.bulletText}>{a}</Text>
              </View>
            ))}
            <View style={s.divider} />
            <TouchableOpacity style={s.primaryBtn} onPress={reset}>
              <Text style={s.primaryBtnText}>+ New Note</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {error && (
        <View style={s.errorBox}><Text style={s.errorText}>{error}</Text></View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:  { flex:1, backgroundColor:'#faf8f5' },
  content:    { padding:24, paddingBottom:60 },
  header:     { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:28, marginTop:12 },
  logo:       { fontSize:28, fontStyle:'italic', color:'#4a2d4e', fontWeight:'500' },
  histBtn:    { paddingHorizontal:14, paddingVertical:8, borderRadius:99, borderWidth:1, borderColor:'#e8e2d9', backgroundColor:'white' },
  histBtnText:{ fontSize:13, color:'#6b5c52', fontWeight:'500' },
  hero:       { alignItems:'center', marginBottom:28 },
  heroTag:    { fontSize:9, letterSpacing:2, color:'#c9a8cd', fontWeight:'600', marginBottom:10 },
  heroTitle:  { fontSize:38, color:'#2a1f1a', fontStyle:'italic', fontWeight:'400', marginBottom:6, textAlign:'center' },
  heroSub:    { fontSize:14, color:'#9e8f82', fontStyle:'italic' },
  card:       { backgroundColor:'#f4f1ec', borderRadius:22, padding:28, borderWidth:1, borderColor:'#e8e2d9', shadowColor:'#4a2d4e', shadowOffset:{width:0,height:4}, shadowOpacity:0.07, shadowRadius:16, elevation:3 },
  recWrap:    { alignItems:'center', gap:20 },
  langRow:    { width:'100%', alignItems:'flex-end' },
  micBtn:     { width:100, height:100, borderRadius:50, backgroundColor:'white', borderWidth:1, borderColor:'#e8e2d9', alignItems:'center', justifyContent:'center', shadowColor:'#4a2d4e', shadowOffset:{width:0,height:2}, shadowOpacity:0.08, shadowRadius:12, elevation:2 },
  micBtnActive:{ backgroundColor:'#4a2d4e', borderColor:'#4a2d4e' },
  micIcon:    { fontSize:36 },
  recInfo:    { flexDirection:'row', alignItems:'center', gap:8 },
  recDot:     { width:6, height:6, borderRadius:3, backgroundColor:'#4a2d4e' },
  recTime:    { fontSize:20, fontWeight:'600', color:'#2a1f1a', letterSpacing:2 },
  tapText:    { fontSize:14, color:'#9e8f82' },
  pillRow:    { flexDirection:'row', gap:6, flexWrap:'wrap', justifyContent:'center' },
  pill:       { paddingHorizontal:12, paddingVertical:4, borderRadius:99, borderWidth:1, borderColor:'#e8e2d9', backgroundColor:'rgba(255,255,255,0.6)' },
  pillText:   { fontSize:11, color:'#9e8f82', fontWeight:'500' },
  previewWrap:{ gap:12 },
  previewTitle:{ fontSize:13, color:'#6b5c52', fontWeight:'500', marginBottom:4 },
  primaryBtn: { backgroundColor:'#4a2d4e', borderRadius:12, height:52, alignItems:'center', justifyContent:'center', marginTop:8, shadowColor:'#4a2d4e', shadowOffset:{width:0,height:4}, shadowOpacity:0.3, shadowRadius:12, elevation:4 },
  primaryBtnText:{ color:'white', fontSize:15, fontWeight:'700' },
  secondaryBtn:  { backgroundColor:'white', borderRadius:12, height:44, alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:'#e8e2d9' },
  secondaryBtnText:{ color:'#6b5c52', fontSize:14, fontWeight:'500' },
  loadingWrap: { alignItems:'center', gap:12, paddingVertical:8 },
  loadingText: { fontSize:14, fontWeight:'500', color:'#2a1f1a' },
  loadStep:    { flexDirection:'row', alignItems:'center', gap:8, alignSelf:'flex-start' },
  loadDot:     { width:5, height:5, borderRadius:99, backgroundColor:'#c9a8cd' },
  loadStepText:{ fontSize:13, color:'#9e8f82' },
  resultHeader:{ flexDirection:'row', alignItems:'center', gap:8, marginBottom:16, paddingBottom:14, borderBottomWidth:1, borderBottomColor:'#e8e2d9' },
  resultDot:   { width:6, height:6, borderRadius:3, backgroundColor:'#4a2d4e' },
  resultHeaderText:{ flex:1, fontSize:10, fontWeight:'700', color:'#2a1f1a', letterSpacing:1.2 },
  viewAll:     { fontSize:12, color:'#c9a8cd', fontWeight:'500' },
  moodTag:     { alignSelf:'flex-start', paddingHorizontal:12, paddingVertical:4, borderRadius:99, borderWidth:1, marginBottom:16 },
  moodText:    { fontSize:11, fontWeight:'700' },
  secLabel:    { fontSize:9, fontWeight:'700', color:'#9e8f82', letterSpacing:1.5, textTransform:'uppercase', marginBottom:10 },
  summaryText: { fontSize:14, color:'#2a1f1a', lineHeight:22 },
  divider:     { height:1, backgroundColor:'#e8e2d9', marginVertical:16 },
  bulletRow:   { flexDirection:'row', gap:10, marginBottom:8, alignItems:'flex-start' },
  bulletNum:   { width:18, height:18, borderRadius:5, backgroundColor:'white', borderWidth:1, borderColor:'#e8e2d9', alignItems:'center', justifyContent:'center', marginTop:2 },
  bulletNumText:{ fontSize:9, fontWeight:'800', color:'#4a2d4e' },
  bulletText:  { flex:1, fontSize:13, color:'#6b5c52', lineHeight:20 },
  checkbox:    { width:14, height:14, borderRadius:3, borderWidth:1, borderColor:'#d6cfc4', marginTop:3 },
  errorBox:    { marginTop:12, padding:12, backgroundColor:'#fef2f2', borderRadius:10, borderWidth:1, borderColor:'#fecaca' },
  errorText:   { fontSize:12, color:'#b91c1c', fontWeight:'500' },
});