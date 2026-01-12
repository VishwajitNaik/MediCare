// NLP functions for patient creation and finding

export function isCreatePatientIntent(msg) {
  const text = msg.toLowerCase();
  return text.includes("create patient") ||
         (text.includes("add patient") && !text.includes("queue"));
}

export function isFindPatientIntent(msg) {
  return msg.toLowerCase().includes("find patient")
      || msg.toLowerCase().includes("search patient")
      || msg.toLowerCase().includes("get patient");
}

export function isCheckMedicineIntent(msg) {
  return msg.toLowerCase().includes("check medicine")
      || msg.toLowerCase().includes("medicine stock")
      || msg.toLowerCase().includes("inventory")
      || msg.toLowerCase().includes("available stock");
}

export function isServeMedicineIntent(msg) {
  return msg.toLowerCase().includes("serve medicine")
      || msg.toLowerCase().includes("sell medicine")
      || msg.toLowerCase().includes("medicine sale");
}

export function isCreatePrescriptionIntent(msg) {
  return msg.toLowerCase().includes("create prescription")
      || msg.toLowerCase().includes("make prescription")
      || msg.toLowerCase().includes("new prescription");
}

export function isServePrescriptionIntent(msg) {
  return msg.toLowerCase().includes("serve prescription")
      || msg.toLowerCase().includes("serve medicine for")
      || msg.toLowerCase().includes("prescription for");
}

export function isSelectPatientIntent(msg) {
  return msg.toLowerCase().includes("select patient");
}

export function isAddMedicineIntent(msg) {
  return msg.toLowerCase().includes("add ") && (
    msg.toLowerCase().includes(" for ") ||
    msg.toLowerCase().includes(" days ")
  );
}

export function isCreateMedicineIntent(msg) {
  return msg.toLowerCase().includes("add medicine") ||
         msg.toLowerCase().includes("create medicine") ||
         (msg.toLowerCase().includes("add ") &&
          (msg.toLowerCase().includes(" tablet") ||
           msg.toLowerCase().includes(" syrup") ||
           msg.toLowerCase().includes(" capsule") ||
           msg.toLowerCase().includes(" injection")));
}

export function isCreateSupplierIntent(msg) {
  return msg.toLowerCase().includes("add supplier") ||
         msg.toLowerCase().includes("create supplier");
}

export function isUpdateSupplierIntent(msg) {
  return msg.toLowerCase().includes("update supplier") ||
         msg.toLowerCase().includes("edit supplier") ||
         msg.toLowerCase().includes("modify supplier");
}

export function isDeleteSupplierIntent(msg) {
  return msg.toLowerCase().includes("delete supplier") ||
         msg.toLowerCase().includes("remove supplier");
}

export function isFindSupplierIntent(msg) {
  return msg.toLowerCase().includes("find supplier") ||
         msg.toLowerCase().includes("search supplier") ||
         msg.toLowerCase().includes("get supplier");
}

export function isExpiryListIntent(msg) {
  return msg.toLowerCase().includes("expiry medicine list") ||
         msg.toLowerCase().includes("expired medicine") ||
         msg.toLowerCase().includes("expiry list");
}

export function isLowStockListIntent(msg) {
  return msg.toLowerCase().includes("low stock medicine list") ||
         msg.toLowerCase().includes("low stock") ||
         msg.toLowerCase().includes("stock alert");
}

export function isCreateCsvIntent(msg) {
  return msg.toLowerCase().includes("create csv") ||
         msg.toLowerCase().includes("generate csv") ||
         msg.toLowerCase().includes("export csv");
}

export function isPurchaseStockIntent(msg) {
  const text = msg.toLowerCase();
  return text.includes("purchase medicine stock") ||
         text.includes("purchase stock") ||
         text.includes("buy medicine") ||
         text.includes("order medicine") ||
         (text.includes("purchase") && text.includes("medicine"));
}

export function extractPurchaseMedicineData(message) {
  const text = message.toLowerCase();

  // Extract medicine name - everything after purchase keywords until numbers or other keywords
  let medicineName = text
    .replace(/purchase medicine stock|purchase stock|buy medicine|order medicine/g, "")
    .replace(/for\s+/g, "") // remove "for"
    .replace(/\d+/g, "") // remove numbers
    .trim();

  // If medicine name is empty or just common words, return null
  if (!medicineName || medicineName.length < 2 ||
      ['the', 'a', 'an', 'some', 'few', 'many'].includes(medicineName.toLowerCase())) {
    return { medicineName: null };
  }

  medicineName = medicineName
    .split(" ")
    .filter(w => w.length > 1)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  // Extract quantity if mentioned
  const quantityMatch = text.match(/(\d+)\s*(units?|pieces?|tablets?|capsules?|bottles?)/i);
  const quantity = quantityMatch ? parseInt(quantityMatch[1]) : null;

  // Extract batch number if mentioned
  const batchMatch = text.match(/batch\s+([a-z0-9-]+)/i);
  const batchNumber = batchMatch ? batchMatch[1].toUpperCase() : null;

  // Extract expiry date if mentioned (simple pattern matching)
  const expiryMatch = text.match(/expiry\s+(\d{1,2}\/\d{1,2}\/\d{2,4})/i);
  const expiryDate = expiryMatch ? expiryMatch[1] : null;

  // Extract purchase price if mentioned
  const priceMatch = text.match(/price\s+(₹?\s*[\d.]+)/i);
  const purchasePrice = priceMatch ? parseFloat(priceMatch[1].replace(/₹|\s+/g, '')) : null;

  return { medicineName, quantity, batchNumber, expiryDate, purchasePrice };
}

export function isLastVisitDetailsIntent(msg) {
  const text = msg.toLowerCase();
  return (text.includes("patient") || text.includes("give me patient")) &&
         (text.includes("last visit") || text.includes("visit details"));
}

