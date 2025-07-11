import React, { useEffect } from "react";
import { gapi } from "gapi-script";

const CLIENT_ID =
  "94978555296-jqvsvij82dru6f5ogcvte3b1hi6nifim.apps.googleusercontent.com";
const SCOPES = "https://www.googleapis.com/auth/drive.file";

export default function GoogleDriveUploader() {
  useEffect(() => {
    const initClient = () => {
      gapi.client
        .init({
          apiKey: "", // opcional
          clientId: CLIENT_ID,
          scope: SCOPES,
          discoveryDocs: [
            "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest",
          ],
        })
        .then(() => {
          console.log("GAPI inicializado.");
        });
    };

    gapi.load("client:auth2", initClient);
  }, []);

  const handleAuthClick = () => {
    gapi.auth2.getAuthInstance().signIn();
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const accessToken = gapi.auth.getToken().access_token;

    const metadata = {
      name: file.name,
      mimeType: file.type,
    };

    const form = new FormData();
    form.append(
      "metadata",
      new Blob([JSON.stringify(metadata)], { type: "application/json" })
    );
    form.append("file", file);

    const res = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink",
      {
        method: "POST",
        headers: new Headers({ Authorization: "Bearer " + accessToken }),
        body: form,
      }
    );

    const data = await res.json();

    // Tornar o ficheiro público
    await fetch(
      `https://www.googleapis.com/drive/v3/files/${data.id}/permissions`,
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + accessToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: "reader",
          type: "anyone",
        }),
      }
    );

    alert("Ficheiro carregado: " + data.webViewLink);
  };

  return (
    <div className="p-4">
      <button
        onClick={handleAuthClick}
        className="bg-green-500 text-white px-4 py-2 rounded"
      >
        Login com Google
      </button>
      <input
        type="file"
        onChange={handleUpload}
        className="mt-4 block"
        accept=".pdf,.xlsx,.xls"
      />
    </div>
  );
}
