// Arquivo: EntradaScreen.tsx
import { Pencil, PlusCircle, Trash } from 'phosphor-react-native'; // --- MUDANÇA: Adicionado 'PlusCircle' ---
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  FlatList,
  Keyboard,
  Modal, // --- MUDANÇA: Adicionado 'Modal' ---
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback, // --- MUDANÇA: Adicionado ---
  View,
} from 'react-native';

// Importar hooks de navegação
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App'; // Tipos do App.tsx

import { getProdutos, Produto, salvarProdutos } from '../services/storage';

// Sua paleta de cores
const cores = {
  verdeEscuro: '#325E54',
  verdeMedio: '#4A7969',
  verdeClaro: '#A3BFAA',
  begeFundo: '#F5F1E6',
  branco: '#FFFFFF',
  texto: '#325E54',
  placeholder: '#A3BFAA',
  danger: '#D9534F'
};

// Tipo da navegação (sem mudanças)
type EntradaScreenNavigationProp = StackNavigationProp<RootStackParamList, 'EditarProduto'>;

export default function EntradaScreen() {
  const [nome, setNome] = useState('');
  const [precoCompra, setPrecoCompra] = useState('');
  const [quantidade, setQuantidade] = useState('');

  const [produtos, setProdutos] = useState<Produto[]>([]);
  
  // --- MUDANÇA: Estados para o Modal de Adicionar Estoque ---
  const [isModalVisible, setModalVisible] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null);
  const [quantidadeAdicionar, setQuantidadeAdicionar] = useState('');
  // --- Fim da Mudança ---

  const isFocused = useIsFocused();
  const navigation = useNavigation<EntradaScreenNavigationProp>();

  useEffect(() => {
    if (isFocused) {
      carregarDados();
    }
  }, [isFocused]);

  const carregarDados = async () => {
    const produtosSalvos = await getProdutos();
    setProdutos(produtosSalvos);
  };

  // Salvar NOVO Produto
  const handleSalvarProduto = async () => {
    // (Validações sem mudanças)
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

    // --- MUDANÇA: Adiciona 'dataEntrada' ---
    const novoProduto: Produto = {
      id: String(new Date().getTime()),
      nome: nome.trim(),
      precoCompra: precoNum,
      quantidade: qtdNum,
      dataEntrada: new Date().toISOString(), // <-- ADICIONADO
    };
    // --- Fim da Mudança ---

    const novaLista = [novoProduto, ...produtos];
    setProdutos(novaLista);
    await salvarProdutos(novaLista);

    setNome('');
    setPrecoCompra('');
    setQuantidade('');
    Keyboard.dismiss();
  };

  // --- MUDANÇA: Funções para o Modal ---
  const handleAbrirModal = (produto: Produto) => {
    setProdutoSelecionado(produto);
    setQuantidadeAdicionar('');
    setModalVisible(true);
  };

  const handleConfirmarAdicionarEstoque = async () => {
    if (!produtoSelecionado || !quantidadeAdicionar.trim()) {
      Alert.alert('Erro', 'Digite a quantidade a adicionar.');
      return;
    }

    const qtdNum = parseInt(quantidadeAdicionar, 10);
    if (isNaN(qtdNum) || qtdNum <= 0) {
      Alert.alert('Erro', 'A quantidade deve ser um número positivo.');
      return;
    }

    // Encontra o produto e atualiza a quantidade
    const novaLista = produtos.map(p => {
      if (p.id === produtoSelecionado.id) {
        return {
          ...p,
          quantidade: p.quantidade + qtdNum,
          // Nota: Não atualizamos a 'dataEntrada' original
        };
      }
      return p;
    });

    setProdutos(novaLista);
    await salvarProdutos(novaLista);

    // Fecha o modal e limpa os estados
    setModalVisible(false);
    setProdutoSelecionado(null);
    setQuantidadeAdicionar('');
    Keyboard.dismiss();
  };
  // --- Fim da Mudança ---

  // handleEditar (sem mudanças)
  const handleEditar = (id: string) => {
    navigation.navigate('EditarProduto', { produtoId: id });
  };

  // handleExcluir (sem mudanças)
  const handleExcluir = (id: string) => {
    Alert.alert(
      'Confirmar Exclusão',
      'Tem certeza que deseja excluir este produto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => { 
            const novaLista = produtos.filter(produto => produto.id !== id);
            setProdutos(novaLista);
            await salvarProdutos(novaLista);
          },
        },
      ]
    );
  };

  // --- MUDANÇA: Render Item ---
  // Adiciona a 'dataEntrada' e o novo botão '+'
  const renderItem = ({ item }: { item: Produto }) => (
    <View style={styles.itemContainer}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemNome}>{item.nome}</Text>
        <Text style={styles.itemDetalhes}>
          Preço: R$ {item.precoCompra.toFixed(2)} | Qtd: {item.quantidade}
        </Text>
        {/* Mostra a data de entrada */}
        {item.dataEntrada && (
          <Text style={styles.itemData}>
            Entrada: {new Date(item.dataEntrada).toLocaleDateString('pt-BR')}
          </Text>
        )}
      </View>
      <View style={styles.itemAcoes}>
        {/* Botão de Adicionar Estoque */}
        <TouchableOpacity onPress={() => handleAbrirModal(item)} style={styles.acaoButton}>
          <PlusCircle size={22} color={cores.verdeEscuro} weight="fill" />
        </TouchableOpacity>
        {/* Botão Editar */}
        <TouchableOpacity onPress={() => handleEditar(item.id)} style={styles.acaoButton}>
          <Pencil size={22} color={cores.verdeMedio} />
        </TouchableOpacity>
        {/* Botão Excluir */}
        <TouchableOpacity onPress={() => handleExcluir(item.id)} style={styles.acaoButton}>
          <Trash size={22} color={cores.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );
  // --- Fim da Mudança ---

  // Return
  return (
    <SafeAreaView style={styles.container}>
      {/* Formulário de Cadastro (sem mudanças) */}
      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="Nome do Produto"
          value={nome}
          onChangeText={setNome}
          placeholderTextColor={cores.placeholder}
        />
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.inputMetade]}
            placeholder="Preço de Compra (R$)"
            value={precoCompra}
            onChangeText={setPrecoCompra}
            keyboardType="numeric"
            placeholderTextColor={cores.placeholder}
          />
          <TextInput
            style={[styles.input, styles.inputMetade]}
            placeholder="Quantidade"
            value={quantidade}
            onChangeText={setQuantidade}
            keyboardType="number-pad"
            placeholderTextColor={cores.placeholder}
          />
        </View>
        <Button title="Salvar Novo Produto" onPress={handleSalvarProduto} color={cores.verdeEscuro} />
      </View>

      {/* Lista de Produtos Cadastrados (sem mudanças) */}
      <FlatList
        data={produtos}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        style={styles.lista}
        ListHeaderComponent={<Text style={styles.listaTitulo}>Produtos Cadastrados</Text>}
      />

      {/* --- MUDANÇA: Modal de Adicionar Estoque --- */}
      <Modal
        transparent={true}
        visible={isModalVisible}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Adicionar Estoque</Text>
                
                <Text style={styles.modalProdutoNome}>
                  Produto: {produtoSelecionado?.nome}
                </Text>
                <Text style={styles.modalProdutoQtd}>
                  Qtd Atual: {produtoSelecionado?.quantidade}
                </Text>

                <TextInput
                  style={styles.inputModal}
                  placeholder="Quantidade a Adicionar"
                  value={quantidadeAdicionar}
                  onChangeText={setQuantidadeAdicionar}
                  keyboardType="number-pad"
                  placeholderTextColor={cores.placeholder}
                  autoFocus={true} // Foca no input ao abrir
                />
                
                <Button 
                  title="Confirmar" 
                  onPress={handleConfirmarAdicionarEstoque} 
                  color={cores.verdeEscuro} 
                />
                
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      {/* --- Fim da Mudança --- */}

    </SafeAreaView>
  );
} 

