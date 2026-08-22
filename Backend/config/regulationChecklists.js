// Static checklist data for frontend checklist UI 
// Each item has:
//   id      — unique key for this requirement (used by frontend to track checkbox state)
//   label   — short human-readable text shown in the checklist
//   warning — (optional) shown as a highlight if this item is easy to miss

const regulationChecklists = {
  china: [
    {
      id: "microchip",
      label: "Microchip (ISO 11784/11785)",
    },
    {
      id: "rabies_vaccination",
      label: "Rabies vaccination",
    },
    {
      id: "rabies_titer_test",
      label: "Rabies titer test",
      warning: "Must be done at least 30 days after vaccination",
    },
    {
      id: "health_certificate",
      label: "Health certificate (issued within 10 days of travel)",
      warning: "Must be endorsed by your national authority (e.g. USDA, APHA)",
    },
    {
      id: "quarantine",
      label: "Quarantine on arrival (up to 30 days)",
      warning: "Owner pays all quarantine costs",
    },
    {
      id: "entry_port",
      label: "Approved entry port only",
      warning: "Not all airports accept pets — confirm before booking",
    },
  ],

  turkey: [
    {
      id: "microchip",
      label: "Microchip (ISO 11784/11785)",
    },
    {
      id: "rabies_vaccination",
      label: "Rabies vaccination",
    },
    {
      id: "health_certificate",
      label: "Health certificate (issued within 10 days of travel)",
    },
    {
      id: "tapeworm_treatment",
      label: "Tapeworm treatment (dogs only)",
      warning: "Must be administered 1–5 days before entry",
    },
    {
      id: "eu_passport",
      label: "EU pet passport accepted",
    },
  ],

  germany: [
    {
      id: "eu_passport",
      label: "EU pet passport",
    },
    {
      id: "microchip",
      label: "Microchip (ISO 11784/11785)",
    },
    {
      id: "rabies_vaccination",
      label: "Rabies vaccination (12-month validity)",
    },
    {
      id: "tapeworm_treatment",
      label: "Tapeworm treatment (dogs only, within 5 days of entry)",
    },
  ],
};

module.exports = regulationChecklists;