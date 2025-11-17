// Arquivo: SaidaScreen.tsx
import { useIsFocused } from '@react-navigation/native';
import { Pencil, Trash, XCircle } from 'phosphor-react-native'; // --- MUDANÇA: Adicionado XCircle ---
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Keyboard,
  Modal, // --- MUDANÇA: Adicionado Modal ---
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback, // --- MUDANÇA: Adicionado ---
  View,
} from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';

// Importa os tipos. Assumindo que 'Produto' AGORA TEM 'dataEntrada'
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

// Interface para o produto com estoque (sem mudanças)
interface ProdutoComEstoque extends Produto {
  estoqueDisponivel: number;
}

// --- MUDANÇA: Interface para o produto agrupado ---
interface ProdutoAgrupado {
  nome: string;
  estoqueTotal: number;
}
// --- Fim da Mudança ---

type SaidaScreenNavigationProp = StackNavigationProp<RootStackParamList, 'EditarSaida'>;

export default function SaidaScreen() {
  // Lista de produtos brutos (lotes) com estoque
  const [produtosDisponiveis, setProdutosDisponiveis] = useState<ProdutoComEstoque[]>([]);
  // Lista de produtos agrupados por nome
  const [produtosAgrupados, setProdutosAgrupados] = useState<ProdutoAgrupado[]>([]);
  
  const [saidas, setSaidas] = useState<Saida[]>([]);
  
  // O 'produtoSelecionado' agora é um lote específico
  const [produtoSelecionado, setProdutoSelecionado] = useState<ProdutoComEstoque | null>(null);
  
  const [quantidadeSaida, setQuantidadeSaida] = useState('');
  const [precoVenda, setPrecoVenda] = useState('');
  const isFocused = useIsFocused();
  const navigation = useNavigation<SaidaScreenNavigationProp>();

  // --- MUDANÇA: Estados do Modal de Seleção de Lote ---
  const [isModalVisible, setModalVisible] = useState(false);
  const [lotesParaSelecionar, setLotesParaSelecionar] = useState<ProdutoComEstoque[]>([]);
  const [nomeModal, setNomeModal] = useState('');
  // --- Fim da Mudança ---

  useEffect(() => {
    if (isFocused) {
      carregarDados();
    }
  }, [isFocused]);

  const carregarDados = async () => {
    const produtosSalvos = await getProdutos();
    const saidasSalvas = await getSaidas();
    setSaidas(saidasSalvas);

    // 1. Calcula o estoque disponível para CADA LOTE (Produto)
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
    .filter(produto => produto.estoqueDisponivel > 0); // Filtra lotes com estoque > 0

    // Salva a lista de lotes brutos
    setProdutosDisponiveis(produtosComEstoque);

    // 2. --- MUDANÇA: Agrupa os lotes por nome ---
    const mapaProdutos = new Map<string, number>();
    produtosComEstoque.forEach(p => {
      // Soma o estoqueTotal para o 'nome'
      mapaProdutos.set(p.nome, (mapaProdutos.get(p.nome) || 0) + p.estoqueDisponivel);
    });

    // Converte o Map para o array que o ScrollView usará
    const agrupados = Array.from(mapaProdutos.entries()).map(([nome, estoqueTotal]) => ({
      nome,
      estoqueTotal
    }));
    
    setProdutosAgrupados(agrupados);
    // --- Fim da Mudança ---
    
    // Limpa seleção se o lote selecionado não estiver mais disponível
    if (produtoSelecionado) {
        const produtoAindaDisponivel = produtosComEstoque.find(p => p.id === produtoSelecionado.id);
        if (!produtoAindaDisponivel) {
            setProdutoSelecionado(null);
        }
    }
  };
  
  // --- MUDANÇA: Novas funções do Modal ---
  const handleAbrirModal = (nomeProduto: string) => {
    // Filtra os lotes disponíveis (brutos) que correspondem ao nome clicado
    const lotes = produtosDisponiveis.filter(p => p.nome === nomeProduto);
    setLotesParaSelecionar(lotes);
    setNomeModal(nomeProduto); // Salva o nome para o título do modal
    setModalVisible(true);
  };

  const handleSelecionarLote = (lote: ProdutoComEstoque) => {
    setProdutoSelecionado(lote); // Define o lote específico
    setModalVisible(false); // Fecha o modal
    setLotesParaSelecionar([]);
    setNomeModal('');
  };

  const handleLimparSelecao = () => {
    setProdutoSelecionado(null);
  };
  // --- Fim da Mudança ---


  const handleRegistrarSaida = async () => {
    // (Lógica idêntica, mas agora 'produtoSelecionado' é um lote)
    if (!produtoSelecionado || !quantidadeSaida.trim() || !precoVenda.trim()) {
      Alert.alert('Erro', 'Selecione um produto/lote e preencha todos os campos.');
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
        `Quantidade insuficiente. Disponível neste lote: ${produtoSelecionado.estoqueDisponivel}`
      );
      return;
    }
    
    const novaSaida: Saida = {
      id: String(new Date().getTime()),
      produtoId: produtoSelecionado.id, // Salva o ID do LOTE
      nomeProduto: produtoSelecionado.nome,
      quantidade: qtdNum,
      precoVenda: precoVendaNum,
      data: new Date().toISOString(),
    };

    const novaListaSaidas = [novaSaida, ...saidas];
    setSaidas(novaListaSaidas);
    await salvarSaidas(novaListaSaidas);
    Alert.alert('Sucesso', 'Saída registrada!');
    setProdutoSelecionado(null);
    setQuantidadeSaida('');
    setPrecoVenda('');
    Keyboard.dismiss();
    await carregarDados(); // Recarrega para atualizar o estoque dos grupos/lotes
  };

  // Funções de Editar/Excluir Saída (sem mudanças)
  const handleEditarSaida = (id: string) => {
    navigation.navigate('EditarSaida', { saidaId: id });
  };
  const handleExcluirSaida = (id: string) => {
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
  const renderItemSaida = ({ item }: { item: Saida }) => (
    <View style={styles.itemContainer}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemNome}>{item.nomeProduto}</Text>
        <Text style={styles.itemDetalhes}>
          Qtd: {item.quantidade} | Preço Venda: R$ {item.precoVenda.toFixed(2)}
        </Text>
        {item.data && (
            <Text style={styles.itemData}>
                Registrado em: {new Date(item.data).toLocaleDateString('pt-BR')} às {new Date(item.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </Text>
        )}
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

  
  // --- MUDANÇA: Componente para renderizar a seleção de produto ---
  const renderSelecaoProduto = () => {
    // CASO 1: Um lote JÁ FOI selecionado
    if (produtoSelecionado) {
      return (
        <View style={styles.selecaoContainer}>
          <View style={[styles.chipProduto, styles.chipProdutoSelecionado, {flex: 1}]}>
             <View>
                <Text style={[styles.chipProdutoTexto, styles.chipProdutoTextoSelecionado]}>
                  {produtoSelecionado.nome} (Compra: R$ {produtoSelecionado.precoCompra.toFixed(2)})
                </Text>
                <Text style={[styles.chipProdutoTexto, styles.chipProdutoTextoSelecionado, {fontSize: 12}]}>
                  (Est. Lote: {produtoSelecionado.estoqueDisponivel}) (Entrada: {new Date(produtoSelecionado.dataEntrada).toLocaleDateString('pt-BR')})
                </Text>
             </View>
          </View>
          <TouchableOpacity onPress={handleLimparSelecao} style={styles.limparSelecaoButton}>
            <XCircle size={24} color={cores.danger} weight="fill" />
          </TouchableOpacity>
        </View>
      );
    }

    // CASO 2: NENHUM lote selecionado (mostra os grupos)
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.seletorScroll}>
        <View style={styles.seletorProdutoContainer}>
          {produtosAgrupados.length > 0 ? (
            produtosAgrupados.map(grupo => (
              <TouchableOpacity
                key={grupo.nome}
                style={styles.chipProduto}
                onPress={() => handleAbrirModal(grupo.nome)} // Abre o modal
              >
                <Text style={styles.chipProdutoTexto}>
                  {grupo.nome} (Est. Total: {grupo.estoqueTotal})
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.semEstoqueAviso}>Nenhum produto com estoque disponível.</Text>
          )}
        </View>
      </ScrollView>
    );
  };
  // --- Fim da Mudança ---


  return (
    <SafeAreaView style={styles.container}>
      {/* Formulário de Saída */}
      <View style={styles.formContainer}>
        <Text style={styles.label}>Selecione o Produto (Estoque &gt; 0):</Text>
        
        {/* --- MUDANÇA: Chama o novo renderizador --- */}
        {renderSelecaoProduto()}
        {/* --- Fim da Mudança --- */}

        {/* Inputs (sem mudanças) */}
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.inputMetade]}
            placeholder="Qtd. Vendida"
            value={quantidadeSaida}
            onChangeText={setQuantidadeSaida}
            keyboardType="number-pad"
            placeholderTextColor={cores.placeholder}
            editable={!!produtoSelecionado} // Só edita se um LOTE foi selecionado
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

        {/* Botão Salvar (sem mudanças) */}
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

      {/* Lista de Saídas (sem mudanças) */}
      <FlatList
        data={saidas}
        renderItem={renderItemSaida}
        keyExtractor={item => item.id}
        style={styles.lista}
        ListHeaderComponent={<Text style={styles.listaTitulo}>Saídas Registradas</Text>}
      />

      {/* --- MUDANÇA: Modal de Seleção de Lote --- */}
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
                <Text style={styles.modalTitle}>Selecionar Lote de "{nomeModal}"</Text>
                
                <FlatList
                  data={lotesParaSelecionar}
                  keyExtractor={item => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity 
                      style={styles.modalItem}
                      onPress={() => handleSelecionarLote(item)}
                    >
                      <Text style={styles.modalItemTexto}>
                        Compra: R$ {item.precoCompra.toFixed(2)}
                      </Text>
                      <Text style={styles.modalItemDetalhe}>
                        Estoque: {item.estoqueDisponivel} | Entrada: {new Date(item.dataEntrada).toLocaleDateString('pt-BR')}
                      </Text>
                    </TouchableOpacity>
                  )}
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

