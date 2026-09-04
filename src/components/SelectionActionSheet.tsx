import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { Copy, BookmarkPlus, StickyNote, Volume2, X } from 'lucide-react-native';
import { Colors } from '../theme';

interface SelectionActionSheetProps {
  visible: boolean;
  selectedText: string;
  onClose: () => void;
  onCopy: () => void;
  onSaveVocab: () => void;
  onAddNote: () => void;
  onPronounce: () => void;
}

/**
 * Floating action sheet shown when the user long-presses text on the
 * Reading detail screen. Mirrors the selection popup on web
 * (EnglishReadingDetail.tsx).
 *
 * The sheet is intentionally self-contained: callers pass the selected
 * text and four callbacks. We don't manage any state internally beyond
 * open/close.
 */
export const SelectionActionSheet: React.FC<SelectionActionSheetProps> = ({
  visible,
  selectedText,
  onClose,
  onCopy,
  onSaveVocab,
  onAddNote,
  onPronounce,
}) => {
  // Truncate the preview to keep the modal compact.
  const preview =
    selectedText.length > 80 ? selectedText.slice(0, 80) + '...' : selectedText;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        onPress={onClose}
        className="flex-1 bg-black/40 justify-end"
      >
        {/* Inner Pressable swallows taps on the sheet itself so a tap
            inside doesn't close the sheet. */}
        <Pressable
          onPress={() => {}}
          className="bg-card rounded-t-3xl p-6 pb-10"
        >
          {/* Header */}
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-foreground font-extrabold text-base">
              Selection actions
            </Text>
            <TouchableOpacity onPress={onClose} className="p-1" hitSlop={8}>
              <X size={18} color={Colors.iconMuted} />
            </TouchableOpacity>
          </View>

          {/* Highlighted preview */}
          <View className="bg-primary/15 border border-primary/30 rounded-2xl px-4 py-3 mb-4">
            <Text className="text-foreground text-sm italic leading-relaxed">
              "{preview}"
            </Text>
          </View>

          {/* Actions */}
          <View className="gap-2">
            <ActionRow
              icon={<Copy size={18} color={Colors.foreground} />}
              label="Copy"
              onPress={() => {
                onCopy();
                onClose();
              }}
            />
            <ActionRow
              icon={<BookmarkPlus size={18} color={Colors.foreground} />}
              label="Save to vocabulary"
              onPress={() => {
                onSaveVocab();
                onClose();
              }}
            />
            <ActionRow
              icon={<StickyNote size={18} color={Colors.foreground} />}
              label="Add note"
              onPress={() => {
                onAddNote();
                onClose();
              }}
            />
            <ActionRow
              icon={<Volume2 size={18} color={Colors.foreground} />}
              label="Pronounce"
              onPress={() => {
                onPronounce();
                onClose();
              }}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

interface ActionRowProps {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}

const ActionRow: React.FC<ActionRowProps> = ({ icon, label, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.7}
    className="flex-row items-center px-4 py-3.5 rounded-2xl bg-muted border border-border"
  >
    {icon}
    <Text className="ml-3 text-foreground text-sm font-bold">{label}</Text>
  </TouchableOpacity>
);
