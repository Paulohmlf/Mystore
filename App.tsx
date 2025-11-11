import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// --- MUDANÇA 1: Importar RouteProp ---
import { NavigationContainer, RouteProp } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ArrowDown, ArrowUp, ChartBar } from 'phosphor-react-native';
import React from 'react';

// Importar TODAS as telas
import EdicaoScreen from './screens/EdicaoScreen';
import EntradaScreen from './screens/EntradaScreen';
import RelatorioScreen from './screens/RelatorioScreen';
import SaidaScreen from './screens/SaidaScreen';
// --- MUDANÇA 2: Importar a tela que faltava ---
import EditarSaidaScreen from './screens/EditarSaidaScreen';

// O Stack Param List (sem mudanças)
export type RootStackParamList = {
  MainTabs: undefined; 
  EditarProduto: { produtoId: string }; 
  EditarSaida: { saidaId: string };
};

// --- MUDANÇA 3: Definir os tipos para as Abas (Tabs) ---
// Isto vai corrigir o erro do 'route'
type MainTabParamList = {
  Entrada: undefined;
  Saída: undefined;
  Relatório: undefined;
};

const cores = {
  verdeEscuro: '#325E54',
  verdeMedio: '#4A7969',
  verdeClaro: '#A3BFAA',
  begeFundo: '#F5F1E6',
  branco: '#FFFFFF',
  inactive: '#A3BFAA'
};

// --- MUDANÇA 4: Informar ao createBottomTabNavigator o tipo ---
const Tab = createBottomTabNavigator<MainTabParamList>(); 
const Stack = createStackNavigator<RootStackParamList>();

function MainTabNavigator() {
  return (
    <Tab.Navigator
      // --- MUDANÇA 5: Adicionar o tipo para { route } ---
      screenOptions={({ route }: { route: RouteProp<MainTabParamList, keyof MainTabParamList> }) => ({
        tabBarIcon: ({ color, size, focused }: { color: string, size: number, focused: boolean }) => {
          if (route.name === 'Entrada') {
            return <ArrowUp color={color} size={size} weight={focused ? 'fill' : 'regular'} />;
          } else if (route.name === 'Saída') {
            return <ArrowDown color={color} size={size} weight={focused ? 'fill' : 'regular'} />;
          } else if (route.name === 'Relatório') {
            return <ChartBar color={color} size={size} weight={focused ? 'fill' : 'regular'} />;
          }
          return null; 
        },
        tabBarActiveTintColor: cores.verdeEscuro,
        tabBarInactiveTintColor: cores.inactive,
        tabBarStyle: {
          backgroundColor: cores.branco,
          paddingTop: 4,
          borderTopColor: cores.verdeClaro,
          borderTopWidth: 1,
        },
        headerStyle: {
          backgroundColor: cores.verdeEscuro,
        },
        headerTitleStyle: {
          color: cores.branco,
        },
        sceneContainerStyle: {
            backgroundColor: cores.begeFundo
        }
      })}
    >
      <Tab.Screen name="Entrada" component={EntradaScreen} options={{ title: 'Cadastro (Entrada)' }} />
      <Tab.Screen name="Saída" component={SaidaScreen} options={{ title: 'Saída (Venda)' }} />
      <Tab.Screen name="Relatório" component={RelatorioScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: cores.verdeEscuro,
          },
          headerTintColor: cores.branco,
          headerTitleStyle: {
            color: cores.branco,
          },
        }}
      >
        <Stack.Screen 
          name="MainTabs" 
          component={MainTabNavigator} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="EditarProduto" 
          component={EdicaoScreen} 
          options={{ title: 'Editar Produto' }}
        />
        
        {/* --- MUDANÇA 6: Adicionar a tela que faltava --- */}
        <Stack.Screen 
          name="EditarSaida" 
          component={EditarSaidaScreen} 
          options={{ title: 'Editar Registro de Saída' }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}