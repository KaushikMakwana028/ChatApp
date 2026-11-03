import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
  StatusBar,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from './Icon';
import Colors from '../theme/colors';

export const WhatsAppHeader = ({
  activeTab = 'CHATS',
  onTabChange,
  unreadCount = 0,
  onCameraPress,
  onSearchPress,
  onNewChatPress,
  onProfilePress,
  onLogoutPress,
}) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const insets = useSafeAreaInsets();

  const tabs = [
    { key: 'CHATS', label: 'CHATS', badge: unreadCount },
    { key: 'STATUS', label: 'STATUS' },
    { key: 'CALLS', label: 'CALLS' },
  ];

  return (
    <View style={[styles.headerWrapper, { paddingTop: Math.max(insets.top, Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0) }]}>
      <StatusBar backgroundColor={Colors.primaryDark} barStyle="light-content" translucent={true} />

      {/* Main Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.titleBrandRow}>
          <Text style={styles.appTitle}>ChatApp</Text>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={onCameraPress}
            activeOpacity={0.7}
          >
            <Icon name="camera" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={onSearchPress}
            activeOpacity={0.7}
          >
            <Icon name="search" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => setMenuVisible(true)}
            activeOpacity={0.7}
          >
            <Icon name="more" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Modern Tabs Bar */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabButton, isActive && styles.activeTabButton]}
              onPress={() => onTabChange && onTabChange(tab.key)}
              activeOpacity={0.8}
            >
              <View style={styles.tabContentRow}>
                <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>
                  {tab.label}
                </Text>
                {!!tab.badge && tab.badge > 0 && (
                  <View style={styles.tabBadge}>
                    <Text style={styles.tabBadgeText}>
                      {tab.badge > 99 ? '99+' : tab.badge}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Dropdown Options Menu */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.dropdownCard}>
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => {
                  setMenuVisible(false);
                  onNewChatPress && onNewChatPress();
                }}
              >
                <Text style={styles.dropdownText}>New chat</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => {
                  setMenuVisible(false);
                  setTimeout(() => {
                    onProfilePress && onProfilePress();
                  }, 120);
                }}
              >
                <Text style={styles.dropdownText}>My Profile</Text>
              </TouchableOpacity>

              <View style={styles.dropdownDivider} />

              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => {
                  setMenuVisible(false);
                  setTimeout(() => {
                    onLogoutPress && onLogoutPress();
                  }, 120);
                }}
              >
                <Text style={[styles.dropdownText, { color: Colors.danger }]}>
                  Log out
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  headerWrapper: {
    backgroundColor: Colors.primary,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  titleBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    padding: 8,
    marginLeft: 6,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderTopWidth: 0,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomColor: '#FFFFFF',
  },
  tabContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.72)',
    letterSpacing: 0.5,
  },
  activeTabLabel: {
    color: '#FFFFFF',
  },
  tabBadge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  dropdownCard: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 88 : 56,
    right: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 6,
    minWidth: 160,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  dropdownText: {
    fontSize: 15,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: 4,
  },
});

export default WhatsAppHeader;
