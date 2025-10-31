import { Client, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";
import express from "express";
import RiveScript from "rivescript";

dotenv.config();

// ---------------------------
// Servidor Express para Render
// ---------------------------
const app = express();
const PORT = process.env.PORT || 3000;
app.get("/", (req, res) => res.send("AaronGPT activo 😎"));
app.listen(PORT, () => console.log(`Servidor escuchando en puerto ${PORT}`));

// ---------------------------
// Inicializar Discord
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// ---------------------------
// Inicializar RiveScript
const bot = new RiveScript();
await bot.loadFile("./aaron.rive"); // tu archivo RiveScript
await bot.sortReplies();

// ---------------------------
// Listener !aaron
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.content.toLowerCase().startsWith("!aaron")) return;

  const pregunta = message.content.slice(6).trim();
  if (!pregunta) return message.reply("Escribe algo para preguntarle a Aaron 😎");

  // Respuesta de RiveScript
  const respuesta = await bot.reply("local-user", pregunta);

  message.reply(respuesta);
});

// ---------------------------
// Login Discord
client.login(process.env.DISCORD_TOKEN);

client.on("ready", () => {
  console.log(`✅ AaronGPT conectado como ${client.user.tag}`);
});
