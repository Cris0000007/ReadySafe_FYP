import React, { useCallback, useEffect, useMemo, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  Alert,
  FlatList,
  Linking,
  SafeAreaView,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { useAudioPlayer } from "expo-audio";

const Stack = createNativeStackNavigator();

const STORAGE_KEYS = {
  tasks: "@readysafe_tasks_v2",
  profile: "@readysafe_profile_v1",
  quiz: "@readysafe_quiz_v1",
};

const INITIAL_TASKS = [
  {
    id: "1",
    title: "Create emergency contact list",
    category: "Contacts",
    why: "Quick access to key contacts can reduce panic during an emergency.",
    description:
      "Save the phone numbers of close family members, trusted neighbours and emergency services.",
    tip: "Include at least one contact outside your immediate area.",
  },
  {
    id: "2",
    title: "Save local emergency hotline",
    category: "Contacts",
    why: "Emergency services should be reachable immediately when time matters.",
    description:
      "Store the main emergency hotline and your local disaster support number on your phone.",
    tip: "Add the numbers to favourites so they are easier to find.",
  },
  {
    id: "3",
    title: "Share emergency plan with family",
    category: "Contacts",
    why: "Preparedness works better when everyone knows the same plan.",
    description:
      "Tell family members who to call, where to go, and what to do if communication is interrupted.",
    tip: "Keep the explanation short and practical.",
  },
  {
    id: "4",
    title: "Prepare basic emergency kit",
    category: "Supplies",
    why: "Basic supplies help you cope during the first hours of an emergency.",
    description:
      "Prepare a bag with water, food, torchlight, batteries, first aid items and a power bank.",
    tip: "Store the kit somewhere easy to reach.",
  },
  {
    id: "5",
    title: "Store clean drinking water",
    category: "Supplies",
    why: "Water supply may be interrupted during severe weather or flooding.",
    description:
      "Keep enough clean drinking water for at least basic short-term use at home.",
    tip: "Check storage condition regularly.",
  },
  {
    id: "6",
    title: "Check torchlight and batteries",
    category: "Supplies",
    why: "Power cuts are common during storms and serious weather events.",
    description:
      "Make sure your torchlight works and that spare batteries are available.",
    tip: "A fully charged power bank is also useful.",
  },
  {
    id: "7",
    title: "Choose a family meeting point",
    category: "Family Plan",
    why: "Family members may become separated during an emergency.",
    description:
      "Agree on one safe meeting place that everyone knows and can reach if possible.",
    tip: "Choose somewhere practical and easy to explain.",
  },
  {
    id: "8",
    title: "Plan communication if separated",
    category: "Family Plan",
    why: "Communication can become difficult when networks are busy or unstable.",
    description:
      "Decide how family members will communicate if phone calls fail.",
    tip: "Choose a backup method such as text messages or a check-in contact.",
  },
  {
    id: "9",
    title: "Assign simple responsibilities",
    category: "Family Plan",
    why: "Clear roles reduce confusion during stressful situations.",
    description:
      "Decide who carries the emergency kit, who checks on children or older family members, and who confirms key information.",
    tip: "Keep responsibilities realistic and simple.",
  },
  {
    id: "10",
    title: "Save important documents safely",
    category: "Documents",
    why: "Important records may be needed quickly during recovery and insurance claims.",
    description:
      "Store IDs, insurance papers, medical records and household documents in a safe place.",
    tip: "Use a waterproof folder if possible.",
  },
  {
    id: "11",
    title: "Keep digital copies of IDs",
    category: "Documents",
    why: "Digital copies can be useful if physical documents are damaged or lost.",
    description:
      "Store scanned copies of important documents in a secure digital location.",
    tip: "Use password protection where appropriate.",
  },
  {
    id: "12",
    title: "Record medical information",
    category: "Documents",
    why: "Medical needs should be available quickly in an emergency.",
    description:
      "Note important medication, allergies and health needs for yourself or family members.",
    tip: "Update the information if treatment changes.",
  },
  {
    id: "13",
    title: "Learn safe evacuation routes",
    category: "Evacuation",
    why: "Knowing where to go can save time during severe flooding or storms.",
    description:
      "Identify safe routes away from low-lying or risky areas around your home.",
    tip: "Avoid routes that are likely to flood quickly.",
  },
  {
    id: "14",
    title: "Identify nearest safe area",
    category: "Evacuation",
    why: "A known safe location helps you act faster when warnings appear.",
    description:
      "Identify a nearby safe place such as higher ground, a shelter, or a trusted relative’s home.",
    tip: "Discuss this location with family members in advance.",
  },
  {
    id: "15",
    title: "Review flood or storm response steps",
    category: "Evacuation",
    why: "Simple, repeated knowledge improves confidence during emergencies.",
    description:
      "Review the basic steps for staying safe during floods or severe storms.",
    tip: "Focus on the first three actions you should take.",
  },
].map((task) => ({ ...task, completed: false }));

const QUIZ_QUESTIONS = [
  {
    id: "q1",
    question: "What should you prepare before a flood emergency?",
    options: [
      "A basic emergency kit",
      "A decorative lamp",
      "A gaming console",
      "A large speaker",
    ],
    correctIndex: 0,
    explanation:
      "A basic emergency kit supports you during the first part of an emergency.",
    recommendedTaskId: "4",
  },
  {
    id: "q2",
    question: "Why is a family meeting point important?",
    options: [
      "It improves mobile signal",
      "It helps family members reunite if separated",
      "It replaces emergency contacts",
      "It avoids all evacuation needs",
    ],
    correctIndex: 1,
    explanation:
      "A meeting point helps family members know where to go if they become separated.",
    recommendedTaskId: "7",
  },
  {
    id: "q3",
    question: "Which item is most useful during a power outage?",
    options: ["Torchlight", "Perfume", "Picture frame", "Desk ornament"],
    correctIndex: 0,
    explanation:
      "A working torchlight is one of the most useful items during a power cut.",
    recommendedTaskId: "6",
  },
  {
    id: "q4",
    question: "What is a good way to protect important personal records?",
    options: [
      "Leave them on the dining table",
      "Store them in a safe and dry place",
      "Only remember them mentally",
      "Ignore them until an emergency happens",
    ],
    correctIndex: 1,
    explanation:
      "Important records should be stored safely and preferably protected from water damage.",
    recommendedTaskId: "10",
  },
  {
    id: "q5",
    question: "What should you do if roads are flooding heavily?",
    options: [
      "Drive through quickly",
      "Wait inside your car in deep water",
      "Avoid flooded roads and follow safe guidance",
      "Ignore warnings",
    ],
    correctIndex: 2,
    explanation:
      "Flooded roads can be dangerous and should be avoided whenever possible.",
    recommendedTaskId: "13",
  },
  {
    id: "q6",
    question:
      "Why should emergency contacts include someone outside your area?",
    options: [
      "They may still be reachable if local networks are affected",
      "They can replace emergency services",
      "They do not need a phone",
      "It is only for decoration",
    ],
    correctIndex: 0,
    explanation:
      "An outside-area contact can still be reachable even if local communication is disrupted.",
    recommendedTaskId: "1",
  },
];

const ALERTS_BY_REGION = {
  "City A": {
    level: "Orange",
    title: "Heavy Rain Warning",
    message:
      "Simulated alert: Expect heavy rainfall in the next 6 hours. Flash flooding is possible in low-lying areas.",
    steps: [
      "Move valuables to higher shelves.",
      "Avoid driving through flooded roads.",
      "Check your emergency kit and torchlights.",
    ],
    relatedTaskId: "15",
  },
  "City B": {
    level: "Red",
    title: "Flood Warning",
    message:
      "Simulated alert: River levels are rising. Flooding of some homes and roads is expected.",
    steps: [
      "Prepare to move to higher ground.",
      "Charge your phone and power bank.",
      "Stay tuned to official announcements.",
    ],
    relatedTaskId: "14",
  },
  "City C": {
    level: "Yellow",
    title: "Thunderstorm Advisory",
    message:
      "Simulated alert: Strong winds and thunderstorms expected this evening.",
    steps: [
      "Secure loose outdoor items.",
      "Stay indoors during thunderstorms.",
      "Avoid standing under trees or near power lines.",
    ],
    relatedTaskId: "6",
  },
};

const REGIONS = Object.keys(ALERTS_BY_REGION);

const RESOURCES = [
  {
    id: "r1",
    name: "Fire & Rescue Department",
    phone: "999",
    type: "Emergency",
  },
  {
    id: "r2",
    name: "Ambulance / Medical Emergency",
    phone: "999",
    type: "Emergency",
  },
  {
    id: "r3",
    name: "Police Hotline",
    phone: "999",
    type: "Emergency",
  },
  {
    id: "r4",
    name: "National Disaster Management Agency",
    phone: "03-8000-8000",
    type: "Information",
  },
  {
    id: "r5",
    name: "Official Weather Information Website",
    url: "https://www.met.gov.my",
    type: "Information",
  },
];

function getScoreMessage(score) {
  if (score === 100) return "Great work! You’ve completed all key tasks.";
  if (score > 75) return "You’re almost ready for emergencies.";
  if (score > 25) return "Nice progress, keep going.";
  if (score > 0) return "You’ve made a start. Keep building your plan.";
  return "You’re just getting started.";
}

function createSections(tasks) {
  const grouped = tasks.reduce((acc, task) => {
    if (!acc[task.category]) acc[task.category] = [];
    acc[task.category].push(task);
    return acc;
  }, {});
  return Object.keys(grouped).map((category) => ({
    title: category,
    data: grouped[category],
  }));
}

function useTasks() {
  const [tasks, setTasks] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEYS.tasks);
        if (stored) {
          setTasks(JSON.parse(stored));
        } else {
          setTasks(INITIAL_TASKS);
        }
      } catch (e) {
        console.warn("Failed to load tasks", e);
        setTasks(INITIAL_TASKS);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const saveTasks = useCallback(async (newTasks) => {
    try {
      setTasks(newTasks);
      await AsyncStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(newTasks));
    } catch (e) {
      console.warn("Failed to save tasks", e);
    }
  }, []);

  const toggleTask = useCallback(
    async (id) => {
      const newTasks = tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      );
      await Haptics.selectionAsync();
      saveTasks(newTasks);
    },
    [tasks, saveTasks]
  );

  const getTaskById = useCallback(
    (id) => tasks.find((task) => task.id === id),
    [tasks]
  );

  const completedCount = tasks.filter((task) => task.completed).length;
  const totalCount = tasks.length || 1;
  const score = Math.round((completedCount / totalCount) * 100);

  return {
    tasks,
    loaded,
    toggleTask,
    getTaskById,
    completedCount,
    totalCount,
    score,
  };
}

