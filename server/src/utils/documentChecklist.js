const REQUIRED_DOCUMENTS = {
  national_id_or_passport: "National ID / Passport",
  drivers_licence: "Driver's Licence",
  secondary_education_proof: "Proof of secondary education",
  profile_photo: "Profile photo",
  police_clearance_certificate: "Police Clearance / Criminal Record Certificate"
};

const CHECKLIST_KEYS = {
  "National ID / Passport": "nationalIdOrPassport",
  "Driver's Licence": "driversLicence",
  "Proof of secondary education": "secondaryEducationProof",
  "Profile photo": "profilePhoto",
  "Police Clearance / Criminal Record Certificate": "policeClearanceCertificate"
};

function buildDocumentChecklist(documents = []) {
  const checklist = {
    nationalIdOrPassport: "Missing",
    driversLicence: "Missing",
    secondaryEducationProof: "Missing",
    profilePhoto: "Missing",
    policeClearanceCertificate: "Missing"
  };

  documents.forEach(function (document) {
    const key = CHECKLIST_KEYS[document.documentType];
    if (key) {
      checklist[key] = document.status || "Submitted";
    }
  });

  return checklist;
}

function getMissingRequiredDocuments(documents = []) {
  const checklist = buildDocumentChecklist(documents);
  return Object.keys(checklist).filter(function (key) {
    return checklist[key] === "Missing";
  });
}

module.exports = {
  REQUIRED_DOCUMENTS,
  CHECKLIST_KEYS,
  buildDocumentChecklist,
  getMissingRequiredDocuments
};
