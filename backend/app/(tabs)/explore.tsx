import { View, Text, StyleSheet } from 'react-native';
export default function ExploreScreen() {
  return <View style={s.c}><Text style={s.t}>Explore</Text></View>;
}
const s = StyleSheet.create({ c: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0A0A' }, t: { color: '#fff', fontSize: 18 } });
