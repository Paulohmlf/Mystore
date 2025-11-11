import { useIsFocused } from '@react-navigation/native';
import { Pencil, Trash } from 'phosphor-react-native';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Keyboard,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

// --- MUDANÇA 1: Importar hooks de navegação ---
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App'; // Importa os tipos do App.tsx

import { Produto, Saida, getProdutos, getSaidas, salvarSaidas } from '../services/storage';

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

interface ProdutoComEstoque extends Produto {
  estoqueDisponivel: number;
}

// --- MUDANÇA 2: Definir o tipo da propriedade de navegação ---
type SaidaScreenNavigationProp = StackNavigationProp<RootStackParamList, 'EditarSaida'>;

export default function SaidaScreen() {
  const [produtosDisponiveis, setProdutosDisponiveis] = useState<ProdutoComEstoque[]>([]);
  const [saidas, setSaidas] = useState<Saida[]>([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState<ProdutoComEstoque | null>(null);
  const [quantidadeSaida, setQuantidadeSaida] = useState('');
  const [precoVenda, setPrecoVenda] = useState('');
  const isFocused = useIsFocused();

  // --- MUDANÇA 3: Inicializar o hook de navegação ---
  const navigation = useNavigation<SaidaScreenNavigationProp>();

  useEffect(() => {
    if (isFocused) {
      carregarDados();
    }
  }, [isFocused]);

  const carregarDados = async () => {
    // (Lógica sem mudanças)
    const produtosSalvos = await getProdutos();
    const saidasSalvas = await getSaidas();
    setSaidas(saidasSalvas);

    const produtosComEstoque = produtosSalvos.map(produto => {
      const totalVendido = saidasSalvas
        .filter(saida => saida.produtoId === produto.id)
        .reduce((soma, saida) => soma + saida.quantidade, 0);
      
      const estoqueDisponivel = produto.quantidade - totalVendido;

      return {
        ...produto,
        estoqueDisponivel: estoqueDisponivel
      };
    })
    .filter(produto => produto.estoqueDisponivel > 0);

    setProdutosDisponiveis(produtosComEstoque);
    
    if (produtoSelecionado) {
        const produtoAindaDisponivel = produtosComEstoque.find(p => p.id === produtoSelecionado.id);
        if (!produtoAindaDisponivel) {
            setProdutoSelecionado(null);
        }
    }
  };

  const handleRegistrarSaida = async () => {
    // (Lógica sem mudanças)
    if (!produtoSelecionado || !quantidadeSaida.trim() || !precoVenda.trim()) {
      Alert.alert('Erro', 'Selecione um produto e preencha todos os campos.');
      return;
    }
    const qtdNum = parseInt(quantidadeSaida, 10);
    const precoVendaNum = parseFloat(precoVenda.replace(',', '.'));
    if (isNaN(qtdNum) || qtdNum <= 0 || isNaN(precoVendaNum) || precoVendaNum <= 0) {
      Alert.alert('Erro', 'Quantidade e Preço de Venda devem ser números positivos.');
      return;
    }
    if (qtdNum > produtoSelecionado.estoqueDisponivel) {
      Alert.alert(
        'Erro de Estoque',
        `Quantidade insuficiente. Disponível: ${produtoSelecionado.estoqueDisponivel}`
      );
      return;
    }
    const novaSaida: Saida = {
      id: String(new Date().getTime()),
      produtoId: produtoSelecionado.id,
      nomeProduto: produtoSelecionado.nome,
      quantidade: qtdNum,
      precoVenda: precoVendaNum,
    };
    const novaListaSaidas = [novaSaida, ...saidas];
    setSaidas(novaListaSaidas);
    await salvarSaidas(novaListaSaidas);
    Alert.alert('Sucesso', 'Saída registrada!');
    setProdutoSelecionado(null);
    setQuantidadeSaida('');
    setPrecoVenda('');
    Keyboard.dismiss();
    await carregarDados();
  };

  // --- MUDANÇA 4: handleEditarSaida agora navega para a nova tela ---
  const handleEditarSaida = (id: string) => {
    // Linha antiga (com o alerta) foi removida
    // Nova linha:
    navigation.navigate('EditarSaida', { saidaId: id });
  };

  const handleExcluirSaida = (id: string) => {
    // (Lógica sem mudanças)
    Alert.alert(
      'Confirmar Exclusão',
      'Tem certeza que deseja excluir este registro de saída? Esta ação irá devolver o item ao estoque.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => { 
            const novaLista = saidas.filter(s => s.id !== id);
            setSaidas(novaLista);
            await salvarSaidas(novaLista);
            await carregarDados(); 
          },
        },
      ]
    );
  };

  // renderItemSaida (Sem mudanças)
  const renderItemSaida = ({ item }: { item: Saida }) => (
    <View style={styles.itemContainer}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemNome}>{item.nomeProduto}</Text>
        <Text style={styles.itemDetalhes}>
          Qtd: {item.quantidade} | Preço Venda: R$ {item.precoVenda.toFixed(2)}
        </Text>
      </View>
      
      <View style={styles.itemAcoes}>
        <TouchableOpacity onPress={() => handleEditarSaida(item.id)} style={styles.acaoButton}>
          <Pencil size={22} color={cores.verdeMedio} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleExcluirSaida(item.id)} style={styles.acaoButton}>
          <Trash size={22} color={cores.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Formulário de Saída */}
      <View style={styles.formContainer}>
        <Text style={styles.label}>Selecione o Produto (Estoque &gt; 0):</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.seletorScroll}>
          <View style={styles.seletorProdutoContainer}>
            {produtosDisponiveis.length > 0 ? (
              produtosDisponiveis.map(produto => (
                <TouchableOpacity
                  key={produto.id}
                  style={[
                    styles.chipProduto,
                    produtoSelecionado?.id === produto.id && styles.chipProdutoSelecionado
                  ]}
                  onPress={() => setProdutoSelecionado(produto)}
                >
                  <Text style={[
                    styles.chipProdutoTexto,
                    produtoSelecionado?.id === produto.id && styles.chipProdutoTextoSelecionado
                  ]}>
                    {produto.nome} (Est: {produto.estoqueDisponivel})
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.semEstoqueAviso}>Nenhum produto com estoque disponível.</Text>
            )}
          </View>
        </ScrollView>

        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.inputMetade]}
            placeholder="Qtd. Vendida"
            value={quantidadeSaida}
            onChangeText={setQuantidadeSaida}
            keyboardType="number-pad"
            placeholderTextColor={cores.placeholder}
            editable={!!produtoSelecionado} 
          />
          <TextInput
            style={[styles.input, styles.inputMetade]}
            placeholder="Preço de Venda (R$)"
            value={precoVenda}
            onChangeText={setPrecoVenda}
            keyboardType="numeric"
            placeholderTextColor={cores.placeholder}
            editable={!!produtoSelecionado}
          />
        </View>

        <TouchableOpacity
          onPress={handleRegistrarSaida}
          style={[
            styles.botaoSalvar, 
            !produtoSelecionado && styles.botaoSalvarDesabilitado
          ]}
          disabled={!produtoSelecionado}
        >
          <Text style={styles.botaoSalvarTexto}>REGISTRAR SAÍDA</Text>
        </TouchableOpacity>
      </View>

      {/* Lista de Saídas */}
      <FlatList
        data={saidas}
        renderItem={renderItemSaida}
        keyExtractor={item => item.id}
        style={styles.lista}
        ListHeaderComponent={<Text style={styles.listaTitulo}>Saídas Registradas</Text>}
      />
    </SafeAreaView>
  );
}

