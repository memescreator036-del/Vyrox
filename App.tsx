import "react-native-url-polyfill/auto";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator, Alert, FlatList, KeyboardAvoidingView,
  Platform, SafeAreaView, StyleSheet, Text, TextInput,
  TouchableOpacity, View
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { supabase } from "./src/lib/supabase";

type Message = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user) loadMessages();
    else setMessages([]);
  }, [session?.user?.id]);

  async function signInOrSignUp(create: boolean) {
    if (!email.trim() || password.length < 6) {
      Alert.alert("Check your details", "Enter an email and a password of at least 6 characters.");
      return;
    }
    const result = create
      ? await supabase.auth.signUp({ email: email.trim(), password })
      : await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (result.error) Alert.alert("Account error", result.error.message);
    else if (create) Alert.alert("Check your email", "If email confirmation is enabled, confirm your email before signing in.");
  }

  async function loadMessages() {
    const { data, error } = await supabase
      .from("messages")
      .select("id,sender_id,content,created_at")
      .order("created_at", { ascending: true })
      .limit(100);
    if (error) {
      Alert.alert("Messages", "The chat database is not ready yet. Check the setup guide.");
      return;
    }
    setMessages((data || []) as Message[]);
  }

  async function sendMessage() {
    const content = draft.trim();
    if (!content || !session?.user || sending) return;
    setSending(true);
    // A conversation must exist and the user must be a member before sending.
    // This starter does not create conversations automatically.
    const { error } = await supabase.from("messages").insert({
      conversation_id: null,
      sender_id: session.user.id,
      content
    });
    setSending(false);
    if (error) {
      Alert.alert("Message not sent", "A conversation must be created and joined first. This is the initial app foundation.");
      return;
    }
    setDraft("");
    loadMessages();
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color="#8B7CFF" /></View>;

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.logo}>VYROX</Text>
        <Text style={styles.tagline}>YOUR PEOPLE. YOUR TERMS.</Text>
      </View>
      {!session ? (
        <View style={styles.auth}>
          <Text style={styles.heading}>Welcome to VYROX</Text>
          <Text style={styles.muted}>Create an account or sign in to continue.</Text>
          <TextInput value={email} onChangeText={setEmail} placeholder="Email address" placeholderTextColor="#77798A" autoCapitalize="none" keyboardType="email-address" style={styles.input} />
          <TextInput value={password} onChangeText={setPassword} placeholder="Password (minimum 6 characters)" placeholderTextColor="#77798A" secureTextEntry style={styles.input} />
          <TouchableOpacity style={styles.primary} onPress={() => signInOrSignUp(true)}><Text style={styles.primaryText}>Create account</Text></TouchableOpacity>
          <TouchableOpacity style={styles.secondary} onPress={() => signInOrSignUp(false)}><Text style={styles.secondaryText}>Sign in</Text></TouchableOpacity>
        </View>
      ) : (
        <KeyboardAvoidingView style={styles.chat} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={styles.row}>
            <Text style={styles.heading}>Messages</Text>
            <TouchableOpacity onPress={() => supabase.auth.signOut()}><Text style={styles.link}>Sign out</Text></TouchableOpacity>
          </View>
          <Text style={styles.muted}>Signed in as {session.user.email}</Text>
          <FlatList
            style={styles.list}
            data={messages}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={<Text style={styles.empty}>Your messages will appear here after a conversation is set up.</Text>}
            renderItem={({ item }) => (
              <View style={[styles.bubble, item.sender_id === session.user.id && styles.ownBubble]}>
                <Text style={styles.message}>{item.content}</Text>
              </View>
            )}
          />
          <View style={styles.composer}>
            <TextInput value={draft} onChangeText={setDraft} placeholder="Write a message..." placeholderTextColor="#77798A" style={styles.messageInput} />
            <TouchableOpacity style={styles.send} onPress={sendMessage} disabled={sending}><Text style={styles.primaryText}>{sending ? "…" : "Send"}</Text></TouchableOpacity>
          </View>
          <Text style={styles.note}>Starter build: direct and group conversation creation is the next implementation step.</Text>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#090B12", padding: 22 },
  center: { flex: 1, backgroundColor: "#090B12", alignItems: "center", justifyContent: "center" },
  header: { paddingTop: 22, paddingBottom: 34 },
  logo: { color: "#FFFFFF", fontSize: 34, fontWeight: "900", letterSpacing: 5 },
  tagline: { color: "#8B7CFF", fontSize: 10, letterSpacing: 2, marginTop: 5 },
  auth: { flex: 1, justifyContent: "center", gap: 14 },
  heading: { color: "#FFFFFF", fontSize: 23, fontWeight: "800" },
  muted: { color: "#9295A8", fontSize: 13, marginBottom: 8 },
  input: { color: "#FFFFFF", backgroundColor: "#171A27", borderWidth: 1, borderColor: "#292D40", padding: 15, borderRadius: 12 },
  primary: { backgroundColor: "#7565F5", padding: 16, borderRadius: 12, alignItems: "center" },
  primaryText: { color: "#FFFFFF", fontWeight: "800" },
  secondary: { borderColor: "#7565F5", borderWidth: 1, padding: 15, borderRadius: 12, alignItems: "center" },
  secondaryText: { color: "#C6C0FF", fontWeight: "700" },
  chat: { flex: 1 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  link: { color: "#A99FFF", fontWeight: "700" },
  list: { flex: 1, marginVertical: 18 },
  empty: { color: "#77798A", textAlign: "center", marginTop: 40, lineHeight: 22 },
  bubble: { alignSelf: "flex-start", backgroundColor: "#1B2030", padding: 12, borderRadius: 14, marginVertical: 5, maxWidth: "85%" },
  ownBubble: { alignSelf: "flex-end", backgroundColor: "#5146B8" },
  message: { color: "#FFFFFF", fontSize: 15 },
  composer: { flexDirection: "row", gap: 8, alignItems: "center" },
  messageInput: { flex: 1, backgroundColor: "#171A27", color: "#FFFFFF", padding: 13, borderRadius: 12 },
  send: { backgroundColor: "#7565F5", padding: 14, borderRadius: 12 },
  note: { color: "#6F7284", fontSize: 11, marginTop: 12, textAlign: "center" }
});