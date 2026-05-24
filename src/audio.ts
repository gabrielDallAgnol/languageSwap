import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';

/** Speaks a German word/phrase using the device's German voice. */
export function speakGerman(text: string) {
  try {
    Speech.stop();
    Speech.speak(text, { language: 'de-DE', rate: 0.95 });
  } catch {
    // Speech is a nice-to-have; ignore failures (e.g. no German voice installed).
  }
}

export function hapticResult(correct: boolean) {
  try {
    Haptics.notificationAsync(
      correct ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error,
    );
  } catch {
    // Haptics unavailable on some devices/simulators; ignore.
  }
}