export function isAddToQueueIntent(msg) {
  return msg.toLowerCase().includes("add to queue") ||
         msg.toLowerCase().includes("add patient to queue") ||
         msg.toLowerCase().includes("queue patient") ||
         msg.toLowerCase().includes("add patient");
}

export function isCallNextPatientIntent(msg) {
  return msg.toLowerCase().includes("call next patient") ||
         msg.toLowerCase().includes("next patient") ||
         msg.toLowerCase().includes("call patient");
}

export function isCompleteVisitIntent(msg) {
  return msg.toLowerCase().includes("complete visit") ||
         msg.toLowerCase().includes("visit complete") ||
         msg.toLowerCase().includes("finish visit");
}

export function isQueueStatusIntent(msg) {
  return msg.toLowerCase().includes("queue status") ||
         msg.toLowerCase().includes("queue list") ||
         msg.toLowerCase().includes("waiting patients") ||
         msg.toLowerCase().includes("patients in queue");
}

export function isCheckAvailabilityIntent(msg) {
  const text = msg.toLowerCase();
  return (text.includes("check") || text.includes("give me") || text.includes("show")) &&
         text.includes("availability") &&
         (text.includes("monday") || text.includes("tuesday") || text.includes("wednesday") ||
          text.includes("thursday") || text.includes("friday") || text.includes("saturday") ||
          text.includes("sunday") || text.includes("to") || text.includes("and"));
}

export function isUpdateAvailabilityIntent(msg) {
  const text = msg.toLowerCase();
  return (text.includes("update") || text.includes("change") || text.includes("set")) &&
         text.includes("availability");
}

export function extractAvailabilityDays(msg) {
  const text = msg.toLowerCase();

  // Days mapping
  const dayMap = {
    'sunday': 0, 'sun': 0,
    'monday': 1, 'mon': 1,
    'tuesday': 2, 'tue': 2,
    'wednesday': 3, 'wed': 3,
    'thursday': 4, 'thu': 4,
    'friday': 5, 'fri': 5,
    'saturday': 6, 'sat': 6
  };

  // Check for range FIRST (e.g., "sun to tue", "monday to friday") - more specific
  const rangeMatch = text.match(/(\w+)\s+to\s+(\w+)/);
  if (rangeMatch) {
    const [, startDay, endDay] = rangeMatch;
    const startIndex = dayMap[startDay];
    const endIndex = dayMap[endDay];

    if (startIndex !== undefined && endIndex !== undefined) {
      const days = [];
      let current = startIndex;
      while (current !== endIndex) {
        days.push(current);
        current = (current + 1) % 7;
      }
      days.push(endIndex); // Include end day
      return days;
    }
  }

  // Check for single day (e.g., "monday availability")
  for (const [dayName, dayIndex] of Object.entries(dayMap)) {
    if (text.includes(dayName)) {
      return [dayIndex];
    }
  }

  // Check for "today"
  if (text.includes("today")) {
    return [new Date().getDay()];
  }

  // Check for "tomorrow"
  if (text.includes("tomorrow")) {
    return [(new Date().getDay() + 1) % 7];
  }

  // Default to current week if no specific days mentioned
  return [0, 1, 2, 3, 4, 5, 6]; // All days
}

export function isPaymentIntent(msg) {
  return msg.toLowerCase().includes("payment");
}

export function isConfirmIntent(msg) {
  return msg.toLowerCase().includes("confirm") ||
         msg.toLowerCase().includes("yes");
}

export function extractPatientData(message) {
  const text = message.toLowerCase();

  // Check if it's labeled format
  const isLabeled = /\b(name|age|gender|mobile)\b/.test(text);

  let name = null, mobile = null, age = null, gender = null;

  if (isLabeled) {
    // Labeled format: "add patient name vishwa naik age 26 gender male mobile 8605243940"
    const nameMatch = text.match(/name\s+([^a-z]*(?:\b[a-z]+\b\s*)+)/);
    if (nameMatch) {
      name = nameMatch[1].trim()
        .split(/\s+/)
        .filter(w => w.length > 1)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
    }

    const mobileMatch = text.match(/mobile\s+(\d{10})/);
    if (mobileMatch) mobile = mobileMatch[1];

    const ageMatch = text.match(/age\s+(\d+)/);
    if (ageMatch) age = Number(ageMatch[1]);

    const genderMatch = text.match(/gender\s+(male|female|other)/);
    if (genderMatch) {
      gender = genderMatch[1].charAt(0).toUpperCase() + genderMatch[1].slice(1);
    }
  } else {
    // Positional format: "create patient vishwa naik 8605243940 26 male"
    mobile = text.match(/\b[6-9]\d{9}\b/)?.[0] || null;
    age = text.match(/\b(1[0-1][0-9]|[1-9]?[0-9])\b/)?.[0] || null;

    if (text.includes("male")) gender = "Male";
    else if (text.includes("female")) gender = "Female";
    else if (text.includes("other")) gender = "Other";

    // Remove keywords, numbers, gender to get name
    name = text
      .replace(/create patient|add patient/g, "")
      .replace(mobile || "", "")
      .replace(age || "", "")
      .replace(/male|female|other/g, "")
      .trim();

    name = name
      .split(" ")
      .filter(w => w.length > 1)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }

  return { name, mobile, age: age ? Number(age) : null, gender };
}

export function validatePatient(data) {
  const missing = [];

  if (!data.name) missing.push("name");
  if (!data.mobile) missing.push("mobile");
  if (!data.age) missing.push("age");
  if (!data.gender) missing.push("gender");

  return missing;
}

export async function createPatientAPI(patientData) {
  const res = await fetch("/api/common/patients", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patientData)
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to create patient");
  }

  const data = await res.json();
  return data.patient;
}

