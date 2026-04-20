const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");
const DATA_DIR = path.join(__dirname, "data");
const CONTACTS_FILE = path.join(DATA_DIR, "contacts.json");

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp"
};

function ensureStorage() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(CONTACTS_FILE)) {
    fs.writeFileSync(CONTACTS_FILE, "[]", "utf8");
  }
}

function canWriteToLocalStorage() {
  return !process.env.VERCEL;
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8"
  });
  response.end(JSON.stringify(payload));
}

function serveFile(filePath, response) {
  fs.readFile(filePath, (error, content) => {
    if (error) {
      sendJson(response, 404, { error: "Ressource introuvable." });
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    response.writeHead(200, {
      "Content-Type": MIME_TYPES[extension] || "application/octet-stream"
    });
    response.end(content);
  });
}

function sanitizeInput(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function buildMailtoLink({ email, name, company, phone, message }) {
  const recipient = encodeURIComponent(email);
  const subject = encodeURIComponent("Demande de contact depuis le site Paris Audit et Conseil");
  const body = encodeURIComponent(
    [
      `Nom : ${name}`,
      `Entreprise : ${company || "Non renseignee"}`,
      `Telephone : ${phone || "Non renseigne"}`,
      "",
      "Message :",
      message
    ].join("\n")
  );

  return `mailto:${recipient}?subject=${subject}&body=${body}`;
}

function saveContact(contact) {
  if (!canWriteToLocalStorage()) {
    return;
  }

  const existing = JSON.parse(fs.readFileSync(CONTACTS_FILE, "utf8"));
  existing.push(contact);
  fs.writeFileSync(CONTACTS_FILE, JSON.stringify(existing, null, 2), "utf8");
}

function handleContact(request, response) {
  let body = "";

  request.on("data", (chunk) => {
    body += chunk.toString();

    if (body.length > 1_000_000) {
      request.socket.destroy();
    }
  });

  request.on("end", () => {
    try {
      const payload = JSON.parse(body);
      const name = sanitizeInput(payload.name);
      const email = sanitizeInput(payload.email);
      const company = sanitizeInput(payload.company);
      const phone = sanitizeInput(payload.phone);
      const message = sanitizeInput(payload.message);

      if (!name || !email || !message) {
        sendJson(response, 400, {
          error: "Les champs nom, email et message sont obligatoires."
        });
        return;
      }

      const recipientEmail = process.env.CONTACT_TO_EMAIL || "PARIS.AUDIT@AOL.COM";
      const contact = {
        id: Date.now(),
        createdAt: new Date().toISOString(),
        name,
        email,
        company,
        phone,
        message
      };

      saveContact(contact);

      sendJson(response, 200, {
        message: "Votre demande a bien ete enregistree.",
        mailtoLink: buildMailtoLink({
          email: recipientEmail,
          name,
          company,
          phone,
          message
        })
      });
    } catch (error) {
      sendJson(response, 400, {
        error: "La requete est invalide."
      });
    }
  });
}

function resolvePath(urlPath) {
  const cleanPath = urlPath === "/" ? "/index.html" : urlPath;
  const safePath = path.normalize(cleanPath).replace(/^(\.\.[/\\])+/, "");
  return path.join(PUBLIC_DIR, safePath);
}

if (canWriteToLocalStorage()) {
  ensureStorage();
}

const server = http.createServer((request, response) => {
  if (request.method === "POST" && request.url === "/api/contact") {
    handleContact(request, response);
    return;
  }

  if (request.method !== "GET") {
    sendJson(response, 405, { error: "Methode non autorisee." });
    return;
  }

  const filePath = resolvePath(request.url);

  fs.stat(filePath, (error, stats) => {
    if (error || !stats.isFile()) {
      sendJson(response, 404, { error: "Page introuvable." });
      return;
    }

    serveFile(filePath, response);
  });
});

server.listen(PORT, () => {
  console.log(`Paris Audit et Conseil disponible sur http://localhost:${PORT}`);
});