// Estilos (Adicionado estilos do Modal e da Seleção)
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
  // --- MUDANÇA: Container da seleção ---
  selecaoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  limparSelecaoButton: {
    padding: 8,
    marginLeft: 8,
  },
  // --- Fim da Mudança ---
  seletorScroll: {
      minHeight: 50, // Mínimo para não pular
      marginBottom: 12,
  },
  seletorProdutoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8, // Espaço para os chips
  },
  chipProduto: {
    backgroundColor: cores.branco,
    paddingVertical: 10, // Aumentado
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: cores.verdeMedio,
    marginRight: 8,
    justifyContent: 'center',
  },
  chipProdutoSelecionado: {
    backgroundColor: cores.verdeMedio,
    borderColor: cores.verdeEscuro,
    paddingVertical: 6, // Reduzido
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
    marginTop: 2,
  },
  itemData: {
    fontSize: 12,
    color: cores.placeholder,
    marginTop: 4,
    fontStyle: 'italic',
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

  // --- MUDANÇA: Estilos do Modal de Lote ---
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
    maxHeight: '60%',
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: cores.texto,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalItem: {
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: cores.begeFundo,
    backgroundColor: cores.branco,
    borderRadius: 8,
    marginBottom: 8,
  },
  modalItemTexto: {
    color: cores.texto,
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalItemDetalhe: {
    color: cores.verdeMedio,
    fontSize: 14,
    marginTop: 2,
  },
});