export function extractFindPatientData(message) {
  const text = message.toLowerCase();

  // Extract name - everything after find/search/get patient until numbers or keywords
  let name = text
    .replace(/find patient|search patient|get patient/g, "")
    .replace(/\d+/g, "") // remove numbers
    .trim();

  name = name
    .split(" ")
    .filter(w => w.length > 1)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  // Extract mobile last 4 digits
  const mobileLast4 = text.match(/\b\d{4}\b/)?.[0] || null;

  // Extract age if mentioned
  const age = text.match(/\b\d{1,3}\b/)?.[0] ? Number(text.match(/\b\d{1,3}\b/)[0]) : null;

  return { name, mobileLast4, age };
}

export async function findPatientsAPI(searchCriteria) {
  const res = await fetch("/api/common/patients");
  if (!res.ok) {
    throw new Error("Failed to fetch patients");
  }
  const data = await res.json();
  return data.patients;
}

export function filterPatients(patients, criteria) {
  return patients.filter(patient => {
    let matches = true;

    if (criteria.name) {
      matches = matches && patient.name.toLowerCase().includes(criteria.name.toLowerCase());
    }

    if (criteria.mobileLast4) {
      matches = matches && patient.mobile.endsWith(criteria.mobileLast4);
    }

    if (criteria.age !== null && criteria.age !== undefined) {
      matches = matches && patient.age === criteria.age;
    }

    return matches;
  });
}

export function findUniquePatient(patients, currentCriteria = {}) {
  if (patients.length === 0) {
    return { status: 'not_found', message: 'No patient found with the given criteria.' };
  }

  if (patients.length === 1) {
    return { status: 'found', patient: patients[0] };
  }

  // Multiple patients, need to disambiguate
  const ages = [...new Set(patients.map(p => p.age))];
  if (ages.length > 1 && !currentCriteria.age) {
    return {
      status: 'need_age',
      message: `Found ${patients.length} patients with that name. Please specify the age: ${ages.join(', ')}`,
      options: ages
    };
  }

  // Same ages, check mobile last 4
  const mobiles = [...new Set(patients.map(p => p.mobile.slice(-4)))];
  if (mobiles.length > 1 && !currentCriteria.mobileLast4) {
    return {
      status: 'need_mobile',
      message: `Found ${patients.length} patients. Please specify the last 4 digits of mobile: ${mobiles.join(', ')}`,
      options: mobiles
    };
  }

  // Still multiple, show all
  return {
    status: 'multiple',
    message: `Found ${patients.length} patients: ${patients.map(p => `${p.name} (${p.age}y, mobile ****${p.mobile.slice(-4)})`).join(', ')}`,
    patients
  };
}

export function extractMedicineData(message) {
  const text = message.toLowerCase();

  // Extract medicine name - everything after check/inventory/stock keywords
  let medicineName = text
    .replace(/check medicine|medicine stock|inventory|available stock/g, "")
    .trim();

  medicineName = medicineName
    .split(" ")
    .filter(w => w.length > 1)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return { medicineName };
}

export async function checkMedicineStockAPI() {
  const res = await fetch("/api/medical/inventory/list");
  if (!res.ok) {
    throw new Error("Failed to fetch inventory");
  }
  const data = await res.json();
  return data.inventory;
}

export async function searchMedicinesAPI(searchTerm = '') {
  const url = searchTerm
    ? `/api/common/medicines?search=${encodeURIComponent(searchTerm)}`
    : "/api/common/medicines";

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to fetch medicines");
  }
  const data = await res.json();
  return data.medicines || [];
}

export function findMedicineStock(inventory, medicineName) {
  if (!medicineName) {
    return { status: 'no_name', message: 'Please specify the medicine name.' };
  }

  // Find all inventory items for this medicine
  const medicineItems = inventory.filter(item =>
    item.medicineId?.name?.toLowerCase().includes(medicineName.toLowerCase()) ||
    item.medicineId?.brandName?.toLowerCase().includes(medicineName.toLowerCase())
  );

  if (medicineItems.length === 0) {
    return { status: 'not_found', message: `No inventory found for medicine "${medicineName}".` };
  }

  // Get medicine details from the first item
  const medicine = medicineItems[0].medicineId;

  // Calculate total stock
  const totalStock = medicineItems.reduce((sum, item) => sum + item.availableStock, 0);

  // Build detailed inventory report
  let message = `📊 Medicine Inventory Report\n\n`;
  message += `💊 Medicine: ${medicine.name}\n`;
  message += `🏷️ Brand: ${medicine.brandName}\n`;
  message += `💪 Strength: ${medicine.strength}\n`;
  message += `📁 Category: ${medicine.category}\n`;
  message += `📋 Prescription Required: ${medicine.prescriptionRequired ? 'Yes' : 'No'}\n`;
  message += `📦 Total Stock: ${totalStock}\n\n`;

  // List all batches with expiry dates
  message += `📅 Batch Details:\n`;
  medicineItems.forEach((item, index) => {
    const expiryDate = new Date(item.expiryDate).toLocaleDateString('en-IN');
    const statusIcon = item.isExpired ? '❌' : item.daysLeft <= 30 ? '⚠️' : '✅';
    const statusText = item.isExpired ? 'EXPIRED' : item.daysLeft <= 30 ? 'NEAR EXPIRY' : 'SAFE';

    message += `${index + 1}. Batch: ${item.batchNumber}\n`;
    message += `   Stock: ${item.availableStock}\n`;
    message += `   Expiry: ${expiryDate} (${statusText})\n`;
    message += `   Supplier: ${item.supplierId?.name || 'Unknown'}\n\n`;
  });

  // Add alerts if any
  const expiredItems = medicineItems.filter(item => item.isExpired);
  const lowStockItems = medicineItems.filter(item => item.isLowStock);

  if (expiredItems.length > 0) {
    message += `🚨 ALERT: ${expiredItems.length} batch(es) are EXPIRED!\n`;
  }

  if (lowStockItems.length > 0) {
    message += `⚠️ ALERT: ${lowStockItems.length} batch(es) are LOW ON STOCK!\n`;
  }

  if (totalStock === 0) {
    message += `❌ ALERT: Medicine is OUT OF STOCK!\n`;
  }

  return {
    status: totalStock === 0 ? 'out_of_stock' : 'available',
    message,
    medicine,
    totalStock,
    batches: medicineItems.length,
    lowStockCount: lowStockItems.length,
    expiredCount: expiredItems.length
  };
}

