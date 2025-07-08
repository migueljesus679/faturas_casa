// src/App.js
import React, { useEffect, useState } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import Login from "./login";
import Faturas from "./Faturas";

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  if (!user) return <Login onLogin={setUser} />;

  return (
    <div style={{ padding: 20 }}>
      <header
        style={{
          backgroundColor: "#f8f9fa",
          padding: "15px 30px",
          borderRadius: "12px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "30px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        }}
      >
        <div style={{ fontSize: "16px", color: "#333" }}>
          👋 Bem-vindo,{" "}
          <span style={{ fontWeight: "bold", color: "#007bff" }}>
            {auth.currentUser?.email}
          </span>
        </div>

        <button
          onClick={() => auth.signOut()}
          style={{
            backgroundColor: "#dc3545",
            color: "#fff",
            border: "none",
            padding: "8px 16px",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "bold",
            transition: "background-color 0.2s ease",
          }}
          onMouseOver={(e) => (e.target.style.backgroundColor = "#c82333")}
          onMouseOut={(e) => (e.target.style.backgroundColor = "#dc3545")}
        >
          Sair
        </button>
      </header>

      <Faturas />
    </div>
  );
}