// Estilos (Sem mudanças)
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
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: cores.texto,
    marginBottom: 8,
  },
  seletorScroll: {
      maxHeight: 50, 
      marginBottom: 12,
  },
  seletorProdutoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipProduto: {
    backgroundColor: cores.branco,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: cores.verdeMedio,
    marginRight: 8,
    height: 34, 
  },
  chipProdutoSelecionado: {
    backgroundColor: cores.verdeMedio,
    borderColor: cores.verdeEscuro,
  },
  chipProdutoTexto: {
    color: cores.verdeMedio,
    fontSize: 14,
  },
  chipProdutoTextoSelecionado: {
    color: cores.branco,
    fontWeight: 'bold',
  },
  semEstoqueAviso: {
      color: cores.verdeMedio,
      fontStyle: 'italic',
      fontSize: 14,
      paddingLeft: 4,
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
    marginTop: 8,
  },
  listaTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: cores.texto,
    marginLeft: 16,
    marginBottom: 10,
  },
  itemContainer: {
    padding: 16,
    backgroundColor: cores.branco,
    borderBottomWidth: 1,
    borderBottomColor: cores.verdeClaro,
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  botaoSalvar: {
    backgroundColor: cores.verdeEscuro,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoSalvarDesabilitado: {
    backgroundColor: cores.verdeClaro,
    opacity: 0.8,
  },
  botaoSalvarTexto: {
    color: cores.branco,
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
});