export function extractPatientMobile(message) {
  const text = message.toLowerCase();
  const mobile = text.match(/\b\d{10}\b/)?.[0];
  return mobile;
}

export function extractPatientLastVisitData(message) {
  const text = message.toLowerCase();

  // Extract mobile (10-digit number)
  const mobile = text.match(/\b\d{10}\b/)?.[0];

  // Extract name - everything between "patient" and "ya" or mobile number
  let name = "";
  if (text.includes("patient") && text.includes("ya")) {
    const patientMatch = text.split("patient")[1]?.split("ya")[0]?.trim();
    if (patientMatch) {
      name = patientMatch.replace(/\d+/g, "").trim(); // Remove any numbers
      name = name
        .split(" ")
        .filter(w => w.length > 1)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
    }
  }

  return { name, mobile };
}

export function extractMedicineCommand(message) {
  const text = message.toLowerCase();

  // Extract all numbers from the text
  const numbers = text.match(/\d+/g);
  const dosePerTime = numbers && numbers.length > 0 ? Number(numbers[0]) : null;
  const durationDays = numbers && numbers.length > 1 ? Number(numbers[1]) : null;

  // Extract timings
  const timings = [];
  if (text.includes("morning")) timings.push("MORNING");
  if (text.includes("afternoon")) timings.push("AFTERNOON");
  if (text.includes("night")) timings.push("NIGHT");

  // Extract medicine name - everything between "add" and "for", removing numbers
  let medicineName = "";
  if (text.includes(" for ")) {
    medicineName = text.split(" for ")[0].replace(/add\s+/, "").replace(/\d+/g, "").trim();
  }

  medicineName = medicineName
    .split(" ")
    .filter(w => w.length > 1)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return {
    medicineName,
    dosePerTime,
    durationDays,
    timing: timings,
    totalQuantity: dosePerTime && durationDays ? dosePerTime * durationDays * timings.length : null
  };
}

export function extractPaymentMode(message) {
  const text = message.toLowerCase();
  if (text.includes("upi")) return "UPI";
  if (text.includes("cash")) return "CASH";
  if (text.includes("card")) return "CARD";
  return null;
}

export async function findPatientByMobile(mobile) {
  try {
    const patients = await findPatientsAPI();
    const patient = patients.find(p => p.mobile === mobile);
    return patient || null;
  } catch (error) {
    throw new Error("Failed to find patient");
  }
}

export async function findMedicineByName(medicineName) {
  try {
    const res = await fetch("/api/common/medicines");
    if (!res.ok) throw new Error("Failed to fetch medicines");
    const data = await res.json();
    const medicine = data.medicines.find(m =>
      m.name.toLowerCase().includes(medicineName.toLowerCase()) ||
      (m.brandName && m.brandName.toLowerCase().includes(medicineName.toLowerCase()))
    );
    return medicine || null;
  } catch (error) {
    throw new Error("Failed to find medicine");
  }
}

export async function findAvailableInventory(medicineId) {
  try {
    const inventory = await checkMedicineStockAPI();
    // Find available inventory for this medicine (FIFO - earliest expiry first)
    const availableItems = inventory
      .filter(item =>
        item.medicineId._id === medicineId &&
        item.availableStock > 0 &&
        !item.isExpired
      )
      .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

    return availableItems.length > 0 ? availableItems[0] : null;
  } catch (error) {
    throw new Error("Failed to check inventory");
  }
}

export function generateBillNumber() {
  const now = new Date();
  const dateStr = now.getFullYear().toString().slice(-2) +
                  (now.getMonth() + 1).toString().padStart(2, '0') +
                  now.getDate().toString().padStart(2, '0');
  // In a real app, you'd track the last bill number for the day
  // For now, just use a simple counter
  const counter = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `BILL-${dateStr}-${counter}`;
}

export async function createSaleAPI(saleData) {
  // Add bill number if not provided
  if (!saleData.billNumber) {
    saleData.billNumber = generateBillNumber();
  }

  const res = await fetch("/api/medical/sales/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(saleData)
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to create sale");
  }

  const data = await res.json();
  return data.sale;
}

export function formatCurrency(amount) {
  return `₹${amount.toFixed(2)}`;
}

export function generateBillSummary(items) {
  let summary = "🧾 Bill Summary\n\n";
  let total = 0;

  items.forEach((item, index) => {
    summary += `${index + 1}. ${item.medicineName}\n`;
    summary += `   Quantity: ${item.quantity}\n`;
    summary += `   Price: ${formatCurrency(item.total)}\n\n`;
    total += item.total;
  });

  summary += `Total Amount: ${formatCurrency(total)}`;
  return { summary, total };
}

