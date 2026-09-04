import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Modal,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Colors } from '../theme';
import { ButtonPrimary, ButtonOutline } from './Button';

interface AddNoteModalProps {
  visible: boolean;
  selectedText: string;
  onClose: () => void;
  onSave: (comment: string) => void | Promise<void>;
}

/**
 * Modal for adding a reading note. The selected text is shown read-only
 * as context; the user types a free-form comment that gets persisted
 * along with the selection by the parent.
 */
export const AddNoteModal: React.FC<AddNoteModalProps> = ({
  visible,
  selectedText,
  onClose,
  onSave,
}) => {
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  // Reset the draft every time the modal opens with a new selection.
  useEffect(() => {
    if (visible) {
      setComment('');
      setSaving(false);
    }
  }, [visible, selectedText]);

  const preview =
    selectedText.length > 120 ? selectedText.slice(0, 120) + '...' : selectedText;

  const handleSave = async () => {
    if (!comment.trim() || saving) return;
    setSaving(true);
    try {
      await onSave(comment.trim());
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-end bg-black/40"
      >
        <View className="bg-card rounded-t-3xl p-6 pb-10">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-foreground font-extrabold text-base">
              Add a note
            </Text>
            <TouchableOpacity onPress={onClose} className="p-1" hitSlop={8}>
              <Text className="text-muted-foreground text-sm font-semibold">
                Cancel
              </Text>
            </TouchableOpacity>
          </View>

          <View className="bg-primary/15 border border-primary/30 rounded-2xl px-4 py-3 mb-4">
            <Text className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
              Highlighted text
            </Text>
            <Text className="text-foreground text-sm italic leading-relaxed">
              "{preview}"
            </Text>
          </View>

          <Text className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
            Your note
          </Text>
          <TextInput
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={5}
            placeholder="What did you notice? Why did this stand out?"
            placeholderTextColor={Colors.iconMuted}
            className="bg-muted border border-border rounded-2xl p-4 text-foreground text-sm leading-relaxed"
            style={{ minHeight: 120, textAlignVertical: 'top' }}
          />

          <View className="mt-5 gap-3">
            <ButtonPrimary
              title={saving ? 'Saving...' : 'Save note'}
              onPress={handleSave}
              disabled={!comment.trim() || saving}
              className="h-12"
            />
            <ButtonOutline
              title="Cancel"
              onPress={onClose}
              className="h-12"
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
