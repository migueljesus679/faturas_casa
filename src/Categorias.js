import React, { useEffect, useState } from "react";
import { db, auth } from "./firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

export default function Categorias({ onSelecionarCategoria }) {
  const [categorias, setCategorias] = useState([]);
  const [novaCategoria, setNovaCategoria] = useState("");

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, "categorias"),
      where("userId", "==", auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setCategorias(lista);
    });

    return () => unsubscribe();
  }, []);

  const criarCategoria = async (e) => {
    e.preventDefault();
    if (!novaCategoria) return;

    await addDoc(collection(db, "categorias"), {
      userId: auth.currentUser.uid,
      nome: novaCategoria,
    });
    setNovaCategoria("");
  };

  return (
    <div style={{ marginBottom: 20 }}>
      <form onSubmit={criarCategoria} style={{ display: "flex", gap: "10px" }}>
        <input
          value={novaCategoria}
          onChange={(e) => setNovaCategoria(e.target.value)}
          placeholder="Nova categoria"
          style={{ padding: "6px", borderRadius: "4px", flex: 1 }}
        />
        <button type="submit" style={{ padding: "6px 12px" }}>
          Adicionar
        </button>
      </form>

      <div style={{ marginTop: 10 }}>
        {categorias.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelecionarCategoria(c.nome)}
            style={{
              marginRight: "10px",
              marginTop: "10px",
              padding: "6px 12px",
              backgroundColor: "#eee",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            {c.nome}
          </button>
        ))}
      </div>
    </div>
  );
}