export function extractCreateMedicineData(message) {
  const text = message.toLowerCase();

  // Initialize defaults
  let name = "", brandName = "", dosageForm = "", strength = "", unit = "", category = "GENERAL";
  let prescriptionRequired = true, isActive = true;

  // Extract dosage form
  if (text.includes("tablet")) dosageForm = "TABLET";
  else if (text.includes("syrup")) dosageForm = "SYRUP";
  else if (text.includes("capsule")) dosageForm = "CAPSULE";
  else if (text.includes("injection")) dosageForm = "INJECTION";
  else if (text.includes("drops")) dosageForm = "DROPS";
  else if (text.includes("cream")) dosageForm = "CREAM";

  // Extract strength (patterns like "500mg", "250 mg", "5 ml")
  const strengthMatch = text.match(/(\d+\s*(?:mg|ml|mcg|g))/i);
  if (strengthMatch) {
    strength = strengthMatch[1].trim();
  }

  // Set unit based on dosage form
  if (dosageForm === "TABLET" || dosageForm === "CAPSULE") {
    unit = dosageForm;
  } else if (dosageForm === "SYRUP" || dosageForm === "DROPS") {
    unit = "ML";
  }

  // Extract category
  if (text.includes("antibiotic")) category = "ANTIBIOTIC";
  else if (text.includes("painkiller") || text.includes("analgesic")) category = "PAINKILLER";
  else if (text.includes("antacid")) category = "ANTACID";
  else if (text.includes("antihistamine")) category = "ANTIHISTAMINE";
  else if (text.includes("vitamin")) category = "VITAMIN";
  else if (text.includes("supplement")) category = "SUPPLEMENT";

  // Extract prescription requirement
  if (text.includes("without prescription") || text.includes("no prescription") || text.includes("otc")) {
    prescriptionRequired = false;
  } else if (text.includes("prescription required") || text.includes("prescription needed") || text.includes("rx required")) {
    prescriptionRequired = true;
  }
  // Otherwise keep default (true)

  // Extract active status
  if (text.includes("inactive") || text.includes("disable") || text.includes("not active")) {
    isActive = false;
  } else if (text.includes("active")) {
    isActive = true;
  }
  // Otherwise keep default (true)

  // Extract brand name (look for "brand" keyword)
  let brandMatch = text.match(/brand\s+([^\s]+)/i);
  if (brandMatch) {
    brandName = brandMatch[1].charAt(0).toUpperCase() + brandMatch[1].slice(1);
  }

  // Extract medicine name (everything between "add medicine"/"create medicine" and the other details)
  let nameText = text
    .replace(/add medicine|create medicine/g, "")
    .replace(/tablet|syrup|capsule|injection|drops|cream/g, "")
    .replace(/antibiotic|painkiller|analgesic|antacid|antihistamine|vitamin|supplement/g, "")
    .replace(/prescription|rx|inactive|disable/g, "")
    .replace(/brand\s+\w+/g, "")
    .replace(strength, "")
    .replace(/not|without/g, "")
    .trim();

  // Split by spaces and take the first word as name, rest as brand if not already set
  const words = nameText.split(" ").filter(w => w.length > 0);
  if (words.length > 0) {
    name = words[0].charAt(0).toUpperCase() + words[0].slice(1);
    if (!brandName && words.length > 1) {
      brandName = words.slice(1).join(" ").charAt(0).toUpperCase() + words.slice(1).join(" ").slice(1);
    }
  }

  return {
    name,
    brandName,
    dosageForm,
    strength,
    unit,
    category,
    prescriptionRequired,
    isActive
  };
}

export async function createMedicineAPI(medicineData) {
  const res = await fetch("/api/medical/medicines", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(medicineData)
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to create medicine");
  }

  const data = await res.json();
  return data.medicine;
}

export function extractCreateSupplierData(message) {
  const text = message.toLowerCase();

  // Initialize
  let name = "", companyName = "", mobile = "", email = "", address = "";

  // Extract mobile (10-digit number)
  const mobileMatch = text.match(/\b\d{10}\b/);
  if (mobileMatch) {
    mobile = mobileMatch[0];
  }

  // Extract email
  const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
  if (emailMatch) {
    email = emailMatch[0];
  }

  // Extract company name (look for "company" keyword)
  let companyMatch = text.match(/company\s+([^,\n]+)/i);
  if (companyMatch) {
    companyName = companyMatch[1].trim();
  }

  // Extract address (everything after "address" or after comma if structured)
  let addressMatch = text.match(/address\s+([^,\n]+)/i);
  if (addressMatch) {
    address = addressMatch[1].trim();
  } else {
    // Look for comma-separated parts
    const parts = text.split(',');
    if (parts.length >= 3) {
      address = parts.slice(2).join(',').trim();
    }
  }

  // Extract supplier name (everything between "add supplier"/"create supplier" and other details)
  let nameText = text
    .replace(/add supplier|create supplier/g, "")
    .replace(/company\s+[^,\n]+/gi, "")
    .replace(/mobile\s+\d{10}/g, "")
    .replace(/email\s+[^,\s]+/g, "")
    .replace(/address\s+[^,\n]+/gi, "")
    .replace(mobile, "")
    .replace(email, "")
    .replace(/[^\w\s]/g, "") // remove punctuation
    .trim();

  // Take first part as name
  const nameParts = nameText.split(" ").filter(w => w.length > 1);
  if (nameParts.length > 0) {
    name = nameParts.slice(0, 2).join(" "); // Take first 2 words as name
    name = name.charAt(0).toUpperCase() + name.slice(1);
  }

  return {
    name,
    companyName,
    mobile,
    email,
    address
  };
}

export async function checkSupplierExists(mobile, email) {
  try {
    const res = await fetch("/api/medical/suppliers");
    if (!res.ok) throw new Error("Failed to fetch suppliers");

    const data = await res.json();
    const suppliers = data.suppliers;

    // Check if supplier exists by mobile or email
    const existingByMobile = suppliers.find(s => s.mobile === mobile);
    const existingByEmail = suppliers.find(s => s.email === email);

    return {
      exists: !!(existingByMobile || existingByEmail),
      existingSupplier: existingByMobile || existingByEmail,
      conflictField: existingByMobile ? 'mobile' : 'email'
    };
  } catch (error) {
    throw new Error("Failed to check supplier existence");
  }
}

export async function createSupplierAPI(supplierData) {
  const res = await fetch("/api/medical/suppliers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(supplierData)
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to create supplier");
  }

  const data = await res.json();
  return data.supplier;
}

