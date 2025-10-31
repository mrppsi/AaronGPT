import { Client, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";
import fetch from "node-fetch";
import express from "express";

dotenv.config();

// ---------------------------
// Express server para mantener activo
// ---------------------------
const app = express();
const PORT = process.env.PORT || 3000;
app.get("/", (req, res) => res.send("AaronGPT activo 😎"));
app.listen(PORT, () => console.log(`Servidor escuchando en puerto ${PORT}`));

// ---------------------------
// Inicializar cliente Discord
// ---------------------------
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// ---------------------------
// Función Hugging Face pública (gpt-neo-125M)
async function askHFModel(pregunta) {
  try {
    const res = await fetch("https://api-inference.huggingface.co/models/EleutherAI/gpt-neo-125M", {
      method: "POST",
      headers: { "Content-Type": "application/json" }, // sin token, modelo público
      body: JSON.stringify({ inputs: pregunta }),
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`HF error: ${res.status} ${txt}`);
    }

    const data = await res.json();
    return data[0]?.generated_text ?? "Aaron no pudo responder 😅";
  } catch (err) {
    console.error("Error Hugging Face:", err);
    return "Aaron está ocupado, inténtalo más tarde 😅";
  }
}

// ---------------------------
// Muletillas al 40% de probabilidad
function maybeAddMuletilla(text) {
  const muletillas = ["mi bro", "compa", "mi pana", "hermano"];
  if (Math.random() < 0.4) {
    const random = muletillas[Math.floor(Math.random() * muletillas.length)];
    return `${text} ${random}`;
  }
  return text;
}

// ---------------------------
// Evento ready
client.on("ready", () => {
  console.log(`✅ AaronGPT conectado como ${client.user.tag}`);
});

// ---------------------------
// Respuestas predefinidas exactas
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
// Listener para comandos !aaron
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.content.toLowerCase().startsWith("!aaron")) {
    const pregunta = message.content.slice(6).trim();
    if (!pregunta) return message.reply("Escribe algo para preguntarle a Aaron 😎");

    // Revisar respuestas predefinidas
    const respuestaDirecta = respuestasPersonalizadasExactas(pregunta);
    if (respuestaDirecta) return message.reply(maybeAddMuletilla(respuestaDirecta));

    // Prompt de personalidad
    const systemPrompt = "Eres AaronGPT, IA con personalidad definida. Usa solo el 50% de tu poder y termina con 'pregúntale el otro 50% a ChatGPT'.";
    const respuestaHF = await askHFModel(`${systemPrompt}\nUsuario: ${pregunta}`);

    // Enviar respuesta final
    return message.reply(maybeAddMuletilla(respuestaHF));
  }
});

// ---------------------------
// Login Discord
client.login(process.env.DISCORD_TOKEN);
