import React, { useEffect, useState } from "react";
import { db, auth } from "./firebase";
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { deleteDoc, doc } from "firebase/firestore";
import { gapi } from "gapi-script";

export default function Faturas() {
  const [categoria, setCategoria] = useState("");
  const [categoriasDisponiveis, setCategoriasDisponiveis] = useState([]);
  const [novaCategoria, setNovaCategoria] = useState("");

  const [faturas, setFaturas] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [empresa, setEmpresa] = useState("");
  const [data, setData] = useState("");
  const [valor, setValor] = useState("");
  const [detalhes, setDetalhes] = useState("");
  const [openCardId, setOpenCardId] = useState(null);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [ordenarPor, setOrdenarPor] = useState("ano"); // "dia", "mes", "ano"

  const faturasPorPagina = 15;
  const indiceInicial = (paginaAtual - 1) * faturasPorPagina;

  const [filtroEmpresa, setFiltroEmpresa] = useState("");

  const [dataFiltro, setDataFiltro] = useState("");

  const limparFiltros = () => {
    setFiltroEmpresa("");
    setDataFiltro("");
    setFiltroCategoria("");
    setPaginaAtual(1);
  };

  // **CORREÇÃO: declarar faturasFiltradas antes de usá-la**
  const faturasFiltradas = faturas.filter((f) => {
    const nomeMatch = f.empresa
      .toLowerCase()
      .includes(filtroEmpresa.toLowerCase());

    const dataFatura = f.data?.seconds
      ? new Date(f.data.seconds * 1000)
      : new Date(f.data);

    const dataFiltroValida = dataFiltro
      ? new Date(dataFiltro).toDateString() === dataFatura.toDateString()
      : true;

    const categoriaMatch = filtroCategoria
      ? f.categoria?.toLowerCase() === filtroCategoria.toLowerCase()
      : true;

    return nomeMatch && dataFiltroValida && categoriaMatch;
  });

  const faturasOrdenadas = [...faturasFiltradas].sort((a, b) => {
    const dataA = a.data?.seconds
      ? new Date(a.data.seconds * 1000)
      : new Date(a.data);
    const dataB = b.data?.seconds
      ? new Date(b.data.seconds * 1000)
      : new Date(b.data);

    if (ordenarPor === "ano") {
      return dataB.getFullYear() - dataA.getFullYear();
    } else if (ordenarPor === "mes") {
      return (
        dataB.getFullYear() * 12 +
        dataB.getMonth() -
        (dataA.getFullYear() * 12 + dataA.getMonth())
      );
    } else {
      return dataB.getTime() - dataA.getTime(); // padrão: ano
    }
  });

  const faturasPaginadas = faturasOrdenadas.slice(
    indiceInicial,
    indiceInicial + faturasPorPagina
  );

  const totalPaginas = Math.ceil(faturasFiltradas.length / faturasPorPagina);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, "faturas"),
      where("userId", "==", auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setFaturas(lista);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, "categorias"),
      where("userId", "==", auth.currentUser.uid)
    );

    return onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setCategoriasDisponiveis(lista);
    });
  }, []);

  const criarFatura = async (e) => {
    e.preventDefault();

    if (!empresa || !data || !valor) {
      alert("Por favor, preenche todos os campos obrigatórios.");
      return;
    }

    try {
      await addDoc(collection(db, "faturas"), {
        userId: auth.currentUser.uid,
        empresa,
        data: new Date(data),
        valor: parseFloat(valor),
        detalhes,
        categoria, // <- novo campo
        createdAt: serverTimestamp(),
      });

      setEmpresa("");
      setData("");
      setValor("");
      setDetalhes("");
      setShowForm(false);
    } catch (err) {
      alert("Erro ao criar fatura: " + err.message);
    }
  };

  const selectedFatura = faturas.find((f) => f.id === openCardId);

  const criarCategoria = async () => {
    if (!novaCategoria.trim()) {
      alert("Digite um nome válido para a categoria.");
      return;
    }

    const nome = novaCategoria.trim();

    try {
      // Verificar se a categoria já existe
      const existe = categoriasDisponiveis.some(
        (cat) => cat.nome.toLowerCase() === nome.toLowerCase()
      );
      if (existe) {
        alert("Esta categoria já existe.");
        return;
      }

      await addDoc(collection(db, "categorias"), {
        nome,
        userId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
      });

      setNovaCategoria("");
      alert("Categoria criada com sucesso!");
    } catch (error) {
      alert("Erro ao criar categoria: " + error.message);
    }
  };

  const eliminarFatura = async (id) => {
    const confirmacao = window.confirm(
      "Tem a certeza que quer eliminar esta fatura?"
    );
    if (!confirmacao) return;

    try {
      await deleteDoc(doc(db, "faturas", id));
      alert("Fatura eliminada com sucesso!");
      setOpenCardId(null); // Fecha o modal após eliminar
    } catch (error) {
      alert("Erro ao eliminar fatura: " + error.message);
    }
  };

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "30px" }}>
      <header
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          marginBottom: "30px",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <input
            type="text"
            placeholder="Filtrar por Empresa..."
            value={filtroEmpresa}
            onChange={(e) => {
              setFiltroEmpresa(e.target.value);
              setPaginaAtual(1);
            }}
            style={inputStyle}
          />
          <input
            type="date"
            value={dataFiltro}
            onChange={(e) => {
              setDataFiltro(e.target.value);
              setPaginaAtual(1);
            }}
            style={inputStyle}
          />

          <select
            value={filtroCategoria}
            onChange={(e) => {
              setFiltroCategoria(e.target.value);
              setPaginaAtual(1);
            }}
            style={inputStyle}
          >
            <option value="">Todas Categorias</option>
            {categoriasDisponiveis.map((cat) => (
              <option key={cat.id} value={cat.nome}>
                {cat.nome}
              </option>
            ))}
          </select>
          <select
            value={ordenarPor}
            onChange={(e) => setOrdenarPor(e.target.value)}
            style={inputStyle}
          >
            <option value="dia">Ordenar por Dia</option>
            <option value="mes">Ordenar por Mês</option>
            <option value="ano">Ordenar por Ano</option>
          </select>

          <button onClick={limparFiltros} style={secondaryButton}>
            Limpar Filtros
          </button>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2
            style={{
              fontSize: "28px",
              fontWeight: "bold",
              textAlign: "center",
              flexGrow: 1,
            }}
          >
            📄 Minhas Faturas
          </h2>
          <button onClick={() => setShowForm(true)} style={primaryButton}>
            + Nova Fatura
          </button>
        </div>
      </header>

      {showForm && (
        <form
          onSubmit={criarFatura}
          style={{
            background: "#f9f9f9",
            padding: "20px",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            marginBottom: "30px",
          }}
        >
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            <input
              type="text"
              placeholder="Empresa"
              value={empresa}
              onChange={(e) => setEmpresa(e.target.value)}
              required
              style={inputStyle}
            />
            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              required
              style={inputStyle}
            />
            <input
              type="number"
              step="0.01"
              placeholder="Valor"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              required
              style={inputStyle}
            />
            <textarea
              placeholder="Detalhes"
              value={detalhes}
              onChange={(e) => setDetalhes(e.target.value)}
              style={{ ...inputStyle, height: "80px" }}
            />

            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              style={inputStyle}
            >
              <option value="">Selecionar Categoria</option>
              {categoriasDisponiveis.map((c) => (
                <option key={c.id} value={c.nome}>
                  {c.nome}
                </option>
              ))}
            </select>

            <div style={{ display: "flex", gap: "10px" }}>
              <input
                type="text"
                placeholder="Nova Categoria"
                value={novaCategoria}
                onChange={(e) => setNovaCategoria(e.target.value)}
                style={{ ...inputStyle, flex: 1 }}
              />
              <button
                onClick={criarCategoria}
                type="button"
                style={secondaryButton}
              >
                + Criar Categoria
              </button>
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              <button type="submit" style={primaryButton}>
                Guardar
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                style={secondaryButton}
              >
                Cancelar
              </button>
            </div>
          </div>
        </form>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={paginaAtual}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4 }}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: "20px",
          }}
        >
          {faturasPaginadas.map((f, index) => (
            <motion.div
              key={f.id}
              layoutId={f.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              onClick={() => setOpenCardId(f.id)}
              style={{
                cursor: "pointer",
                border: "1px solid #ddd",
                borderRadius: "12px",
                padding: "15px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                backgroundColor: "#fff",
                position: "relative",
              }}
              whileHover={{ scale: 1.02 }}
            >
              <span
                style={{
                  position: "absolute",
                  top: 10,
                  right: 15,
                  fontSize: "12px",
                  color: "#888",
                }}
              >
                {f.data?.seconds
                  ? new Date(f.data.seconds * 1000).toLocaleDateString()
                  : ""}
              </span>
              <div
                style={{
                  textAlign: "center",
                  fontSize: "18px",
                  fontWeight: "bold",
                  marginTop: "30px",
                }}
              >
                {f.empresa}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

      <div
        style={{
          position: "fixed",
          bottom: 20,
          left: 0,
          width: "100%",
          backgroundColor: "#fff",
          padding: "10px 0",
          textAlign: "center",
          boxShadow: "0 -2px 6px rgba(0,0,0,0.1)",
          zIndex: 100,
        }}
      >
        <button
          onClick={() => setPaginaAtual((prev) => Math.max(prev - 1, 1))}
          disabled={paginaAtual === 1}
          style={{
            marginRight: "10px",
            ...primaryButton,
            opacity: paginaAtual === 1 ? 0.5 : 1,
            cursor: paginaAtual === 1 ? "not-allowed" : "pointer",
          }}
        >
          ⬅ Anterior
        </button>
        <span style={{ fontSize: "16px", margin: "0 10px" }}>
          Página {paginaAtual} de {totalPaginas}
        </span>
        <button
          onClick={() =>
            setPaginaAtual((prev) => Math.min(prev + 1, totalPaginas))
          }
          disabled={paginaAtual === totalPaginas}
          style={{
            marginLeft: "10px",
            ...primaryButton,
            opacity: paginaAtual === totalPaginas ? 0.5 : 1,
            cursor: paginaAtual === totalPaginas ? "not-allowed" : "pointer",
          }}
        >
          Próxima ➡
        </button>
      </div>

      <AnimatePresence>
        {openCardId && selectedFatura && (
          <motion.div
            layoutId={openCardId}
            onClick={() => setOpenCardId(null)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              backgroundColor: "rgba(0, 0, 0, 0.4)",
              backdropFilter: "blur(8px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 999,
            }}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "#fff",
                borderRadius: "16px",
                padding: "30px",
                width: "90%",
                maxWidth: "600px",
                boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
              }}
            >
              <h2>{selectedFatura.empresa}</h2>
              <p>
                <strong>Data:</strong>{" "}
                {new Date(
                  selectedFatura.data.seconds * 1000
                ).toLocaleDateString()}
              </p>
              <p>
                <strong>Valor:</strong> {selectedFatura.valor?.toFixed(2)} €
              </p>
              {selectedFatura.detalhes && (
                <p>
                  <strong>Detalhes:</strong> {selectedFatura.detalhes}
                </p>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  marginTop: 20,
                }}
              >
                <button
                  onClick={() => eliminarFatura(selectedFatura.id)}
                  style={{
                    backgroundColor: "#dc3545", // vermelho
                    color: "#fff",
                    padding: "10px 20px",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  🗑 Eliminar
                </button>
                <button
                  onClick={() => setOpenCardId(null)}
                  style={{
                    padding: "10px 20px",
                    border: "none",
                    backgroundColor: "#007bff",
                    color: "#fff",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// estilos reutilizáveis
const inputStyle = {
  padding: "10px",
  borderRadius: "6px",
  border: "1px solid #ccc",
  fontSize: "16px",
};

const primaryButton = {
  backgroundColor: "#007bff",
  color: "#fff",
  border: "none",
  padding: "10px 16px",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "bold",
};

const secondaryButton = {
  backgroundColor: "#f0f0f0",
  color: "#333",
  border: "none",
  padding: "10px 16px",
  borderRadius: "6px",
  cursor: "pointer",
};