export function extractUpdateSupplierData(message) {
  const text = message.toLowerCase();

  // Initialize with current values (will be filled from existing supplier)
  let updates = {};

  // Extract mobile (10-digit number) - for identifying supplier
  const mobileMatch = text.match(/\b\d{10}\b/);
  if (mobileMatch) {
    updates.mobile = mobileMatch[0];
  }

  // Extract email for identification
  const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
  if (emailMatch) {
    updates.email = emailMatch[0];
  }

  // Extract name updates
  const nameMatch = text.match(/name\s+([^,\n]+)/i);
  if (nameMatch) {
    updates.name = nameMatch[1].trim();
  }

  // Extract company name updates
  const companyMatch = text.match(/company\s+([^,\n]+)/i);
  if (companyMatch) {
    updates.companyName = companyMatch[1].trim();
  }

  // Extract address updates
  const addressMatch = text.match(/address\s+([^,\n]+)/i);
  if (addressMatch) {
    updates.address = addressMatch[1].trim();
  }

  // Extract new mobile (different from identification mobile)
  if (updates.mobile) {
    const mobileUpdateMatch = text.match(/mobile\s+(\d{10})/i);
    if (mobileUpdateMatch && mobileUpdateMatch[1] !== updates.mobile) {
      updates.newMobile = mobileUpdateMatch[1];
    }
  }

  // Extract new email (different from identification email)
  if (updates.email) {
    const emailUpdateMatch = text.match(/email\s+([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,})/i);
    if (emailUpdateMatch && emailUpdateMatch[1] !== updates.email) {
      updates.newEmail = emailUpdateMatch[1];
    }
  }

  return updates;
}

export function extractFindSupplierData(message) {
  const text = message.toLowerCase();

  // Extract mobile last 4 digits
  const mobileLast4 = text.match(/\b\d{4}\b/)?.[0] || null;

  // Extract name - everything after find/search/get supplier until numbers or keywords
  let name = text
    .replace(/find supplier|search supplier|get supplier/g, "")
    .replace(/\d+/g, "") // remove numbers
    .trim();

  name = name
    .split(" ")
    .filter(w => w.length > 1)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  // Extract company name
  let companyName = null;
  const companyMatch = text.match(/company\s+([^,\n]+)/i);
  if (companyMatch) {
    companyName = companyMatch[1].trim();
  }

  return { name, mobileLast4, companyName };
}

export async function findSuppliersAPI(searchCriteria) {
  const res = await fetch("/api/medical/suppliers");
  if (!res.ok) {
    throw new Error("Failed to fetch suppliers");
  }
  const data = await res.json();
  return data.suppliers;
}

export function filterSuppliers(suppliers, criteria) {
  return suppliers.filter(supplier => {
    let matches = true;

    if (criteria.name) {
      matches = matches && supplier.name.toLowerCase().includes(criteria.name.toLowerCase());
    }

    if (criteria.mobileLast4) {
      matches = matches && supplier.mobile.endsWith(criteria.mobileLast4);
    }

    if (criteria.companyName) {
      matches = matches && supplier.companyName.toLowerCase().includes(criteria.companyName.toLowerCase());
    }

    return matches;
  });
}

export function findUniqueSupplier(suppliers, currentCriteria = {}) {
  if (suppliers.length === 0) {
    return { status: 'not_found', message: 'No supplier found with the given criteria.' };
  }

  if (suppliers.length === 1) {
    return { status: 'found', supplier: suppliers[0] };
  }

  // Multiple suppliers, need to disambiguate
  const mobiles = [...new Set(suppliers.map(s => s.mobile.slice(-4)))];
  if (mobiles.length > 1 && !currentCriteria.mobileLast4) {
    return {
      status: 'need_mobile',
      message: `Found ${suppliers.length} suppliers. Please specify the last 4 digits of mobile: ${mobiles.join(', ')}`,
      options: mobiles
    };
  }

  // Same mobile endings, show all
  return {
    status: 'multiple',
    message: `Found ${suppliers.length} suppliers: ${suppliers.map(s => `${s.name} (${s.companyName}) - mobile ****${s.mobile.slice(-4)}`).join(', ')}`,
    suppliers
  };
}

