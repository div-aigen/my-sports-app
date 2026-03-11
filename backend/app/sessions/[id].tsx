import { Redirect, useLocalSearchParams } from 'expo-router';
export default function SessionsRedirect() {
  const { id } = useLocalSearchParams();
  return <Redirect href={`/session/${id}`} />;
}
