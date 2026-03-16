import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';

const TRENDING_TOPICS = [
  { id: '1', title: 'Top 10 Backend Interview Questions', author: 'Alex Chen', likes: 124 },
  { id: '2', title: 'How I Cracked Google STEP Internship', author: 'Sarah Jenkins', likes: 89 },
  { id: '3', title: 'Ultimate System Design Guide', author: 'David Wong', likes: 256 },
  { id: '4', title: 'Mastering React Native Animations', author: 'Maria Garcia', likes: 67 },
  { id: '5', title: 'The Road to Senior Engineer', author: 'James Miller', likes: 412 },
];

export default function ExploreScreen() {
  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardAuthor}>By {item.author}</Text>
      <View style={styles.cardFooter}>
        <Text style={styles.cardLikes}>❤️ {item.likes} Likes</Text>
        <Pressable style={styles.readButton}>
          <Text style={styles.readButtonText}>Read</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Trending Resources</Text>
      <Text style={styles.subHeader}>Discover top content from the EduNexus community.</Text>

      <FlatList
        data={TRENDING_TOPICS}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#11181C',
    marginBottom: 8,
    marginTop: 10,
  },
  subHeader: {
    fontSize: 16,
    color: '#687076',
    marginBottom: 20,
  },
  listContent: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#11181C',
    marginBottom: 6,
  },
  cardAuthor: {
    fontSize: 14,
    color: '#687076',
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  cardLikes: {
    fontSize: 14,
    color: '#f59e0b',
    fontWeight: '600',
  },
  readButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  readButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
