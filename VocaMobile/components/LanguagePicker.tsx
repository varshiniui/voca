import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, StyleSheet } from 'react-native';

export const LANGUAGES = [
  { code: 'en',  label: 'English',     flag: '🇬🇧' },
  { code: 'ta',  label: 'Tamil',       flag: '🇮🇳' },
  { code: 'hi',  label: 'Hindi',       flag: '🇮🇳' },
  { code: 'ml',  label: 'Malayalam',   flag: '🇮🇳' },
  { code: 'es',  label: 'Spanish',     flag: '🇪🇸' },
  { code: 'fr',  label: 'French',      flag: '🇫🇷' },
  { code: null,  label: 'Auto-detect', flag: '🌐' },
];

export type Language = typeof LANGUAGES[0];

export default function LanguagePicker({ selected, onSelect }: { selected: Language; onSelect: (l: Language) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <TouchableOpacity style={s.btn} onPress={() => setOpen(true)}>
        <Text style={s.flag}>{selected.flag}</Text>
        <Text style={s.label}>{selected.label}</Text>
        <Text style={s.chevron}>▾</Text>
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="slide">
        <Pressable style={s.backdrop} onPress={() => setOpen(false)}>
          <View style={s.sheet}>
            <Text style={s.sheetTitle}>Select Language</Text>
            {LANGUAGES.map((lang, i) => (
              <TouchableOpacity key={i} style={[s.option, i < LANGUAGES.length-1 && s.border]}
                onPress={() => { onSelect(lang); setOpen(false); }}>
                <Text style={s.optFlag}>{lang.flag}</Text>
                <Text style={[s.optLabel, selected.label === lang.label && s.optActive]}>{lang.label}</Text>
                {selected.label === lang.label && <Text style={s.check}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  btn:      { flexDirection:'row', alignItems:'center', gap:6, paddingHorizontal:14, paddingVertical:8, backgroundColor:'white', borderRadius:99, borderWidth:1, borderColor:'#e8e2d9' },
  flag:     { fontSize:15 },
  label:    { fontSize:13, fontWeight:'500', color:'#6b5c52' },
  chevron:  { fontSize:10, color:'#9e8f82' },
  backdrop: { flex:1, backgroundColor:'rgba(42,31,26,0.3)', justifyContent:'flex-end' },
  sheet:    { backgroundColor:'#faf8f5', borderTopLeftRadius:20, borderTopRightRadius:20, padding:24, paddingBottom:44 },
  sheetTitle:{ fontSize:11, fontWeight:'700', color:'#9e8f82', letterSpacing:1.5, textTransform:'uppercase', marginBottom:14 },
  option:   { flexDirection:'row', alignItems:'center', gap:12, paddingVertical:14 },
  border:   { borderBottomWidth:1, borderBottomColor:'#f4f1ec' },
  optFlag:  { fontSize:20 },
  optLabel: { flex:1, fontSize:15, color:'#6b5c52' },
  optActive:{ color:'#4a2d4e', fontWeight:'700' },
  check:    { fontSize:14, color:'#4a2d4e', fontWeight:'700' },
});