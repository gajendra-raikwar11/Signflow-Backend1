const docusign = require("docusign-esign");
const { getAuthenticatedClient } = require("./docusignClient");

function buildTabsForRecipient(allTabs, recipientEmail, recipientId) {
  const myTabs = allTabs.filter((t) => t.recipientEmail === recipientEmail);

  const signHereTabs = [];
  const dateSignedTabs = [];
  const initialHereTabs = [];
  const textTabs = [];
  const checkboxTabs = [];

  myTabs.forEach((tab) => {
    // Coordinate conversion:
    // normX/normY (0-1) × PDF page size in points (72 DPI)
    // Standard A4: 595 × 842 points
    // Standard Letter: 612 × 792 points
    // Agar normX available hai to use karo, warna raw x/y (already in points) use karo
    
    let xPos, yPos;
    
    if (tab.normX !== undefined && tab.normX !== null) {
      // PDF.js canvas se aaya — normalize karo actual page size se
      // Hum Letter size assume karte hain (most common)
      xPos = String(Math.round(tab.normX * 612));
      yPos = String(Math.round(tab.normY * 792));
    } else {
      // Purana format — scale factor remove karo
      xPos = String(Math.round((tab.x || 0) / 1.4));
      yPos = String(Math.round((tab.y || 0) / 1.4));
    }

    const base = {
      documentId: "1",
      pageNumber: String(tab.page || 1),
      xPosition: xPos,
      yPosition: yPos,
      recipientId: recipientId,
    };

    console.log(`Tab: ${tab.type} | recipient: ${recipientEmail} | page: ${tab.page} | x: ${xPos} | y: ${yPos}`);

    switch (tab.type) {
      case "sign_here":
        signHereTabs.push(base);
        break;
      case "date_signed":
        dateSignedTabs.push({ ...base });
        break;
      case "initial_here":
        initialHereTabs.push(base);
        break;
      case "checkbox":
        checkboxTabs.push(base);
        break;
      case "text":
        textTabs.push({ ...base, tabLabel: tab.label || `text_${recipientId}`, value: "" });
        break;
      case "dropdown":
        textTabs.push({ ...base, tabLabel: tab.label || `dropdown_${recipientId}`, value: "" });
        break;
      default:
        signHereTabs.push(base);
    }
  });

  return {
    signHereTabs,
    dateSignedTabs,
    initialHereTabs,
    checkboxTabs,
    textTabs,
  };
}

async function createEnvelopeInDocuSign(envelopeDoc) {
  const { apiClient, accountId } = await getAuthenticatedClient();
  const envelopesApi = new docusign.EnvelopesApi(apiClient);

  // 1. Document
  const doc = new docusign.Document();
  doc.documentBase64 = envelopeDoc.sourceFileBase64;
  doc.name = envelopeDoc.sourceFileName;
  doc.fileExtension = "pdf";
  doc.documentId = "1";

  // 2. Validate tabs — invalid page numbers hata do
  const validTabs = (envelopeDoc.tabs || []).filter(
    (tab) => tab.page >= 1 && tab.recipientEmail
  );

  console.log(`Total tabs: ${envelopeDoc.tabs?.length}, Valid tabs: ${validTabs.length}`);

  if (validTabs.length === 0) {
    console.warn("WARNING: Koi valid tab nahi hai — recipient bina sign kiye complete kar sakta hai!");
  }

  // 3. Recipients
  const sortedRecipients = [...envelopeDoc.recipients].sort(
    (a, b) => a.routingOrder - b.routingOrder
  );

  const signers = sortedRecipients.map((r, index) => {
    const docusignRecipientId = String(index + 1);
    const tabs = buildTabsForRecipient(validTabs, r.email, docusignRecipientId);

    console.log(`Recipient: ${r.email} | tabs:`, JSON.stringify(tabs));

    const signer = new docusign.Signer();
    signer.email = r.email;
    signer.name = r.name;
    signer.recipientId = docusignRecipientId;
    signer.routingOrder =
      envelopeDoc.routingType === "sequential" ? String(r.routingOrder) : "1";
    signer.tabs = tabs;

    r.docusignRecipientId = docusignRecipientId;

    return signer;
  });

  // 4. Envelope definition
  const envelopeDefinition = new docusign.EnvelopeDefinition();
  envelopeDefinition.emailSubject = `Please sign: ${envelopeDoc.title}`;
  envelopeDefinition.documents = [doc];
  envelopeDefinition.recipients = { signers };
  envelopeDefinition.status = "sent";

  // 5. Call DocuSign
  try {
    const results = await envelopesApi.createEnvelope(accountId, {
      envelopeDefinition,
    });
    console.log("DocuSign envelope created:", results.envelopeId);
    return results.envelopeId;
  } catch (err) {
    const detail = err.response ? err.response.body || err.response.data : err.message;
    console.error("DocuSign error detail:", JSON.stringify(detail, null, 2));
    throw new Error(JSON.stringify(detail));
  }
}

module.exports = { createEnvelopeInDocuSign };