function useProfile() {
  const [profile, setProfile] = useState({
    name: "",
    emergencyContact: "",
    familyMeetingPoint: "",
    medicalNotes: "",
    homeRegion: "City A",
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEYS.profile);
        if (stored) {
          setProfile(JSON.parse(stored));
        }
      } catch (e) {
        console.warn("Failed to load profile", e);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const saveProfile = useCallback(async (newProfile) => {
    await AsyncStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(newProfile));
    setProfile(newProfile);
  }, []);

  const isProfileComplete =
    profile.name.trim() &&
    profile.emergencyContact.trim() &&
    profile.familyMeetingPoint.trim();

  return { profile, loaded, saveProfile, isProfileComplete };
}

function useQuiz() {
  const [latestScore, setLatestScore] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEYS.quiz);
        if (stored) {
          const parsed = JSON.parse(stored);
          setLatestScore(parsed.latestScore ?? null);
        }
      } catch (e) {
        console.warn("Failed to load quiz score", e);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const saveLatestScore = useCallback(async (score) => {
    setLatestScore(score);
    await AsyncStorage.setItem(
      STORAGE_KEYS.quiz,
      JSON.stringify({ latestScore: score })
    );
  }, []);

  return { latestScore, loaded, saveLatestScore };
}

function HomeScreen({ navigation, taskHook, profileHook, quizHook }) {
  const { loaded, completedCount, totalCount, score } = taskHook;
  const { profile, isProfileComplete } = profileHook;
  const { latestScore } = quizHook;

  const profileInitial = profile?.name?.trim()
    ? profile.name.trim().charAt(0).toUpperCase()
    : "?";

  if (!loaded) {
    return (
      <SafeAreaView style={styles.center}>
        <Text>Loading ReadySafe...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>ReadySafe</Text>
        <Text style={styles.pageDescription}>
          Build calm and practical disaster readiness one step at a time.
        </Text>

        <View style={styles.card}>
          <Text style={styles.title}>Preparedness Overview</Text>
          <Text style={styles.bigNumber}>{score}%</Text>
          <Text style={styles.subtitle}>Your current preparedness level</Text>

          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${score}%` }]} />
          </View>

          <Text style={styles.summary}>
            You have completed {completedCount} out of {totalCount} tasks.
          </Text>
          <Text style={styles.message}>{getScoreMessage(score)}</Text>
        </View>

        <View style={styles.focusCard}>
          <Text style={styles.focusTitle}>Today’s focus</Text>
          <Text style={styles.focusText}>
            Complete one preparedness task and review one emergency scenario.
          </Text>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Profile</Text>
            <Text style={styles.infoValue}>
              {isProfileComplete ? "Complete" : "Incomplete"}
            </Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Latest Quiz</Text>
            <Text style={styles.infoValue}>
              {latestScore === null ? "Not done" : `${latestScore}%`}
            </Text>
          </View>
        </View>

        <View style={styles.profileSummaryCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{profileInitial}</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.profileSummaryTitle}>Emergency Profile</Text>

            {isProfileComplete ? (
              <>
                <Text style={styles.profileSummaryText}>
                  Name: {profile.name}
                </Text>
                <Text style={styles.profileSummaryText}>
                  Contact: {profile.emergencyContact}
                </Text>
                <Text style={styles.profileSummaryText}>
                  Meeting point: {profile.familyMeetingPoint}
                </Text>
                <Text style={styles.profileSummaryText}>
                  Region: {profile.homeRegion}
                </Text>
              </>
            ) : (
              <Text style={styles.profileSummaryText}>
                Your emergency profile is not complete yet.
              </Text>
            )}
          </View>
        </View>

        {!isProfileComplete && (
          <Text style={styles.noticeText}>
            Recommended next action: complete your emergency profile.
          </Text>
        )}

        <TouchableOpacity
          onPress={() => navigation.navigate("Tasks")}
          style={styles.button}
        >
          <Text style={styles.buttonText}>📝 View Tasks</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate("Quiz")}
          style={[styles.button, styles.buttonSecondary]}
        >
          <Text style={styles.buttonSecondaryText}>❓ Take Quiz</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate("Profile")}
          style={[styles.button, styles.buttonSecondary]}
        >
          <Text style={styles.buttonSecondaryText}>👤 Emergency Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate("Alerts")}
          style={[styles.button, styles.buttonSecondary]}
        >
          <Text style={styles.buttonSecondaryText}>⚠️ Simulated Alerts</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate("Resources")}
          style={[styles.button, styles.buttonSecondary]}
        >
          <Text style={styles.buttonSecondaryText}>☎️ Resource Hub</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function TasksScreen({ navigation, taskHook }) {
  const { loaded, tasks, toggleTask } = taskHook;
  const sections = useMemo(() => createSections(tasks), [tasks]);

  if (!loaded) {
    return (
      <SafeAreaView style={styles.center}>
        <Text>Loading tasks...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.pageTitle}>Preparedness Tasks</Text>
      <Text style={styles.pageDescription}>
        Complete small actions to improve your overall readiness.
      </Text>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionHeader}>{title}</Text>
        )}
        renderItem={({ item }) => (
          <View
            style={[
              styles.taskItem,
              item.completed && styles.taskItemCompleted,
            ]}
          >
            <TouchableOpacity
              onPress={() => toggleTask(item.id)}
              style={styles.checkbox}
            >
              {item.completed && <View style={styles.checkboxInner} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={{ flex: 1 }}
              onPress={() =>
                navigation.navigate("TaskDetail", { taskId: item.id })
              }
            >
              <Text
                style={[
                  styles.taskTitle,
                  item.completed && styles.taskTitleCompleted,
                ]}
              >
                {item.title}
              </Text>
              <Text style={styles.taskCategory}>{item.category}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                navigation.navigate("TaskDetail", { taskId: item.id })
              }
              style={styles.smallButton}
            >
              <Text style={styles.smallButtonText}>Details</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

function TaskDetailScreen({ route, taskHook }) {
  const { taskId } = route.params;
  const { getTaskById, toggleTask } = taskHook;
  const task = getTaskById(taskId);

  if (!task) {
    return (
      <SafeAreaView style={styles.center}>
        <Text>Task not found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Task Details</Text>
        <Text style={styles.pageDescription}>
          Read the purpose of this task and what you should do in practice.
        </Text>

        <View style={styles.card}>
          <Text style={styles.screenTitle}>{task.title}</Text>
          <Text style={styles.detailBadge}>{task.category}</Text>

          <Text style={styles.detailLabel}>Why this matters</Text>
          <Text style={styles.detailText}>{task.why}</Text>

          <Text style={styles.detailLabel}>What to do</Text>
          <Text style={styles.detailText}>{task.description}</Text>

          <Text style={styles.detailLabel}>Example / tip</Text>
          <Text style={styles.detailText}>{task.tip}</Text>

          <TouchableOpacity
            onPress={() => toggleTask(task.id)}
            style={styles.button}
          >
            <Text style={styles.buttonText}>
              {task.completed ? "✓ Mark as Incomplete" : "✓ Mark as Complete"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function QuizScreen({ navigation, quizHook, taskHook, successPlayer }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongTaskIds, setWrongTaskIds] = useState([]);
  const [showResult, setShowResult] = useState(false);

  const currentQuestion = QUIZ_QUESTIONS[currentIndex];

  const resetQuiz = () => {
    setCurrentIndex(0);
    setSelectedIndex(null);
    setCorrectCount(0);
    setWrongTaskIds([]);
    setShowResult(false);
  };

  const handleNext = async () => {
    if (selectedIndex === null) {
      Alert.alert("Please choose an answer first.");
      return;
    }

    await Haptics.selectionAsync();

    const isCorrect = selectedIndex === currentQuestion.correctIndex;
    const nextCorrect = isCorrect ? correctCount + 1 : correctCount;
    const nextWrongTaskIds = isCorrect
      ? wrongTaskIds
      : [...new Set([...wrongTaskIds, currentQuestion.recommendedTaskId])];

    if (currentIndex === QUIZ_QUESTIONS.length - 1) {
      const finalScore = Math.round(
        (nextCorrect / QUIZ_QUESTIONS.length) * 100
      );
      setCorrectCount(nextCorrect);
      setWrongTaskIds(nextWrongTaskIds);
      setShowResult(true);
      await quizHook.saveLatestScore(finalScore);

      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      );
      successPlayer.seekTo(0);
      successPlayer.play();
    } else {
      setCorrectCount(nextCorrect);
      setWrongTaskIds(nextWrongTaskIds);
      setCurrentIndex((prev) => prev + 1);
      setSelectedIndex(null);
    }
  };

  const recommendedTasks = wrongTaskIds
    .map((id) => taskHook.getTaskById(id))
    .filter(Boolean);

  if (showResult) {
    const finalScore = Math.round(
      (correctCount / QUIZ_QUESTIONS.length) * 100
    );
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.pageTitle}>Quiz Result</Text>
          <Text style={styles.pageDescription}>
            Review your score and the tasks that may need more attention.
          </Text>

          <View style={styles.card}>
            <Text style={styles.bigNumber}>{finalScore}%</Text>
            <Text style={styles.subtitle}>
              You answered {correctCount} out of {QUIZ_QUESTIONS.length} correctly.
            </Text>

            <Text style={styles.detailLabel}>Recommended tasks</Text>
            {recommendedTasks.length === 0 ? (
              <Text style={styles.detailText}>
                Great job. You did not miss any task-linked questions.
              </Text>
            ) : (
              recommendedTasks.map((task) => (
                <TouchableOpacity
                  key={task.id}
                  onPress={() =>
                    navigation.navigate("TaskDetail", { taskId: task.id })
                  }
                  style={styles.recommendationCard}
                >
                  <Text style={styles.recommendationTitle}>{task.title}</Text>
                  <Text style={styles.taskCategory}>{task.category}</Text>
                </TouchableOpacity>
              ))
            )}

            <TouchableOpacity onPress={resetQuiz} style={styles.button}>
              <Text style={styles.buttonText}>↻ Retake Quiz</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Preparedness Quiz</Text>
        <Text style={styles.pageDescription}>
          Answer a few simple questions to review your emergency readiness.
        </Text>

        <View style={styles.card}>
          <Text style={styles.subtitle}>
            Question {currentIndex + 1} of {QUIZ_QUESTIONS.length}
          </Text>

          <Text style={styles.questionText}>{currentQuestion.question}</Text>

          {currentQuestion.options.map((option, index) => (
            <TouchableOpacity
              key={index}
              onPress={async () => {
                setSelectedIndex(index);
                await Haptics.selectionAsync();
              }}
              style={[
                styles.optionCard,
                selectedIndex === index && styles.optionCardSelected,
              ]}
            >
              <Text
                style={[
                  styles.optionText,
                  selectedIndex === index && styles.optionTextSelected,
                ]}
              >
                {option}
              </Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity onPress={handleNext} style={styles.button}>
            <Text style={styles.buttonText}>
              {currentIndex === QUIZ_QUESTIONS.length - 1
                ? "✓ Finish Quiz"
                : "→ Next Question"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ProfileScreen({ profileHook, successPlayer }) {
  const { profile, loaded, saveProfile } = profileHook;
  const [form, setForm] = useState(profile);

  useEffect(() => {
    setForm(profile);
  }, [profile]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.alert("Please enter your name.");
      return;
    }
    if (!form.emergencyContact.trim()) {
      Alert.alert("Please enter an emergency contact.");
      return;
    }
    if (!form.familyMeetingPoint.trim()) {
      Alert.alert("Please enter a family meeting point.");
      return;
    }

    await saveProfile(form);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    successPlayer.seekTo(0);
    successPlayer.play();

    Alert.alert(
      "Profile saved",
      "Your emergency details have been stored on this device."
    );
  };

  if (!loaded) {
    return (
      <SafeAreaView style={styles.center}>
        <Text>Loading profile...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Emergency Profile</Text>
        <Text style={styles.pageDescription}>
          Save practical details that may be useful during an emergency.
        </Text>

        <View style={styles.card}>
          <Text style={styles.inputLabel}>Full name</Text>
          <TextInput
            value={form.name}
            onChangeText={(text) => updateField("name", text)}
            style={styles.input}
            placeholder="Enter your full name"
            placeholderTextColor="#A08C7F"
          />

          <Text style={styles.inputLabel}>Emergency contact</Text>
          <TextInput
            value={form.emergencyContact}
            onChangeText={(text) => updateField("emergencyContact", text)}
            style={styles.input}
            placeholder="Enter emergency contact number"
            placeholderTextColor="#A08C7F"
          />

          <Text style={styles.inputLabel}>Family meeting point</Text>
          <TextInput
            value={form.familyMeetingPoint}
            onChangeText={(text) => updateField("familyMeetingPoint", text)}
            style={styles.input}
            placeholder="Enter meeting point"
            placeholderTextColor="#A08C7F"
          />

          <Text style={styles.inputLabel}>Medical notes</Text>
          <TextInput
            value={form.medicalNotes}
            onChangeText={(text) => updateField("medicalNotes", text)}
            style={[styles.input, styles.multilineInput]}
            placeholder="Allergies, medication, special needs"
            placeholderTextColor="#A08C7F"
            multiline
          />

          <Text style={styles.inputLabel}>Home region</Text>
          <View style={styles.regionRow}>
            {REGIONS.map((region) => (
              <TouchableOpacity
                key={region}
                onPress={async () => {
                  updateField("homeRegion", region);
                  await Haptics.selectionAsync();
                }}
                style={[
                  styles.regionChip,
                  form.homeRegion === region && styles.regionChipSelected,
                ]}
              >
                <Text
                  style={[
                    styles.regionChipText,
                    form.homeRegion === region && styles.regionChipTextSelected,
                  ]}
                >
                  {region}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity onPress={handleSave} style={styles.button}>
            <Text style={styles.buttonText}>💾 Save Profile</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function AlertsScreen({ navigation, alertPlayer }) {
  const [selectedRegion, setSelectedRegion] = useState(REGIONS[0]);
  const alertData = ALERTS_BY_REGION[selectedRegion];

  const handleDrill = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    alertPlayer.seekTo(0);
    alertPlayer.play();

    Alert.alert(
      "Drill steps",
      alertData.steps.map((step, index) => `${index + 1}. ${step}`).join("\n")
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Simulated Alerts</Text>
        <Text style={styles.pageDescription}>
          Review warning scenarios and practise a calm response.
        </Text>

        <Text style={styles.sectionLabel}>Select region</Text>
        <View style={styles.regionRow}>
          {REGIONS.map((region) => (
            <TouchableOpacity
              key={region}
              onPress={async () => {
                setSelectedRegion(region);
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                alertPlayer.seekTo(0);
                alertPlayer.play();
              }}
              style={[
                styles.regionChip,
                selectedRegion === region && styles.regionChipSelected,
              ]}
            >
              <Text
                style={[
                  styles.regionChipText,
                  selectedRegion === region && styles.regionChipTextSelected,
                ]}
              >
                {region}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.alertCard}>
          <Text style={styles.alertRegion}>{selectedRegion}</Text>
          <Text style={styles.alertLevel}>Level: {alertData.level}</Text>
          <Text style={styles.alertTitle}>{alertData.title}</Text>
          <Text style={styles.alertMessage}>{alertData.message}</Text>

          <Text style={styles.sectionLabel}>Recommended steps</Text>
          {alertData.steps.map((step, index) => (
            <Text key={index} style={styles.alertStep}>
              {index + 1}. {step}
            </Text>
          ))}

          <TouchableOpacity onPress={handleDrill} style={styles.button}>
            <Text style={styles.buttonText}>⚠️ Start Drill</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              navigation.navigate("TaskDetail", {
                taskId: alertData.relatedTaskId,
              })
            }
            style={[styles.button, styles.buttonSecondary]}
          >
            <Text style={styles.buttonSecondaryText}>📝 Open Related Task</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate("Resources")}
            style={[styles.button, styles.buttonSecondary]}
          >
            <Text style={styles.buttonSecondaryText}>☎️ Open Resource Hub</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ResourceHubScreen() {
  const handleCall = (phone) => {
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert("Call not supported on this device.");
    });
  };

  const handleLink = (url) => {
    Linking.openURL(url).catch(() => {
      Alert.alert("Unable to open link.");
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.pageTitle}>Resource Hub</Text>
      <Text style={styles.pageDescription}>
        Keep essential emergency contacts and information in one place.
      </Text>

      <FlatList
        showsVerticalScrollIndicator={false}
        data={RESOURCES}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.resourceItem}>
            <View style={{ flex: 1 }}>
              <Text style={styles.resourceName}>{item.name}</Text>
              <Text style={styles.resourceType}>{item.type}</Text>
              {item.phone && (
                <Text style={styles.resourceDetail}>Phone: {item.phone}</Text>
              )}
              {item.url && (
                <Text style={styles.resourceDetail}>Website: {item.url}</Text>
              )}
            </View>
            {item.phone && (
              <TouchableOpacity
                onPress={() => handleCall(item.phone)}
                style={styles.smallButton}
              >
                <Text style={styles.smallButtonText}>Call</Text>
              </TouchableOpacity>
            )}
            {item.url && (
              <TouchableOpacity
                onPress={() => handleLink(item.url)}
                style={styles.smallButton}
              >
                <Text style={styles.smallButtonText}>Open</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

function AppInner() {
  const taskHook = useTasks();
  const profileHook = useProfile();
  const quizHook = useQuiz();

  const alertPlayer = useAudioPlayer(require("./assets/sounds/alert.mp3"));
  const successPlayer = useAudioPlayer(require("./assets/sounds/success.mp3"));

  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" options={{ title: "ReadySafe" }}>
        {(props) => (
          <HomeScreen
            {...props}
            taskHook={taskHook}
            profileHook={profileHook}
            quizHook={quizHook}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name="Tasks" options={{ title: "Preparedness Tasks" }}>
        {(props) => <TasksScreen {...props} taskHook={taskHook} />}
      </Stack.Screen>

      <Stack.Screen name="TaskDetail" options={{ title: "Task Details" }}>
        {(props) => <TaskDetailScreen {...props} taskHook={taskHook} />}
      </Stack.Screen>

      <Stack.Screen name="Quiz" options={{ title: "Preparedness Quiz" }}>
        {(props) => (
          <QuizScreen
            {...props}
            quizHook={quizHook}
            taskHook={taskHook}
            successPlayer={successPlayer}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name="Profile" options={{ title: "Emergency Profile" }}>
        {(props) => (
          <ProfileScreen
            {...props}
            profileHook={profileHook}
            successPlayer={successPlayer}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name="Alerts" options={{ title: "Simulated Alerts" }}>
        {(props) => <AlertsScreen {...props} alertPlayer={alertPlayer} />}
      </Stack.Screen>

      <Stack.Screen
        name="Resources"
        component={ResourceHubScreen}
        options={{ title: "Resource Hub" }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <AppInner />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAF6F1",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#6F4E37",
    marginBottom: 6,
  },
  pageDescription: {
    fontSize: 14,
    color: "#8C786B",
    marginBottom: 14,
    lineHeight: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#B89B8A",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
    color: "#6F4E37",
  },
  bigNumber: {
    fontSize: 48,
    fontWeight: "700",
    textAlign: "center",
    color: "#8A5A44",
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 8,
    color: "#7A6A5F",
  },
  progressBarBackground: {
    height: 10,
    borderRadius: 5,
    backgroundColor: "#EADFD4",
    marginVertical: 12,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#E9967A",
  },
  summary: {
    textAlign: "center",
    marginBottom: 4,
    color: "#5E5248",
  },
  message: {
    textAlign: "center",
    marginBottom: 16,
    color: "#6B5B52",
  },
  noticeText: {
    textAlign: "center",
    color: "#9B6A52",
    marginBottom: 8,
    fontWeight: "500",
  },
  focusCard: {
    backgroundColor: "#FFF4EA",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  focusTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#8A5A44",
    marginBottom: 4,
  },
  focusText: {
    fontSize: 13,
    color: "#5E5248",
    lineHeight: 19,
  },
  infoRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  infoCard: {
    flex: 1,
    backgroundColor: "#FFF4EA",
    borderRadius: 12,
    padding: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: "#8C786B",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#6F4E37",
  },
  profileSummaryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF4EA",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#E9967A",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "700",
  },
  profileSummaryTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
    color: "#6F4E37",
  },
  profileSummaryText: {
    fontSize: 13,
    color: "#5E5248",
    marginBottom: 2,
  },
  button: {
    marginTop: 10,
    backgroundColor: "#E9967A",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  buttonSecondary: {
    backgroundColor: "#F4E6D9",
    borderWidth: 1,
    borderColor: "#E7D2C2",
  },
  buttonSecondaryText: {
    color: "#8A5A44",
    fontWeight: "600",
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
    color: "#6F4E37",
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: "700",
    marginTop: 14,
    marginBottom: 8,
    color: "#8A5A44",
    backgroundColor: "#F4E6D9",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    overflow: "hidden",
  },
  taskItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
  },
  taskItemCompleted: {
    backgroundColor: "#F2E8DE",
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#E9967A",
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxInner: {
    width: 14,
    height: 14,
    borderRadius: 2,
    backgroundColor: "#E9967A",
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#4F433C",
  },
  taskTitleCompleted: {
    textDecorationLine: "line-through",
    color: "#8C7B70",
  },
  taskCategory: {
    fontSize: 12,
    color: "#A08C7F",
  },
  detailBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#F4E6D9",
    color: "#8A5A44",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 14,
    overflow: "hidden",
  },
  detailLabel: {
    fontWeight: "700",
    marginTop: 10,
    marginBottom: 4,
    color: "#8A5A44",
  },
  detailText: {
    color: "#5E5248",
    lineHeight: 21,
  },
  questionText: {
    fontSize: 18,
    fontWeight: "600",
    marginVertical: 12,
    lineHeight: 26,
    color: "#4F433C",
  },
  optionCard: {
    backgroundColor: "#FFF4EA",
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#EADFD4",
  },
  optionCardSelected: {
    backgroundColor: "#E9967A",
    borderColor: "#E9967A",
  },
  optionText: {
    color: "#4F433C",
  },
  optionTextSelected: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  recommendationCard: {
    backgroundColor: "#FFF4EA",
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
  },
  recommendationTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#6F4E37",
  },
  inputLabel: {
    fontWeight: "600",
    marginBottom: 6,
    marginTop: 10,
    color: "#6F4E37",
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D9C6B8",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#4F433C",
  },
  multilineInput: {
    minHeight: 90,
    textAlignVertical: "top",
  },
  sectionLabel: {
    marginTop: 12,
    marginBottom: 6,
    fontWeight: "600",
    color: "#6F4E37",
  },
  regionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  regionChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#F4E6D9",
    marginRight: 8,
    marginBottom: 8,
  },
  regionChipSelected: {
    backgroundColor: "#E9967A",
  },
  regionChipText: {
    color: "#6F4E37",
  },
  regionChipTextSelected: {
    color: "#FFFFFF",
  },
  alertCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    marginTop: 4,
    marginBottom: 16,
  },
  alertRegion: {
    fontWeight: "600",
    marginBottom: 4,
    color: "#6F4E37",
  },
  alertLevel: {
    color: "#B85C38",
    marginBottom: 4,
    fontWeight: "600",
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
    color: "#6F4E37",
  },
  alertMessage: {
    marginBottom: 8,
    color: "#5E5248",
  },
  alertStep: {
    marginBottom: 4,
    color: "#5E5248",
  },
  resourceItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
  },
  resourceName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#4F433C",
  },
  resourceType: {
    fontSize: 12,
    color: "#8C786B",
  },
  resourceDetail: {
    fontSize: 12,
    color: "#6B5B52",
  },
  smallButton: {
    marginLeft: 8,
    backgroundColor: "#E9967A",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  smallButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
});