import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import Icon from './Icon';
import Colors from '../theme/colors';

export const ChatInputBar = ({ onSend, onAttach, onCameraPress }) => {
  const [text, setText] = useState('');

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
  };

  const hasText = text.trim().length > 0;

  return (
    <View style={styles.container}>
      {/* White Input Pill */}
      <View style={styles.inputCard}>
        <TouchableOpacity style={styles.iconBtn} activeOpacity={0.6}>
          <Icon name="smiley" size={22} color={Colors.textMuted} />
        </TouchableOpacity>

        <TextInput
          style={styles.textInput}
          placeholder="Message"
          placeholderTextColor={Colors.textMuted}
          value={text}
          onChangeText={setText}
          multiline
          maxLength={1000}
        />

        <TouchableOpacity
          style={styles.iconBtn}
          activeOpacity={0.6}
          onPress={onAttach}
        >
          <Icon name="attachment" size={20} color={Colors.textMuted} />
        </TouchableOpacity>

        {!hasText && (
          <TouchableOpacity
            style={styles.iconBtn}
            activeOpacity={0.6}
            onPress={onCameraPress || onAttach}
          >
            <Icon name="camera" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Floating Action Button: Send / Mic */}
      <TouchableOpacity
        style={[styles.fabButton, hasText ? styles.fabSend : styles.fabMic]}
        activeOpacity={0.8}
        onPress={hasText ? handleSend : undefined}
      >
        <Icon
          name={hasText ? 'send' : 'microphone'}
          size={hasText ? 18 : 20}
          color="#FFFFFF"
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 6,
    paddingVertical: 6,
    backgroundColor: 'transparent',
  },
  inputCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    marginRight: 6,
    minHeight: 46,
    maxHeight: 120,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  iconBtn: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  fabSend: {
    backgroundColor: Colors.secondary,
  },
  fabMic: {
    backgroundColor: Colors.primary,
  },
});

export default ChatInputBar;
