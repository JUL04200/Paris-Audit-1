module.exports = (request, response) => {
  if (request.method !== "POST") {
    response.status(405).json({
      error: "Méthode non autorisée."
    });
    return;
  }

  const payload = typeof request.body === "object" && request.body !== null ? request.body : {};
  const name = sanitizeInput(payload.name);
  const email = sanitizeInput(payload.email);
  const company = sanitizeInput(payload.company);
  const phone = sanitizeInput(payload.phone);
  const message = sanitizeInput(payload.message);

  if (!name || !email || !message) {
    response.status(400).json({
      error: "Les champs nom, email et message sont obligatoires."
    });
    return;
  }

  const recipientEmail = process.env.CONTACT_TO_EMAIL || "INFO@PARISAUDIT.COM";

  response.status(200).json({
    message: "Votre demande a bien été préparée.",
    mailtoLink: buildMailtoLink({
      email: recipientEmail,
      name,
      company,
      phone,
      message
    })
  });
};

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
      `Entreprise : ${company || "Non renseignée"}`,
      `Téléphone : ${phone || "Non renseigné"}`,
      "",
      "Message :",
      message
    ].join("\n")
  );

  return `mailto:${recipient}?subject=${subject}&body=${body}`;
}
