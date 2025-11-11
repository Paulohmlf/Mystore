import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  Keyboard,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';

// NOVO: Importar tipos de Rota e Navegação
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { RootStackParamList } from '../App'; // Importar tipos do App
import { Produto, getProdutos, salvarProdutos } from '../services/storage';

// NOVO: Definir tipos para Route e Navigation desta tela
type EdicaoScreenRouteProp = RouteProp<RootStackParamList, 'EditarProduto'>;
type EdicaoScreenNavigationProp = StackNavigationProp<RootStackParamList, 'EditarProduto'>;

// Cores
const cores = {
  verdeEscuro: '#325E54',
  verdeMedio: '#4A7969',
  verdeClaro: '#A3BFAA',
  begeFundo: '#F5F1E6',
  branco: '#FFFFFF',
  texto: '#325E54',
  placeholder: '#A3BFAA',
};

export default function EdicaoScreen() {
  // NOVO: Pegar navegação e rota
  const navigation = useNavigation<EdicaoScreenNavigationProp>();
  const route = useRoute<EdicaoScreenRouteProp>();
  
  // Pegar o ID do produto passado como parâmetro
  const { produtoId } = route.params;

  // Estados para os dados do produto
  const [produto, setProduto] = useState<Produto | null>(null);
  const [nome, setNome] = useState('');
  const [precoCompra, setPrecoCompra] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // --- NOVO: Carregar dados do produto específico ---
  useEffect(() => {
    carregarProduto();
  }, [produtoId]);

  const carregarProduto = async () => {
    setIsLoading(true);
    const produtosSalvos = await getProdutos();
    const produtoParaEditar = produtosSalvos.find(p => p.id === produtoId);

    if (produtoParaEditar) {
      setProduto(produtoParaEditar);
      // Preenche os estados dos inputs com os dados atuais
      setNome(produtoParaEditar.nome);
      setPrecoCompra(String(produtoParaEditar.precoCompra));
      setQuantidade(String(produtoParaEditar.quantidade));
    } else {
      Alert.alert('Erro', 'Produto não encontrado.');
      navigation.goBack(); // Volta se não achar o produto
    }
    setIsLoading(false);
  };

  // --- NOVO: Função para salvar alterações ---
  const handleSalvarAlteracoes = async () => {
    if (!produto) return; // Segurança

    // Validação (a mesma da tela de entrada)
    if (!nome.trim() || !precoCompra.trim() || !quantidade.trim()) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }
    const precoNum = parseFloat(precoCompra.replace(',', '.'));
    const qtdNum = parseInt(quantidade, 10);

    if (isNaN(precoNum) || precoNum <= 0 || isNaN(qtdNum) || qtdNum <= 0) {
      Alert.alert('Erro', 'Preço e Quantidade devem ser números positivos.');
      return;
    }

    // Criar o produto atualizado
    const produtoAtualizado: Produto = {
      ...produto, // Mantém o ID
      nome: nome.trim(),
      precoCompra: precoNum,
      quantidade: qtdNum,
    };

    // Atualizar a lista no AsyncStorage
    const produtosSalvos = await getProdutos();
    const novaLista = produtosSalvos.map(p => 
      p.id === produtoId ? produtoAtualizado : p
    );
    
    await salvarProdutos(novaLista);

    Keyboard.dismiss();
    Alert.alert('Sucesso', 'Produto atualizado!');
    navigation.goBack(); // Volta para a tela de Entrada
  };

  // Feedback visual enquanto carrega os dados
  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={cores.verdeEscuro} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.label}>Nome do Produto</Text>
        <TextInput
          style={styles.input}
          value={nome}
          onChangeText={setNome}
          placeholderTextColor={cores.placeholder}
        />
        
        <Text style={styles.label}>Preço de Compra (R$)</Text>
        <TextInput
          style={styles.input}
          value={precoCompra}
          onChangeText={setPrecoCompra}
          keyboardType="numeric"
          placeholderTextColor={cores.placeholder}
        />
        
        <Text style={styles.label}>Quantidade (Entrada)</Text>
        <TextInput
          style={styles.input}
          value={quantidade}
          onChangeText={setQuantidade}
          keyboardType="number-pad"
          placeholderTextColor={cores.placeholder}
        />

        <Button 
          title="Salvar Alterações" 
          onPress={handleSalvarAlteracoes} 
          color={cores.verdeEscuro} 
        />
      </View>
    </SafeAreaView>
  );
}

// Estilos
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: cores.begeFundo,
    padding: 16,
  },
  loadingContainer: {
      justifyContent: 'center',
      alignItems: 'center'
  },
  formContainer: {
    padding: 16,
    backgroundColor: cores.branco,
    borderRadius: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: cores.texto,
    marginBottom: 4,
    marginTop: 10,
  },
  input: {
    height: 44,
    backgroundColor: cores.branco,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 12,
    fontSize: 16,
    color: cores.texto,
    borderWidth: 1,
    borderColor: cores.verdeClaro,
  },
});