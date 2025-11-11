import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import React from 'react';
// NOVO: Importar createStackNavigator
import { createStackNavigator } from '@react-navigation/stack';
// Ícone Pencil removido das tabs
import { ArrowDown, ArrowUp, ChartBar } from 'phosphor-react-native';

// Importar as 4 telas
import EdicaoScreen from './screens/EdicaoScreen'; // A nossa tela de Edição
import EntradaScreen from './screens/EntradaScreen';
import RelatorioScreen from './screens/RelatorioScreen';
import SaidaScreen from './screens/SaidaScreen';

// NOVO: Exportar os tipos de rotas da Pilha (Stack)
// Isto é essencial para o TypeScript nas outras telas
export type RootStackParamList = {
  MainTabs: undefined; // Rota para as tabs (não precisa de parâmetros)
  EditarProduto: { produtoId: string }; // Rota para a tela de edição (espera um ID)
};

// Cores (sem alteração)
const cores = {
  verdeEscuro: '#325E54',
  verdeMedio: '#4A7969',
  verdeClaro: '#A3BFAA',
  begeFundo: '#F5F1E6',
  branco: '#FFFFFF',
  inactive: '#A3BFAA'
};

const Tab = createBottomTabNavigator();
// NOVO: Criar o Stack
const Stack = createStackNavigator<RootStackParamList>();

/**
 * NOVO: Este componente define apenas a navegação das Abas (Bottom Tabs)
 * Removemos a aba "Edição" daqui.
 */
function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size, focused }: { color: string, size: number, focused: boolean }) => {
          if (route.name === 'Entrada') {
            return <ArrowUp color={color} size={size} weight={focused ? 'fill' : 'regular'} />;
          } else if (route.name === 'Saída') {
            return <ArrowDown color={color} size={size} weight={focused ? 'fill' : 'regular'} />;
          } else if (route.name === 'Relatório') {
            return <ChartBar color={color} size={size} weight={focused ? 'fill' : 'regular'} />;
          }
          return null; // Ícone de Edição removido
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
      {/* Apenas as 3 abas principais */}
      <Tab.Screen name="Entrada" component={EntradaScreen} options={{ title: 'Cadastro (Entrada)' }} />
      <Tab.Screen name="Saída" component={SaidaScreen} options={{ title: 'Saída (Venda)' }} />
      <Tab.Screen name="Relatório" component={RelatorioScreen} />
    </Tab.Navigator>
  );
}

/**
 * NOVO: O App agora usa o StackNavigator como principal
 */
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          // Aplicar o header verde escuro em todas as telas da pilha
          headerStyle: {
            backgroundColor: cores.verdeEscuro,
          },
          headerTintColor: cores.branco, // Cor do botão "voltar"
          headerTitleStyle: {
            color: cores.branco,
          },
        }}
      >
        {/* Rota 1: As abas */}
        <Stack.Screen 
          name="MainTabs" 
          component={MainTabNavigator} 
          // Esconder o header da Stack na tela de abas (pois as abas já têm o seu)
          options={{ headerShown: false }} 
        />
        {/* Rota 2: A tela de Edição */}
        <Stack.Screen 
          name="EditarProduto" 
          component={EdicaoScreen} 
          options={{ title: 'Editar Produto' }} // Título no header
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}