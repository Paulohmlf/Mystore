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

import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { RootStackParamList } from '../App';
// Importa TODOS os tipos e funções de storage
import { Produto, Saida, getProdutos, getSaidas, salvarSaidas } from '../services/storage';

// Definir tipos para Route e Navigation
type EditarSaidaRouteProp = RouteProp<RootStackParamList, 'EditarSaida'>;
type EditarSaidaNavigationProp = StackNavigationProp<RootStackParamList, 'EditarSaida'>;

const cores = {
  verdeEscuro: '#325E54',
  verdeMedio: '#4A7969',
  verdeClaro: '#A3BFAA',
  begeFundo: '#F5F1E6',
  branco: '#FFFFFF',
  texto: '#325E54',
  placeholder: '#A3BFAA',
};

export default function EditarSaidaScreen() {
  const navigation = useNavigation<EditarSaidaNavigationProp>();
  const route = useRoute<EditarSaidaRouteProp>();
  
  const { saidaId } = route.params;

  // Estados
  const [saidaOriginal, setSaidaOriginal] = useState<Saida | null>(null);
  const [precoVenda, setPrecoVenda] = useState('');
  const [quantidadeSaida, setQuantidadeSaida] = useState('');
  
  // Para validar o estoque
  const [produtoRelacionado, setProdutoRelacionado] = useState<Produto | null>(null);
  const [estoqueTotalProduto, setEstoqueTotalProduto] = useState(0);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    carregarDadosSaida();
  }, [saidaId]);

  const carregarDadosSaida = async () => {
    setIsLoading(true);
    const [todasSaidas, todosProdutos] = await Promise.all([getSaidas(), getProdutos()]);
    
    const saidaParaEditar = todasSaidas.find(s => s.id === saidaId);
    
    if (!saidaParaEditar) {
      Alert.alert('Erro', 'Registro de saída não encontrado.');
      navigation.goBack();
      return;
    }

    // Encontra o produto original desta saída
    const produtoOrigem = todosProdutos.find(p => p.id === saidaParaEditar.produtoId);
    if (!produtoOrigem) {
        Alert.alert('Erro', 'Produto original desta saída não foi encontrado.');
        navigation.goBack();
        return;
    }

    // Calcula o estoque total disponível para validação
    const totalVendido = todasSaidas
      .filter(s => s.produtoId === produtoOrigem.id)
      .reduce((soma, s) => soma + s.quantidade, 0);
    
    const estoqueDisponivel = produtoOrigem.quantidade - totalVendido;

    // O estoque máximo que esta edição pode ter é:
    // O que já está disponível + a quantidade desta própria saída (que estamos "devolvendo" temporariamente)
    setEstoqueTotalProduto(estoqueDisponivel + saidaParaEditar.quantidade);
    setProdutoRelacionado(produtoOrigem);
    
    setSaidaOriginal(saidaParaEditar);
    setPrecoVenda(String(saidaParaEditar.precoVenda));
    setQuantidadeSaida(String(saidaParaEditar.quantidade));
    setIsLoading(false);
  };

  const handleSalvarAlteracoes = async () => {
    if (!saidaOriginal || !produtoRelacionado) return;

    const precoNum = parseFloat(precoVenda.replace(',', '.'));
    const qtdNum = parseInt(quantidadeSaida, 10);

    if (isNaN(precoNum) || precoNum <= 0 || isNaN(qtdNum) || qtdNum <= 0) {
      Alert.alert('Erro', 'Preço e Quantidade devem ser números positivos.');
      return;
    }

    // Validação de Estoque
    if (qtdNum > estoqueTotalProduto) {
      Alert.alert(
        'Erro de Estoque',
        `Quantidade insuficiente. O máximo disponível (incluindo esta saída) é: ${estoqueTotalProduto}`
      );
      return;
    }

    // Cria a saída atualizada
    const saidaAtualizada: Saida = {
      ...saidaOriginal,
      precoVenda: precoNum,
      quantidade: qtdNum,
    };

    // Atualiza a lista no AsyncStorage
    const todasSaidas = await getSaidas();
    const novaLista = todasSaidas.map(s => 
      s.id === saidaId ? saidaAtualizada : s
    );
    
    await salvarSaidas(novaLista);

    Keyboard.dismiss();
    Alert.alert('Sucesso', 'Registro de saída atualizado!');
    navigation.goBack(); // Volta para a tela de Saída
  };

  if (isLoading || !saidaOriginal) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={cores.verdeEscuro} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.produtoInfo}>
          Editando Saída do Produto: 
          <Text style={{fontWeight: 'bold'}}> {saidaOriginal.nomeProduto}</Text>
        </Text>
        <Text style={styles.estoqueInfo}>
          (Estoque máximo disponível: {estoqueTotalProduto})
        </Text>

        <Text style={styles.label}>Preço de Venda (R$)</Text>
        <TextInput
          style={styles.input}
          value={precoVenda}
          onChangeText={setPrecoVenda}
          keyboardType="numeric"
          placeholderTextColor={cores.placeholder}
        />
        
        <Text style={styles.label}>Quantidade Vendida</Text>
        <TextInput
          style={styles.input}
          value={quantidadeSaida}
          onChangeText={setQuantidadeSaida}
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
  produtoInfo: {
    fontSize: 18,
    color: cores.texto,
    marginBottom: 4,
    textAlign: 'center'
  },
  estoqueInfo: {
    fontSize: 14,
    color: cores.verdeMedio,
    marginBottom: 16,
    textAlign: 'center',
    fontStyle: 'italic'
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