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

export default function Faturas() {
  const [faturas, setFaturas] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [empresa, setEmpresa] = useState("");
  const [data, setData] = useState("");
  const [valor, setValor] = useState("");
  const [detalhes, setDetalhes] = useState("");
  const [openCardId, setOpenCardId] = useState(null);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const faturasPorPagina = 15;
  const indiceInicial = (paginaAtual - 1) * faturasPorPagina;

  const [filtroEmpresa, setFiltroEmpresa] = useState("");

  const [dataInicial, setDataInicial] = useState("");
  const [dataFinal, setDataFinal] = useState("");

  const limparFiltros = () => {
    setFiltroEmpresa("");
    setDataInicial("");
    setDataFinal("");
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

    const inicioValido = dataInicial
      ? new Date(dataInicial) <= dataFatura
      : true;
    const fimValido = dataFinal ? new Date(dataFinal) >= dataFatura : true;

    return nomeMatch && inicioValido && fimValido;
  });

  const faturasPaginadas = faturasFiltradas.slice(
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
            value={dataInicial}
            onChange={(e) => {
              setDataInicial(e.target.value);
              setPaginaAtual(1);
            }}
            style={inputStyle}
          />
          <input
            type="date"
            value={dataFinal}
            onChange={(e) => {
              setDataFinal(e.target.value);
              setPaginaAtual(1);
            }}
            style={inputStyle}
          />
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
              <button
                onClick={() => setOpenCardId(null)}
                style={{
                  marginTop: 20,
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
