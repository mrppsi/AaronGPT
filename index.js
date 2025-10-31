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

app.get("/", (req, res) => {
  res.send("AaronGPT esta vivo 😎");
});

app.listen(PORT, () => console.log(`Servidor escuchando en puerto ${PORT}`));

// ---------------------------
// Inicializar cliente Discord
// ---------------------------
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
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
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );
    console.log("Slash commands actualizados ✅");
  } catch (error) {
    console.error(error);
  }
})();

// ---------------------------
// Función Hugging Face
// ---------------------------
async function askHFModel(pregunta) {
  try {
    const res = await fetch("https://api-inference.huggingface.co/models/tiiuae/falcon-7b-instruct", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HF_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: pregunta }),
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`HF error: ${res.status} ${txt}`);
    }

    const data = await res.json();
    return data[0]?.generated_text ?? "AaronGPT está ocupado, pregúntale el otro 50% a aaron.";
  } catch (err) {
    console.error("Error Hugging Face:", err);
    return "AaronGPT está ocupado, pregúntale el otro 50% a aaron.";
  }
}

// ---------------------------
// Muletillas
// ---------------------------
function maybeAddMuletilla(text) {
  const muletillas = ["bro gay", "nigga", "negro", "50% de mi poder"];
  if (Math.random() < 0.4) {
    const random = muletillas[Math.floor(Math.random() * muletillas.length)];
    return `${text} ${random}`;
  }
  return text;
}

// ---------------------------
// Respuestas predefinidas
// ---------------------------
function respuestasPersonalizadas(mensaje) {
  const lower = mensaje.toLowerCase();
  if (lower.includes("donde esta aaron") || lower.includes("dónde está aaron")) return "Aaron está ocupado haciendo el saludo de bustopolis";
  if (lower.includes("que es el saludo de bustopolis") || lower.includes("que es el saludo de bustopolis")) return "Preguntale a xiande, él lo inventó.";
  if (lower.includes("quien es xiande") || lower.includes("quien es xiande")) return "un chino.";
  if (lower.includes("en que salon va aaron") || lower.includes("en qué salón va aaron")) return "Aaron va en el salón 221 lo que es apa.";
  if (lower.includes("como es aaron") || lower.includes("cómo es aaron")) return "Aaron es un femboy con mucho estilo y le encantan las peliculas bbc gay.";
  return null;
}

// ---------------------------
// Evento ready
// ---------------------------
client.on("ready", () => {
  console.log(`AaronGPT conectado como ${client.user.tag}`);
});

// ---------------------------
// Evento interacción (slash command)
/* Responde a /aaron */
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;
  if (interaction.commandName === "aaron") {
    const pregunta = interaction.options.getString("pregunta");

    // Respuesta predefinida
    const respuestaDirecta = respuestasPersonalizadas(pregunta);
    if (respuestaDirecta) {
      return interaction.reply(maybeAddMuletilla(respuestaDirecta));
    }

    // Hugging Face
    const systemPrompt = "Eres AaronGPT, IA carismática con el humor negro que usa solo 50% de su poder. Termina tus respuestas diciendo 'pregúntale el otro 50% a aaron'.";
    const respuestaHF = await askHFModel(`${systemPrompt}\nUsuario: ${pregunta}`);
    await interaction.reply(maybeAddMuletilla(respuestaHF));
  }
});

// ---------------------------
// Login Discord
// ---------------------------
client.login(process.env.DISCORD_TOKEN);