// Estilos (Com adição dos estilos do Modal)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: cores.begeFundo,
  },
  formContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: cores.verdeClaro,
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputMetade: {
    width: '48%',
  },
  lista: {
    flex: 1,
  },
  listaTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: cores.texto,
    marginLeft: 16,
    marginBottom: 10,
    marginTop: 10,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: cores.branco,
    borderBottomWidth: 1,
    borderBottomColor: cores.verdeClaro,
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  itemInfo: {
    flex: 1,
  },
  itemNome: {
    fontSize: 16,
    fontWeight: 'bold',
    color: cores.texto,
  },
  itemDetalhes: {
    fontSize: 14,
    color: cores.verdeMedio,
    marginTop: 2,
  },
  // --- MUDANÇA: Estilo para a Data ---
  itemData: {
      fontSize: 12,
      color: cores.placeholder,
      marginTop: 4,
      fontStyle: 'italic',
  },
  // --- Fim da Mudança ---
  itemAcoes: {
    flexDirection: 'row',
  },
  acaoButton: {
    marginLeft: 16,
    padding: 4,
  },

  // --- MUDANÇA: Estilos do Modal ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: cores.branco,
    borderRadius: 12,
    padding: 20,
    width: '100%',
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: cores.texto,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalProdutoNome: {
    fontSize: 16,
    color: cores.texto,
    textAlign: 'center',
  },
  modalProdutoQtd: {
    fontSize: 14,
    color: cores.verdeMedio,
    textAlign: 'center',
    marginBottom: 16,
  },
  inputModal: {
    height: 44,
    backgroundColor: cores.begeFundo, // Fundo bege para diferenciar
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 16, // Aumentado
    fontSize: 16,
    color: cores.texto,
    borderWidth: 1,
    borderColor: cores.verdeClaro,
    textAlign: 'center', // Centraliza o número
  },
});