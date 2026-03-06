import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" backgroundColor="#faf8f5" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#faf8f5' } }} />
    </>
  );
}