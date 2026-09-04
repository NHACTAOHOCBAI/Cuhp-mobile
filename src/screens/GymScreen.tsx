import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Modal,
  Alert,
  TextInput,
  ActivityIndicator
} from 'react-native';
import {
  CalendarDays,
  Dumbbell,
  FolderOpen,
  LineChart,
  Plus,
  Trash2,
  Check,
  Calendar,
  Clock,
  ChevronRight,
  TrendingUp,
  X,
  Edit2,
  Copy,
  TrendingDown
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../theme';
import { MainLayout } from '../components/MainLayout';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Input } from '../components/Input';
import { IconButton } from '../components/IconButton';
import { ButtonPrimary, ButtonOutline } from '../components/Button';
import { ChipGroup } from '../components/ChipGroup';
import { SegmentedControl } from '../components/SegmentedControl';
import { WeekStrip } from '../components/WeekStrip';
import {
  fetchGymCategories,
  createGymCategory,
  updateGymCategory,
  deleteGymCategory,
  fetchExercisesByDate,
  createGymExercise,
  updateGymExercise,
  updateExerciseCompletion,
  deleteGymExercise,
  copyGymDayForward
} from '../api/client';
import type { WorkoutCategory, WorkoutExercise } from '../types';

type ViewMode = 'schedule' | 'categories';

