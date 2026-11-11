import { Drawer } from 'expo-router/drawer';
import {
  DrawerContentScrollView,
  DrawerItem,
  DrawerItemList,
  type DrawerContentComponentProps,
} from 'expo-router/drawer';
import { Alert, Text, View } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';

function AppDrawerContent(props: DrawerContentComponentProps) {
  async function handleSignOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert('No se pudo cerrar sesión', 'Intenta de nuevo.');
      return;
    }
    router.replace('/(auth)/login');
  }

  return (
    <View className="flex-1 bg-white">
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={{ paddingTop: 16 }}
      >
        <DrawerItemList {...props} />
      </DrawerContentScrollView>

      <View className="border-t border-slate-200 px-2 pb-5 pt-2">
        <DrawerItem
          label="Cerrar sesión"
          onPress={() => void handleSignOut()}
          icon={() => (
            <Text className="text-xl font-bold text-red-600">↪</Text>
          )}
          labelStyle={{ color: '#DC2626', fontSize: 15, fontWeight: '600' }}
          activeTintColor="#DC2626"
          inactiveTintColor="#DC2626"
        />
      </View>
    </View>
  );
}

export default function AppLayout() {
  return (
    <Drawer
      initialRouteName="inspecciones"
      drawerContent={(props) => <AppDrawerContent {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: '#F8FAFC' },
        headerTintColor: '#0F172A',
        headerTitleStyle: { fontWeight: '700' },
        drawerActiveTintColor: '#0F172A',
        drawerInactiveTintColor: '#64748B',
        drawerStyle: { backgroundColor: '#FFFFFF' },
        sceneStyle: { backgroundColor: '#F8FAFC' },
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          drawerItemStyle: { display: 'none' },
          headerShown: false,
        }}
      />
      <Drawer.Screen
        name="inspecciones"
        options={{
          drawerLabel: 'Inicio',
          title: 'Inicio',
          headerShown: false,
          drawerIcon: () => <Text className="text-xl">🏠</Text>,
        }}
      />
      <Drawer.Screen
        name="reportes"
        options={{
          drawerLabel: 'Reportes',
          title: 'Reportes',
          headerShown: false,
          drawerIcon: () => <Text className="text-xl">📋</Text>,
        }}
      />
      <Drawer.Screen
        name="profile"
        options={{
          drawerLabel: 'Perfil',
          title: 'Perfil',
          drawerIcon: () => <Text className="text-xl">👤</Text>,
        }}
      />
    </Drawer>
  );
}
