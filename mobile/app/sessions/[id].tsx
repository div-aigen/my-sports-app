import { Redirect, useLocalSearchParams } from 'expo-router';

// This route handles deep links from https://lineup-sports.in/sessions/{session_id}
// It redirects to the existing session/[id] screen which handles auth and display
export default function SessionsRedirect() {
  const { id } = useLocalSearchParams();
  return <Redirect href={`/session/${id}`} />;
}
