import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';

/** Speaks a German word/phrase using the device's German voice. */
export async function speakGerman(text: string) {
  try {
    // Only interrupt if something is already being spoken. Calling Speech.stop()
    // unconditionally right before Speech.speak() cancels the new utterance on iOS
    // (the stop and the freshly-queued speech race), so nothing was pronounced.
    if (await Speech.isSpeakingAsync()) {
      Speech.stop();
      // Let the synthesiser reset before queuing the next utterance.
      await new Promise((resolve) => setTimeout(resolve, 120));
    }
    Speech.speak(text, {
      language: 'de-DE',
      rate: 0.95,
      onError: (error) => console.warn('[speakGerman] speech error', error),
    });
  } catch (error) {
    // Speech is a nice-to-have; log so failures are visible but never crash the UI.
    console.warn('[speakGerman] failed', error);
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
