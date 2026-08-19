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
  Inbox,
  LayoutGrid,
  Plus,
  Trash2,
  Check,
  Calendar,
  Clock,
  ChevronRight,
  TrendingUp,
  X,
  Edit2
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../theme';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Input } from '../components/Input';
import { IconButton } from '../components/IconButton';
import { ButtonPrimary, ButtonOutline } from '../components/Button';
import { ChipGroup } from '../components/ChipGroup';
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

const WEEKDAY_NAMES = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

export default function TodoScreen() {
  const { token } = useAuth();

  const [activeView, setActiveView] = useState<ViewMode>('planner');
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
      console.error('Lỗi tải dữ liệu Todo:', error);
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
      // Cập nhật giao diện lập tức (optimistic update)
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, completed: !t.completed } : t))
      );
      await toggleTodo(task.id, token);
      // Reload stats
      const statsRes = await fetchTodoStats(token);
      setStats(statsRes);
    } catch (error) {
      console.error(error);
      loadData(); // Revert nếu lỗi
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
      Alert.alert('Lỗi', 'Thêm công việc nhanh thất bại.');
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
      Alert.alert('Lỗi', 'Vui lòng điền tiêu đề công việc.');
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
      Alert.alert('Lỗi', 'Lưu công việc thất bại.');
    } finally {
      setSavingTask(false);
    }
  };

  const handleDeleteTask = (task: TodoTask) => {
    Alert.alert('Xác nhận xóa', `Bạn có chắc muốn xóa vĩnh viễn: "${task.title}"?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
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
            Alert.alert('Lỗi', 'Xóa công việc thất bại.');
          }
        }
      }
    ]);
  };

  const handleClearCompleted = () => {
    const completedCount = tasks.filter((t) => t.completed).length;
    if (completedCount === 0) return;

    Alert.alert('Xác nhận', `Bạn có chắc muốn dọn sạch ${completedCount} công việc đã hoàn thành?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Dọn dẹp',
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
            Alert.alert('Lỗi', 'Không thể dọn dẹp công việc.');
          }
        }
      }
    ]);
  };

  // Calendar dates list for strip (7 days starting from Monday of base date week)
  const getWeekDates = () => {
    const current = new Date(plannerBaseDate);
    const day = current.getDay();
    const diff = current.getDate() - day + (day === 0 ? -6 : 1); // Monday is first day
    const monday = new Date(current.setDate(diff));

    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  const navigateWeek = (weeks: number) => {
    const next = new Date(plannerBaseDate);
    next.setDate(plannerBaseDate.getDate() + (weeks * 7));
    setPlannerBaseDate(next);
  };

  const weekDates = getWeekDates();

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
    return (
      <Card key={task.id} className="mb-3 p-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1 pr-3">
            {/* Checkbox button */}
            <TouchableOpacity
              onPress={() => handleToggle(task)}
              style={[
                task.completed && { backgroundColor: Colors.foreground, borderColor: Colors.foreground }
              ]}
              className="w-5 h-5 rounded border border-border items-center justify-center mr-3"
            >
              {task.completed && <Check size={12} color="#ffffff" />}
            </TouchableOpacity>

            <Text
              style={[task.completed && { textDecorationLine: 'line-through', opacity: 0.5 }]}
              className="text-foreground text-sm font-semibold flex-1 leading-snug"
            >
              {task.title}
            </Text>
          </View>

          {/* Action menu */}
          <View className="flex-row gap-2.5">
            <TouchableOpacity onPress={() => handleOpenEditModal(task)} className="p-1">
              <Edit2 size={13} color={Colors.iconSubtle} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDeleteTask(task)} className="p-1">
              <Trash2 size={13} color={Colors.destructive} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Task extra meta */}
        {(task.due_date || task.estimated_time || task.scheduled_date) ? (
          <View className="flex-row flex-wrap items-center mt-3 pt-2.5 border-t border-border/40 gap-3">
            {task.scheduled_date ? (
              <View className="flex-row items-center bg-zinc-100 px-2 py-0.5 rounded">
                <Calendar size={10} color={Colors.iconMuted} />
                <Text className="text-muted-foreground text-[9px] font-bold ml-1">{task.scheduled_date}</Text>
              </View>
            ) : null}
            {task.due_date ? (
              <View className="flex-row items-center bg-red-50 px-2 py-0.5 rounded">
                <Clock size={10} color={Colors.destructive} />
                <Text className="text-destructive text-[9px] font-bold ml-1">Hạn: {task.due_date}</Text>
              </View>
            ) : null}
            {task.estimated_time ? (
              <View className="flex-row items-center bg-blue-50 px-2 py-0.5 rounded">
                <Clock size={10} color={Colors.accent} />
                <Text className="text-accent text-[9px] font-bold ml-1">{task.estimated_time}p</Text>
              </View>
            ) : null}
            {task.quadrant !== 'inbox' && (
              <Badge
                label={
                  task.quadrant === 'do'
                    ? 'Làm ngay'
                    : task.quadrant === 'schedule'
                    ? 'Lên lịch'
                    : task.quadrant === 'delegate'
                    ? 'Ủy quyền'
                    : 'Loại bỏ'
                }
                variant={
                  task.quadrant === 'do'
                    ? 'red'
                    : task.quadrant === 'schedule'
                    ? 'yellow'
                    : task.quadrant === 'delegate'
                    ? 'green'
                    : 'zinc'
                }
              />
            )}
          </View>
        ) : null}
      </Card>
    );
  };

  const renderPlannerView = () => {
    return (
      <View className="flex-1">
        {/* Calendar Horizontal Strip */}
        <View className="flex-row justify-between items-center px-6 py-2 border-b border-border/40 bg-card">
          <TouchableOpacity onPress={() => navigateWeek(-1)} className="p-1">
            <Text className="text-foreground text-xs font-bold">← Tuần trước</Text>
          </TouchableOpacity>
          <Text className="text-foreground font-black text-xs uppercase tracking-wider">
            {weekDates[0].toLocaleDateString('vi-VN', { month: 'numeric', year: 'numeric' })}
          </Text>
          <TouchableOpacity onPress={() => navigateWeek(1)} className="p-1">
            <Text className="text-foreground text-xs font-bold">Tuần sau →</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-around py-3 px-3 bg-card border-b border-border mb-4">
          {weekDates.map((date) => {
            const dateStr = formatDateLocal(date);
            const isSelected = selectedDate === dateStr;
            const weekday = WEEKDAY_NAMES[date.getDay()];
            return (
              <TouchableOpacity
                key={dateStr}
                onPress={() => setSelectedDate(dateStr)}
                style={[
                  isSelected && { backgroundColor: Colors.foreground }
                ]}
                className="items-center py-2 px-3 rounded-xl flex-1 mx-1"
              >
                <Text className={`text-[10px] font-bold ${isSelected ? 'text-background' : 'text-muted-foreground'}`}>
                  {weekday}
                </Text>
                <Text className={`text-sm font-black mt-1 ${isSelected ? 'text-background' : 'text-foreground'}`}>
                  {date.getDate()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Selected date task list */}
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {plannerTasks.length === 0 ? (
            <View className="py-12 items-center">
              <Calendar size={28} color={Colors.iconMuted} />
              <Text className="text-muted-foreground text-xs mt-2 text-center">
                Không có lịch trình công việc nào trong ngày {selectedDate}.
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
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Card className="p-4 mb-4">
          <View className="flex-row items-center mb-1">
            <Inbox size={16} color={Colors.foreground} />
            <Text className="text-foreground font-extrabold text-sm ml-1.5">Hộp việc chung</Text>
          </View>
          <Text className="text-muted-foreground text-xs leading-normal">
            Nơi lưu nhanh các công việc phát sinh chưa kịp lên lịch làm việc cụ thể.
          </Text>
        </Card>

        {inboxTasks.length === 0 ? (
          <View className="py-12 items-center">
            <Inbox size={28} color={Colors.iconMuted} />
            <Text className="text-muted-foreground text-xs mt-2 text-center">Hộp thư công việc đang trống.</Text>
          </View>
        ) : (
          inboxTasks.map(renderTaskCard)
        )}
      </ScrollView>
    );
  };

  const renderMatrixView = () => {
    const quadrants: { key: TodoQuadrant; label: string; desc: string; variant: 'red' | 'yellow' | 'green' | 'zinc' }[] = [
      { key: 'do', label: '1. Làm ngay (Do)', desc: 'Quan trọng & Khẩn cấp', variant: 'red' },
      { key: 'schedule', label: '2. Lên lịch (Schedule)', desc: 'Quan trọng nhưng không khẩn', variant: 'yellow' },
      { key: 'delegate', label: '3. Ủy quyền (Delegate)', desc: 'Khẩn cấp nhưng không quan trọng', variant: 'green' },
      { key: 'eliminate', label: '4. Loại bỏ (Eliminate)', desc: 'Không quan trọng & không khẩn', variant: 'zinc' }
    ];

    return (
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {quadrants.map((quad) => {
          const list = comedyList(quadrants, quad.key);
          return (
            <Card key={quad.key} className="mb-5 p-4">
              <View className="flex-row justify-between items-center pb-2 border-b border-border/40 mb-3">
                <View>
                  <Text className="text-foreground font-extrabold text-sm">{quad.label}</Text>
                  <Text className="text-muted-foreground text-[10px] mt-0.5">{quad.desc}</Text>
                </View>
                <Badge label={`${list.length} việc`} variant={quad.variant} />
              </View>

              {list.length === 0 ? (
                <Text className="text-muted-foreground text-xs py-2 italic text-center">Chưa có công việc nào.</Text>
              ) : (
                list.map(renderTaskCard)
              )}
            </Card>
          );
        })}
      </ScrollView>
    );
  };

  // Safe helper to extract lists of quadrant
  const comedyList = (quads: any, key: TodoQuadrant) => {
    return tasksByQuadrant[key] || [];
  };

  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <ScreenWrapper scroll={false}>
      {/* Page Header */}
      <View className="px-4 py-3 border-b border-border flex-row items-center justify-between">
        <Text className="text-foreground font-black text-lg">Quản Lý Công Việc</Text>
        {completedCount > 0 && (
          <TouchableOpacity
            onPress={handleClearCompleted}
            className="bg-red-50 border border-red-200/50 px-2.5 py-1 rounded-lg"
          >
            <Text className="text-destructive text-[10px] font-bold">Dọn xong ({completedCount})</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Main View Mode Tabs */}
      <View className="flex-row bg-muted p-1 rounded-xl my-3.5 mx-6">
        <TouchableOpacity
          onPress={() => setActiveView('planner')}
          className={`flex-1 py-2.5 rounded-lg items-center justify-center flex-row ${activeView === 'planner' ? 'bg-card' : ''}`}
        >
          <CalendarDays size={12} color={activeView === 'planner' ? Colors.foreground : Colors.iconMuted} />
          <Text className={`text-[10px] font-extrabold ml-1 ${activeView === 'planner' ? 'text-foreground' : 'text-muted-foreground'}`}>
            Lịch trình
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveView('inbox')}
          className={`flex-1 py-2.5 rounded-lg items-center justify-center flex-row ${activeView === 'inbox' ? 'bg-card' : ''}`}
        >
          <Inbox size={12} color={activeView === 'inbox' ? Colors.foreground : Colors.iconMuted} />
          <Text className={`text-[10px] font-extrabold ml-1 ${activeView === 'inbox' ? 'text-foreground' : 'text-muted-foreground'}`}>
            Hộp việc
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveView('matrix')}
          className={`flex-1 py-2.5 rounded-lg items-center justify-center flex-row ${activeView === 'matrix' ? 'bg-card' : ''}`}
        >
          <LayoutGrid size={12} color={activeView === 'matrix' ? Colors.foreground : Colors.iconMuted} />
          <Text className={`text-[10px] font-extrabold ml-1 ${activeView === 'matrix' ? 'text-foreground' : 'text-muted-foreground'}`}>
            Ma trận
          </Text>
        </TouchableOpacity>
      </View>

      {/* Quick Add Bar */}
      {activeView !== 'matrix' ? (
        <View className="flex-row items-center px-6 mb-3">
          <View className="flex-1 mr-3">
            <Input
              value={quickTitle}
              onChangeText={setQuickTitle}
              placeholder={activeView === 'planner' ? 'Thêm việc nhanh vào ngày này...' : 'Thêm việc nhanh vào Hộp thư...'}
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

      {/* Floating Action Button for Advanced Create */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handleOpenCreateModal}
        className="absolute bottom-6 right-6 bg-foreground w-14 h-14 rounded-full items-center justify-center shadow-lg shadow-black/30 z-50"
      >
        <Plus size={24} color={Colors.background} />
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
                {editingId ? 'Chỉnh Sửa Công Việc' : 'Tạo Công Việc Mới'}
              </Text>
              <TouchableOpacity onPress={() => setModalOpen(false)} className="p-1">
                <Text className="text-muted-foreground text-sm font-semibold">Đóng</Text>
              </TouchableOpacity>
            </View>

            {/* Scrollable Form */}
            <ScrollView contentContainerStyle={{ paddingVertical: 4 }} showsVerticalScrollIndicator={false}>
              <View className="mt-4">
                <Text className="text-foreground text-xs font-bold mb-1.5">Tên công việc*</Text>
                <Input
                  value={formTitle}
                  onChangeText={setFormTitle}
                  placeholder="Ví dụ: Thiết kế giao diện di động"
                />
              </View>

              <View className="mt-4">
                <Text className="text-foreground text-xs font-bold mb-1.5">Nhóm ma trận ưu tiên</Text>
                <ChipGroup
                  data={[
                    { value: 'inbox', label: 'Hộp việc chung' },
                    { value: 'do', label: 'Làm ngay' },
                    { value: 'schedule', label: 'Lên lịch' },
                    { value: 'delegate', label: 'Ủy quyền' },
                    { value: 'eliminate', label: 'Loại bỏ' }
                  ]}
                  value={formQuadrant}
                  onChange={(val: any) => setFormQuadrant(val)}
                />
              </View>

              <View className="mt-4">
                <Text className="text-foreground text-xs font-bold mb-1.5">Ngày lập lịch (YYYY-MM-DD)</Text>
                <Input
                  value={formScheduledDate}
                  onChangeText={setFormScheduledDate}
                  placeholder="Ví dụ: 2026-08-19"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View className="mt-4">
                <Text className="text-foreground text-xs font-bold mb-1.5">Ngày hạn chót (YYYY-MM-DD)</Text>
                <Input
                  value={formDueDate}
                  onChangeText={setFormDueDate}
                  placeholder="Ví dụ: 2026-08-25"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View className="mt-4">
                <Text className="text-foreground text-xs font-bold mb-1.5">Thời gian ước tính (phút)</Text>
                <Input
                  value={formEstTime}
                  onChangeText={setFormEstTime}
                  placeholder="Ví dụ: 60"
                  keyboardType="numeric"
                />
              </View>

              {/* Action Button */}
              <View className="mt-6 mb-8">
                <ButtonPrimary
                  title={editingId ? 'Lưu cập nhật' : 'Tạo mới công việc'}
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
    </ScreenWrapper>
  );
}
