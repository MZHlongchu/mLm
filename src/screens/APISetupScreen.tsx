import React from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { theme } from '../constants/theme';
import AppHeader from '../components/AppHeader';

const steps = [
  {
    title: '1. Start the Server',
    body: 'Go to the Server tab in InferrLM and toggle the server switch on. Your device IP and port will appear (e.g. http://192.168.1.10:8889).',
  },
  {
    title: '2. Download a Model',
    body: 'Make sure you have at least one GGUF model downloaded in the Models tab. The model name (without .gguf) is what you will use in API requests.',
  },
  {
    title: '3. Configure Your Client',
    body: 'Point any OpenAI-compatible client to your server. Set the base URL to http://<device-ip>:8889/v1. No API key is required — use any placeholder if the client requires one.',
  },
  {
    title: '4. Set the Model Name',
    body: 'Use the model name from the Models tab as the "model" field in your requests (e.g. "llama-3.2-1b"). The .gguf extension is optional.',
  },
  {
    title: '5. Send a Request',
    body: 'curl -X POST http://<device-ip>:8889/v1/chat/completions \\\n  -H "Content-Type: application/json" \\\n  -d \'{"model": "llama-3.2-1b", "messages": [{"role": "user", "content": "Hi"}]}\'',
  },
];

const clients = [
  { name: 'Python (OpenAI SDK)', config: 'client = OpenAI(base_url="http://<ip>:8889/v1", api_key="any")' },
  { name: 'Continue (VS Code)', config: 'Set provider to "openai", base URL to http://<ip>:8889/v1' },
  { name: 'Open WebUI', config: 'Add an OpenAI connection with base URL http://<ip>:8889/v1' },
  { name: 'Obsidian Copilot', config: 'Set OpenAI-compatible base URL to http://<ip>:8889/v1' },
];

export default function APISetupScreen() {
  const { theme: currentTheme } = useTheme();
  const themeColors = theme[currentTheme as 'light' | 'dark'];

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <AppHeader title="API Setup" showBackButton />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.heading, { color: themeColors.text }]}>
          Quick Start
        </Text>
        <Text style={[styles.subtitle, { color: themeColors.secondaryText }]}>
          Connect any OpenAI-compatible app to your local models
        </Text>

        {steps.map((step, i) => (
          <View
            key={i}
            style={[styles.card, { backgroundColor: currentTheme === 'dark' ? 'rgba(255,255,255,0.06)' : '#f7f9fc' }]}
          >
            <Text style={[styles.stepTitle, { color: themeColors.text }]}>
              {step.title}
            </Text>
            <Text
              style={[
                i === steps.length - 1 ? styles.codeText : styles.stepBody,
                { color: themeColors.secondaryText },
              ]}
            >
              {step.body}
            </Text>
          </View>
        ))}

        <Text style={[styles.heading, { color: themeColors.text, marginTop: 28 }]}>
          Client Examples
        </Text>

        {clients.map((c, i) => (
          <View
            key={i}
            style={[styles.card, { backgroundColor: currentTheme === 'dark' ? 'rgba(255,255,255,0.06)' : '#f7f9fc' }]}
          >
            <Text style={[styles.clientName, { color: themeColors.text }]}>
              {c.name}
            </Text>
            <Text style={[styles.codeText, { color: themeColors.secondaryText }]}>
              {c.config}
            </Text>
          </View>
        ))}

        <View style={[styles.note, { backgroundColor: currentTheme === 'dark' ? 'rgba(102,126,234,0.15)' : '#eef2ff' }]}>
          <Text style={[styles.noteText, { color: themeColors.text }]}>
            Both devices must be on the same WiFi network. The full API documentation is available at the server homepage when the server is running.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  stepBody: {
    fontSize: 14,
    lineHeight: 21,
  },
  codeText: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'Courier',
  },
  clientName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  note: {
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  noteText: {
    fontSize: 14,
    lineHeight: 21,
  },
});