export async function updateSupplierAPI(supplierId, updateData) {
  const res = await fetch(`/api/medical/suppliers/${supplierId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updateData)
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to update supplier");
  }

  const data = await res.json();
  return data.supplier;
}

export async function deleteSupplierAPI(supplierId) {
  const res = await fetch(`/api/medical/suppliers/${supplierId}`, {
    method: "DELETE"
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to delete supplier");
  }

  return true;
}

export async function createPrescriptionAPI(prescriptionData) {
  const res = await fetch("/api/doctor/prescriptions/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(prescriptionData)
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to create prescription");
  }

  const data = await res.json();
  return data.prescription;
}

export async function getActivePrescriptionsByMobile(mobile) {
  try {
    // First find the patient by mobile
    const patients = await findPatientsAPI();
    const patient = patients.find(p => p.mobile === mobile);

    if (!patient) {
      return { found: false, message: "Patient not found with this mobile number." };
    }

    // Fetch active prescriptions for this patient
    const res = await fetch(`/api/medical/prescriptions/fetch?patientId=${patient._id}`);
    if (!res.ok) {
      throw new Error("Failed to fetch prescriptions");
    }

    const data = await res.json();
    const prescriptions = data.prescriptions || [];

    // For each prescription, calculate remaining quantities
    const prescriptionsWithRemaining = await Promise.all(
      prescriptions.map(async (prescription) => {
        // Get all sales for this prescription to calculate dispensed quantities
        const salesRes = await fetch(`/api/medical/sales/prescription/${prescription._id}`);
        const salesData = salesRes.ok ? await salesRes.json() : { sales: [] };
        const sales = salesData.sales || [];

        // Calculate total dispensed for each medicine
        const dispensedQuantities = {};
        sales.forEach(sale => {
          sale.items.forEach(item => {
            const medId = item.medicineId._id || item.medicineId;
            dispensedQuantities[medId] = (dispensedQuantities[medId] || 0) + item.quantity;
          });
        });

        // Add remaining quantities to each medicine
        const medicinesWithRemaining = prescription.medicines.map(med => {
          const medId = med.medicine._id || med.medicine;
          const prescribedQty = med.totalQuantity;
          const dispensedQty = dispensedQuantities[medId] || 0;
          const remainingQty = Math.max(0, prescribedQty - dispensedQty);

          return {
            ...med,
            prescribedQty,
            dispensedQty,
            remainingQty,
            isFullyDispensed: remainingQty === 0,
            isPartiallyDispensed: dispensedQty > 0 && remainingQty > 0
          };
        });

        // Determine prescription status
        const totalMedicines = medicinesWithRemaining.length;
        const fullyDispensed = medicinesWithRemaining.filter(m => m.isFullyDispensed).length;
        const partiallyDispensed = medicinesWithRemaining.filter(m => m.isPartiallyDispensed).length;

        let status = 'ACTIVE';
        if (fullyDispensed === totalMedicines) {
          status = 'FULLY_FULFILLED';
        } else if (partiallyDispensed > 0 || fullyDispensed > 0) {
          status = 'PARTIALLY_FULFILLED';
        }

        return {
          ...prescription,
          medicines: medicinesWithRemaining,
          status,
          totalMedicines,
          fullyDispensed,
          partiallyDispensed
        };
      })
    );

    return {
      found: true,
      patient,
      prescriptions: prescriptionsWithRemaining
    };
  } catch (error) {
    throw new Error("Failed to fetch prescriptions");
  }
}

export async function getExpiryListAPI() {
  const res = await fetch("/api/medical/expiry/list");
  if (!res.ok) {
    throw new Error("Failed to fetch expiry list");
  }
  const data = await res.json();
  return data;
}

export async function getLowStockListAPI() {
  const res = await fetch("/api/medical/inventory/list");
  if (!res.ok) {
    throw new Error("Failed to fetch inventory");
  }
  const data = await res.json();
  return data.inventory;
}

export function formatExpiryList(data) {
  let message = "📅 Medicine Expiry Report\n\n";

  const { expiredItems, nearExpiryItems, summary } = data;

  message += `📊 Summary:\n`;
  message += `• Expired: ${summary.totalExpired}\n`;
  message += `• Expiring within 30 days: ${summary.totalNearExpiry}\n`;
  message += `• Normal: ${summary.totalNormal}\n\n`;

  if (summary.totalExpired > 0) {
    message += `🚨 EXPIRED MEDICINES:\n`;
    Object.entries(expiredItems).forEach(([supplier, data]) => {
      message += `• ${supplier}:\n`;
      data.items.forEach(item => {
        message += `  - ${item.medicineId?.name} (${item.medicineId?.strength}) - Batch: ${item.batchNumber}\n`;
        message += `    Expiry: ${new Date(item.expiryDate).toLocaleDateString()}\n`;
      });
    });
    message += "\n";
  }

  if (summary.totalNearExpiry > 0) {
    message += `⚠️ EXPIRING SOON (within 30 days):\n`;
    Object.entries(nearExpiryItems).forEach(([supplier, data]) => {
      message += `• ${supplier}:\n`;
      data.items.forEach(item => {
        message += `  - ${item.medicineId?.name} (${item.medicineId?.strength}) - Batch: ${item.batchNumber}\n`;
        message += `    Expiry: ${new Date(item.expiryDate).toLocaleDateString()} (${item.daysUntilExpiry} days)\n`;
      });
    });
  }

  if (summary.totalExpired === 0 && summary.totalNearExpiry === 0) {
    message += "✅ No medicines are expired or expiring soon!";
  }

  return message;
}

export function formatLowStockList(inventory) {
  // Use medicine-level low stock checking
  const lowStockMedicines = inventory.filter(item => item.isMedicineLowStock);

  if (lowStockMedicines.length === 0) {
    return "✅ All medicines are adequately stocked!";
  }

  let message = "⚠️ Low Stock Alert Report\\n\\n";
  message += `Found ${lowStockMedicines.length} medicine(s) with low stock:\\n\\n`;

  // Group by medicine and show medicine-level totals
  const groupedByMedicine = lowStockMedicines.reduce((acc, item) => {
    const medicineName = item.medicineId?.name || 'Unknown';
    const brandName = item.medicineId?.brandName || 'Unknown';
    if (!acc[medicineName]) {
      acc[medicineName] = {
        medicineName,
        brandName,
        totalStock: item.medicineTotalStock,
        reorderLevel: item.reorderLevel,
        batches: []
      };
    }
    acc[medicineName].batches.push(item);
    return acc;
  }, {});

  Object.entries(groupedByMedicine).forEach(([medicineName, data]) => {
    message += `💊 ${medicineName}\\n`;
    message += `Brand: ${data.brandName}\\n`;
    message += `Total Stock: ${data.totalStock} (Reorder at: ${data.reorderLevel})\\n`;

    // Show batch details
    data.batches.forEach(item => {
      message += `  - Batch: ${item.batchNumber}\\n`;
      message += `    Available: ${item.availableStock}\\n`;
      message += `    Supplier: ${item.supplierId?.name || 'Unknown'}\\n`;
    });
    message += "\\n";
  });

  message += "Please reorder these medicines soon!";

  return message;
}

export function generateCSV(data, type) {
  let csv = "";
  const headers = [];
  const rows = [];

  if (type === 'expiry') {
    headers.push("Status,Medicine,Strength,Batch,Expiry Date,Days Until Expiry,Supplier,Available Stock");
    Object.entries(data.expiredItems).forEach(([supplier, data]) => {
      data.items.forEach(item => {
        rows.push([
          "EXPIRED",
          item.medicineId?.name || "",
          item.medicineId?.strength || "",
          item.batchNumber,
          new Date(item.expiryDate).toLocaleDateString(),
          item.daysUntilExpiry,
          supplier,
          item.availableStock
        ]);
      });
    });

    Object.entries(data.nearExpiryItems).forEach(([supplier, data]) => {
      data.items.forEach(item => {
        rows.push([
          "NEAR_EXPIRY",
          item.medicineId?.name || "",
          item.medicineId?.strength || "",
          item.batchNumber,
          new Date(item.expiryDate).toLocaleDateString(),
          item.daysUntilExpiry,
          supplier,
          item.availableStock
        ]);
      });
    });
  } else if (type === 'low_stock') {
    headers.push("Medicine,Brand,Total Stock,Reorder Level,Low Stock Batches");
    // Group by medicine for medicine-level low stock
    const medicineGroups = data.filter(item => item.isMedicineLowStock).reduce((acc, item) => {
      const medicineName = item.medicineId?.name || "Unknown";
      if (!acc[medicineName]) {
        acc[medicineName] = {
          medicineName,
          brandName: item.medicineId?.brandName || "",
          totalStock: item.medicineTotalStock,
          reorderLevel: item.reorderLevel,
          batches: []
        };
      }
      acc[medicineName].batches.push(item);
      return acc;
    }, {});

    Object.values(medicineGroups).forEach(medicine => {
      rows.push([
        medicine.medicineName,
        medicine.brandName,
        medicine.totalStock,
        medicine.reorderLevel,
        medicine.batches.length
      ]);
    });
  }

  csv = headers.join(",") + "\n";
  csv += rows.map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");

  return csv;
}

export async function getPatientLastVisitDetailsAPI(patientId) {
  try {
    const res = await fetch(`/api/medical/patients/${patientId}`);
    if (!res.ok) {
      throw new Error("Failed to fetch patient details");
    }
    const data = await res.json();
    return data;
  } catch (error) {
    throw new Error("Failed to fetch patient last visit details");
  }
}

export function formatLastVisitDetails(data) {
  const { patient, history } = data;

  if (history.medicines.length === 0) {
    return `📋 Patient: ${patient.name}\n\nNo medicine dispensing history found for this patient.`;
  }

  // Get the most recent visit
  const lastVisit = history.medicines[0]; // Already sorted by visitDate desc

  let message = `📋 Last Visit Details for ${patient.name}\n\n`;
  message += `🗓️ Date: ${new Date(lastVisit.visitDate).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}\n\n`;

  message += `💊 Medicines Given:\n`;
  lastVisit.medicines.forEach((med, index) => {
    message += `${index + 1}. ${med.medicineId?.name || 'Unknown Medicine'}\n`;
    message += `   • Dose: ${med.dosePerTime}\n`;
    message += `   • Quantity: ${med.actualQuantity} units\n`;
    message += `   • Duration: ${med.durationDays} days\n`;
    message += `   • Timing: ${med.timing?.join(', ') || 'Not specified'}\n`;
    message += `   • Price: ${formatCurrency(med.totalPrice)}\n\n`;
  });

  message += `💰 Total Amount: ${formatCurrency(lastVisit.totalAmount)}\n`;
  message += `🏥 Served by: ${lastVisit.medicalId?.name || 'Medical Staff'}\n`;
  message += `📝 Source: ${lastVisit.source.replace('_', ' ')}\n`;

  if (lastVisit.notes) {
    message += `📝 Notes: ${lastVisit.notes}\n`;
  }

  if (lastVisit.prescriptionId) {
    message += `📄 From Prescription\n`;
  }

  return message;
}

// Queue Management APIs
export async function addPatientToQueueAPI(queueData) {
  const res = await fetch('/api/doctor/queue/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(queueData)
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to add patient to queue');
  }

  const data = await res.json();
  return data;
}

export async function getQueueStatusAPI() {
  const res = await fetch('/api/doctor/queue/list');
  if (!res.ok) {
    throw new Error('Failed to fetch queue status');
  }
  const data = await res.json();
  return data;
}

export async function callNextPatientAPI(queueId) {
  const res = await fetch(`/api/doctor/queue/${queueId}/call`, {
    method: 'PUT'
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to call patient');
  }

  const data = await res.json();
  return data;
}

export async function completeVisitAPI(queueId) {
  const res = await fetch(`/api/doctor/queue/${queueId}/complete`, {
    method: 'PUT'
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to complete visit');
  }

  const data = await res.json();
  return data;
}

export function formatQueueStatus(queueData) {
  const { summary, current, next, queue } = queueData;

  let message = `🏥 Patient Queue Status\n\n`;
  message += `📊 Summary:\n`;
  message += `• Waiting: ${summary.waiting}\n`;
  message += `• Currently Seeing: ${summary.inProgress}\n`;
  message += `• Completed Today: ${summary.completed}\n\n`;

  if (current) {
    message += `🔵 Currently Seeing:\n`;
    message += `• ${current.patient?.name} (${current.patient?.age}y)\n`;
    message += `• Token: ${current.tokenNumber}\n`;
    message += `• Waiting Time: ${Math.floor(current.waitingTime / 60000)} minutes\n\n`;
  }

  if (next) {
    message += `🟡 Next Patient:\n`;
    message += `• ${next.patient?.name} (${next.patient?.age}y)\n`;
    message += `• Token: ${next.tokenNumber}\n`;
    message += `• Waiting Time: ${Math.floor(next.waitingTime / 60000)} minutes\n\n`;
  }

  if (summary.waiting > 0) {
    const waitingPatients = queue.filter(q => q.status === 'WAITING').slice(0, 5);
    message += `⏳ Waiting Patients:\n`;
    waitingPatients.forEach((patient, index) => {
      message += `${index + 1}. ${patient.patient?.name} (${patient.patient?.age}y) - Token: ${patient.tokenNumber}\n`;
    });
    if (summary.waiting > 5) {
      message += `... and ${summary.waiting - 5} more patients\n`;
    }
  }

  if (summary.waiting === 0 && !current) {
    message += `✅ Queue is empty - no patients waiting!\n`;
  }

  return message;
}
