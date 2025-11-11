import { Pencil, Trash } from 'phosphor-react-native';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  FlatList,
  Keyboard,
  SafeAreaView, // SafeAreaView
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

// Importar hooks de navegação
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App'; // Tipos do App.tsx

import { getProdutos, Produto, salvarProdutos } from '../services/storage';

// Sua nova paleta de cores
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

// Definir o tipo da navegação
type EntradaScreenNavigationProp = StackNavigationProp<RootStackParamList, 'EditarProduto'>;

export default function EntradaScreen() {
  const [nome, setNome] = useState('');
  const [precoCompra, setPrecoCompra] = useState('');
  const [quantidade, setQuantidade] = useState('');

  const [produtos, setProdutos] = useState<Produto[]>([]);
  
  const isFocused = useIsFocused();
  
  // Inicializar o hook de navegação
  const navigation = useNavigation<EntradaScreenNavigationProp>();

  // Carregar dados quando a tela abrir
  useEffect(() => {
    if (isFocused) {
      carregarDados();
    }
  }, [isFocused]);

  const carregarDados = async () => {
    const produtosSalvos = await getProdutos();
    setProdutos(produtosSalvos);
  };

  // Salvar Produto
  const handleSalvarProduto = async () => {
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

    const novoProduto: Produto = {
      id: String(new Date().getTime()),
      nome: nome.trim(),
      precoCompra: precoNum,
      quantidade: qtdNum,
    };

    const novaLista = [novoProduto, ...produtos];
    setProdutos(novaLista);
    
    await salvarProdutos(novaLista);

    setNome('');
    setPrecoCompra('');
    setQuantidade('');
    Keyboard.dismiss();
  };

  // handleEditar (atualizado para navegar)
  const handleEditar = (id: string) => {
    navigation.navigate('EditarProduto', { produtoId: id });
  };

  // handleExcluir (a sua lógica que já estava correta)
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

  // Render Item
  const renderItem = ({ item }: { item: Produto }) => (
    <View style={styles.itemContainer}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemNome}>{item.nome}</Text>
        <Text style={styles.itemDetalhes}>
          Preço: R$ {item.precoCompra.toFixed(2)} | Qtd: {item.quantidade}
        </Text>
      </View>
      <View style={styles.itemAcoes}>
        <TouchableOpacity onPress={() => handleEditar(item.id)} style={styles.acaoButton}>
          <Pencil size={22} color={cores.verdeMedio} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleExcluir(item.id)} style={styles.acaoButton}>
          <Trash size={22} color={cores.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Return
  return (
    <SafeAreaView style={styles.container}>
      {/* Formulário de Cadastro */}
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
        <Button title="Salvar Produto" onPress={handleSalvarProduto} color={cores.verdeEscuro} />
      </View>

      {/* Lista de Produtos Cadastrados */}
      <FlatList
        data={produtos}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        style={styles.lista}
        ListHeaderComponent={<Text style={styles.listaTitulo}>Produtos Cadastrados</Text>}
      />
    </SafeAreaView>
  );
} // <--- Fim do componente EntradaScreen

// Estilos
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
  },
  itemAcoes: {
    flexDirection: 'row',
  },
  acaoButton: {
    marginLeft: 16,
    padding: 4,
  },
}); 