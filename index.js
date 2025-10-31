import { Client, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";
import fetch from "node-fetch";
import express from "express";

dotenv.config();

// ---------------------------
// Servidor Express para Render
// ---------------------------
const app = express();
const PORT = process.env.PORT || 3000;
app.get("/", (req, res) => res.send("AaronGPT activo 😎"));
app.listen(PORT, () => console.log(`Servidor escuchando en puerto ${PORT}`));

// ---------------------------
// Cliente Discord
// ---------------------------
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// ---------------------------
// Hugging Face público (gpt-neo-125M) sin token
async function askHFModel(pregunta) {
  try {
    const res = await fetch(
      "https://api-inference.huggingface.co/models/EleutherAI/gpt-neo-125M",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" }, // ✅ sin token
        body: JSON.stringify({ inputs: pregunta }),
      }
    );

    if (!res.ok) {
      const txt = await res.text();
      console.error(`HF error: ${res.status} ${txt}`);
      return "Aaron está ocupado, inténtalo más tarde 😅";
    }

    const data = await res.json();
    return data[0]?.generated_text ?? "Aaron no pudo responder 😅";
  } catch (err) {
    console.error("Error Hugging Face:", err);
    return "Aaron está ocupado, inténtalo más tarde 😅";
  }
}

// ---------------------------
// Muletillas al 40%
function maybeAddMuletilla(text) {
  const muletillas = ["mi bro", "compa", "mi pana", "hermano"];
  if (Math.random() < 0.4) {
    const random = muletillas[Math.floor(Math.random() * muletillas.length)];
    return `${text} ${random}`;
  }
  return text;
}

// ---------------------------
// Respuestas predefinidas
function respuestasPersonalizadasExactas(mensaje) {
  const lower = mensaje.toLowerCase();
  if (lower === "donde esta aaron" || lower === "dónde está aaron")
    return "Aaron está ocupado viendo una de sus películas favoritas 😎";
  if (lower === "en que salon va aaron" || lower === "en qué salón va aaron")
    return "Aaron va en el salón 221 📘";
  if (lower === "como es aaron" || lower === "cómo es aaron")
    return "Aaron es un femboy con mucho estilo y le encantan las películas intensas 🎬";
  return null;
}

// ---------------------------
// Listener !aaron
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.content.toLowerCase().startsWith("!aaron")) return;

  const pregunta = message.content.slice(6).trim();
  if (!pregunta) return message.reply("Escribe algo para preguntarle a Aaron 😎");

  // Determinar respuesta
  let respuesta = respuestasPersonalizadasExactas(pregunta);
  if (!respuesta) {
    const systemPrompt =
      "Eres AaronGPT, IA con personalidad definida. Usa solo el 50% de tu poder y termina con 'pregúntale el otro 50% a ChatGPT'.";
    respuesta = await askHFModel(`${systemPrompt}\nUsuario: ${pregunta}`);
  }

  // Enviar solo una vez
  return message.reply(maybeAddMuletilla(respuesta));
});

// ---------------------------
// Login Discord
client.login(process.env.DISCORD_TOKEN);

client.on("ready", () => {
  console.log(`✅ AaronGPT conectado como ${client.user.tag}`);
});
