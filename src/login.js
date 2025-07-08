// src/Login.js
import React, { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "./firebase";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [isRegisto, setIsRegisto] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = isRegisto
        ? await createUserWithEmailAndPassword(auth, email, senha)
        : await signInWithEmailAndPassword(auth, email, senha);
      onLogin(res.user);
    } catch (err) {
      alert("Erro: " + err.message);
    }
  };

  return (
    <div style={container}>
      <form onSubmit={handleSubmit} style={formStyle}>
        <h2 style={titleStyle}>
          {isRegisto ? "Criar Conta" : "Iniciar Sessão"}
        </h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
          required
        />
        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          style={inputStyle}
          required
        />
        <button type="submit" style={primaryButton}>
          {isRegisto ? "Registar" : "Entrar"}
        </button>
        <button
          type="button"
          onClick={() => setIsRegisto(!isRegisto)}
          style={secondaryButton}
        >
          {isRegisto ? "Já tens conta? Entrar" : "Não tens conta? Registar"}
        </button>
      </form>
    </div>
  );
}

// 🎨 Estilos inline
const container = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  height: "100vh",
  background: "#f3f4f6",
};

const formStyle = {
  background: "#fff",
  padding: "40px",
  borderRadius: "12px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
  display: "flex",
  flexDirection: "column",
  gap: "16px",
  width: "100%",
  maxWidth: "400px",
};

const titleStyle = {
  marginBottom: "10px",
  textAlign: "center",
  fontSize: "24px",
  fontWeight: "bold",
};

const inputStyle = {
  padding: "12px",
  fontSize: "16px",
  border: "1px solid #ccc",
  borderRadius: "6px",
  outline: "none",
};

const primaryButton = {
  padding: "12px",
  fontSize: "16px",
  backgroundColor: "#007bff",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "bold",
};

const secondaryButton = {
  padding: "10px",
  fontSize: "14px",
  backgroundColor: "transparent",
  color: "#007bff",
  border: "none",
  textAlign: "center",
  cursor: "pointer",
  textDecoration: "underline",
};