function formatDateLocal(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function GymScreen() {
  const { token } = useAuth();

  const [activeView, setActiveView] = useState<ViewMode>('schedule');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [categories, setCategories] = useState<WorkoutCategory[]>([]);
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);

  // Schedule base date
  const [selectedDate, setSelectedDate] = useState(() => formatDateLocal(new Date()));
  const [scheduleBaseDate, setScheduleBaseDate] = useState(() => new Date());

  // Exercise Form Modal State
  const [exerciseModalOpen, setExerciseModalOpen] = useState(false);
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);
  const [formExName, setFormExName] = useState('');
  const [formExSets, setFormExSets] = useState('3');
  const [formExReps, setFormExReps] = useState('10');
  const [formExWeight, setFormExWeight] = useState('');
  const [formExCategoryId, setFormExCategoryId] = useState<string | null>(null);
  const [formExCompleted, setFormExCompleted] = useState(false);
  const [savingExercise, setSavingExercise] = useState(false);

  // Category Form Modal State
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [formCatName, setFormCatName] = useState('');
  const [formCatColor, setFormCatColor] = useState('#EFBCD5');
  const [savingCategory, setSavingCategory] = useState(false);

  // Copy schedule state
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [weeksToCopy, setWeeksToCopy] = useState('1');
  const [copying, setCopying] = useState(false);



  const loadData = async () => {
    if (!token) return;
    try {
      const [catsRes, exRes] = await Promise.all([
        fetchGymCategories(token),
        fetchExercisesByDate(selectedDate, token)
      ]);
      setCategories(catsRes || []);
      setExercises(exRes || []);
    } catch (error) {
      console.error('Error loading Gym data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token, selectedDate]);



  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Toggle completed state
  const handleToggleComplete = async (ex: WorkoutExercise) => {
    if (!token) return;
    try {
      setExercises((prev) =>
        prev.map((e) => (e.id === ex.id ? { ...e, completed: !e.completed } : e))
      );
      await updateExerciseCompletion(ex.id, !ex.completed, token);
    } catch (error) {
      console.error(error);
      loadData();
    }
  };

  // Exercise CRUD
  const handleOpenExerciseCreate = () => {
    setEditingExerciseId(null);
    setFormExName('');
    setFormExSets('3');
    setFormExReps('10');
    setFormExWeight('');
    setFormExCategoryId(categories.length > 0 ? categories[0].id : null);
    setFormExCompleted(false);
    setExerciseModalOpen(true);
  };

  const handleOpenExerciseEdit = (ex: WorkoutExercise) => {
    setEditingExerciseId(ex.id);
    setFormExName(ex.name);
    setFormExSets(String(ex.sets));
    setFormExReps(String(ex.reps));
    setFormExWeight(ex.weight ? String(ex.weight) : '');
    setFormExCategoryId(ex.category_id || null);
    setFormExCompleted(ex.completed);
    setExerciseModalOpen(true);
  };

  const handleSaveExercise = async () => {
    if (!formExName.trim() || !token) {
      Alert.alert('Error', 'Please enter exercise name.');
      return;
    }

    setSavingExercise(true);
    try {
      const payload = {
        name: formExName.trim(),
        date: selectedDate,
        sets: parseInt(formExSets) || 3,
        reps: parseInt(formExReps) || 10,
        weight: parseFloat(formExWeight) || null,
        category_id: formExCategoryId,
        completed: formExCompleted
      };

      if (editingExerciseId) {
        const updated = await updateGymExercise(editingExerciseId, payload, token);
        setExercises((prev) => prev.map((e) => (e.id === editingExerciseId ? updated : e)));
      } else {
        const created = await createGymExercise(payload, token);
        setExercises((prev) => [...prev, created]);
      }

      setExerciseModalOpen(false);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to save exercise.');
    } finally {
      setSavingExercise(false);
    }
  };

  const handleDeleteExercise = (ex: WorkoutExercise) => {
    Alert.alert('Confirm delete', `Delete exercise "${ex.name}" from today?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (!token) return;
          try {
            await deleteGymExercise(ex.id, token);
            setExercises((prev) => prev.filter((e) => e.id !== ex.id));
          } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to delete exercise.');
          }
        }
      }
    ]);
  };

  // Copy schedule forward
  const handleCopySchedule = async () => {
    if (exercises.length === 0) {
      Alert.alert('Notice', 'No exercises on this day to copy.');
      return;
    }
    const weeks = parseInt(weeksToCopy) || 1;
    if (weeks < 1 || weeks > 12) {
      Alert.alert('Error', 'Please enter a number of weeks between 1 and 12.');
      return;
    }

    setCopying(true);
    try {
      const res = await copyGymDayForward({ source_date: selectedDate, weeks_ahead: weeks }, token);
      Alert.alert('Success 🎉', `Successfully copied the schedule to ${weeks} upcoming weeks.`);
      setCopyModalOpen(false);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not apply schedule to upcoming weeks.');
    } finally {
      setCopying(false);
    }
  };

  // Category CRUD
  const handleOpenCategoryCreate = () => {
    setEditingCategoryId(null);
    setFormCatName('');
    setFormCatColor('#76baf9');
    setCategoryModalOpen(true);
  };

  const handleOpenCategoryEdit = (cat: WorkoutCategory) => {
    setEditingCategoryId(cat.id);
    setFormCatName(cat.name);
    setFormCatColor(cat.color);
    setCategoryModalOpen(true);
  };

  const handleSaveCategory = async () => {
    if (!formCatName.trim() || !token) {
      Alert.alert('Error', 'Please enter muscle group name.');
      return;
    }

    setSavingCategory(true);
    try {
      const payload = {
        name: formCatName.trim(),
        color: formCatColor
      };

      if (editingCategoryId) {
        const updated = await updateGymCategory(editingCategoryId, payload, token);
        setCategories((prev) => prev.map((c) => (c.id === editingCategoryId ? updated : c)));
      } else {
        const created = await createGymCategory(payload, token);
        setCategories((prev) => [...prev, created]);
      }

      setCategoryModalOpen(false);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to save muscle group.');
    } finally {
      setSavingCategory(false);
    }
  };

  const handleDeleteCategory = (cat: WorkoutCategory) => {
    Alert.alert('Confirm delete', `All exercises in muscle group "${cat.name}" will become Unclassified. Are you sure?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (!token) return;
          try {
            await deleteGymCategory(cat.id, token);
            setCategories((prev) => prev.filter((c) => c.id !== cat.id));
          } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Could not delete muscle group.');
          }
        }
      }
    ]);
  };



  const getCategoryColor = (catId?: string | null) => {
    if (!catId) return Colors.iconSubtle;
    const cat = categories.find((c) => c.id === catId);
    return cat ? cat.color : Colors.iconSubtle;
  };

  const getCategoryName = (catId?: string | null) => {
    if (!catId) return 'Unclassified';
    const cat = categories.find((c) => c.id === catId);
    return cat ? cat.name : 'Unclassified';
  };



  const renderScheduleView = () => {
    const totalEx = exercises.length;
    const completedEx = exercises.filter((e) => e.completed).length;
    const pct = totalEx > 0 ? Math.round((completedEx / totalEx) * 100) : 0;

    return (
      <View className="flex-1">
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {/* Progress circle summary card */}
          {totalEx > 0 && (
            <Card className="p-4 mb-4 flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-foreground font-extrabold text-sm mb-1">Today's workout progress</Text>
                <Text className="text-muted-foreground text-xs">
                  Completed {completedEx}/{totalEx} exercises ({pct}%)
                </Text>
              </View>
              <Badge label={`${pct}%`} variant={pct === 100 ? 'green' : 'zinc'} />
            </Card>
          )}

          {exercises.length === 0 ? (
            <View className="py-12 items-center">
              <Dumbbell size={28} color={Colors.iconMuted} />
              <Text className="text-muted-foreground text-xs mt-2 text-center">No workout scheduled on this day.</Text>
            </View>
          ) : (
            exercises.map((ex) => (
              <Card key={ex.id} className="mb-3 p-4">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1 pr-3">
                    <TouchableOpacity
                      onPress={() => handleToggleComplete(ex)}
                      style={[
                        ex.completed && { backgroundColor: Colors.foreground, borderColor: Colors.foreground }
                      ]}
                      className="w-5 h-5 rounded border border-border items-center justify-center mr-3"
                    >
                      {ex.completed && <Check size={12} color="#ffffff" />}
                    </TouchableOpacity>

                    <View className="flex-1">
                      <Text
                        style={[ex.completed && { textDecorationLine: 'line-through', opacity: 0.5 }]}
                        className="text-foreground text-sm font-semibold leading-snug"
                      >
                        {ex.name}
                      </Text>
                      <Text className="text-muted-foreground text-[10px] mt-0.5 font-bold">
                        {getCategoryName(ex.category_id)}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-center gap-3">
                    <View className="items-end">
                      <Text className="text-foreground text-xs font-extrabold">
                        {ex.sets} × {ex.reps}
                      </Text>
                      {ex.weight ? (
                        <Text className="text-muted-foreground text-[10px] font-semibold mt-0.5">{ex.weight} kg</Text>
                      ) : null}
                    </View>

                    <View className="flex-row gap-2 border-l border-border/40 pl-3">
                      <TouchableOpacity onPress={() => handleOpenExerciseEdit(ex)} className="p-1">
                        <Edit2 size={13} color={Colors.iconSubtle} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDeleteExercise(ex)} className="p-1">
                        <Trash2 size={13} color={Colors.destructive} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </Card>
            ))
          )}

          {/* Copy day forward button */}
          {exercises.length > 0 && (
            <ButtonOutline
              title="Copy schedule to upcoming weeks"
              onPress={() => setCopyModalOpen(true)}
              icon={<Copy size={14} color={Colors.foreground} />}
              className="mt-2 h-12"
            />
          )}
        </ScrollView>
      </View>
    );
  };

  const renderCategoriesView = () => {
    return (
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Card className="p-4 mb-4">
          <View className="flex-row items-center mb-1">
            <FolderOpen size={16} color={Colors.foreground} />
            <Text className="text-foreground font-extrabold text-sm ml-1.5">Manage muscle groups</Text>
          </View>
          <Text className="text-muted-foreground text-xs leading-normal">
            Categorize your exercises by muscle group to balance your training volume evenly.
          </Text>
        </Card>

        {categories.length === 0 ? (
          <View className="py-12 items-center">
            <FolderOpen size={28} color={Colors.iconMuted} />
            <Text className="text-muted-foreground text-xs mt-2 text-center">No muscle groups yet.</Text>
          </View>
        ) : (
          categories.map((cat) => (
            <Card key={cat.id} className="mb-3 p-4 flex-row justify-between items-center">
              <View className="flex-row items-center">
                <View style={{ backgroundColor: cat.color }} className="w-3.5 h-3.5 rounded-full mr-3" />
                <Text className="text-foreground text-sm font-bold">{cat.name}</Text>
              </View>

              <View className="flex-row gap-3">
                <TouchableOpacity onPress={() => handleOpenCategoryEdit(cat)} className="p-1">
                  <Edit2 size={14} color={Colors.iconMuted} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteCategory(cat)} className="p-1">
                  <Trash2 size={14} color={Colors.destructive} />
                </TouchableOpacity>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    );
  };



  return (
    <MainLayout
      title="Gym Planner"
      scroll={false}
      headerRight={
        activeView === 'schedule' ? (
          <TouchableOpacity
            onPress={handleOpenExerciseCreate}
            className="bg-foreground px-3 py-1.5 rounded-lg flex-row items-center"
          >
            <Plus size={12} color={Colors.background} />
            <Text className="text-background text-[10px] font-bold ml-1">Add exercise</Text>
          </TouchableOpacity>
        ) : activeView === 'categories' ? (
          <TouchableOpacity
            onPress={handleOpenCategoryCreate}
            className="bg-foreground px-3 py-1.5 rounded-lg flex-row items-center"
          >
            <Plus size={12} color={Colors.background} />
            <Text className="text-background text-[10px] font-bold ml-1">Muscle group</Text>
          </TouchableOpacity>
        ) : undefined
      }
    >
      {activeView === 'schedule' && (
        <WeekStrip
          selectedDate={selectedDate}
          onSelectDate={(dateStr, date) => {
            setSelectedDate(dateStr);
            setScheduleBaseDate(date);
          }}
          baseDate={scheduleBaseDate}
          onBaseDateChange={setScheduleBaseDate}
          showNavButtons={true}
        />
      )}

      <SegmentedControl<ViewMode>
        tabs={[
          {
            value: 'schedule',
            label: 'Schedule',
            icon: (color) => <CalendarDays size={12} color={color} />
          },
          {
            value: 'categories',
            label: 'Muscle groups',
            icon: (color) => <FolderOpen size={12} color={color} />
          }
        ]}
        value={activeView}
        onChange={setActiveView}
        roundedVariant="xl"
        className="my-3.5 mx-6"
      />

      {/* Render Main Content */}
      <View className="flex-1">
        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color={Colors.foreground} />
          </View>
        ) : (
          <>
            {activeView === 'schedule' && renderScheduleView()}
            {activeView === 'categories' && renderCategoriesView()}
          </>
        )}
      </View>

      {/* Exercise Modal Form */}
      <Modal
        animationType="slide"
        transparent
        visible={exerciseModalOpen}
        onRequestClose={() => setExerciseModalOpen(false)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <View className="bg-background rounded-t-3xl p-6 min-h-[480px] max-h-[85%]">
            <View className="flex-row justify-between items-center pb-3 border-b border-border/50">
              <Text className="text-lg font-black text-foreground">
                {editingExerciseId ? 'Edit exercise' : 'Add new exercise'}
              </Text>
              <TouchableOpacity onPress={() => setExerciseModalOpen(false)} className="p-1">
                <Text className="text-muted-foreground text-sm font-semibold">Close</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingVertical: 4 }} showsVerticalScrollIndicator={false}>
              <View className="mt-4">
                <Text className="text-foreground text-xs font-bold mb-1.5">Exercise name*</Text>
                <Input
                  value={formExName}
                  onChangeText={setFormExName}
                  placeholder="e.g. Bench Press"
                />
              </View>

              <View className="mt-4">
                <Text className="text-foreground text-xs font-bold mb-1.5">Muscle group</Text>
                <ChipGroup
                  data={[
                    { value: 'none', label: 'Unclassified' },
                    ...categories.map((c) => ({ value: c.id, label: c.name }))
                  ]}
                  value={formExCategoryId || 'none'}
                  onChange={(val: string) => setFormExCategoryId(val === 'none' ? null : val)}
                />
              </View>

              <View className="flex-row gap-4 mt-4">
                <View className="flex-1">
                  <Text className="text-foreground text-xs font-bold mb-1.5">Sets*</Text>
                  <Input
                    value={formExSets}
                    onChangeText={setFormExSets}
                    placeholder="3"
                    keyboardType="numeric"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-foreground text-xs font-bold mb-1.5">Reps*</Text>
                  <Input
                    value={formExReps}
                    onChangeText={setFormExReps}
                    placeholder="10"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View className="mt-4">
                <Text className="text-foreground text-xs font-bold mb-1.5">Weight per side (kg)</Text>
                <Input
                  value={formExWeight}
                  onChangeText={setFormExWeight}
                  placeholder="e.g. 20"
                  keyboardType="numeric"
                />
              </View>

              {/* Status checkbox */}
              <TouchableOpacity
                onPress={() => setFormExCompleted(!formExCompleted)}
                className="mt-4 flex-row items-center"
              >
                <View
                  style={[
                    formExCompleted && { backgroundColor: Colors.foreground, borderColor: Colors.foreground }
                  ]}
                  className="w-5 h-5 rounded border border-border items-center justify-center mr-3"
                >
                  {formExCompleted && <Check size={12} color="#ffffff" />}
                </View>
                <Text className="text-foreground text-sm font-semibold">Completed this exercise</Text>
              </TouchableOpacity>

              <View className="mt-6 mb-8">
                <ButtonPrimary
                  title={editingExerciseId ? 'Save changes' : 'Add exercise'}
                  onPress={handleSaveExercise}
                  disabled={savingExercise || !formExName.trim()}
                  icon={savingExercise ? <ActivityIndicator size="small" color="#ffffff" /> : <Check size={18} color={Colors.primaryForeground} />}
                  className="h-12"
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Category Modal Form */}
      <Modal
        animationType="slide"
        transparent
        visible={categoryModalOpen}
        onRequestClose={() => setCategoryModalOpen(false)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <View className="bg-background rounded-t-3xl p-6 min-h-[300px]">
            <View className="flex-row justify-between items-center pb-3 border-b border-border/50">
              <Text className="text-lg font-black text-foreground">
                {editingCategoryId ? 'Edit muscle group' : 'Add new muscle group'}
              </Text>
              <TouchableOpacity onPress={() => setCategoryModalOpen(false)} className="p-1">
                <Text className="text-muted-foreground text-sm font-semibold">Close</Text>
              </TouchableOpacity>
            </View>

            <View className="mt-4">
              <Text className="text-foreground text-xs font-bold mb-1.5">Muscle group name*</Text>
              <Input
                value={formCatName}
                onChangeText={setFormCatName}
                placeholder="e.g. Chest, Back, Legs"
              />
            </View>

            <View className="mt-4">
              <Text className="text-foreground text-xs font-bold mb-1.5">Display color</Text>
              <ChipGroup
                data={[
                  { value: '#76baf9', label: 'Blue' },
                  { value: '#22c55e', label: 'Green' },
                  { value: '#f97316', label: 'Orange' },
                  { value: '#ef4444', label: 'Red' },
                  { value: '#a855f7', label: 'Purple' },
                  { value: '#eab308', label: 'Yellow' }
                ]}
                value={formCatColor}
                onChange={setFormCatColor}
              />
            </View>

            <View className="mt-6 mb-8">
              <ButtonPrimary
                title={editingCategoryId ? 'Save changes' : 'Create muscle group'}
                onPress={handleSaveCategory}
                disabled={savingCategory || !formCatName.trim()}
                icon={savingCategory ? <ActivityIndicator size="small" color="#ffffff" /> : <Check size={18} color={Colors.primaryForeground} />}
                className="h-12"
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Copy Schedule Modal */}
      <Modal
        animationType="fade"
        transparent
        visible={copyModalOpen}
        onRequestClose={() => setCopyModalOpen(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/40 px-6">
          <Card className="w-full p-6">
            <View className="flex-row justify-between items-center pb-2 border-b border-border/40 mb-3">
              <Text className="text-foreground font-black text-sm">Copy schedule</Text>
              <TouchableOpacity onPress={() => setCopyModalOpen(false)} className="p-1">
                <Text className="text-muted-foreground text-xs font-bold">Cancel</Text>
              </TouchableOpacity>
            </View>

            <Text className="text-muted-foreground text-xs leading-normal mb-4">
              The system will copy all exercises from {selectedDate} to upcoming weeks.
            </Text>

            <Text className="text-foreground text-xs font-bold mb-1.5">Number of weeks to copy (1 - 12 weeks)*</Text>
            <Input
              value={weeksToCopy}
              onChangeText={setWeeksToCopy}
              placeholder="1"
              keyboardType="numeric"
            />

            <View className="mt-5 flex-row gap-3">
              <ButtonOutline title="Cancel" onPress={() => setCopyModalOpen(false)} className="flex-1 h-12" />
              <ButtonPrimary
                title="Apply"
                onPress={handleCopySchedule}
                disabled={copying || !weeksToCopy}
                icon={copying ? <ActivityIndicator size="small" color="#ffffff" /> : <Copy size={16} color={Colors.primaryForeground} />}
                className="flex-1 h-12"
              />
            </View>
          </Card>
        </View>
      </Modal>
    </MainLayout>
  );
}