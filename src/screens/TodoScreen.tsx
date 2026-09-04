import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator
} from 'react-native';
import {
  Inbox,
  Plus,
  Trash2,
  Check,
  Calendar,
  Clock,
  AlertCircle,
  X,
  Edit2,
  GripVertical
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../theme';
import { MainLayout } from '../components/MainLayout';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Input } from '../components/Input';
import { IconButton } from '../components/IconButton';
import { ButtonPrimary } from '../components/Button';
import { ChipGroup } from '../components/ChipGroup';
import { SegmentedControl } from '../components/SegmentedControl';
import { WeekStrip } from '../components/WeekStrip';
import {
  fetchTodos,
  createTodo,
  updateTodo,
  toggleTodo,
  deleteTodo,
  deleteCompletedTodos,
  fetchTodoStats
} from '../api/client';
import type { TodoTask, TodoStats, TodoQuadrant } from '../types';

type ViewMode = 'planner' | 'inbox' | 'matrix';

function formatDateLocal(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Render a YYYY-MM-DD string as e.g. "Aug 18" for the "Overdue" pill.
function formatHumanDate(dateStr: string) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map((n) => parseInt(n, 10));
  if (!y || !m || !d) return dateStr;
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  return `${months[m - 1]} ${d}`;
}

const WEEKDAY_SHORT_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function TodoScreen() {
  const { token } = useAuth();

  const [activeView, setActiveView] = useState<ViewMode>('matrix');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tasks, setTasks] = useState<TodoTask[]>([]);
  const [stats, setStats] = useState<TodoStats | null>(null);

  // Planner States
  const [selectedDate, setSelectedDate] = useState(() => formatDateLocal(new Date()));
  const [plannerBaseDate, setPlannerBaseDate] = useState(() => new Date());

  // Fast input state
  const [quickTitle, setQuickTitle] = useState('');
  const [quickAdding, setQuickAdding] = useState(false);

  // Modal Detail Form State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formQuadrant, setFormQuadrant] = useState<TodoQuadrant>('inbox');
  const [formScheduledDate, setFormScheduledDate] = useState('');
  const [formDueDate, setFormDueDate] = useState('');
  const [formEstTime, setFormEstTime] = useState('');
  const [savingTask, setSavingTask] = useState(false);



  // Active quadrant for the Matrix view's task list (default "Do First").
  const [activeQuadrant, setActiveQuadrant] = useState<TodoQuadrant>('do');

  const loadData = async () => {
    if (!token) return;
    try {
      const [tasksRes, statsRes] = await Promise.all([
        fetchTodos({ scope: 'all', show_completed: true }, token),
        fetchTodoStats(token)
      ]);
      setTasks(tasksRes.items || []);
      setStats(statsRes);
    } catch (error) {
      console.error('Error loading Todo data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleToggle = async (task: TodoTask) => {
    if (!token) return;
    try {
      // Update UI optimistically
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, completed: !t.completed } : t))
      );
      await toggleTodo(task.id, token);
      // Reload stats
      const statsRes = await fetchTodoStats(token);
      setStats(statsRes);
    } catch (error) {
      console.error(error);
      loadData(); // Revert on error
    }
  };

  const handleQuickAdd = async () => {
    if (!quickTitle.trim() || !token) return;
    setQuickAdding(true);
    try {
      const payload = {
        title: quickTitle.trim(),
        quadrant: activeView === 'matrix' ? 'do' as TodoQuadrant : 'inbox' as TodoQuadrant,
        scheduled_date: activeView === 'planner' ? selectedDate : null,
        due_date: null
      };

      const newTask = await createTodo(payload, token);
      setTasks((prev) => [newTask, ...prev]);
      setQuickTitle('');

      // Reload stats
      const statsRes = await fetchTodoStats(token);
      setStats(statsRes);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to quick-add task.');
    } finally {
      setQuickAdding(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingId(null);
    setFormTitle('');
    setFormQuadrant(activeView === 'matrix' ? 'do' : 'inbox');
    setFormScheduledDate(activeView === 'planner' ? selectedDate : '');
    setFormDueDate('');
    setFormEstTime('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (task: TodoTask) => {
    setEditingId(task.id);
    setFormTitle(task.title);
    setFormQuadrant(task.quadrant);
    setFormScheduledDate(task.scheduled_date || '');
    setFormDueDate(task.due_date || '');
    setFormEstTime(task.estimated_time ? String(task.estimated_time) : '');
    setModalOpen(true);
  };

  const handleSaveTask = async () => {
    if (!formTitle.trim() || !token) {
      Alert.alert('Error', 'Please enter the task title.');
      return;
    }

    setSavingTask(true);
    try {
      const estMinutes = parseInt(formEstTime) || null;
      const payload = {
        title: formTitle.trim(),
        quadrant: formQuadrant,
        scheduled_date: formScheduledDate.trim() || null,
        due_date: formDueDate.trim() || null,
        estimated_time: estMinutes
      };

      if (editingId) {
        const updated = await updateTodo(editingId, payload, token);
        setTasks((prev) => prev.map((t) => (t.id === editingId ? updated : t)));
      } else {
        const created = await createTodo(payload, token);
        setTasks((prev) => [created, ...prev]);
      }

      setModalOpen(false);
      // Reload stats
      const statsRes = await fetchTodoStats(token);
      setStats(statsRes);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to save task.');
    } finally {
      setSavingTask(false);
    }
  };

  const handleDeleteTask = (task: TodoTask) => {
    Alert.alert('Confirm delete', `Are you sure you want to permanently delete: "${task.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (!token) return;
          try {
            await deleteTodo(task.id, token);
            setTasks((prev) => prev.filter((t) => t.id !== task.id));
            const statsRes = await fetchTodoStats(token);
            setStats(statsRes);
          } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to delete task.');
          }
        }
      }
    ]);
  };

  const handleClearCompleted = () => {
    const completedCount = tasks.filter((t) => t.completed).length;
    if (completedCount === 0) return;

    Alert.alert('Confirm', `Are you sure you want to clear ${completedCount} completed tasks?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          if (!token) return;
          try {
            await deleteCompletedTodos(token);
            setTasks((prev) => prev.filter((t) => !t.completed));
            const statsRes = await fetchTodoStats(token);
            setStats(statsRes);
          } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Could not clear completed tasks.');
          }
        }
      }
    ]);
  };



  // Filter tasks based on current view
  const plannerTasks = useMemo(() => {
    return tasks.filter((t) => t.scheduled_date === selectedDate);
  }, [tasks, selectedDate]);

  const inboxTasks = useMemo(() => {
    return tasks.filter((t) => t.quadrant === 'inbox' && !t.scheduled_date);
  }, [tasks]);

  const tasksByQuadrant = useMemo(() => {
    const map: Record<TodoQuadrant, TodoTask[]> = {
      do: [],
      schedule: [],
      delegate: [],
      eliminate: [],
      inbox: []
    };
    tasks.forEach((t) => {
      if (t.quadrant !== 'inbox') {
        map[t.quadrant].push(t);
      }
    });
    return map;
  }, [tasks]);

  const renderTaskCard = (task: TodoTask) => {
    const showMeta = !!(task.due_date || task.estimated_time);
    return (
      <Card key={task.id} className="mb-3 p-4 rounded-2xl">
        <View className="flex-row items-center">
          {/* Drag/grip handle (visual only — no drag-and-drop yet) */}
          <GripVertical size={16} color={Colors.iconSubtle} />

          {/* Ring checkbox */}
          <TouchableOpacity
            onPress={() => handleToggle(task)}
            style={[
              task.completed && {
                backgroundColor: Colors.foreground,
                borderColor: Colors.foreground
              }
            ]}
            className="w-6 h-6 rounded-full border-2 border-muted-foreground/40 ml-3 mr-3 items-center justify-center"
          >
            {task.completed && <Check size={14} color="#ffffff" />}
          </TouchableOpacity>

          <Text
            numberOfLines={2}
            style={[task.completed && { textDecorationLine: 'line-through', opacity: 0.5 }]}
            className="flex-1 text-sm font-semibold text-foreground"
          >
            {task.title}
          </Text>

          {/* Edit / Delete actions */}
          <View className="flex-row gap-2.5 ml-2">
            <TouchableOpacity onPress={() => handleOpenEditModal(task)} className="p-1">
              <Edit2 size={14} color={Colors.iconSubtle} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDeleteTask(task)} className="p-1">
              <Trash2 size={14} color={Colors.destructive} />
            </TouchableOpacity>
          </View>
        </View>

        {showMeta ? (
          <View className="flex-row flex-wrap items-center gap-2 mt-3">
            {task.due_date ? (
              <View className="flex-row items-center bg-destructive/10 border border-destructive/30 rounded-full px-2.5 py-1">
                <AlertCircle size={12} color={Colors.destructive} />
                <Text className="text-destructive text-[11px] font-bold ml-1">
                  Overdue: {formatHumanDate(task.due_date)}
                </Text>
              </View>
            ) : null}
            {task.estimated_time ? (
              <View className="flex-row items-center bg-muted rounded-full px-2.5 py-1">
                <Clock size={12} color={Colors.iconMuted} />
                <Text className="text-muted-foreground text-[11px] font-bold ml-1">
                  Today, 2:00 PM
                </Text>
              </View>
            ) : null}
            {task.scheduled_date && !task.due_date && !task.estimated_time ? (
              <View className="flex-row items-center bg-muted rounded-full px-2.5 py-1">
                <Calendar size={12} color={Colors.iconMuted} />
                <Text className="text-muted-foreground text-[11px] font-bold ml-1">
                  {formatHumanDate(task.scheduled_date)}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </Card>
    );
  };

  const renderPlannerView = () => {
    return (
      <View className="flex-1">
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.foreground} />
          }
        >
          {plannerTasks.length === 0 ? (
            <View className="py-12 items-center">
              <Calendar size={28} color={Colors.iconMuted} />
              <Text className="text-muted-foreground text-xs mt-2 text-center">
                No tasks scheduled for {selectedDate}.
              </Text>
            </View>
          ) : (
            plannerTasks.map(renderTaskCard)
          )}
        </ScrollView>
      </View>
    );
  };

  const renderInboxView = () => {
    return (
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.foreground} />
        }
      >
        <Card className="p-4 mb-4">
          <View className="flex-row items-center mb-1">
            <Inbox size={16} color={Colors.foreground} />
            <Text className="text-foreground font-extrabold text-sm ml-1.5">Inbox</Text>
          </View>
          <Text className="text-muted-foreground text-xs leading-normal">
            Quick collection of incoming tasks not yet scheduled on a specific date.
          </Text>
        </Card>

        {inboxTasks.length === 0 ? (
          <View className="py-12 items-center">
            <Inbox size={28} color={Colors.iconMuted} />
            <Text className="text-muted-foreground text-xs mt-2 text-center">Your inbox is empty.</Text>
          </View>
        ) : (
          inboxTasks.map(renderTaskCard)
        )}
      </ScrollView>
    );
  };

  const renderMatrixView = () => {
    const quadrants: {
      key: TodoQuadrant;
      label: string;
      desc: string;
      icon: React.ReactNode;
      badgeVariant: 'red' | 'yellow' | 'green' | 'zinc';
    }[] = [
      {
        key: 'do',
        label: 'Do First',
        desc: 'Urgent, Important',
        icon: <AlertCircle size={18} color={Colors.destructive} />,
        badgeVariant: 'red'
      },
      {
        key: 'schedule',
        label: 'Schedule',
        desc: 'Important, Not Urgent',
        icon: <Calendar size={20} color={Colors.foreground} />,
        badgeVariant: 'zinc'
      },
      {
        key: 'delegate',
        label: 'Delegate',
        desc: 'Urgent, Not Important',
        icon: <Inbox size={20} color={Colors.destructive} />,
        badgeVariant: 'red'
      },
      {
        key: 'eliminate',
        label: "Don't Do",
        desc: 'Neither',
        icon: <Trash2 size={20} color={Colors.foreground} />,
        badgeVariant: 'zinc'
      }
    ];

    // Default to "Do First" as the highlighted quadrant in the task list.
    // (state is hoisted to the top of TodoScreen to keep the order of hooks stable.)
    const quadrantList = tasksByQuadrant[activeQuadrant] || [];

    return (
      <View className="flex-1">
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 4, paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.foreground} />
          }
        >
          {/* 2x2 grid of quadrant summary cards */}
          <View className="flex-row flex-wrap justify-between">
            {quadrants.map((quad) => {
              const list = tasksByQuadrant[quad.key] || [];
              const isActive = activeQuadrant === quad.key;
              return (
                <TouchableOpacity
                  key={quad.key}
                  activeOpacity={0.85}
                  onPress={() => setActiveQuadrant(quad.key)}
                  style={[{ width: '47.5%' }]}
                  className="mb-3"
                >
                  <Card
                    variant="default"
                    className={`p-4 ${
                      isActive ? 'border-purple bg-purple/5' : ''
                    }`}
                  >
                    <View className="flex-row justify-between items-start">
                      {quad.icon}
                      <Badge label={String(list.length)} variant={quad.badgeVariant} />
                    </View>
                    <Text className="text-foreground font-black text-base mt-3">{quad.label}</Text>
                    <Text className="text-muted-foreground text-xs mt-0.5">{quad.desc}</Text>
                  </Card>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Section header for the active quadrant's task list */}
          <View className="flex-row items-center mt-3 mb-3">
            <View className="w-1.5 h-1.5 rounded-full bg-purple mr-2" />
            <Text className="text-foreground text-2xl font-black">
              {quadrants.find((q) => q.key === activeQuadrant)?.label}
            </Text>
          </View>

          {quadrantList.length === 0 ? (
            <View className="py-10 items-center">
              <Check size={28} color={Colors.iconMuted} />
              <Text className="text-muted-foreground text-xs mt-2 text-center">
                No tasks in this group yet.
              </Text>
            </View>
          ) : (
            quadrantList.map(renderTaskCard)
          )}
        </ScrollView>
      </View>
    );
  };

  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <MainLayout
      title="Cuhp"
      scroll={false}
      headerRight={
        completedCount > 0 ? (
          <TouchableOpacity
            onPress={handleClearCompleted}
            className="bg-red-50 border border-red-200/50 px-2.5 py-1 rounded-lg"
          >
            <Text className="text-destructive text-[10px] font-bold">Clear done ({completedCount})</Text>
          </TouchableOpacity>
        ) : undefined
      }
    >
      <WeekStrip
        selectedDate={selectedDate}
        onSelectDate={(dateStr, date) => {
          setSelectedDate(dateStr);
          setPlannerBaseDate(date);
        }}
        baseDate={plannerBaseDate}
        onBaseDateChange={setPlannerBaseDate}
        showNavButtons={false}
      />

      <SegmentedControl<ViewMode>
        tabs={[
          { value: 'inbox', label: 'Inbox' },
          { value: 'planner', label: 'Planner' },
          { value: 'matrix', label: 'Matrix' }
        ]}
        value={activeView}
        onChange={setActiveView}
        className="mx-6 mb-3"
      />

      {/* Quick Add Bar (hidden on matrix, matches reference) */}
      {activeView !== 'matrix' ? (
        <View className="flex-row items-center px-6 mb-3">
          <View className="flex-1 mr-3">
            <Input
              value={quickTitle}
              onChangeText={setQuickTitle}
              placeholder={activeView === 'planner' ? 'Quick add a task to this date...' : 'Quick add a task to Inbox...'}
              rightElement={
                quickTitle ? (
                  <IconButton
                    variant="plain"
                    size="sm"
                    onPress={() => setQuickTitle('')}
                    icon={<X size={16} color={Colors.iconMuted} />}
                  />
                ) : undefined
              }
            />
          </View>
          <IconButton
            variant="soft"
            size="md"
            disabled={quickAdding || !quickTitle.trim()}
            onPress={handleQuickAdd}
            icon={quickAdding ? <ActivityIndicator size="small" color={Colors.foreground} /> : <Plus size={18} color={Colors.foreground} />}
          />
        </View>
      ) : null}

      {/* View Content */}
      <View className="flex-1">
        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color={Colors.foreground} />
          </View>
        ) : (
          <>
            {activeView === 'planner' && renderPlannerView()}
            {activeView === 'inbox' && renderInboxView()}
            {activeView === 'matrix' && renderMatrixView()}
          </>
        )}
      </View>

      {/* Floating Action Button for Advanced Create — purple, above the bottom tab bar */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handleOpenCreateModal}
        className="absolute bottom-24 right-6 w-14 h-14 rounded-full bg-purple items-center justify-center shadow-lg shadow-purple/40 z-50"
      >
        <Plus size={26} color="#ffffff" />
      </TouchableOpacity>

      {/* Detail Form Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={modalOpen}
        onRequestClose={() => setModalOpen(false)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <View className="bg-background rounded-t-3xl p-6 min-h-[480px] max-h-[85%]">
            {/* Header Modal */}
            <View className="flex-row justify-between items-center pb-3 border-b border-border/50">
              <Text className="text-lg font-black text-foreground">
                {editingId ? 'Edit Task' : 'Create New Task'}
              </Text>
              <TouchableOpacity onPress={() => setModalOpen(false)} className="p-1">
                <Text className="text-muted-foreground text-sm font-semibold">Close</Text>
              </TouchableOpacity>
            </View>

            {/* Scrollable Form */}
            <ScrollView contentContainerStyle={{ paddingVertical: 4 }} showsVerticalScrollIndicator={false}>
              <View className="mt-4">
                <Text className="text-foreground text-xs font-bold mb-1.5">Task name*</Text>
                <Input
                  value={formTitle}
                  onChangeText={setFormTitle}
                  placeholder="e.g. Design mobile UI"
                />
              </View>

              <View className="mt-4">
                <Text className="text-foreground text-xs font-bold mb-1.5">Priority matrix group</Text>
                <ChipGroup
                  data={[
                    { value: 'inbox', label: 'Inbox' },
                    { value: 'do', label: 'Do First' },
                    { value: 'schedule', label: 'Schedule' },
                    { value: 'delegate', label: 'Delegate' },
                    { value: 'eliminate', label: 'Eliminate' }
                  ]}
                  value={formQuadrant}
                  onChange={(val: any) => setFormQuadrant(val)}
                />
              </View>

              <View className="mt-4">
                <Text className="text-foreground text-xs font-bold mb-1.5">Scheduled date (YYYY-MM-DD)</Text>
                <Input
                  value={formScheduledDate}
                  onChangeText={setFormScheduledDate}
                  placeholder="e.g. 2026-08-19"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View className="mt-4">
                <Text className="text-foreground text-xs font-bold mb-1.5">Due date (YYYY-MM-DD)</Text>
                <Input
                  value={formDueDate}
                  onChangeText={setFormDueDate}
                  placeholder="e.g. 2026-08-25"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View className="mt-4">
                <Text className="text-foreground text-xs font-bold mb-1.5">Estimated time (minutes)</Text>
                <Input
                  value={formEstTime}
                  onChangeText={setFormEstTime}
                  placeholder="e.g. 60"
                  keyboardType="numeric"
                />
              </View>

              {/* Action Button */}
              <View className="mt-6 mb-8">
                <ButtonPrimary
                  title={editingId ? 'Save changes' : 'Create task'}
                  onPress={handleSaveTask}
                  disabled={savingTask || !formTitle.trim()}
                  icon={savingTask ? <ActivityIndicator size="small" color="#ffffff" /> : <Check size={18} color={Colors.primaryForeground} />}
                  className="h-12"
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </MainLayout>
  );
}