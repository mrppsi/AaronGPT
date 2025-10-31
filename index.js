import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } from "discord.js";
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
// Registrar slash command /aaron
// ---------------------------
const commands = [
  new SlashCommandBuilder()
    .setName("aaron")
    .setDescription("Pregunta algo a AaronGPT")
    .addStringOption(option => option.setName("pregunta").setDescription("Tu pregunta").setRequired(true))
].map(cmd => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log("Actualizando slash commands...");
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
    console.log("Slash commands actualizados ✅");
  } catch (error) {
    console.error(error);
  }
})();

// ---------------------------
// Función Hugging Face pública (GPT2)
// ---------------------------
async function askHFModel(pregunta) {
  try {
    const res = await fetch("https://api-inference.huggingface.co/models/gpt2", {
      method: "POST",
      headers: { "Content-Type": "application/json" }, // ✅ sin token
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
// ---------------------------
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
// Slash command /aaron
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;
  if (interaction.commandName === "aaron") {
    const pregunta = interaction.options.getString("pregunta");
    const respuestaDirecta = respuestasPersonalizadasExactas(pregunta);
    if (respuestaDirecta) return interaction.reply(maybeAddMuletilla(respuestaDirecta));

    const systemPrompt = "Eres AaronGPT, IA con personalidad definida. Usa solo el 50% de tu poder y termina con 'pregúntale el otro 50% a ChatGPT'.";
    const respuestaHF = await askHFModel(`${systemPrompt}\nUsuario: ${pregunta}`);
    await interaction.reply(maybeAddMuletilla(respuestaHF));
  }
});

// ---------------------------
// Listener para comandos !aaron
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.content.toLowerCase().startsWith("!aaron")) {
    const pregunta = message.content.slice(6).trim();
    if (!pregunta) return message.reply("Escribe algo para preguntarle a Aaron 😎");

    const respuestaDirecta = respuestasPersonalizadasExactas(pregunta);
    if (respuestaDirecta) return message.reply(maybeAddMuletilla(respuestaDirecta));

    const systemPrompt = "Eres AaronGPT, IA con personalidad definida. Usa solo el 50% de tu poder y termina con 'pregúntale el otro 50% a ChatGPT'.";
    const respuestaHF = await askHFModel(`${systemPrompt}\nUsuario: ${pregunta}`);
    return message.reply(maybeAddMuletilla(respuestaHF));
  }
});

// ---------------------------
// Login Discord
client.login(process.env.DISCORD_TOKEN);
