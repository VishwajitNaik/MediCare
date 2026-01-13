"use client";

import { useState, useEffect } from "react";
import {
  isCreatePatientIntent,
  isFindPatientIntent,
  isCheckMedicineIntent,
  isServeMedicineIntent,
  isCreatePrescriptionIntent,
  isServePrescriptionIntent,
  isCreateMedicineIntent,
  isCreateSupplierIntent,
  isUpdateSupplierIntent,
  isDeleteSupplierIntent,
  isFindSupplierIntent,
  isExpiryListIntent,
  isLowStockListIntent,
  isCreateCsvIntent,
  isLastVisitDetailsIntent,
  isSelectPatientIntent,
  isAddMedicineIntent,
  isPaymentIntent,
  isConfirmIntent,
  isAddToQueueIntent,
  isCallNextPatientIntent,
  isCompleteVisitIntent,
  isQueueStatusIntent,
  isPurchaseStockIntent,
  extractPatientData,
  extractFindPatientData,
  extractMedicineData,
  extractPatientMobile,
  extractPatientLastVisitData,
  extractMedicineCommand,
  extractCreateMedicineData,
  extractCreateSupplierData,
  extractUpdateSupplierData,
  extractFindSupplierData,
  extractPurchaseMedicineData,
  extractPaymentMode,
  validatePatient,
  createPatientAPI,
  findPatientsAPI,
  filterPatients,
  findUniquePatient,
  checkMedicineStockAPI,
  findMedicineStock,
  findPatientByMobile,
  isCheckAvailabilityIntent,
  isUpdateAvailabilityIntent,
  extractAvailabilityDays,
  findMedicineByName,
  findAvailableInventory,
  createSaleAPI,
  createPrescriptionAPI,
  createMedicineAPI,
  checkSupplierExists,
  createSupplierAPI,
  findSuppliersAPI,
  filterSuppliers,
  findUniqueSupplier,
  updateSupplierAPI,
  deleteSupplierAPI,
  getExpiryListAPI,
  getLowStockListAPI,
  formatExpiryList,
  formatLowStockList,
  generateCSV,
  formatCurrency,
  generateBillSummary,
  getActivePrescriptionsByMobile,
  searchMedicinesAPI,
  getPatientLastVisitDetailsAPI,
  formatLastVisitDetails,
  addPatientToQueueAPI,
  getQueueStatusAPI,
  callNextPatientAPI,
  completeVisitAPI,
  formatQueueStatus
} from "../../utils/patientNLP";

// Import the Multiple Purchase Panel component
import MultiplePurchasePanel from "../Components/MultiplePurchasePanel";

export default function VoiceAgent() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true); // TTS toggle state
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [pendingSearch, setPendingSearch] = useState(null); // { criteria, patients }
  const [currentCriteria, setCurrentCriteria] = useState({});
  const [userRole, setUserRole] = useState('DOCTOR'); // Default to DOCTOR, will be set from auth
  const [activeCategory, setActiveCategory] = useState('patient'); // Default category
  const [quickActions, setQuickActions] = useState([]); // Frequently used actions
  const [commandMemory, setCommandMemory] = useState({}); // Intent-based command memory
  const [currentState, setCurrentState] = useState(null); // Current state context
  const [stateCommands, setStateCommands] = useState([]); // Commands available in current state

  // Check user authentication and set role
  useEffect(() => {
    const checkUserRole = async () => {
      try {
        // Check if user is authenticated as doctor
        const doctorResponse = await fetch('/api/doctor/profile');
        if (doctorResponse.ok) {
          setUserRole('DOCTOR');
          return;
        }

        // Check if user is authenticated as medical
        const medicalResponse = await fetch('/api/medical/profile');
        if (medicalResponse.ok) {
          setUserRole('MEDICAL');
          return;
        }

        // Check if user is authenticated as patient
        const patientResponse = await fetch('/api/auth/patient/profile');
        if (patientResponse.ok) {
          setUserRole('PATIENT');
          return;
        }

        // If no authentication found, redirect to home
        window.location.href = '/';
      } catch (error) {
        // On error, redirect to home
        window.location.href = '/';
      }
    };

    checkUserRole();
  }, []);

  // Initialize command memory and state commands on mount
  useEffect(() => {
    initializeCommandMemory();
    updateStateCommands();
  }, [userRole, activeCategory]);

  // Initialize command memory from localStorage or defaults
  const initializeCommandMemory = () => {
    const stored = localStorage.getItem(`commandMemory_${userRole}`);
    if (stored) {
      setCommandMemory(JSON.parse(stored));
    } else {
      // Initialize with default command frequencies
      const defaultMemory = {};
      const categories = getCommandCategories();
      categories.forEach(category => {
        category.commands.forEach(command => {
          const intent = getIntentFromCommand(command);
          defaultMemory[intent] = {
            intent,
            command,
            frequency: 1,
            lastUsed: new Date().toISOString(),
            role: userRole,
            category: category.id
          };
        });
      });
      setCommandMemory(defaultMemory);
      localStorage.setItem(`commandMemory_${userRole}`, JSON.stringify(defaultMemory));
    }
  };

  // Get intent from command text
  const getIntentFromCommand = (command) => {
    const commandMap = {
      'Add patient to queue': 'ADD_TO_QUEUE',
      'Call next patient': 'CALL_NEXT_PATIENT',
      'Complete visit': 'COMPLETE_VISIT',
      'Queue status': 'QUEUE_STATUS',
      'Find patient': 'FIND_PATIENT',
      'Create patient': 'CREATE_PATIENT',
      'Create prescription': 'CREATE_PRESCRIPTION',
      'Update prescription': 'UPDATE_PRESCRIPTION',
      'Check prescription': 'CHECK_PRESCRIPTION',
      'Prescription history': 'PRESCRIPTION_HISTORY',
      'Patient reports': 'PATIENT_REPORTS',
      'Queue reports': 'QUEUE_REPORTS',
      'Daily summary': 'DAILY_SUMMARY',
      'Check medicine stock': 'CHECK_MEDICINE_STOCK',
      'Serve medicine': 'SERVE_MEDICINE',
      'Add medicine': 'ADD_MEDICINE',
      'Low stock alert': 'LOW_STOCK_ALERT',
      'Serve prescription': 'SERVE_PRESCRIPTION',
      'Prescription status': 'PRESCRIPTION_STATUS',
      'Expiry list': 'EXPIRY_LIST',
      'Low stock list': 'LOW_STOCK_LIST',
      'Add supplier': 'ADD_SUPPLIER',
      'Generate CSV': 'GENERATE_CSV',
      'Patient history': 'PATIENT_HISTORY'
    };
    return commandMap[command] || command.toUpperCase().replace(/\s+/g, '_');
  };

  // Update command memory when a command is used
  const updateCommandMemory = (intent, command) => {
    const now = new Date().toISOString();
    setCommandMemory(prev => {
      const updated = {
        ...prev,
        [intent]: {
          intent,
          command,
          frequency: (prev[intent]?.frequency || 0) + 1,
          lastUsed: now,
          role: userRole,
          category: activeCategory
        }
      };
      localStorage.setItem(`commandMemory_${userRole}`, JSON.stringify(updated));
      return updated;
    });
  };

  // Get state-based commands (filtered and ranked)
  const updateStateCommands = () => {
    const categories = getCommandCategories();
    const category = categories.find(cat => cat.id === activeCategory);
    if (!category) return;

    // Get commands for current category
    const categoryCommands = category.commands.map(cmd => ({
      command: cmd,
      intent: getIntentFromCommand(cmd),
      frequency: commandMemory[getIntentFromCommand(cmd)]?.frequency || 1,
      lastUsed: commandMemory[getIntentFromCommand(cmd)]?.lastUsed || new Date().toISOString()
    }));

    // Sort by frequency (descending) and then by last used (descending)
    const sortedCommands = categoryCommands.sort((a, b) => {
      if (b.frequency !== a.frequency) {
        return b.frequency - a.frequency;
      }
      return new Date(b.lastUsed) - new Date(a.lastUsed);
    });

    // Take top commands and deduplicate by intent
    const deduplicated = [];
    const seenIntents = new Set();

    sortedCommands.forEach(cmd => {
      if (!seenIntents.has(cmd.intent)) {
        deduplicated.push(cmd);
        seenIntents.add(cmd.intent);
      }
    });

    setStateCommands(deduplicated);
  };

  // Get quick actions (top 4 most used commands across all categories)
  const getQuickActions = () => {
    const allCommands = Object.values(commandMemory)
      .filter(cmd => cmd.role === userRole)
      .sort((a, b) => {
        if (b.frequency !== a.frequency) {
          return b.frequency - a.frequency;
        }
        return new Date(b.lastUsed) - new Date(a.lastUsed);
      });

    return allCommands.slice(0, 4).map(cmd => cmd.command);
  };

  // Detect category keywords in user message
  const detectCategoryKeyword = (text) => {
    const categoryKeywords = {
      'patient': 'patient',
      'patients': 'patient',
      'prescription': 'prescription',
      'prescriptions': 'prescription',
      'medicine': 'medicine',
      'medicines': 'medicine',
      'inventory': 'inventory',
      'stock': 'inventory',
      'queue': 'patient', // Queue commands are under patient category
      'report': 'reports',
      'reports': 'reports',
      'supplier': 'inventory',
      'suppliers': 'inventory'
    };

    // Check if the message is just a category keyword
    const words = text.split(/\s+/);
    if (words.length === 1) {
      const keyword = words[0].toLowerCase();
      if (categoryKeywords[keyword]) {
        return categoryKeywords[keyword];
      }
    }

    return null;
  };

  // Generate category command response with clickable buttons
  const getCategoryCommandsResponse = (categoryId) => {
    const categories = getCommandCategories();
    const category = categories.find(cat => cat.id === categoryId);

    if (!category) {
      return `❌ Category "${categoryId}" not found.`;
    }

    // Get ranked commands for this category
    const categoryCommands = category.commands.map(cmd => ({
      command: cmd,
      intent: getIntentFromCommand(cmd),
      frequency: commandMemory[getIntentFromCommand(cmd)]?.frequency || 1
    }));

    // Sort by frequency
    const sortedCommands = categoryCommands.sort((a, b) => b.frequency - a.frequency);

    // Create a special message object that contains command buttons
    return {
      type: 'commands',
      category: category.name,
      commands: sortedCommands
    };
  };

  // Detect command intent from user message
  const detectCommandIntent = (message) => {
    const text = message.toLowerCase().trim();

    // Check for various intents in order of specificity
    if (isCreatePatientIntent(text)) {
      return { intent: 'CREATE_PATIENT', command: 'Create patient' };
    }
    if (isFindPatientIntent(text)) {
      return { intent: 'FIND_PATIENT', command: 'Find patient' };
    }
    if (isCreatePrescriptionIntent(text)) {
      return { intent: 'CREATE_PRESCRIPTION', command: 'Create prescription' };
    }
    if (isServePrescriptionIntent(text)) {
      return { intent: 'SERVE_PRESCRIPTION', command: 'Serve prescription' };
    }
    if (isServeMedicineIntent(text)) {
      return { intent: 'SERVE_MEDICINE', command: 'Serve medicine' };
    }
    if (isCheckMedicineIntent(text)) {
      return { intent: 'CHECK_MEDICINE_STOCK', command: 'Check medicine stock' };
    }
    if (isAddToQueueIntent(text)) {
      return { intent: 'ADD_TO_QUEUE', command: 'Add patient to queue' };
    }
    if (isCallNextPatientIntent(text)) {
      return { intent: 'CALL_NEXT_PATIENT', command: 'Call next patient' };
    }
    if (isCompleteVisitIntent(text)) {
      return { intent: 'COMPLETE_VISIT', command: 'Complete visit' };
    }
    if (isQueueStatusIntent(text)) {
      return { intent: 'QUEUE_STATUS', command: 'Queue status' };
    }
    if (isExpiryListIntent(text)) {
      return { intent: 'EXPIRY_LIST', command: 'Expiry list' };
    }
    if (isLowStockListIntent(text)) {
      return { intent: 'LOW_STOCK_LIST', command: 'Low stock list' };
    }
    if (isCreateCsvIntent(text)) {
      return { intent: 'GENERATE_CSV', command: 'Generate CSV' };
    }
    if (isCreateMedicineIntent(text)) {
      return { intent: 'ADD_MEDICINE', command: 'Add medicine' };
    }
    if (isCreateSupplierIntent(text)) {
      return { intent: 'ADD_SUPPLIER', command: 'Add supplier' };
    }
    if (isCheckAvailabilityIntent(text)) {
      return { intent: 'CHECK_AVAILABILITY', command: 'Check availability' };
    }
    if (isUpdateAvailabilityIntent(text)) {
      return { intent: 'UPDATE_AVAILABILITY', command: 'Update availability' };
    }
    if (isLastVisitDetailsIntent(text)) {
      return { intent: 'PATIENT_HISTORY', command: 'Patient history' };
    }
    if (text.toLowerCase().includes('manage suppliers')) {
      return { intent: 'MANAGE_SUPPLIERS', command: 'Manage suppliers' };
    }
    if (text.toLowerCase().includes('prescription history')) {
      return { intent: 'PRESCRIPTION_HISTORY', command: 'Prescription history' };
    }
    if (text.toLowerCase().includes('purchase history')) {
      return { intent: 'PURCHASE_HISTORY', command: 'Purchase history' };
    }
    if (text.toLowerCase().includes('purchase medicine stock') || text.toLowerCase().includes('purchase stock')) {
      return { intent: 'PURCHASE_STOCK', command: 'Purchase medicine stock' };
    }
    if (text.toLowerCase().includes('purchase multiple medicines') || text.toLowerCase().includes('bulk purchase')) {
      return { intent: 'MULTIPLE_PURCHASE', command: 'Multiple medicine purchase' };
    }

    return null; // No intent detected
  };

  // Serve medicine state machine
  const [serveMedicineState, setServeMedicineState] = useState(null);
  // {
  //   step: 'SELECT_PATIENT' | 'ADD_MEDICINE' | 'SELECT_PAYMENT' | 'CONFIRM'
  //   patientId: string,
  //   items: [{ medicineId, inventoryId, quantity, medicineName, total, ... }],
  //   paymentMode: string
  // }

  // Create prescription state machine
  const [createPrescriptionState, setCreatePrescriptionState] = useState(null);
  // {
  //   step: 'SELECT_PATIENT' | 'ADD_MEDICINE' | 'CREATE_PRESCRIPTION'
  //   patientId: string,
  //   patientName: string,
  //   medicines: [{ medicineId, medicineName, dosePerTime, timing, durationDays, totalQuantity, ... }]
  //   showMedicinePanel: boolean // For hybrid UI
  // }

  // Medicine entry panel state
  const [medicinePanelData, setMedicinePanelData] = useState(null);
  // {
  //   searchTerm: string,
  //   selectedMedicine: object,
  //   dose: number,
  //   duration: number,
  //   timing: ['MORNING', 'AFTERNOON', 'NIGHT']
  // }

  // Medicine update panel state
  const [medicineUpdateData, setMedicineUpdateData] = useState(null);
  // {
  //   medicineIndex: number,
  //   currentMedicine: object,
  //   dose: number,
  //   duration: number,
  //   timing: ['MORNING', 'AFTERNOON', 'NIGHT']
  // }

  // Medicine management panel state
  const [medicineManagementData, setMedicineManagementData] = useState(null);
  // {
  //   mode: 'list' | 'add' | 'update' | 'check'
  //   selectedMedicine: object (for update mode)
  // }

  // Medicine form panel state (for add/update)
  const [medicineFormData, setMedicineFormData] = useState(null);
  // {
  //   mode: 'add' | 'update',
  //   medicine: object (for update mode),
  //   formData: {
  //     name: string,
  //     brandName: string,
  //     dosageForm: string,
  //     strength: string,
  //     unit: string,
  //     category: string,
  //     prescriptionRequired: boolean,
  //     isActive: boolean
  //   }
  // }

  // Medicine add form panel state (simple form with required fields)
  const [medicineAddFormData, setMedicineAddFormData] = useState(null);
  // {
  //   formData: {
  //     name: string,
  //     brandName: string,
  //     dosageForm: string,
  //     strength: string,
  //     unit: string,
  //     category: string,
  //     prescriptionRequired: boolean,
  //     isActive: boolean
  //   }
  // }

  // Supplier management panel states
  const [supplierManagementData, setSupplierManagementData] = useState(null);
  // {
  //   mode: 'list' | 'add' | 'search' | 'update' | 'delete'
  //   selectedSupplier: object (for update/delete mode)
  // }

  // Supplier add form panel state
  const [supplierAddFormData, setSupplierAddFormData] = useState(null);
  // {
  //   formData: {
  //     name: string,
  //     companyName: string,
  //     mobile: string,
  //     email: string,
  //     address: string
  //   }
  // }

  // Supplier search panel state
  const [supplierSearchData, setSupplierSearchData] = useState(null);
  // {
  //   searchTerm: string,
  //   suppliers: array,
  //   isLoading: boolean,
  //   currentPage: number,
  //   totalPages: number
  // }

  // Supplier update form panel state
  const [supplierUpdateFormData, setSupplierUpdateFormData] = useState(null);
  // {
  //   selectedSupplier: object,
  //   formData: {
  //     name: string,
  //     companyName: string,
  //     mobile: string,
  //     email: string,
  //     address: string
  //   }
  // }

  // Supplier delete confirmation panel state
  const [supplierDeleteData, setSupplierDeleteData] = useState(null);
  // {
  //   selectedSupplier: object
  // }

  // Medicine search panel state
  const [medicineSearchData, setMedicineSearchData] = useState(null);
  // {
  //   searchTerm: string,
  //   filterBy: 'name' | 'brand' | 'category' | 'all',
  //   medicines: array,
  //   isLoading: boolean,
  //   currentPage: number,
  //   totalPages: number
  // }

  // Medicine update panel state
  const [medicineUpdateFormData, setMedicineUpdateFormData] = useState(null);
  // {
  //   selectedMedicine: object,
  //   formData: {
  //     name: string,
  //     brandName: string,
  //     dosageForm: string,
  //     strength: string,
  //     unit: string,
  //     category: string,
  //     prescriptionRequired: boolean,
  //     isActive: boolean
  //   }
  // }

  // Medicine stock/inventory panel state
  const [medicineStockData, setMedicineStockData] = useState(null);
  // {
  //   selectedMedicine: object,
  //   inventory: array,
  //   stockHistory: array,
  //   isLoading: boolean
  // }

  // Medicine inventory overview panel state (shows all medicines with stock)
  const [inventoryOverviewData, setInventoryOverviewData] = useState(null);
  // {
  //   medicines: array,
  //   isLoading: boolean,
  //   currentPage: number,
  //   totalPages: number
  // }

  // Purchase form panel state
  const [purchaseFormData, setPurchaseFormData] = useState(null);
  // {
  //   selectedMedicine: object,
  //   supplierId: string,
  //   formData: {
  //     medicineId: string,
  //     batchNumber: string,
  //     expiryDate: string,
  //     quantity: number,
  //     purchasePrice: number
  //   }
  // }

  // Multiple purchase form panel state
  const [multiplePurchasePanelData, setMultiplePurchasePanelData] = useState(null);
  // {
  //   show: boolean
  // }

  // PurchaseFormPanel Component
  const PurchaseFormPanel = ({ onSave, onClose }) => {
    const [suppliers, setSuppliers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
      supplierId: '',
      medicineId: purchaseFormData?.selectedMedicine?._id || '',
      batchNumber: purchaseFormData?.suggestedBatchNumber || '',
      expiryDate: purchaseFormData?.suggestedExpiryDate || '',
      quantity: purchaseFormData?.suggestedQuantity || '',
      purchasePrice: purchaseFormData?.suggestedPrice || ''
    });

    useEffect(() => {
      loadSuppliers();
    }, []);

    const loadSuppliers = async () => {
      try {
        const response = await fetch('/api/medical/suppliers');
        if (response.ok) {
          const data = await response.json();
          setSuppliers(data.suppliers || []);
        }
      } catch (error) {
        console.error('Error loading suppliers:', error);
      }
    };

    const handleSubmit = async () => {
      // Validation
      if (!formData.supplierId || !formData.batchNumber.trim() || !formData.expiryDate || !formData.quantity || !formData.purchasePrice) {
        alert('Please fill in all required fields');
        return;
      }

      setIsLoading(true);
      try {
        const purchaseData = {
          supplierId: formData.supplierId,
          invoiceNumber: `AUTO-${Date.now()}`, // Auto-generate invoice number
          items: [{
            medicineId: formData.medicineId,
            batchNumber: formData.batchNumber.trim(),
            expiryDate: formData.expiryDate,
            quantity: parseInt(formData.quantity),
            purchasePrice: parseFloat(formData.purchasePrice)
          }]
        };

        const response = await fetch('/api/medical/purchases/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(purchaseData)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create purchase');
        }

        const result = await response.json();
        addToChat(`✅ Purchase created successfully!\nInvoice: ${result.purchase.invoiceNumber}\nTotal: ₹${result.purchase.totalPurchaseAmount}\nItems: ${result.purchase.itemsCount}`, false);
        onSave(result.purchase);
      } catch (error) {
        console.error('Purchase creation error:', error);
        alert(`Error creating purchase: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    const handleGenerateBatchNumber = () => {
      const date = new Date();
      const year = date.getFullYear().toString().slice(-2);
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const batchNum = `BATCH-${year}${month}${day}-${random}`;
      setFormData({ ...formData, batchNumber: batchNum });
    };

    const handleGenerateExpiryDate = () => {
      const date = new Date();
      date.setFullYear(date.getFullYear() + 2); // Default 2 years expiry
      const expiryDate = date.toISOString().split('T')[0];
      setFormData({ ...formData, expiryDate });
    };

    if (!purchaseFormData?.selectedMedicine) return null;

    const medicine = purchaseFormData.selectedMedicine;

    return (
      <div style={{
        border: "2px solid #28a745",
        borderRadius: "10px",
        padding: "20px",
        marginBottom: "20px",
        backgroundColor: "#f8fff8",
        maxWidth: "600px"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <h3 style={{ margin: 0, color: "#155724" }}>
            🛒 Purchase Medicine: {medicine.name}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "20px",
              cursor: "pointer",
              color: "#666"
            }}
          >
            ×
          </button>
        </div>

        {/* Medicine Info */}
        <div style={{ marginBottom: "15px", padding: "10px", backgroundColor: "#e8f5e8", borderRadius: "4px" }}>
          <strong>Medicine Details:</strong><br/>
          {medicine.name} ({medicine.brandName}) - {medicine.strength} {medicine.dosageForm}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "15px" }}>
          {/* Supplier Selection */}
          <div>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
              Supplier: <span style={{ color: "red" }}>*</span>
            </label>
            <select
              value={formData.supplierId}
              onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                fontSize: "14px"
              }}
            >
              <option value="">Select Supplier</option>
              {suppliers.map(supplier => (
                <option key={supplier._id} value={supplier._id}>
                  {supplier.name} - {supplier.companyName}
                </option>
              ))}
            </select>
          </div>

          {/* Batch Number */}
          <div>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
              Batch Number: <span style={{ color: "red" }}>*</span>
            </label>
            <div style={{ display: "flex", gap: "5px" }}>
              <input
                type="text"
                value={formData.batchNumber}
                onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                placeholder="e.g. BATCH001"
                style={{
                  flex: 1,
                  padding: "8px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontSize: "14px"
                }}
              />
              <button
                type="button"
                onClick={handleGenerateBatchNumber}
                style={{
                  padding: "8px 12px",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "12px"
                }}
                title="Generate batch number"
              >
                🔄
              </button>
            </div>
          </div>

          {/* Expiry Date */}
          <div>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
              Expiry Date: <span style={{ color: "red" }}>*</span>
            </label>
            <div style={{ display: "flex", gap: "5px" }}>
              <input
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                style={{
                  flex: 1,
                  padding: "8px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontSize: "14px"
                }}
              />
              <button
                type="button"
                onClick={handleGenerateExpiryDate}
                style={{
                  padding: "8px 12px",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "12px"
                }}
                title="Set 2 years expiry"
              >
                📅
              </button>
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
              Quantity: <span style={{ color: "red" }}>*</span>
            </label>
            <input
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              placeholder="Enter quantity"
              min="1"
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                fontSize: "14px"
              }}
            />
          </div>

          {/* Purchase Price */}
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
              Purchase Price per Unit: <span style={{ color: "red" }}>*</span>
            </label>
            <input
              type="number"
              value={formData.purchasePrice}
              onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
              placeholder="Enter price per unit"
              min="0"
              step="0.01"
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                fontSize: "14px"
              }}
            />
          </div>
        </div>

        {/* Total Calculation */}
        {formData.quantity && formData.purchasePrice && (
          <div style={{ marginTop: "15px", padding: "10px", backgroundColor: "#e8f5e8", borderRadius: "4px" }}>
            <strong>Total Amount: ₹{(parseFloat(formData.quantity) * parseFloat(formData.purchasePrice)).toFixed(2)}</strong>
          </div>
        )}

        {/* Submit Button */}
        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <button
            onClick={handleSubmit}
            disabled={isLoading || !formData.supplierId || !formData.batchNumber.trim() || !formData.expiryDate || !formData.quantity || !formData.purchasePrice}
            style={{
              padding: "12px 24px",
              backgroundColor: (formData.supplierId && formData.batchNumber.trim() && formData.expiryDate && formData.quantity && formData.purchasePrice && !isLoading) ? "#28a745" : "#ccc",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: (formData.supplierId && formData.batchNumber.trim() && formData.expiryDate && formData.quantity && formData.purchasePrice && !isLoading) ? "pointer" : "not-allowed",
              fontSize: "16px",
              fontWeight: "bold"
            }}
          >
            {isLoading ? "⏳ Creating Purchase..." : "💾 Create Purchase"}
          </button>
        </div>

        {/* Form Tips */}
        <div style={{ marginTop: "15px", padding: "10px", backgroundColor: "#e8f5e8", borderRadius: "4px", fontSize: "12px" }}>
          <strong>💡 Required Fields:</strong> Supplier, Batch Number, Expiry Date, Quantity, Purchase Price<br/>
          <strong>💡 Note:</strong> This will create a purchase record and automatically update inventory stock.<br/>
          <strong>💡 Tips:</strong> Use 🔄 to generate batch numbers and 📅 to set default expiry dates.
        </div>
      </div>
    );
  };

  // Medicine search panel state
  const [medicineSearchPanel, setMedicineSearchPanel] = useState(null);

  // Inventory Overview Panel Component
  const InventoryOverviewPanel = ({ onClose }) => {
    const [medicines, setMedicines] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const medicinesPerPage = 6;

    useEffect(() => {
      loadInventoryOverview();
    }, [currentPage]);

    const loadInventoryOverview = async () => {
      setIsLoading(true);
      try {
        // Get all inventory items with medicine details
        const response = await fetch('/api/medical/inventory/list');
        if (!response.ok) throw new Error('Failed to load inventory');
        const data = await response.json();

        // Group by medicine and calculate totals
        const medicineMap = new Map();

        data.inventory.forEach(item => {
          const medicineId = item.medicineId._id.toString();
          if (!medicineMap.has(medicineId)) {
            medicineMap.set(medicineId, {
              _id: medicineId,
              name: item.medicineId.name,
              brandName: item.medicineId.brandName,
              dosageForm: item.medicineId.dosageForm,
              strength: item.medicineId.strength,
              category: item.medicineId.category,
              totalStock: 0,
              batches: 0,
              lowStock: false,
              expiryAlerts: 0,
              latestExpiry: null
            });
          }

          const medicine = medicineMap.get(medicineId);
          medicine.totalStock += item.availableStock;
          medicine.batches += 1;

          // Check expiry (within 30 days)
          const daysLeft = Math.ceil((new Date(item.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
          if (daysLeft <= 30 && daysLeft > 0) {
            medicine.expiryAlerts += 1;
            if (!medicine.latestExpiry || daysLeft < medicine.latestExpiry) {
              medicine.latestExpiry = daysLeft;
            }
          }

          // Check low stock (less than reorder level)
          if (item.availableStock <= item.reorderLevel) {
            medicine.lowStock = true;
          }
        });

        const medicineList = Array.from(medicineMap.values());
        setMedicines(medicineList);

        // Calculate pagination
        const totalPages = Math.ceil(medicineList.length / medicinesPerPage);
        setTotalPages(totalPages);

        // Show current page items
        const startIndex = (currentPage - 1) * medicinesPerPage;
        const endIndex = startIndex + medicinesPerPage;

      } catch (error) {
        console.error('Inventory overview error:', error);
        addToChat('❌ Error loading inventory overview', false);
      } finally {
        setIsLoading(false);
      }
    };

    // Calculate summary stats
    const totalMedicines = medicines.length;
    const lowStockCount = medicines.filter(m => m.lowStock).length;
    const expiryAlertsCount = medicines.reduce((sum, m) => sum + m.expiryAlerts, 0);
    const totalStockValue = medicines.reduce((sum, m) => sum + m.totalStock, 0);

    // Get current page medicines
    const startIndex = (currentPage - 1) * medicinesPerPage;
    const endIndex = startIndex + medicinesPerPage;
    const currentMedicines = medicines.slice(startIndex, endIndex);

    return (
      <div style={{
        border: "2px solid #17a2b8",
        borderRadius: "10px",
        padding: "20px",
        marginBottom: "20px",
        backgroundColor: "#f0f8ff",
        maxWidth: "1200px"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <h3 style={{ margin: 0, color: "#17a2b8" }}>
            📦 Inventory Overview
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "20px",
              cursor: "pointer",
              color: "#666"
            }}
          >
            ×
          </button>
        </div>

        {isLoading ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <div style={{ fontSize: "18px", marginBottom: "10px" }}>🔄 Loading inventory overview...</div>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div style={{ marginBottom: "20px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px" }}>
              <div style={{
                padding: "15px",
                backgroundColor: "white",
                borderRadius: "8px",
                border: "1px solid #dee2e6",
                textAlign: "center"
              }}>
                <div style={{ fontSize: "24px", fontWeight: "bold", color: "#007bff" }}>
                  {totalMedicines}
                </div>
                <div style={{ fontSize: "12px", color: "#666" }}>Total Medicines</div>
              </div>
              <div style={{
                padding: "15px",
                backgroundColor: "white",
                borderRadius: "8px",
                border: "1px solid #dee2e6",
                textAlign: "center"
              }}>
                <div style={{ fontSize: "24px", fontWeight: "bold", color: "#ffc107" }}>
                  {totalStockValue}
                </div>
                <div style={{ fontSize: "12px", color: "#666" }}>Total Stock Units</div>
              </div>
              <div style={{
                padding: "15px",
                backgroundColor: "white",
                borderRadius: "8px",
                border: "1px solid #dee2e6",
                textAlign: "center"
              }}>
                <div style={{ fontSize: "24px", fontWeight: "bold", color: lowStockCount > 0 ? "#dc3545" : "#28a745" }}>
                  {lowStockCount}
                </div>
                <div style={{ fontSize: "12px", color: "#666" }}>Low Stock Items</div>
              </div>
              <div style={{
                padding: "15px",
                backgroundColor: "white",
                borderRadius: "8px",
                border: "1px solid #dee2e6",
                textAlign: "center"
              }}>
                <div style={{ fontSize: "24px", fontWeight: "bold", color: expiryAlertsCount > 0 ? "#fd7e14" : "#28a745" }}>
                  {expiryAlertsCount}
                </div>
                <div style={{ fontSize: "12px", color: "#666" }}>Expiry Alerts</div>
              </div>
            </div>

            {/* Medicine List */}
            <div style={{ marginBottom: "15px" }}>
              <h4 style={{ margin: "0 0 15px 0", color: "#17a2b8" }}>
                💊 Medicine Stock Levels
              </h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "15px" }}>
                {currentMedicines.map((medicine) => (
                  <div key={medicine._id} style={{
                    padding: "15px",
                    backgroundColor: "white",
                    borderRadius: "8px",
                    border: "1px solid #dee2e6",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                      <div style={{ fontSize: "16px", fontWeight: "bold", color: "#007bff" }}>
                        💊 {medicine.name}
                      </div>
                      <div style={{ display: "flex", gap: "5px" }}>
                        {medicine.lowStock && (
                          <span style={{
                            fontSize: "10px",
                            backgroundColor: "#dc3545",
                            color: "white",
                            padding: "2px 6px",
                            borderRadius: "10px"
                          }}>
                            LOW STOCK
                          </span>
                        )}
                        {medicine.expiryAlerts > 0 && (
                          <span style={{
                            fontSize: "10px",
                            backgroundColor: "#fd7e14",
                            color: "white",
                            padding: "2px 6px",
                            borderRadius: "10px"
                          }}>
                            EXPIRY
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ fontSize: "14px", color: "#666", marginBottom: "12px", lineHeight: "1.4" }}>
                      <div><strong>Brand:</strong> {medicine.brandName}</div>
                      <div><strong>Form:</strong> {medicine.dosageForm} | <strong>Strength:</strong> {medicine.strength}</div>
                      <div><strong>Category:</strong> {medicine.category}</div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "15px" }}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{
                          fontSize: "18px",
                          fontWeight: "bold",
                          color: medicine.totalStock > 0 ? "#28a745" : "#dc3545"
                        }}>
                          {medicine.totalStock}
                        </div>
                        <div style={{ fontSize: "10px", color: "#666" }}>Total Stock</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "18px", fontWeight: "bold", color: "#007bff" }}>
                          {medicine.batches}
                        </div>
                        <div style={{ fontSize: "10px", color: "#666" }}>Batches</div>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => {
                          setMedicineStockData({ selectedMedicine: medicine });
                          onClose();
                        }}
                        style={{
                          flex: 1,
                          padding: "8px 12px",
                          backgroundColor: "#17a2b8",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "12px",
                          fontWeight: "bold"
                        }}
                      >
                        📦 Check Stock
                      </button>
                      <button
                        onClick={() => {
                          setMedicineUpdateFormData({ selectedMedicine: medicine });
                          onClose();
                        }}
                        style={{
                          flex: 1,
                          padding: "8px 12px",
                          backgroundColor: "#ffc107",
                          color: "#212529",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "12px",
                          fontWeight: "bold"
                        }}
                      >
                        ✏️ Update
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ textAlign: "center", marginTop: "20px" }}>
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: currentPage === 1 ? "#ccc" : "#007bff",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: currentPage === 1 ? "not-allowed" : "pointer",
                    marginRight: "10px"
                  }}
                >
                  Previous
                </button>
                <span style={{ margin: "0 10px" }}>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: currentPage === totalPages ? "#ccc" : "#007bff",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                    marginLeft: "10px"
                  }}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  // Medicine search panel component
  const MedicineSearchPanel = ({ onSelectMedicine, onClose }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterBy, setFilterBy] = useState('all'); // 'all', 'name', 'brand', 'category'
    const [medicines, setMedicines] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const medicinesPerPage = 10;

    const handleSearch = async () => {
      if (!searchTerm.trim()) return;

      setIsLoading(true);
      try {
        // Build search URL with filters
        let searchUrl = `/api/common/medicines?search=${encodeURIComponent(searchTerm)}`;
        if (filterBy !== 'all') {
          searchUrl += `&filterBy=${filterBy}`;
        }

        const response = await fetch(searchUrl);
        if (!response.ok) throw new Error('Failed to search medicines');
        const data = await response.json();

        setMedicines(data.medicines.slice(0, medicinesPerPage));
        setTotalPages(Math.ceil(data.medicines.length / medicinesPerPage));
        setCurrentPage(1);
      } catch (error) {
        console.error('Medicine search error:', error);
        addToChat(`❌ Error searching medicines: ${error.message}`, false);
      } finally {
        setIsLoading(false);
      }
    };

    const handleSelectMedicine = (medicine) => {
      onSelectMedicine(medicine);
      onClose();
    };

    return (
      <div style={{
        border: "2px solid #007bff",
        borderRadius: "10px",
        padding: "20px",
        marginBottom: "20px",
        backgroundColor: "#f8f9ff",
        maxWidth: "800px"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <h3 style={{ margin: 0, color: "#007bff" }}>🔍 Search Medicines</h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "20px",
              cursor: "pointer",
              color: "#666"
            }}
          >
            ×
          </button>
        </div>

        {/* Search Filters */}
        <div style={{ marginBottom: "15px" }}>
          <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Enter medicine name, brand, or category..."
              style={{
                flex: 1,
                padding: "10px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                fontSize: "14px"
              }}
            />
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
              style={{
                padding: "10px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                fontSize: "14px",
                minWidth: "120px"
              }}
            >
              <option value="all">All Fields</option>
              <option value="name">Name Only</option>
              <option value="brand">Brand Only</option>
              <option value="category">Category Only</option>
            </select>
            <button
              onClick={handleSearch}
              disabled={isLoading || !searchTerm.trim()}
              style={{
                padding: "10px 20px",
                backgroundColor: (searchTerm.trim() && !isLoading) ? "#007bff" : "#ccc",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: (searchTerm.trim() && !isLoading) ? "pointer" : "not-allowed",
                fontSize: "14px",
                fontWeight: "bold"
              }}
            >
              {isLoading ? "🔄 Searching..." : "🔍 Search"}
            </button>
          </div>
        </div>

        {/* Search Tips */}
        <div style={{ marginBottom: "15px", padding: "8px", backgroundColor: "#e7f3ff", borderRadius: "4px", fontSize: "12px" }}>
          <strong>💡 Search Tips:</strong><br/>
          • Search by medicine name (e.g. "paracetamol")<br/>
          • Search by brand name (e.g. "cipla")<br/>
          • Search by category (e.g. "antibiotic")<br/>
          • Use filters to narrow down results
        </div>

        {/* Medicine Results */}
        {medicines.length > 0 && (
          <div style={{ marginTop: "20px" }}>
            <div style={{ fontWeight: "bold", marginBottom: "15px", color: "#007bff" }}>
              📋 Found {medicines.length} medicine(s):
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "15px" }}>
              {medicines.map((medicine) => (
                <div key={medicine._id} style={{
                  padding: "15px",
                  backgroundColor: "white",
                  borderRadius: "8px",
                  border: "1px solid #dee2e6",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                }}>
                  <div style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "10px", color: "#007bff" }}>
                    💊 {medicine.name}
                  </div>
                  <div style={{ fontSize: "14px", color: "#666", marginBottom: "12px", lineHeight: "1.4" }}>
                    <div><strong>Brand:</strong> {medicine.brandName}</div>
                    <div><strong>Form:</strong> {medicine.dosageForm} | <strong>Strength:</strong> {medicine.strength}</div>
                    <div><strong>Category:</strong> {medicine.category}</div>
                    <div><strong>Prescription:</strong> {medicine.prescriptionRequired ? 'Required' : 'Not Required'}</div>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => handleSelectMedicine(medicine)}
                      style={{
                        flex: 1,
                        padding: "8px 12px",
                        backgroundColor: "#28a745",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: "bold"
                      }}
                    >
                      ✅ Select
                    </button>
                    <button
                      onClick={() => {
                        setMedicineStockData({ selectedMedicine: medicine });
                        onClose();
                      }}
                      style={{
                        flex: 1,
                        padding: "8px 12px",
                        backgroundColor: "#17a2b8",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: "bold"
                      }}
                    >
                      📦 Check Stock
                    </button>
                    <button
                      onClick={() => {
                        setMedicineUpdateFormData({ selectedMedicine: medicine });
                        onClose();
                      }}
                      style={{
                        flex: 1,
                        padding: "8px 12px",
                        backgroundColor: "#ffc107",
                        color: "#212529",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: "bold"
                      }}
                    >
                      ✏️ Update
                    </button>
                    <button
                      onClick={() => {
                        setPurchaseFormData({ selectedMedicine: medicine });
                        onClose();
                      }}
                      style={{
                        flex: 1,
                        padding: "8px 12px",
                        backgroundColor: "#28a745",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: "bold"
                      }}
                    >
                      🛒 Add Purchase
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pagination */}
        {medicines.length > 0 && totalPages > 1 && (
          <div style={{ marginTop: "20px", textAlign: "center" }}>
            <button
              disabled={currentPage === 1}
              style={{
                padding: "8px 16px",
                backgroundColor: currentPage === 1 ? "#ccc" : "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: currentPage === 1 ? "not-allowed" : "pointer",
                marginRight: "10px"
              }}
            >
              Previous
            </button>
            <span style={{ margin: "0 10px" }}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              style={{
                padding: "8px 16px",
                backgroundColor: currentPage === totalPages ? "#ccc" : "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                marginLeft: "10px"
              }}
            >
              Next
            </button>
          </div>
        )}
      </div>
    );
  };

  // Medicine Update Form Panel Component
  const MedicineUpdateFormPanel = ({ onSave, onClose }) => {
    const [formData, setFormData] = useState({
      name: medicineUpdateFormData?.selectedMedicine?.name || '',
      brandName: medicineUpdateFormData?.selectedMedicine?.brandName || '',
      dosageForm: medicineUpdateFormData?.selectedMedicine?.dosageForm || 'TABLET',
      strength: medicineUpdateFormData?.selectedMedicine?.strength || '',
      unit: medicineUpdateFormData?.selectedMedicine?.unit || 'TABLET',
      category: medicineUpdateFormData?.selectedMedicine?.category || 'GENERAL',
      prescriptionRequired: medicineUpdateFormData?.selectedMedicine?.prescriptionRequired ?? true,
      isActive: medicineUpdateFormData?.selectedMedicine?.isActive ?? true
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
      // Validation
      if (!formData.name.trim() || !formData.brandName.trim() || !formData.strength.trim()) {
        alert('Please fill in all required fields: Name, Brand Name, and Strength');
        return;
      }

      setIsSubmitting(true);
      try {
        const response = await fetch(`/api/medical/medicines/${medicineUpdateFormData.selectedMedicine._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        if (!response.ok) {
          throw new Error('Failed to update medicine');
        }

        const result = await response.json();
        onSave(result.medicine);
      } catch (error) {
        console.error('Medicine update error:', error);
        alert(`Error updating medicine: ${error.message}`);
      } finally {
        setIsSubmitting(false);
      }
    };

    if (!medicineUpdateFormData?.selectedMedicine) return null;

    return (
      <div style={{
        border: "2px solid #ffc107",
        borderRadius: "10px",
        padding: "20px",
        marginBottom: "20px",
        backgroundColor: "#fffbf0"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <h3 style={{ margin: 0, color: "#856404" }}>
            ✏️ Update Medicine: {medicineUpdateFormData.selectedMedicine.name}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "20px",
              cursor: "pointer",
              color: "#666"
            }}
          >
            ×
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "15px" }}>
          {/* Required Fields */}
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                Medicine Name: <span style={{ color: "red" }}>*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter medicine name"
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontSize: "14px"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                Brand Name: <span style={{ color: "red" }}>*</span>
              </label>
              <input
                type="text"
                value={formData.brandName}
                onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                placeholder="Enter brand name"
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontSize: "14px"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                Dosage Form: <span style={{ color: "red" }}>*</span>
              </label>
              <select
                value={formData.dosageForm}
                onChange={(e) => setFormData({ ...formData, dosageForm: e.target.value })}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontSize: "14px"
                }}
              >
                <option value="TABLET">Tablet</option>
                <option value="SYRUP">Syrup</option>
                <option value="CAPSULE">Capsule</option>
                <option value="INJECTION">Injection</option>
                <option value="DROPS">Drops</option>
                <option value="CREAM">Cream</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                Strength: <span style={{ color: "red" }}>*</span>
              </label>
              <input
                type="text"
                value={formData.strength}
                onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
                placeholder="e.g. 500mg, 5ml, 250mg"
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontSize: "14px"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                Unit: <span style={{ color: "red" }}>*</span>
              </label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontSize: "14px"
                }}
              >
                <option value="TABLET">Tablet</option>
                <option value="ML">ML</option>
                <option value="CAPSULE">Capsule</option>
              </select>
            </div>
          </div>

          {/* Optional Settings */}
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                Category: (Optional)
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontSize: "14px"
                }}
              >
                <option value="GENERAL">General</option>
                <option value="ANTIBIOTIC">Antibiotic</option>
                <option value="PAINKILLER">Painkiller</option>
                <option value="ANTACID">Antacid</option>
                <option value="ANTIHISTAMINE">Antihistamine</option>
                <option value="VITAMIN">Vitamin</option>
                <option value="SUPPLEMENT">Supplement</option>
              </select>
            </div>

            <div style={{ marginTop: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>
                Settings:
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={formData.prescriptionRequired}
                    onChange={(e) => setFormData({ ...formData, prescriptionRequired: e.target.checked })}
                    style={{ marginRight: "8px" }}
                  />
                  Prescription Required
                </label>
                <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    style={{ marginRight: "8px" }}
                  />
                  Active Medicine
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.name.trim() || !formData.brandName.trim() || !formData.strength.trim()}
            style={{
              padding: "12px 24px",
              backgroundColor: (formData.name.trim() && formData.brandName.trim() && formData.strength.trim() && !isSubmitting) ? "#ffc107" : "#ccc",
              color: (formData.name.trim() && formData.brandName.trim() && formData.strength.trim() && !isSubmitting) ? "#212529" : "white",
              border: "none",
              borderRadius: "6px",
              cursor: (formData.name.trim() && formData.brandName.trim() && formData.strength.trim() && !isSubmitting) ? "pointer" : "not-allowed",
              fontSize: "16px",
              fontWeight: "bold"
            }}
          >
            {isSubmitting ? "⏳ Updating..." : "🔄 Update Medicine"}
          </button>
        </div>

        {/* Form Tips */}
        <div style={{ marginTop: "15px", padding: "10px", backgroundColor: "#fff3cd", borderRadius: "4px", fontSize: "12px" }}>
          <strong>💡 Update Tips:</strong> Modify any fields you want to change. All changes will be saved to the medicine record.
        </div>
      </div>
    );
  };

  // Medicine Stock Panel Component
  const MedicineStockPanel = ({ onClose }) => {
    const [inventory, setInventory] = useState([]);
    const [stockHistory, setStockHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      if (medicineStockData?.selectedMedicine) {
        loadStockData();
      }
    }, [medicineStockData]);

    const loadStockData = async () => {
      setIsLoading(true);
      try {
        // Load inventory data
        const inventoryResponse = await fetch(`/api/medical/inventory?medicineId=${medicineStockData.selectedMedicine._id}`);
        const inventoryData = await inventoryResponse.json();
        setInventory(inventoryData.inventory || []);

        // Load stock history (sales/purchases for this medicine)
        const historyResponse = await fetch(`/api/medical/inventory/history?medicineId=${medicineStockData.selectedMedicine._id}`);
        const historyData = await historyResponse.json();
        setStockHistory(historyData.history || []);
      } catch (error) {
        console.error('Error loading stock data:', error);
        addToChat('❌ Error loading stock information', false);
      } finally {
        setIsLoading(false);
      }
    };

    if (!medicineStockData?.selectedMedicine) return null;

    const medicine = medicineStockData.selectedMedicine;
    const totalStock = inventory.reduce((sum, item) => sum + item.quantity, 0);

    return (
      <div style={{
        border: "2px solid #17a2b8",
        borderRadius: "10px",
        padding: "20px",
        marginBottom: "20px",
        backgroundColor: "#f0f8ff",
        maxWidth: "1000px"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <h3 style={{ margin: 0, color: "#17a2b8" }}>
            📦 Stock Information: {medicine.name}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "20px",
              cursor: "pointer",
              color: "#666"
            }}
          >
            ×
          </button>
        </div>

        {isLoading ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <div style={{ fontSize: "18px", marginBottom: "10px" }}>🔄 Loading stock information...</div>
          </div>
        ) : (
          <>
            {/* Current Stock Summary */}
            <div style={{ marginBottom: "20px", padding: "15px", backgroundColor: "white", borderRadius: "8px", border: "1px solid #dee2e6" }}>
              <h4 style={{ margin: "0 0 15px 0", color: "#17a2b8" }}>📊 Current Stock Summary</h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "15px" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "24px", fontWeight: "bold", color: totalStock > 0 ? "#28a745" : "#dc3545" }}>
                    {totalStock}
                  </div>
                  <div style={{ fontSize: "12px", color: "#666" }}>Total Units</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "24px", fontWeight: "bold", color: "#007bff" }}>
                    {inventory.length}
                  </div>
                  <div style={{ fontSize: "12px", color: "#666" }}>Stock Batches</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "24px", fontWeight: "bold", color: "#ffc107" }}>
                    {totalStock > 0 ? '✅' : '❌'}
                  </div>
                  <div style={{ fontSize: "12px", color: "#666" }}>Availability</div>
                </div>
              </div>
            </div>

            {/* Inventory Details */}
            <div style={{ marginBottom: "20px" }}>
              <h4 style={{ margin: "0 0 15px 0", color: "#17a2b8" }}>📦 Inventory Batches</h4>
              {inventory.length > 0 ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "15px" }}>
                  {inventory.map((item, index) => (
                    <div key={item._id || index} style={{
                      padding: "15px",
                      backgroundColor: "white",
                      borderRadius: "8px",
                      border: "1px solid #dee2e6"
                    }}>
                      <div style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "10px", color: "#007bff" }}>
                        Batch #{index + 1}
                      </div>
                      <div style={{ fontSize: "14px", color: "#666", lineHeight: "1.4" }}>
                        <div><strong>Quantity:</strong> {item.quantity} units</div>
                        <div><strong>Purchase Price:</strong> ₹{item.purchasePrice || 0}</div>
                        <div><strong>Selling Price:</strong> ₹{item.sellingPrice || 0}</div>
                        <div><strong>Batch No:</strong> {item.batchNumber || 'N/A'}</div>
                        <div><strong>Expiry:</strong> {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('en-IN') : 'N/A'}</div>
                        <div><strong>Supplier:</strong> {item.supplier?.name || 'N/A'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: "40px", textAlign: "center", backgroundColor: "white", borderRadius: "8px", border: "1px solid #dee2e6" }}>
                  <div style={{ fontSize: "18px", color: "#666", marginBottom: "10px" }}>📭 No inventory found</div>
                  <div style={{ fontSize: "14px", color: "#999" }}>This medicine has no stock batches in the inventory.</div>
                </div>
              )}
            </div>

            {/* Stock History */}
            <div>
              <h4 style={{ margin: "0 0 15px 0", color: "#17a2b8" }}>📈 Stock Movement History</h4>
              {stockHistory.length > 0 ? (
                <div style={{ backgroundColor: "white", borderRadius: "8px", border: "1px solid #dee2e6", overflow: "hidden" }}>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr",
                    gap: "0",
                    backgroundColor: "#f8f9fa",
                    padding: "10px",
                    fontSize: "12px",
                    fontWeight: "bold",
                    borderBottom: "1px solid #dee2e6"
                  }}>
                    <div>Date</div>
                    <div>Type</div>
                    <div>Quantity</div>
                    <div>Price</div>
                    <div>Reference</div>
                  </div>
                  {stockHistory.slice(0, 10).map((entry, index) => (
                    <div key={entry._id || index} style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr",
                      gap: "0",
                      padding: "10px",
                      borderBottom: index < stockHistory.length - 1 ? "1px solid #dee2e6" : "none",
                      fontSize: "12px"
                    }}>
                      <div>{new Date(entry.date).toLocaleDateString()}</div>
                      <div style={{ color: entry.type === 'SALE' ? '#dc3545' : '#28a745' }}>
                        {entry.type === 'SALE' ? '📤 Sale' : '📥 Purchase'}
                      </div>
                      <div>{entry.quantity}</div>
                      <div>{formatCurrency(entry.price || 0)}</div>
                      <div style={{ fontSize: "10px", color: "#666" }}>
                        {entry.reference || 'N/A'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: "40px", textAlign: "center", backgroundColor: "white", borderRadius: "8px", border: "1px solid #dee2e6" }}>
                  <div style={{ fontSize: "18px", color: "#666", marginBottom: "10px" }}>📊 No history available</div>
                  <div style={{ fontSize: "14px", color: "#999" }}>No stock movements recorded for this medicine yet.</div>
                </div>
              )}
            </div>

            {/* Purchase Button - Show when stock is low or zero */}
            {totalStock === 0 || totalStock <= 10 ? (
              <div style={{ marginTop: "20px", padding: "15px", backgroundColor: "#fff3cd", borderRadius: "8px", border: "1px solid #ffeaa7" }}>
                <div style={{ fontSize: "16px", fontWeight: "bold", color: "#856404", marginBottom: "10px" }}>
                  ⚠️ Low Stock Alert: Only {totalStock} units remaining!
                </div>
                <div style={{ fontSize: "14px", color: "#856404", marginBottom: "15px" }}>
                  This medicine is running low. Consider purchasing more stock to avoid stockouts.
                </div>
                <button
                  onClick={() => {
                    setPurchaseFormData({ selectedMedicine: medicine });
                    setMedicineStockData(null); // Close current panel
                  }}
                  style={{
                    padding: "12px 24px",
                    backgroundColor: "#28a745",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "16px",
                    fontWeight: "bold"
                  }}
                >
                  🛒 Purchase More Stock
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>
    );
  };

  // Medicine Management Panel Component
  const MedicineManagementPanel = ({ onAction, onClose }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [medicines, setMedicines] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const medicinesPerPage = 10;

    const handleSearch = async () => {
      if (!searchTerm.trim()) return;

      setIsLoading(true);
      try {
        const response = await fetch(`/api/common/medicines?search=${encodeURIComponent(searchTerm)}`);
        if (!response.ok) throw new Error('Failed to search medicines');
        const data = await response.json();

        setMedicines(data.medicines.slice(0, medicinesPerPage));
        setTotalPages(Math.ceil(data.medicines.length / medicinesPerPage));
        setCurrentPage(1);
      } catch (error) {
        console.error('Medicine search error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <div style={{
        border: "2px solid #007bff",
        borderRadius: "10px",
        padding: "20px",
        marginBottom: "20px",
        backgroundColor: "#f8f9ff"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <h3 style={{ margin: 0, color: "#007bff" }}>💊 Medicine Management</h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "20px",
              cursor: "pointer",
              color: "#666"
            }}
          >
            ×
          </button>
        </div>

        {/* Action Buttons */}
        <div style={{ marginBottom: "20px", padding: "15px", backgroundColor: "#f8f9fa", borderRadius: "8px" }}>
          <div style={{ fontWeight: "bold", marginBottom: "10px", color: "#007bff" }}>⚡ Medicine Actions:</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "10px" }}>
            <button
              onClick={() => onAction('add')}
              style={{
                padding: "10px",
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "bold"
              }}
            >
              ➕ Add Medicine
            </button>
            <button
              onClick={() => onAction('search')}
              style={{
                padding: "10px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "bold"
              }}
            >
              🔍 Search Medicines
            </button>
            <button
              onClick={() => onAction('inventory')}
              style={{
                padding: "10px",
                backgroundColor: "#17a2b8",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "bold"
              }}
            >
              📦 Check Inventory
            </button>
          </div>
        </div>

        {/* Search Section */}
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Search Existing Medicines:</label>
          <div style={{ display: "flex", gap: "10px" }}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Enter medicine name or brand..."
              style={{
                flex: 1,
                padding: "8px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                fontSize: "14px"
              }}
            />
            <button
              onClick={handleSearch}
              disabled={isLoading || !searchTerm.trim()}
              style={{
                padding: "8px 16px",
                backgroundColor: (searchTerm.trim() && !isLoading) ? "#007bff" : "#ccc",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: (searchTerm.trim() && !isLoading) ? "pointer" : "not-allowed",
                fontSize: "14px",
                fontWeight: "bold"
              }}
            >
              {isLoading ? "🔄 Searching..." : "🔍 Search"}
            </button>
          </div>
        </div>

        {/* Medicine Results */}
        {medicines.length > 0 && (
          <div style={{ marginTop: "20px" }}>
            <div style={{ fontWeight: "bold", marginBottom: "10px", color: "#007bff" }}>
              📋 Found {medicines.length} medicine(s):
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "12px" }}>
              {medicines.map((medicine) => (
                <div key={medicine._id} style={{
                  padding: "12px",
                  backgroundColor: "white",
                  borderRadius: "6px",
                  border: "1px solid #dee2e6"
                }}>
                  <div style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "8px", color: "#007bff" }}>
                    💊 {medicine.name}
                  </div>
                  <div style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>
                    <strong>Brand:</strong> {medicine.brandName}<br/>
                    <strong>Form:</strong> {medicine.dosageForm} | <strong>Strength:</strong> {medicine.strength}<br/>
                    <strong>Category:</strong> {medicine.category} | <strong>Prescription:</strong> {medicine.prescriptionRequired ? 'Required' : 'Not Required'}
                  </div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      onClick={() => onAction('update', medicine)}
                      style={{
                        flex: 1,
                        padding: "6px",
                        backgroundColor: "#ffc107",
                        color: "#212529",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: "bold"
                      }}
                    >
                      ✏️ Update
                    </button>
                    <button
                      onClick={() => onAction('check_stock', medicine)}
                      style={{
                        flex: 1,
                        padding: "6px",
                        backgroundColor: "#17a2b8",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: "bold"
                      }}
                    >
                      📦 Stock
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tips */}
        <div style={{ marginTop: "15px", padding: "10px", backgroundColor: "#e7f3ff", borderRadius: "4px", fontSize: "12px" }}>
          <strong>💡 Tips:</strong><br/>
          • Click "Add Medicine" to create a new medicine with all required fields<br/>
          • Search for existing medicines to update or check stock<br/>
          • All medicines require name, brand, dosage form, strength, and unit
        </div>
      </div>
    );
  };

  // Supplier Management Panel Component
  const SupplierManagementPanel = ({ onAction, onClose }) => {
    return (
      <div style={{
        border: "2px solid #6f42c1",
        borderRadius: "10px",
        padding: "20px",
        marginBottom: "20px",
        backgroundColor: "#f8f7ff"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <h3 style={{ margin: 0, color: "#6f42c1" }}>🏢 Supplier Management</h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "20px",
              cursor: "pointer",
              color: "#666"
            }}
          >
            ×
          </button>
        </div>

        {/* Action Buttons */}
        <div style={{ marginBottom: "20px", padding: "15px", backgroundColor: "#f8f9fa", borderRadius: "8px" }}>
          <div style={{ fontWeight: "bold", marginBottom: "10px", color: "#6f42c1" }}>⚡ Supplier Actions:</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px" }}>
            <button
              onClick={() => onAction('add')}
              style={{
                padding: "12px",
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "bold"
              }}
            >
              ➕ Add Supplier
            </button>
            <button
              onClick={() => onAction('search')}
              style={{
                padding: "12px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "bold"
              }}
            >
              🔍 Search Suppliers
            </button>
            <button
              onClick={() => onAction('update')}
              style={{
                padding: "12px",
                backgroundColor: "#ffc107",
                color: "#212529",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "bold"
              }}
            >
              ✏️ Update Supplier
            </button>
            <button
              onClick={() => onAction('delete')}
              style={{
                padding: "12px",
                backgroundColor: "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "bold"
              }}
            >
              🗑️ Delete Supplier
            </button>
          </div>
        </div>

        {/* Tips */}
        <div style={{ marginTop: "15px", padding: "10px", backgroundColor: "#f3e5f5", borderRadius: "4px", fontSize: "12px" }}>
          <strong>💡 Supplier Management Tips:</strong><br/>
          • Add suppliers to track medicine sources and contact information<br/>
          • Search suppliers by name, company, or mobile number<br/>
          • Update supplier details when contact information changes<br/>
          • Delete suppliers only if they are no longer active (use with caution)
        </div>
      </div>
    );
  };

  // Supplier Add Form Panel Component
  const SupplierAddFormPanel = ({ onSave, onClose }) => {
    const [formData, setFormData] = useState({
      name: '',
      companyName: '',
      mobile: '',
      email: '',
      address: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
      // Validation
      if (!formData.name.trim() || !formData.companyName.trim() || !formData.mobile.trim() || !formData.email.trim() || !formData.address.trim()) {
        alert('Please fill in all required fields: Name, Company Name, Mobile, Email, and Address');
        return;
      }

      // Validate mobile (10 digits)
      if (!/^\d{10}$/.test(formData.mobile)) {
        alert('Please enter a valid 10-digit mobile number');
        return;
      }

      // Validate email
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        alert('Please enter a valid email address');
        return;
      }

      setIsSubmitting(true);
      try {
        const createdSupplier = await createSupplierAPI(formData);
        onSave(createdSupplier);
      } catch (error) {
        console.error('Supplier creation error:', error);
        alert(`Error creating supplier: ${error.message}`);
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <div style={{
        border: "2px solid #28a745",
        borderRadius: "10px",
        padding: "20px",
        marginBottom: "20px",
        backgroundColor: "#f8fff8"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <h3 style={{ margin: 0, color: "#155724" }}>
            ➕ Add New Supplier
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "20px",
              cursor: "pointer",
              color: "#666"
            }}
          >
            ×
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "15px" }}>
          {/* Required Fields */}
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                Contact Person Name: <span style={{ color: "red" }}>*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter contact person name"
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontSize: "14px"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                Company Name: <span style={{ color: "red" }}>*</span>
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="Enter company name"
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontSize: "14px"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                Mobile Number: <span style={{ color: "red" }}>*</span>
              </label>
              <input
                type="tel"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                placeholder="Enter 10-digit mobile number"
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontSize: "14px"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                Email Address: <span style={{ color: "red" }}>*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter email address"
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontSize: "14px"
                }}
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
              Address: <span style={{ color: "red" }}>*</span>
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Enter complete address"
              rows="4"
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                fontSize: "14px",
                resize: "vertical"
              }}
            />
          </div>
        </div>

        {/* Submit Button */}
        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.name.trim() || !formData.companyName.trim() || !formData.mobile.trim() || !formData.email.trim() || !formData.address.trim()}
            style={{
              padding: "12px 24px",
              backgroundColor: (formData.name.trim() && formData.companyName.trim() && formData.mobile.trim() && formData.email.trim() && formData.address.trim() && !isSubmitting) ? "#28a745" : "#ccc",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: (formData.name.trim() && formData.companyName.trim() && formData.mobile.trim() && formData.email.trim() && formData.address.trim() && !isSubmitting) ? "pointer" : "not-allowed",
              fontSize: "16px",
              fontWeight: "bold"
            }}
          >
            {isSubmitting ? "⏳ Creating..." : "💾 Create Supplier"}
          </button>
        </div>

        {/* Form Tips */}
        <div style={{ marginTop: "15px", padding: "10px", backgroundColor: "#e8f5e8", borderRadius: "4px", fontSize: "12px" }}>
          <strong>💡 Required Fields:</strong> Name, Company Name, Mobile, Email, Address<br/>
          <strong>💡 Tips:</strong> Mobile must be 10 digits. Email must be valid format. Address should include full details for deliveries.
        </div>
      </div>
    );
  };

  // Supplier Search Panel Component
  const SupplierSearchPanel = ({ onSelectSupplier, onClose }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [suppliers, setSuppliers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const suppliersPerPage = 10;

    const handleSearch = async () => {
      if (!searchTerm.trim()) return;

      setIsLoading(true);
      try {
        const allSuppliers = await findSuppliersAPI();
        const filteredSuppliers = filterSuppliers(allSuppliers, { name: searchTerm, companyName: searchTerm });

        setSuppliers(filteredSuppliers.slice(0, suppliersPerPage));
        setTotalPages(Math.ceil(filteredSuppliers.length / suppliersPerPage));
        setCurrentPage(1);
      } catch (error) {
        console.error('Supplier search error:', error);
        addToChat(`❌ Error searching suppliers: ${error.message}`, false);
      } finally {
        setIsLoading(false);
      }
    };

    const handleKeyPress = (e) => {
      if (e.key === 'Enter') {
        handleSearch();
      }
    };

    return (
      <div style={{
        border: "2px solid #6f42c1",
        borderRadius: "10px",
        padding: "20px",
        marginBottom: "20px",
        backgroundColor: "#f8f7ff"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <h3 style={{ margin: 0, color: "#6f42c1" }}>🔍 Search Suppliers</h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "20px",
              cursor: "pointer",
              color: "#666"
            }}
          >
            ×
          </button>
        </div>

        {/* Search Input */}
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
            Search by Name, Company, or Mobile:
          </label>
          <div style={{ display: "flex", gap: "10px" }}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter supplier name, company name, or mobile..."
              style={{
                flex: 1,
                padding: "10px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                fontSize: "14px"
              }}
            />
            <button
              onClick={handleSearch}
              disabled={isLoading || !searchTerm.trim()}
              style={{
                padding: "10px 20px",
                backgroundColor: (searchTerm.trim() && !isLoading) ? "#6f42c1" : "#ccc",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: (searchTerm.trim() && !isLoading) ? "pointer" : "not-allowed",
                fontSize: "14px",
                fontWeight: "bold"
              }}
            >
              {isLoading ? "🔄 Searching..." : "🔍 Search"}
            </button>
          </div>
        </div>

        {/* Search Tips */}
        <div style={{ marginBottom: "15px", padding: "8px", backgroundColor: "#f3e5f5", borderRadius: "4px", fontSize: "12px" }}>
          <strong>💡 Search Examples:</strong><br/>
          • Search by contact person name (e.g. "Ramesh")<br/>
          • Search by company name (e.g. "Patil Medical")<br/>
          • Search by mobile last 4 digits (e.g. "3210")
        </div>

        {/* Supplier Results */}
        {suppliers.length > 0 && (
          <div style={{ marginTop: "20px" }}>
            <div style={{ fontWeight: "bold", marginBottom: "15px", color: "#6f42c1" }}>
              📋 Found {suppliers.length} supplier(s):
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "15px" }}>
              {suppliers.map((supplier) => (
                <div key={supplier._id} style={{
                  padding: "15px",
                  backgroundColor: "white",
                  borderRadius: "8px",
                  border: "1px solid #dee2e6",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                }}>
                  <div style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "10px", color: "#6f42c1" }}>
                    🏢 {supplier.name}
                  </div>
                  <div style={{ fontSize: "14px", color: "#666", marginBottom: "12px", lineHeight: "1.4" }}>
                    <div><strong>Company:</strong> {supplier.companyName}</div>
                    <div><strong>Mobile:</strong> ****{supplier.mobile.slice(-4)}</div>
                    <div><strong>Email:</strong> {supplier.email}</div>
                    <div><strong>Address:</strong> {supplier.address.length > 50 ? supplier.address.substring(0, 50) + '...' : supplier.address}</div>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => onSelectSupplier(supplier)}
                      style={{
                        flex: 1,
                        padding: "8px 12px",
                        backgroundColor: "#28a745",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: "bold"
                      }}
                    >
                      ✅ Select
                    </button>
                    <button
                      onClick={() => {
                        setSupplierUpdateFormData({ selectedSupplier: supplier });
                        onClose();
                      }}
                      style={{
                        flex: 1,
                        padding: "8px 12px",
                        backgroundColor: "#ffc107",
                        color: "#212529",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: "bold"
                      }}
                    >
                      ✏️ Update
                    </button>
                    <button
                      onClick={() => {
                        setSupplierDeleteData({ selectedSupplier: supplier });
                        onClose();
                      }}
                      style={{
                        flex: 1,
                        padding: "8px 12px",
                        backgroundColor: "#dc3545",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: "bold"
                      }}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pagination */}
        {suppliers.length > 0 && totalPages > 1 && (
          <div style={{ marginTop: "20px", textAlign: "center" }}>
            <span style={{ fontSize: "14px", color: "#666" }}>
              Page {currentPage} of {totalPages}
            </span>
          </div>
        )}
      </div>
    );
  };

  // Supplier Update Form Panel Component
  const SupplierUpdateFormPanel = ({ onSave, onClose }) => {
    const [formData, setFormData] = useState({
      name: supplierUpdateFormData?.selectedSupplier?.name || '',
      companyName: supplierUpdateFormData?.selectedSupplier?.companyName || '',
      mobile: supplierUpdateFormData?.selectedSupplier?.mobile || '',
      email: supplierUpdateFormData?.selectedSupplier?.email || '',
      address: supplierUpdateFormData?.selectedSupplier?.address || ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
      // Validation
      if (!formData.name.trim() || !formData.companyName.trim() || !formData.mobile.trim() || !formData.email.trim() || !formData.address.trim()) {
        alert('Please fill in all required fields');
        return;
      }

      // Validate mobile (10 digits)
      if (!/^\d{10}$/.test(formData.mobile)) {
        alert('Please enter a valid 10-digit mobile number');
        return;
      }

      // Validate email
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        alert('Please enter a valid email address');
        return;
      }

      setIsSubmitting(true);
      try {
        const updatedSupplier = await updateSupplierAPI(supplierUpdateFormData.selectedSupplier._id, formData);
        onSave(updatedSupplier);
      } catch (error) {
        console.error('Supplier update error:', error);
        alert(`Error updating supplier: ${error.message}`);
      } finally {
        setIsSubmitting(false);
      }
    };

    if (!supplierUpdateFormData?.selectedSupplier) return null;

    return (
      <div style={{
        border: "2px solid #ffc107",
        borderRadius: "10px",
        padding: "20px",
        marginBottom: "20px",
        backgroundColor: "#fffbf0"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <h3 style={{ margin: 0, color: "#856404" }}>
            ✏️ Update Supplier: {supplierUpdateFormData.selectedSupplier.name}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "20px",
              cursor: "pointer",
              color: "#666"
            }}
          >
            ×
          </button>
        </div>

        {/* Current Values Display */}
        <div style={{ marginBottom: "15px", padding: "10px", backgroundColor: "#f8f9fa", borderRadius: "4px" }}>
          <strong>Current Values:</strong><br/>
          Name: {supplierUpdateFormData.selectedSupplier.name} |
          Company: {supplierUpdateFormData.selectedSupplier.companyName}<br/>
          Mobile: ****{supplierUpdateFormData.selectedSupplier.mobile.slice(-4)} |
          Email: {supplierUpdateFormData.selectedSupplier.email}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "15px" }}>
          {/* Update Fields */}
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                Contact Person Name: <span style={{ color: "red" }}>*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter contact person name"
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontSize: "14px"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                Company Name: <span style={{ color: "red" }}>*</span>
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="Enter company name"
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontSize: "14px"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                Mobile Number: <span style={{ color: "red" }}>*</span>
              </label>
              <input
                type="tel"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                placeholder="Enter 10-digit mobile number"
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontSize: "14px"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                Email Address: <span style={{ color: "red" }}>*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter email address"
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontSize: "14px"
                }}
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
              Address: <span style={{ color: "red" }}>*</span>
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Enter complete address"
              rows="4"
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                fontSize: "14px",
                resize: "vertical"
              }}
            />
          </div>
        </div>

        {/* Submit Button */}
        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.name.trim() || !formData.companyName.trim() || !formData.mobile.trim() || !formData.email.trim() || !formData.address.trim()}
            style={{
              padding: "12px 24px",
              backgroundColor: (formData.name.trim() && formData.companyName.trim() && formData.mobile.trim() && formData.email.trim() && formData.address.trim() && !isSubmitting) ? "#ffc107" : "#ccc",
              color: (formData.name.trim() && formData.companyName.trim() && formData.mobile.trim() && formData.email.trim() && formData.address.trim() && !isSubmitting) ? "#212529" : "white",
              border: "none",
              borderRadius: "6px",
              cursor: (formData.name.trim() && formData.companyName.trim() && formData.mobile.trim() && formData.email.trim() && formData.address.trim() && !isSubmitting) ? "pointer" : "not-allowed",
              fontSize: "16px",
              fontWeight: "bold"
            }}
          >
            {isSubmitting ? "⏳ Updating..." : "🔄 Update Supplier"}
          </button>
        </div>

        {/* Form Tips */}
        <div style={{ marginTop: "15px", padding: "10px", backgroundColor: "#fff3cd", borderRadius: "4px", fontSize: "12px" }}>
          <strong>💡 Update Tips:</strong> Modify any fields you want to change. All changes will be saved to the supplier record.
        </div>
      </div>
    );
  };

  // Supplier Delete Confirmation Panel Component
  const SupplierDeletePanel = ({ onConfirm, onCancel }) => {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleConfirm = async () => {
      setIsDeleting(true);
      try {
        await deleteSupplierAPI(supplierDeleteData.selectedSupplier._id);
        onConfirm();
      } catch (error) {
        console.error('Supplier deletion error:', error);
        alert(`Error deleting supplier: ${error.message}`);
      } finally {
        setIsDeleting(false);
      }
    };

    if (!supplierDeleteData?.selectedSupplier) return null;

    const supplier = supplierDeleteData.selectedSupplier;

    return (
      <div style={{
        border: "2px solid #dc3545",
        borderRadius: "10px",
        padding: "20px",
        marginBottom: "20px",
        backgroundColor: "#fff5f5"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <h3 style={{ margin: 0, color: "#721c24" }}>
            ⚠️ Confirm Supplier Deletion
          </h3>
          <button
            onClick={onCancel}
            style={{
              background: "none",
              border: "none",
              fontSize: "20px",
              cursor: "pointer",
              color: "#666"
            }}
          >
            ×
          </button>
        </div>

        {/* Warning Message */}
        <div style={{ marginBottom: "20px", padding: "15px", backgroundColor: "#f8d7da", borderRadius: "8px", border: "1px solid #f5c6cb" }}>
          <div style={{ fontSize: "18px", fontWeight: "bold", color: "#721c24", marginBottom: "10px" }}>
            🗑️ Delete Supplier
          </div>
          <div style={{ fontSize: "14px", color: "#721c24", lineHeight: "1.4" }}>
            Are you sure you want to delete this supplier? This action cannot be undone and may affect:
            <ul style={{ margin: "10px 0", paddingLeft: "20px" }}>
              <li>Existing inventory records</li>
              <li>Purchase history</li>
              <li>Medicine supply tracking</li>
            </ul>
          </div>
        </div>

        {/* Supplier Details */}
        <div style={{ marginBottom: "20px", padding: "15px", backgroundColor: "#f8f9fa", borderRadius: "8px", border: "1px solid #dee2e6" }}>
          <div style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "10px", color: "#6f42c1" }}>
            🏢 Supplier Details
          </div>
          <div style={{ fontSize: "14px", color: "#666", lineHeight: "1.4" }}>
            <div><strong>Name:</strong> {supplier.name}</div>
            <div><strong>Company:</strong> {supplier.companyName}</div>
            <div><strong>Mobile:</strong> ****{supplier.mobile.slice(-4)}</div>
            <div><strong>Email:</strong> {supplier.email}</div>
            <div><strong>Address:</strong> {supplier.address}</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "15px", justifyContent: "center" }}>
          <button
            onClick={handleConfirm}
            disabled={isDeleting}
            style={{
              padding: "12px 24px",
              backgroundColor: isDeleting ? "#ccc" : "#dc3545",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: isDeleting ? "not-allowed" : "pointer",
              fontSize: "16px",
              fontWeight: "bold"
            }}
          >
            {isDeleting ? "⏳ Deleting..." : "🗑️ Yes, Delete Supplier"}
          </button>
          <button
            onClick={onCancel}
            disabled={isDeleting}
            style={{
              padding: "12px 24px",
              backgroundColor: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: isDeleting ? "not-allowed" : "pointer",
              fontSize: "16px",
              fontWeight: "bold"
            }}
          >
            Cancel
          </button>
        </div>

        {/* Warning */}
        <div style={{ marginTop: "15px", padding: "10px", backgroundColor: "#fff3cd", borderRadius: "4px", fontSize: "12px", border: "1px solid #ffeaa7" }}>
          <strong>⚠️ Warning:</strong> This action is permanent. Consider updating the supplier instead if they might be active again in the future.
        </div>
      </div>
    );
  };

  // Medicine Add Form Panel Component (Simple form with required fields)
  const MedicineAddFormPanel = ({ onSave, onClose }) => {
    const [formData, setFormData] = useState({
      name: '',
      brandName: '',
      dosageForm: 'TABLET',
      strength: '',
      unit: 'TABLET',
      category: 'GENERAL',
      prescriptionRequired: true,
      isActive: true
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
      // Validation
      if (!formData.name.trim() || !formData.brandName.trim() || !formData.strength.trim()) {
        alert('Please fill in all required fields: Name, Brand Name, and Strength');
        return;
      }

      setIsSubmitting(true);
      try {
        const response = await fetch('/api/medical/medicines', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        if (!response.ok) {
          throw new Error('Failed to create medicine');
        }

        const result = await response.json();
        onSave(result.medicine);
      } catch (error) {
        console.error('Medicine creation error:', error);
        alert(`Error creating medicine: ${error.message}`);
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <div style={{
        border: "2px solid #28a745",
        borderRadius: "10px",
        padding: "20px",
        marginBottom: "20px",
        backgroundColor: "#f8fff8"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <h3 style={{ margin: 0, color: "#155724" }}>
            ➕ Add New Medicine
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "20px",
              cursor: "pointer",
              color: "#666"
            }}
          >
            ×
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "15px" }}>
          {/* Required Fields */}
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                Medicine Name: <span style={{ color: "red" }}>*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter medicine name"
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontSize: "14px"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                Brand Name: <span style={{ color: "red" }}>*</span>
              </label>
              <input
                type="text"
                value={formData.brandName}
                onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                placeholder="Enter brand name"
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontSize: "14px"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                Dosage Form: <span style={{ color: "red" }}>*</span>
              </label>
              <select
                value={formData.dosageForm}
                onChange={(e) => setFormData({ ...formData, dosageForm: e.target.value })}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontSize: "14px"
                }}
              >
                <option value="TABLET">Tablet</option>
                <option value="SYRUP">Syrup</option>
                <option value="CAPSULE">Capsule</option>
                <option value="INJECTION">Injection</option>
                <option value="DROPS">Drops</option>
                <option value="CREAM">Cream</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                Strength: <span style={{ color: "red" }}>*</span>
              </label>
              <input
                type="text"
                value={formData.strength}
                onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
                placeholder="e.g. 500mg, 5ml, 250mg"
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontSize: "14px"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                Unit: <span style={{ color: "red" }}>*</span>
              </label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontSize: "14px"
                }}
              >
                <option value="TABLET">Tablet</option>
                <option value="ML">ML</option>
                <option value="CAPSULE">Capsule</option>
              </select>
            </div>
          </div>

          {/* Optional Settings */}
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                Category: (Optional)
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontSize: "14px"
                }}
              >
                <option value="GENERAL">General</option>
                <option value="ANTIBIOTIC">Antibiotic</option>
                <option value="PAINKILLER">Painkiller</option>
                <option value="ANTACID">Antacid</option>
                <option value="ANTIHISTAMINE">Antihistamine</option>
                <option value="VITAMIN">Vitamin</option>
                <option value="SUPPLEMENT">Supplement</option>
              </select>
            </div>

            <div style={{ marginTop: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>
                Settings:
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={formData.prescriptionRequired}
                    onChange={(e) => setFormData({ ...formData, prescriptionRequired: e.target.checked })}
                    style={{ marginRight: "8px" }}
                  />
                  Prescription Required
                </label>
                <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    style={{ marginRight: "8px" }}
                  />
                  Active Medicine
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.name.trim() || !formData.brandName.trim() || !formData.strength.trim()}
            style={{
              padding: "12px 24px",
              backgroundColor: (formData.name.trim() && formData.brandName.trim() && formData.strength.trim() && !isSubmitting) ? "#28a745" : "#ccc",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: (formData.name.trim() && formData.brandName.trim() && formData.strength.trim() && !isSubmitting) ? "pointer" : "not-allowed",
              fontSize: "16px",
              fontWeight: "bold"
            }}
          >
            {isSubmitting ? "⏳ Creating..." : "💾 Create Medicine"}
          </button>
        </div>

        {/* Form Tips */}
        <div style={{ marginTop: "15px", padding: "10px", backgroundColor: "#e8f5e8", borderRadius: "4px", fontSize: "12px" }}>
          <strong>💡 Required Fields:</strong> Name, Brand Name, Dosage Form, Strength, Unit<br/>
          <strong>💡 Tips:</strong> Strength examples: "500mg", "5ml", "250mg". Category helps with organization.
        </div>
      </div>
    );
  };

  // Medicine Form Panel Component (Add/Update)
  const MedicineFormPanel = ({ mode, medicine, onSave, onClose }) => {
    const [formData, setFormData] = useState({
      name: medicine?.name || '',
      brandName: medicine?.brandName || '',
      dosageForm: medicine?.dosageForm || 'TABLET',
      strength: medicine?.strength || '',
      unit: medicine?.unit || 'TABLET',
      category: medicine?.category || 'GENERAL',
      prescriptionRequired: medicine?.prescriptionRequired ?? true,
      isActive: medicine?.isActive ?? true
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
      // Validation
      if (!formData.name.trim() || !formData.brandName.trim() || !formData.strength.trim()) {
        alert('Please fill in all required fields (Name, Brand Name, Strength)');
        return;
      }

      setIsSubmitting(true);
      try {
        const url = mode === 'add' ? '/api/medical/medicines' : `/api/medical/medicines/${medicine._id}`;
        const method = mode === 'add' ? 'POST' : 'PUT';

        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        if (!response.ok) {
          throw new Error(`Failed to ${mode} medicine`);
        }

        const result = await response.json();
        addToChat(`✅ Medicine ${mode === 'add' ? 'added' : 'updated'} successfully!`, false);
        onSave(result.medicine);
      } catch (error) {
        console.error(`Medicine ${mode} error:`, error);
        addToChat(`❌ Error ${mode === 'add' ? 'adding' : 'updating'} medicine: ${error.message}`, false);
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <div style={{
        border: "2px solid #28a745",
        borderRadius: "10px",
        padding: "20px",
        marginBottom: "20px",
        backgroundColor: "#f8fff8"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <h3 style={{ margin: 0, color: "#155724" }}>
            {mode === 'add' ? '➕ Add New Medicine' : '✏️ Update Medicine'}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "20px",
              cursor: "pointer",
              color: "#666"
            }}
          >
            ×
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "15px" }}>
          {/* Basic Information */}
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                Medicine Name: <span style={{ color: "red" }}>*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter medicine name"
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontSize: "14px"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                Brand Name: <span style={{ color: "red" }}>*</span>
              </label>
              <input
                type="text"
                value={formData.brandName}
                onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                placeholder="Enter brand name"
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontSize: "14px"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                Dosage Form: <span style={{ color: "red" }}>*</span>
              </label>
              <select
                value={formData.dosageForm}
                onChange={(e) => setFormData({ ...formData, dosageForm: e.target.value })}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontSize: "14px"
                }}
              >
                <option value="TABLET">Tablet</option>
                <option value="SYRUP">Syrup</option>
                <option value="CAPSULE">Capsule</option>
                <option value="INJECTION">Injection</option>
                <option value="DROPS">Drops</option>
                <option value="CREAM">Cream</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                Strength: <span style={{ color: "red" }}>*</span>
              </label>
              <input
                type="text"
                value={formData.strength}
                onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
                placeholder="e.g. 500mg, 5ml, 250mg"
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontSize: "14px"
                }}
              />
            </div>
          </div>

          {/* Additional Settings */}
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                Unit: <span style={{ color: "red" }}>*</span>
              </label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontSize: "14px"
                }}
              >
                <option value="TABLET">Tablet</option>
                <option value="ML">ML</option>
                <option value="CAPSULE">Capsule</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                Category:
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontSize: "14px"
                }}
              >
                <option value="GENERAL">General</option>
                <option value="ANTIBIOTIC">Antibiotic</option>
                <option value="PAINKILLER">Painkiller</option>
                <option value="ANTACID">Antacid</option>
                <option value="ANTIHISTAMINE">Antihistamine</option>
                <option value="VITAMIN">Vitamin</option>
                <option value="SUPPLEMENT">Supplement</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>
                Settings:
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={formData.prescriptionRequired}
                    onChange={(e) => setFormData({ ...formData, prescriptionRequired: e.target.checked })}
                    style={{ marginRight: "8px" }}
                  />
                  Prescription Required
                </label>
                <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    style={{ marginRight: "8px" }}
                  />
                  Active Medicine
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            style={{
              padding: "12px 24px",
              backgroundColor: isSubmitting ? "#ccc" : "#28a745",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              fontSize: "16px",
              fontWeight: "bold"
            }}
          >
            {isSubmitting ? "⏳ Saving..." : `💾 ${mode === 'add' ? 'Add Medicine' : 'Update Medicine'}`}
          </button>
        </div>

        {/* Form Tips */}
        <div style={{ marginTop: "15px", padding: "10px", backgroundColor: "#e8f5e8", borderRadius: "4px", fontSize: "12px" }}>
          <strong>💡 Required Fields:</strong> Name, Brand Name, Dosage Form, Strength, Unit<br/>
          <strong>💡 Tips:</strong> Strength examples: "500mg", "5ml", "250mg". Category helps with organization.
        </div>
      </div>
    );
  };

  // Availability management state
  const [availabilityData, setAvailabilityData] = useState(null);
  // {
  //   days: [0, 1, 2, ...], // Day indices (0=Sunday, 1=Monday, etc.)
  //   availability: [{ day: 1, startTime: '09:00', endTime: '17:00', isAvailable: true }, ...]
  // }

  // Function to generate CSV by type directly
  const generateCsvByType = async (type) => {
    try {
      if (type === 'expiry') {
        const expiryData = await getExpiryListAPI();
        const csvData = generateCSV(expiryData, 'expiry');
        const fileName = "expiry_report.csv";

        // Create a blob and download link
        const blob = new Blob([csvData], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);

        addToChat(`✅ Expiry report CSV generated and downloaded: ${fileName}`, false);
      } else if (type === 'low_stock') {
        const inventory = await getLowStockListAPI();
        const csvData = generateCSV(inventory, 'low_stock');
        const fileName = "low_stock_report.csv";

        // Create a blob and download link
        const blob = new Blob([csvData], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);

        addToChat(`✅ Low stock report CSV generated and downloaded: ${fileName}`, false);
      }
    } catch (error) {
      console.error('CSV generation error:', error);
      addToChat(`❌ Error generating CSV report: ${error.message}`, false);
    }
  };

  // Patient creation panel state
  const [patientCreationData, setPatientCreationData] = useState(null);

  // Patient search panel state
  const [patientSearchData, setPatientSearchData] = useState(null);

  // Serve prescription state machine
  const [servePrescriptionState, setServePrescriptionState] = useState(null);
  // {
  //   step: 'SHOW_PRESCRIPTIONS' | 'SERVE_MEDICINE'
  //   patientId: string,
  //   patientName: string,
  //   prescriptions: [{ prescription data }],
  //   selectedPrescription: { prescription data }
  // }

  const speak = async (text) => {
    if (isPlaying) return; // Prevent multiple simultaneous audio plays

    setIsPlaying(true);

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        throw new Error("TTS request failed");
      }

      const audioBlob = await res.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      const audio = new Audio(audioUrl);

      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl); // Clean up
      };

      audio.onerror = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };

      audio.play();
    } catch (error) {
      console.error("TTS error:", error);
      setIsPlaying(false);
    }
  };

  const addToChat = (content, isUser = false) => {
    setChatHistory(prev => [...prev, { content, isUser, timestamp: new Date() }]);
  };

  const handleCreatePrescriptionStep = async (userMessage) => {
    const state = createPrescriptionState;

    switch (state.step) {
      case 'SELECT_PATIENT':
        // Extract mobile from "create prescription for 7447340940"
        const mobileMatch = userMessage.match(/\b\d{10}\b/);
        if (!mobileMatch) {
          return "Please provide a valid 10-digit mobile number.";
        }

        const mobile = mobileMatch[0];
        const patient = await findPatientByMobile(mobile);
        if (!patient) {
          return "Patient not found. Please create the patient first using 'create patient' command.";
        }

        setCreatePrescriptionState({
          ...state,
          step: 'ADD_MEDICINE',
          patientId: patient._id
        });

        // Add action buttons to chat for prescription management
        const prescriptionActionsMessage = {
          type: 'prescription_actions',
          patient: patient,
          step: 'patient_found',
          message: `Patient found: ${patient.name} (Age ${patient.age})\nNow add medicines to the prescription.`
        };
        addToChat(prescriptionActionsMessage, false);

        return; // Don't return text since we're using special message type

      case 'ADD_MEDICINE':
        // Handle remove medicine
        if (userMessage.toLowerCase().includes("remove") || userMessage.toLowerCase().includes("delete")) {
          const medicineToRemove = userMessage.toLowerCase()
            .replace(/remove|delete/g, "")
            .trim();

          if (!medicineToRemove) {
            return "Please specify which medicine to remove. Example: 'remove paracetamol'";
          }

          const updatedMedicines = (state.medicines || []).filter(med =>
            !med.medicineName.toLowerCase().includes(medicineToRemove.toLowerCase())
          );

          if (updatedMedicines.length === (state.medicines || []).length) {
            return `Medicine "${medicineToRemove}" not found in the current prescription.`;
          }

          setCreatePrescriptionState({
            ...state,
            medicines: updatedMedicines
          });

          return `✅ Removed "${medicineToRemove}" from prescription.\n\nCurrent medicines: ${updatedMedicines.length > 0 ? updatedMedicines.map(m => m.medicineName).join(', ') : 'None'}\n\nAdd another medicine, remove more, or say 'create prescription' to finish.`;
        }

        // Handle update medicine - Open visual panel instead of parsing text
        if (userMessage.toLowerCase().includes("update")) {
          const msg = userMessage.toLowerCase().trim();

          // Check if user wants to update the entire prescription (show all medicines)
          if (msg.trim().toLowerCase() === "update prescription" || msg.trim().toLowerCase() === "update") {
            if (!state.medicines || state.medicines.length === 0) {
              return "No medicines in the current prescription to update. Add some medicines first.";
            }

            // Return special message with medicine update buttons
            return {
              type: 'medicine_update_selection',
              medicines: state.medicines,
              message: "📝 Select a medicine to update:"
            };
          }

          // Extract medicine name (first word after "update")
          const medicineMatch = msg.match(/update\s+(\w+)/);
          if (!medicineMatch) {
            return "Please specify which medicine to update. Example: 'update paracetamol'";
          }

          const medicineName = medicineMatch[1];

          // Find the medicine to update
          const medIndex = (state.medicines || []).findIndex(med =>
            med.medicineName.toLowerCase().includes(medicineName.toLowerCase())
          );

          if (medIndex === -1) {
            return `Medicine "${medicineName}" not found in the current prescription.`;
          }

          const currentMed = state.medicines[medIndex];

          // Open medicine update panel with pre-filled values
          setMedicineUpdateData({
            medicineIndex: medIndex,
            currentMedicine: currentMed,
            dose: currentMed.dosePerTime,
            duration: currentMed.durationDays,
            timing: [...currentMed.timing]
          });

          return `📝 Opening update panel for "${medicineName}..."\n\n💡 Tip: Use the visual panel above to modify values easily!`;
        }

        // Handle check/current prescription
        if (userMessage.toLowerCase().includes("check prescription") ||
            userMessage.toLowerCase().includes("current prescription") ||
            (userMessage.toLowerCase().includes("check") && userMessage.toLowerCase().includes("prescription"))) {
          const medicines = state.medicines || [];
          if (medicines.length === 0) {
            return "📋 Current prescription is empty.\n\nNo medicines added yet. Use 'add [medicine] [dose] for [days] [timing]' to add medicines.";
          }

          let response = "📋 Current Prescription Medicines:\n\n";
          medicines.forEach((med, idx) => {
            response += `${idx + 1}. ${med.medicineName}\n`;
            response += `   • Dose: ${med.dosePerTime} per time\n`;
            response += `   • Duration: ${med.durationDays} days\n`;
            response += `   • Timing: ${med.timing.join(', ')}\n`;
            response += `   • Total: ${med.totalQuantity} units\n\n`;
          });

          response += "Available Commands:\n";
          response += "• 'add [medicine] [dose] for [days] [timing]' - Add more medicine\n";
          response += "• 'remove [medicine]' - Remove a medicine\n";
          response += "• 'update [medicine] dose [num] duration [num] timing [times]' - Update medicine\n";
          response += "• 'create prescription' - Finalize prescription";

          return response;
        }

        // Handle list/show medicines
        if (userMessage.toLowerCase().includes("list") || userMessage.toLowerCase().includes("show")) {
          const medicines = state.medicines || [];
          if (medicines.length === 0) {
            return "No medicines added yet. Use 'add [medicine] [dose] for [days] [timing]' to add medicines.";
          }

          let response = "📋 Current medicines in prescription:\n\n";
          medicines.forEach((med, idx) => {
            response += `${idx + 1}. ${med.medicineName}\n`;
            response += `   • Dose: ${med.dosePerTime} per time\n`;
            response += `   • Duration: ${med.durationDays} days\n`;
            response += `   • Timing: ${med.timing.join(', ')}\n`;
            response += `   • Total: ${med.totalQuantity} units\n\n`;
          });

          response += "Commands:\n";
          response += "• 'add [medicine] [dose] for [days] [timing]' - Add medicine\n";
          response += "• 'remove [medicine]' - Remove medicine\n";
          response += "• 'update [medicine] dose [num] duration [num] timing [times]' - Update medicine\n";
          response += "• 'create prescription' - Finish prescription";

          return response;
        }

        if (isAddMedicineIntent(userMessage)) {
          const medicineCmd = extractMedicineCommand(userMessage);
          if (!medicineCmd.medicineName || !medicineCmd.dosePerTime || !medicineCmd.durationDays) {
            return "Please specify medicine name, dose, and duration. Example: 'add paracetamol 2 for 3 days morning afternoon'";
          }

          // Check if medicine already exists
          const existingIndex = (state.medicines || []).findIndex(med =>
            med.medicineName.toLowerCase().includes(medicineCmd.medicineName.toLowerCase())
          );

          if (existingIndex >= 0) {
            return `Medicine "${medicineCmd.medicineName}" is already in the prescription. Use 'update ${medicineCmd.medicineName}' to modify it or 'remove ${medicineCmd.medicineName}' to delete it.`;
          }

          // Find medicine
          const medicine = await findMedicineByName(medicineCmd.medicineName);
          if (!medicine) {
            return `Medicine "${medicineCmd.medicineName}" not found.`;
          }

          const newMedicine = {
            medicine: medicine._id,
            medicineName: medicine.name,
            dosePerTime: medicineCmd.dosePerTime,
            timing: medicineCmd.timing,
            durationDays: medicineCmd.durationDays,
            totalQuantity: medicineCmd.totalQuantity
          };

          const updatedMedicines = [...(state.medicines || []), newMedicine];

          setCreatePrescriptionState({
            ...state,
            medicines: updatedMedicines
          });

          return `✅ Added: ${medicine.name}\nDose: ${medicineCmd.dosePerTime} per time\nDuration: ${medicineCmd.durationDays} days\nTiming: ${medicineCmd.timing.join(', ')}\nTotal: ${medicineCmd.totalQuantity} units\n\nCommands: 'add', 'remove', 'update', 'list', or 'create prescription'`;
        } else if (userMessage.toLowerCase().includes("create prescription")) {
          if (!state.medicines || state.medicines.length === 0) {
            return "Please add at least one medicine first.";
          }

          setCreatePrescriptionState({
            ...state,
            step: 'CREATE_PRESCRIPTION'
          });

          // Create the prescription
          const prescriptionData = {
            patientId: state.patientId,
            medicines: state.medicines.map(med => ({
              medicine: med.medicine,
              medicineName: med.medicineName,
              dosePerTime: med.dosePerTime,
              timing: med.timing,
              durationDays: med.durationDays,
              totalQuantity: med.totalQuantity
            }))
          };

          const prescription = await createPrescriptionAPI(prescriptionData);

          // Reset state
          setCreatePrescriptionState(null);

          return `✅ Prescription created successfully!\nPrescription ID: ${prescription.id}\nPatient: ${state.patientName || 'N/A'}\nMedicines: ${state.medicines.length}`;
        }
        return "Add medicine by typing 'add' followed by medicine details, or say 'create prescription' to finish.";

      default:
        return "Invalid state. Please start over with 'create prescription for [mobile]'.";
    }
  };

  const handleServePrescriptionStep = async (userMessage) => {
    const state = servePrescriptionState;

    switch (state.step) {
      case 'SHOW_PRESCRIPTIONS':
        // For now, just show prescriptions and allow serving
        // In a real implementation, you might want to ask which prescription to serve
        if (userMessage.toLowerCase().includes("serve") || userMessage.toLowerCase().includes("yes")) {
          // For simplicity, serve the first prescription
          const prescription = state.prescriptions[0];
          setServePrescriptionState({
            ...state,
            step: 'SERVE_MEDICINE',
            selectedPrescription: prescription
          });

          // Show medicines with remaining quantities only
          const remainingMedicines = prescription.medicines.filter(med => med.remainingQty > 0);

          return `📋 Selected Prescription: ${prescription._id.slice(-6)}\nStatus: ${prescription.status}\n\n📦 Medicines available to serve:\n${remainingMedicines.map((med, idx) => `${idx + 1}. ${med.medicineName}\n   • Prescribed: ${med.prescribedQty}\n   • Already given: ${med.dispensedQty}\n   • Remaining: ${med.remainingQty} units`).join('\n\n')}\n\n💰 Type quantities to dispense (≤ remaining) or 'full' for remaining amounts.`;
        }
        return "Please type 'serve' or 'yes' to serve the prescription.";

      case 'SERVE_MEDICINE':
        if (userMessage.toLowerCase().includes("confirm")) {
          // Create sale from prescription medicines with specified quantities
          const prescription = state.selectedPrescription;
          const saleItems = [];

          for (const med of prescription.medicines) {
            const dispenseQty = med.requestedQty || med.remainingQty;

            console.log('Processing medicine:', med.medicineName, 'dispenseQty:', dispenseQty, 'remaining:', med.remainingQty);

            // Validate quantity doesn't exceed remaining
            if (dispenseQty > med.remainingQty) {
              return `❌ Cannot dispense ${dispenseQty} units of ${med.medicineName}. Only ${med.remainingQty} units remaining.`;
            }

            if (dispenseQty > 0) {
              // Find available inventory for this medicine
              const medicineId = med.medicine._id || med.medicine; // Ensure we get the ID string
              console.log('Looking for inventory with medicineId:', medicineId);

              const inventory = await findAvailableInventory(medicineId);
              console.log('Found inventory:', inventory);

              if (!inventory) {
                return `❌ No stock available for ${med.medicineName}`;
              }

              saleItems.push({
                medicineId: medicineId,
                inventoryId: inventory._id,
                quantity: dispenseQty
              });
            }
          }

          if (saleItems.length === 0) {
            return "❌ No medicines selected to dispense.";
          }

          // Create sale with prescription reference
          const saleData = {
            patientId: state.patientId,
            prescriptionId: prescription._id,
            items: saleItems,
            paymentMode: "CASH" // Default to CASH for prescriptions
          };

          const sale = await createSaleAPI(saleData);

          // Reset state
          setServePrescriptionState(null);

          return `✅ Partial dispensing completed!\nBill No: ${sale.billNumber}\nTotal: ${formatCurrency(sale.totalAmount)}\nPayment: ${sale.paymentMode}\n\nPrescription status updated automatically.`;
        } else {
          // Parse medicine quantities from user input
          const prescription = state.selectedPrescription;
          const quantityRequests = parseDispensingQuantities(userMessage, prescription.medicines);

          if (quantityRequests.length === 0) {
            return "Please specify quantities for medicines. Example: 'paracetamol 5, azithromycin 3' or 'full' for remaining amounts.";
          }

          // Update medicines with requested quantities
          const updatedMedicines = prescription.medicines.map(med => {
            const medId = med.medicine._id || med.medicine;
            const request = quantityRequests.find(q => q.medicineId === medId);
            if (request) {
              // Validate quantity
              if (request.quantity > med.remainingQty) {
                throw new Error(`Cannot dispense ${request.quantity} units of ${med.medicineName}. Only ${med.remainingQty} units remaining.`);
              }
              return { ...med, requestedQty: request.quantity };
            }
            return med;
          });

          setServePrescriptionState({
            ...state,
            selectedPrescription: {
              ...prescription,
              medicines: updatedMedicines
            }
          });

          // Show summary
          const medicinesToDispense = updatedMedicines.filter(med => med.requestedQty > 0);
          const totalAmount = medicinesToDispense.reduce((sum, med) => {
            // Estimate price (in real app, get from inventory)
            return sum + (med.requestedQty * 10); // Placeholder price
          }, 0);

          return `📋 Ready to dispense:\n${medicinesToDispense.map(med => `• ${med.medicineName}: ${med.requestedQty} units`).join('\n')}\n\n💰 Estimated total: ${formatCurrency(totalAmount)}\n\nType 'confirm' to proceed or specify different quantities.`;
        }

      default:
        return "Invalid state. Please start over with 'serve prescription for [mobile]'.";
    }
  };

  // Helper function to parse dispensing quantities
  const parseDispensingQuantities = (message, medicines) => {
    const text = message.toLowerCase();

    if (text.includes('full') || text.includes('remaining')) {
      // Dispense all remaining quantities
      return medicines
        .filter(med => med.remainingQty > 0)
        .map(med => ({
          medicineId: med.medicine,
          quantity: med.remainingQty
        }));
    }

    // Parse specific quantities like "paracetamol 5, azithromycin 3"
    const requests = [];
    const parts = text.split(',').map(p => p.trim());

    for (const part of parts) {
      const match = part.match(/^(.+?)\s+(\d+)$/);
      if (match) {
        const medicineName = match[1].trim();
        const quantity = parseInt(match[2]);

        // Find medicine by name
        const medicine = medicines.find(m =>
          m.medicineName.toLowerCase().includes(medicineName.toLowerCase()) &&
          m.remainingQty > 0
        );

        if (medicine && quantity > 0) {
          requests.push({
            medicineId: medicine.medicine._id || medicine.medicine,
            quantity
          });
        }
      }
    }

    return requests;
  };

  const handleServeMedicineStep = async (userMessage) => {
    const state = serveMedicineState;

    switch (state.step) {
      case 'SELECT_PATIENT':
        if (isSelectPatientIntent(userMessage)) {
          const mobile = extractPatientMobile(userMessage);
          if (!mobile) {
            return "Please provide a valid 10-digit mobile number.";
          }

          const patient = await findPatientByMobile(mobile);
          if (!patient) {
            return "Patient not found. Please create the patient first using 'create patient' command.";
          }

          setServeMedicineState({
            ...state,
            step: 'ADD_MEDICINE',
            patientId: patient._id
          });

          return `Patient selected: ${patient.name} (Age ${patient.age})\nNow add medicine.`;
        }
        return "Please select patient by typing 'select patient' followed by mobile number.";

      case 'ADD_MEDICINE':
        if (isAddMedicineIntent(userMessage)) {
          const medicineCmd = extractMedicineCommand(userMessage);
          if (!medicineCmd.medicineName || !medicineCmd.dosePerTime || !medicineCmd.durationDays) {
            return "Please specify medicine name, dose, and duration. Example: 'add paracetamol 2 for 3 days morning night'";
          }

          // Find medicine
          const medicine = await findMedicineByName(medicineCmd.medicineName);
          if (!medicine) {
            return `Medicine "${medicineCmd.medicineName}" not found.`;
          }

          // Find available inventory
          const inventory = await findAvailableInventory(medicine._id);
          if (!inventory) {
            return `No stock available for ${medicine.name}.`;
          }

          // Calculate quantity and total
          const quantity = medicineCmd.totalQuantity;
          const total = quantity * inventory.sellingPrice;

          const newItem = {
            medicineId: medicine._id,
            inventoryId: inventory._id,
            quantity,
            purchasePrice: inventory.purchasePrice,
            sellingPrice: inventory.sellingPrice,
            total,
            medicineName: medicine.name
          };

          const updatedItems = [...(state.items || []), newItem];

          setServeMedicineState({
            ...state,
            items: updatedItems
          });

          return `Added:\n${medicine.name}\nQuantity: ${quantity}\nPrice: ${formatCurrency(total)}\n\nAdd another medicine or type 'payment' to proceed.`;
        } else if (isPaymentIntent(userMessage)) {
          if (!state.items || state.items.length === 0) {
            return "Please add at least one medicine first.";
          }

          setServeMedicineState({
            ...state,
            step: 'SELECT_PAYMENT'
          });

          const { summary } = generateBillSummary(state.items);
          return `${summary}\n\nSelect payment mode: CASH / UPI / CARD`;
        }
        return "Add medicine by typing 'add' followed by medicine details, or type 'payment' to proceed.";

      case 'SELECT_PAYMENT':
        const paymentMode = extractPaymentMode(userMessage);
        if (!paymentMode) {
          return "Please specify payment mode: CASH, UPI, or CARD.";
        }

        setServeMedicineState({
          ...state,
          step: 'CONFIRM',
          paymentMode
        });

        const { summary } = generateBillSummary(state.items);
        return `${summary}\nPayment: ${paymentMode}\n\nConfirm sale?\nReply YES to confirm.`;

      case 'CONFIRM':
        if (isConfirmIntent(userMessage)) {
          // Create the sale
          const saleData = {
            patientId: state.patientId,
            items: state.items.map(item => ({
              medicineId: item.medicineId,
              inventoryId: item.inventoryId,
              quantity: item.quantity
            })),
            paymentMode: state.paymentMode
          };

          const sale = await createSaleAPI(saleData);

          // Reset state
          setServeMedicineState(null);

          return `✅ Medicine served successfully\nBill No: ${sale.billNumber}\nTotal: ${formatCurrency(sale.totalAmount)}\nPayment: ${sale.paymentMode}`;
        } else {
          setServeMedicineState({
            ...state,
            step: 'ADD_MEDICINE'
          });
          return "Sale cancelled. You can continue adding medicines or start over.";
        }

      default:
        return "Invalid state. Please start over with 'serve medicine'.";
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = message.trim();
    addToChat(userMessage, true);
    setMessage("");

    let response = "";

    try {


      // Reset state machines if user is switching to a different command category
      const categoryKeyword = detectCategoryKeyword(userMessage.toLowerCase());
      if (categoryKeyword) {
        // Reset all state machines when switching categories
        setServePrescriptionState(null);
        setCreatePrescriptionState(null);
        setServeMedicineState(null);
        setMedicinePanelData(null);
        setMedicineUpdateData(null);
      }

      // Track command usage for state-based system
      const intent = detectCommandIntent(userMessage);
      if (intent) {
        updateCommandMemory(intent.intent, intent.command);
        updateStateCommands();
      }

      // Handle specific intents first
      if (intent && intent.intent === 'MANAGE_SUPPLIERS') {
        setSupplierManagementData({});
        response = "🛠️ Opening Supplier Management panel...";
        addToChat(response);
        return;
      }

      // Check for category keywords first
      if (categoryKeyword) {
        if (categoryKeyword === 'medicine') {
          // Show medicine actions instead of generic commands
          const medicineActionsMessage = {
            type: 'medicine_actions',
            category: '💊 Medicine',
            message: '💊 Medicine Management Actions:'
          };
          addToChat(medicineActionsMessage, false);
          setMessage("");
          return;
        } else {
          response = getCategoryCommandsResponse(categoryKeyword);
          addToChat(response);
          setMessage("");
          return;
        }
      }
      // Handle serve medicine state machine
      else if (serveMedicineState) {
        response = await handleServeMedicineStep(userMessage);
      }
      // Check if there's a pending search to resolve
      else if (pendingSearch) {
        const answer = userMessage.toLowerCase().trim();

        if (pendingSearch.status === 'need_age') {
          const age = parseInt(answer);
          if (isNaN(age)) {
            response = "Please provide a valid age number.";
          } else {
            const updatedCriteria = { ...currentCriteria, age };
            const filtered = filterPatients(pendingSearch.patients, updatedCriteria);
            const result = findUniquePatient(filtered, updatedCriteria);

            if (result.status === 'found') {
              response = `Found patient: ${result.patient.name}, Age: ${result.patient.age}, Gender: ${result.patient.gender}, Mobile: ****${result.patient.mobile.slice(-4)}`;
              setPendingSearch(null);
              setCurrentCriteria({});
            } else if (result.status === 'need_mobile') {
              response = result.message;
              setPendingSearch({ ...pendingSearch, status: 'need_mobile' });
              setCurrentCriteria(updatedCriteria);
            } else {
              response = result.message;
              setPendingSearch(null);
              setCurrentCriteria({});
            }
          }
        } else if (pendingSearch.status === 'need_mobile') {
          const mobileLast4 = answer.replace(/\D/g, '');
          if (mobileLast4.length !== 4) {
            response = "Please provide the last 4 digits of the mobile number.";
          } else {
            const updatedCriteria = { ...currentCriteria, mobileLast4 };
            const filtered = filterPatients(pendingSearch.patients, updatedCriteria);
            const result = findUniquePatient(filtered, updatedCriteria);

            if (result.status === 'found') {
              response = `Found patient: ${result.patient.name}, Age: ${result.patient.age}, Gender: ${result.patient.gender}, Mobile: ****${result.patient.mobile.slice(-4)}`;
            } else {
              response = result.message;
            }
            setPendingSearch(null);
            setCurrentCriteria({});
          }
        }
      } else if (isCreatePatientIntent(userMessage)) {
        // Track command usage
        updateCommandMemory('CREATE_PATIENT', 'Create patient');

        // Show patient creation panel instead of text-based flow
        setPatientCreationData({
          name: '',
          mobile: '',
          age: '',
          gender: 'Male'
        });

        // Don't return a response since we're showing a panel
        return;
      } else if (isFindPatientIntent(userMessage)) {
        // Track command usage
        updateCommandMemory('FIND_PATIENT', 'Find patient');

        // Show patient search panel instead of text-based flow
        setPatientSearchData({
          searchTerm: '',
          patients: [],
          currentPage: 1,
          totalPages: 1,
          isLoading: false
        });

        // Don't return a response since we're showing a panel
        return;
      } else if (isCreatePrescriptionIntent(userMessage)) {
        // Track command usage
        updateCommandMemory('CREATE_PRESCRIPTION', 'Create prescription');

        // Extract mobile from "create prescription for 7447340940"
        const mobileMatch = userMessage.match(/\b\d{10}\b/);
        if (!mobileMatch) {
          response = "Please provide a valid 10-digit mobile number. Example: 'create prescription for 9876543210'";
        } else {
          const mobile = mobileMatch[0];
          const patient = await findPatientByMobile(mobile);
          if (!patient) {
            response = "Patient not found. Please create the patient first using 'create patient' command.";
          } else {
            setCreatePrescriptionState({
              step: 'ADD_MEDICINE',
              patientId: patient._id,
              patientName: patient.name,
              medicines: []
            });

            // Return special message object with action buttons
            const prescriptionActionsMessage = {
              type: 'prescription_actions',
              patient: patient,
              step: 'patient_found',
              message: `Patient found: ${patient.name} (Age ${patient.age})\nNow add medicines to the prescription.`
            };
            addToChat(prescriptionActionsMessage, false);
            return; // Don't return text since we're using special message type
          }
        }
      } else if (isServePrescriptionIntent(userMessage)) {
        // Check role-based access - only MEDICAL staff can serve prescriptions
        if (userRole !== 'MEDICAL') {
          response = "❌ Access Denied: Only Medical staff can serve prescriptions. Doctors can create and update prescriptions, but serving medicine requires Medical staff authorization.";
          addToChat(response);
          return;
        }

        // Track command usage
        updateCommandMemory('SERVE_PRESCRIPTION', 'Serve prescription');
        // Extract mobile from "serve prescription for 7447340940"
        const mobileMatch = userMessage.match(/\b\d{10}\b/);
        if (!mobileMatch) {
          response = "Please provide a valid 10-digit mobile number. Example: 'serve prescription for 9876543210'";
        } else {
          const mobile = mobileMatch[0];
          const result = await getActivePrescriptionsByMobile(mobile);
          if (!result.found) {
            response = result.message;
          } else if (result.prescriptions.length === 0) {
            response = `Patient ${result.patient.name} has no active prescriptions.`;
          } else {
            setServePrescriptionState({
              step: 'SHOW_PRESCRIPTIONS',
              patientId: result.patient._id,
              patientName: result.patient.name,
              prescriptions: result.prescriptions
            });
            // Create special message with prescription selection buttons
            const prescriptionSelectionMessage = {
              type: 'prescription_selection',
              patient: result.patient,
              prescriptions: result.prescriptions,
              message: `📋 Found ${result.prescriptions.length} active prescription(s) for ${result.patient.name}:\n\nSelect which prescription to serve:`
            };
            addToChat(prescriptionSelectionMessage, false);
            return; // Don't return text since we're using special message type
          }
        }
      } else if (isServeMedicineIntent(userMessage)) {
        setServeMedicineState({
          step: 'SELECT_PATIENT',
          patientId: null,
          items: [],
          paymentMode: null
        });
        response = "Please select patient by mobile number.";
      } else if (isCreateMedicineIntent(userMessage)) {
        const medicineData = extractCreateMedicineData(userMessage);
        if (!medicineData.name || !medicineData.brandName || !medicineData.dosageForm || !medicineData.strength || !medicineData.unit) {
          response = "Please provide all required medicine details: name, brand, dosage form (tablet/syrup/capsule), and strength. Optional: category (antibiotic/painkiller), prescription status (prescription required/without prescription), active status (active/inactive). Example: 'add medicine azithromycin brand azee tablet 500mg antibiotic prescription required active'";
        } else {
          // Create medicine
          const createdMedicine = await createMedicineAPI(medicineData);
          response = `✅ Medicine added successfully!\nName: ${createdMedicine.name}\nBrand: ${createdMedicine.brandName}\nForm: ${createdMedicine.dosageForm}\nStrength: ${createdMedicine.strength}\nCategory: ${createdMedicine.category}\nPrescription: ${createdMedicine.prescriptionRequired ? 'Required' : 'Not Required'}`;
        }
      } else if (userMessage.toLowerCase().includes('manage suppliers')) {
        // Open supplier management panel
        setSupplierManagementData({});
        response = "🛠️ Opening Supplier Management panel...";
      } else if (isCreateSupplierIntent(userMessage)) {
        const supplierData = extractCreateSupplierData(userMessage);
        if (!supplierData.name || !supplierData.companyName || !supplierData.mobile || !supplierData.email || !supplierData.address) {
          response = "Please provide all required supplier details: name, company name, mobile, email, and address. Example: 'add supplier ramesh patil company patil medical distributors mobile 9876543210 email patilmedicals@gmail.com address midc road nashik maharashtra'";
        } else {
          // Check if supplier already exists
          const { exists, conflictField } = await checkSupplierExists(supplierData.mobile, supplierData.email);
          if (exists) {
            response = `Supplier with this ${conflictField} already exists.`;
          } else {
            // Create supplier
            const createdSupplier = await createSupplierAPI(supplierData);
            response = `✅ Supplier added successfully!\nName: ${createdSupplier.name}\nCompany: ${createdSupplier.companyName}\nEmail: ${createdSupplier.email}`;
          }
        }
      } else if (isFindSupplierIntent(userMessage)) {
        const searchCriteria = extractFindSupplierData(userMessage);
        if (!searchCriteria.name && !searchCriteria.mobileLast4 && !searchCriteria.companyName) {
          response = "Please specify supplier name, mobile last 4 digits, or company name to search. Example: 'find supplier patil' or 'find supplier 3210'";
        } else {
          // Find suppliers
          const allSuppliers = await findSuppliersAPI();
          const filteredSuppliers = filterSuppliers(allSuppliers, searchCriteria);
          const result = findUniqueSupplier(filteredSuppliers, searchCriteria);

          if (result.status === 'found') {
            const supplier = result.supplier;
            response = `✅ Supplier found:\nName: ${supplier.name}\nCompany: ${supplier.companyName}\nMobile: ****${supplier.mobile.slice(-4)}\nEmail: ${supplier.email}\nAddress: ${supplier.address}`;
          } else if (result.status === 'multiple') {
            response = result.message;
          } else {
            response = result.message;
          }
        }
      } else if (isUpdateSupplierIntent(userMessage)) {
        const updateData = extractUpdateSupplierData(userMessage);

        if (!updateData.mobile && !updateData.email) {
          response = "Please specify which supplier to update by providing mobile number or email. Example: 'update supplier mobile 9876543210 name ramesh kumar'";
        } else {
          // Find the supplier first
          const allSuppliers = await findSuppliersAPI();
          let supplierToUpdate = null;

          if (updateData.mobile) {
            supplierToUpdate = allSuppliers.find(s => s.mobile === updateData.mobile);
          } else if (updateData.email) {
            supplierToUpdate = allSuppliers.find(s => s.email === updateData.email);
          }

          if (!supplierToUpdate) {
            response = "Supplier not found with the provided mobile or email.";
          } else {
            // Prepare update data (remove identification fields)
            const updatePayload = {};
            if (updateData.name) updatePayload.name = updateData.name;
            if (updateData.companyName) updatePayload.companyName = updateData.companyName;
            if (updateData.address) updatePayload.address = updateData.address;
            if (updateData.newMobile) updatePayload.mobile = updateData.newMobile;
            if (updateData.newEmail) updatePayload.email = updateData.newEmail;

            if (Object.keys(updatePayload).length === 0) {
              response = "No valid fields to update. Please specify what to update (name, company, address, mobile, email).";
            } else {
              try {
                const updatedSupplier = await updateSupplierAPI(supplierToUpdate._id, updatePayload);
                response = `✅ Supplier updated successfully!\nName: ${updatedSupplier.name}\nCompany: ${updatedSupplier.companyName}\nEmail: ${updatedSupplier.email}`;
              } catch (error) {
                response = `❌ Error updating supplier: ${error.message}`;
              }
            }
          }
        }
      } else if (isDeleteSupplierIntent(userMessage)) {
        const searchCriteria = extractFindSupplierData(userMessage);

        if (!searchCriteria.name && !searchCriteria.mobileLast4 && !searchCriteria.companyName) {
          response = "Please specify which supplier to delete by name, mobile last 4 digits, or company name. Example: 'delete supplier patil' or 'delete supplier 3210'";
        } else {
          // Find the supplier first
          const allSuppliers = await findSuppliersAPI();
          const filteredSuppliers = filterSuppliers(allSuppliers, searchCriteria);
          const result = findUniqueSupplier(filteredSuppliers, searchCriteria);

          if (result.status === 'found') {
            const supplier = result.supplier;

            // Confirm deletion
            if (confirm(`Are you sure you want to delete supplier "${supplier.name}" from "${supplier.companyName}"? This action cannot be undone.`)) {
              try {
                await deleteSupplierAPI(supplier._id);
                response = `✅ Supplier "${supplier.name}" deleted successfully!`;
              } catch (error) {
                response = `❌ Error deleting supplier: ${error.message}`;
              }
            } else {
              response = "Supplier deletion cancelled.";
            }
          } else if (result.status === 'multiple') {
            response = result.message + "\n\nPlease be more specific with the supplier details.";
          } else {
            response = result.message;
          }
        }
      } else if (isExpiryListIntent(userMessage)) {
        const expiryData = await getExpiryListAPI();
        // Return special message object with purchase buttons for expired medicines
        const expiredMedicinesMessage = {
          type: 'expired_medicines',
          message: `📅 Medicine Expiry Report\n\n📊 Summary:\n• Expired: ${expiryData.summary.totalExpired}\n• Expiring within 30 days: ${expiryData.summary.totalNearExpiry}\n• Normal: ${expiryData.summary.totalNormal}`,
          medicines: Object.entries(expiryData.expiredItems).flatMap(([supplier, data]) =>
            data.items.map(item => ({
              ...item,
              supplierName: supplier
            }))
          )
        };
        addToChat(expiredMedicinesMessage, false);
        return; // Don't return text since we're using special message type
      } else if (isLowStockListIntent(userMessage)) {
        const inventory = await getLowStockListAPI();

        // Check if user wants batch-wise or medicine-wise view
        const text = userMessage.toLowerCase();
        const viewType = text.includes('batch') ? 'batch' : text.includes('medicine') ? 'medicine' : 'medicine'; // Default to medicine-wise

        let message = "";
        let medicines = [];

        if (viewType === 'batch') {
          // Batch-wise view - show individual batches that are low
          medicines = inventory.filter(item => item.isLowStock);
          message = `⚠️ Low Stock Alert Report (Batch-wise)\n\nFound ${medicines.length} batch(es) with low stock:`;
        } else {
          // Medicine-wise view - group by medicine and show medicine-level low stock
          const medicineGroups = inventory.filter(item => item.isMedicineLowStock).reduce((acc, item) => {
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

          // Convert back to array for display
          medicines = Object.values(medicineGroups).map(medicine => ({
            ...medicine,
            isMedicineLevel: true // Mark as medicine-level entry
          }));

          message = `⚠️ Low Stock Alert Report (Medicine-wise)\n\nFound ${medicines.length} medicine(s) with low stock:`;
        }

        // Return special message object with view toggle buttons and purchase buttons
        const lowStockMedicinesMessage = {
          type: 'low_stock_medicines',
          message,
          medicines,
          viewType, // Include view type for rendering
          totalBatchLowStock: inventory.filter(item => item.isLowStock).length,
          totalMedicineLowStock: inventory.filter(item => item.isMedicineLowStock).length
        };
        addToChat(lowStockMedicinesMessage, false);
        return; // Don't return text since we're using special message type
      } else if (isCreateCsvIntent(userMessage)) {
        if (userMessage.toLowerCase().includes("expiry")) {
          const expiryData = await getExpiryListAPI();
          const csvData = generateCSV(expiryData, 'expiry');
          const fileName = "expiry_report.csv";

          // Create a blob and download link
          const blob = new Blob([csvData], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          link.click();
          URL.revokeObjectURL(url);

          response = `✅ CSV report generated and downloaded: ${fileName}`;
        } else if (userMessage.toLowerCase().includes("low stock") || userMessage.toLowerCase().includes("stock")) {
          const inventory = await getLowStockListAPI();
          const csvData = generateCSV(inventory, 'low_stock');
          const fileName = "low_stock_report.csv";

          // Create a blob and download link
          const blob = new Blob([csvData], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          link.click();
          URL.revokeObjectURL(url);

          response = `✅ CSV report generated and downloaded: ${fileName}`;
        } else {
          // Return special message object with CSV selection buttons
          const csvSelectionMessage = {
            type: 'csv_selection',
            message: '📄 Choose CSV Report Type',
            options: [
              {
                type: 'expiry',
                title: 'Expiry Report',
                description: 'Export medicines that have expired',
                icon: '⏰',
                color: '#dc3545',
                bgColor: '#fff5f5'
              },
              {
                type: 'low_stock',
                title: 'Low Stock Report',
                description: 'Export medicines running low on stock',
                icon: '📉',
                color: '#ffc107',
                bgColor: '#fffbf0'
              }
            ]
          };
          addToChat(csvSelectionMessage, false);
          return; // Don't return text since we're using special message type
        }
      } else if (isCheckMedicineIntent(userMessage)) {
        const medicineData = extractMedicineData(userMessage);

        // If no specific medicine name is provided, show general inventory overview
        if (!medicineData.medicineName || medicineData.medicineName.toLowerCase() === 'stock') {
          response = "Please specify a medicine name to check stock. Example: 'check medicine paracetamol'\n\n💡 Or use 'expiry medicine list' or 'low stock medicine list' for reports.";
        } else {
          const inventory = await checkMedicineStockAPI();
          const result = findMedicineStock(inventory, medicineData.medicineName);
          response = result.message;
        }
      } else if (isCheckAvailabilityIntent(userMessage)) {
        // Check role-based access - only DOCTORS can manage availability
        if (userRole !== 'DOCTOR') {
          response = "❌ Access Denied: Only Doctors can manage availability schedules. Medical staff cannot access doctor availability features.";
          addToChat(response);
          return;
        }

        // Extract days from the message
        const days = extractAvailabilityDays(userMessage);

        if (days.length === 0) {
          response = "Please specify which days you want to check availability for. Examples:\n• 'check monday availability'\n• 'give me sun to tue availability'\n• 'check today availability'";
        } else {
          // Show availability form for the specified days
          setAvailabilityData({
            days,
            availability: days.map(day => ({
              day,
              startTime: '09:00',
              endTime: '17:00',
              isAvailable: true
            }))
          });

          const dayNames = days.map(d => ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d]);
          response = `📅 Opening availability panel for: ${dayNames.join(', ')}\n\n💡 Use the visual panel above to view and edit your availability!`;
        }
      } else if (isUpdateAvailabilityIntent(userMessage)) {
        // Check role-based access - only DOCTORS can manage availability
        if (userRole !== 'DOCTOR') {
          response = "❌ Access Denied: Only Doctors can manage availability schedules. Medical staff cannot access doctor availability features.";
          addToChat(response);
          return;
        }

        // Extract days from the message
        const days = extractAvailabilityDays(userMessage);

        if (days.length === 0) {
          response = "Please specify which days you want to update availability for. Examples:\n• 'update monday availability'\n• 'update sun to tue availability'";
        } else {
          // Show availability form for updating the specified days
          setAvailabilityData({
            days,
            availability: days.map(day => ({
              day,
              startTime: '09:00',
              endTime: '17:00',
              isAvailable: true
            }))
          });

          const dayNames = days.map(d => ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d]);
          response = `🔄 Opening availability update panel for: ${dayNames.join(', ')}\n\n💡 Use the visual panel above to modify your availability settings!`;
        }
      } else if (userMessage.toLowerCase().includes("check appointments") || userMessage.toLowerCase().includes("appointments for")) {
        // Extract mobile from "check appointments for 7447340940"
        const mobileMatch = userMessage.match(/\b\d{10}\b/);
        if (!mobileMatch) {
          response = "Please provide a valid 10-digit mobile number. Example: 'check appointments for 9876543210'";
        } else {
          const mobile = mobileMatch[0];

          // Find the patient
          const patient = await findPatientByMobile(mobile);
          if (!patient) {
            response = `Patient with mobile ${mobile} not found. Please create the patient first.`;
          } else {
            // In a real implementation, you would call an appointments API
            // For now, show a placeholder response
            response = `📅 Appointments for ${patient.name} (${patient.age}y):\n\nNo upcoming appointments found.\n\n💡 To book an appointment, use: 'book appointment for ${mobile}'`;
          }
        }
      } else if (isLastVisitDetailsIntent(userMessage)) {
        const patientData = extractPatientLastVisitData(userMessage);

        if (!patientData.name && !patientData.mobile) {
          response = "Please specify patient name and mobile number. Example: 'patient john doe ya 9876543210 give me patient last visit details'";
        } else {
          // Find the patient
          const allPatients = await findPatientsAPI();
          let patient = null;

          if (patientData.mobile) {
            patient = allPatients.find(p => p.mobile === patientData.mobile);
          }

          if (!patient && patientData.name) {
            // Try to find by name
            const nameMatches = allPatients.filter(p =>
              p.name.toLowerCase().includes(patientData.name.toLowerCase())
            );
            if (nameMatches.length === 1) {
              patient = nameMatches[0];
            } else if (nameMatches.length > 1) {
              response = `Found multiple patients with similar name. Please provide mobile number for: ${nameMatches.map(p => `${p.name} (${p.mobile.slice(-4)})`).join(', ')}`;
            } else {
              response = `Patient "${patientData.name}" not found.`;
            }
          }

          if (patient) {
            // Fetch last visit details
            const visitData = await getPatientLastVisitDetailsAPI(patient._id);
            response = formatLastVisitDetails(visitData);
          } else if (!response) {
            response = "Patient not found. Please check the name and mobile number.";
          }
        }
      } else if (intent.intent === 'MULTIPLE_PURCHASE') {
        // Track command usage
        updateCommandMemory('MULTIPLE_PURCHASE', 'Multiple medicine purchase');

        // Open multiple purchase panel
        setMultiplePurchasePanelData({ show: true });
        response = `🛒 Opening Multiple Medicine Purchase Panel...\n\n💡 You can now add multiple medicines to create a bulk purchase order.`;
      } else if (isPurchaseStockIntent(userMessage)) {
        // Track command usage
        updateCommandMemory('PURCHASE_STOCK', 'Purchase medicine stock');

        // Extract medicine name and quantity from user message
        const purchaseData = extractPurchaseMedicineData(userMessage);

        if (purchaseData.medicineName) {
          // User specified a medicine name - try to find it and open purchase panel directly
          try {
            const medicines = await searchMedicinesAPI(purchaseData.medicineName);

            if (medicines.length === 1) {
              // Found exact match - open purchase form directly
              setPurchaseFormData({
                selectedMedicine: medicines[0],
                suggestedQuantity: purchaseData.quantity || 100 // Default quantity if not specified
              });
              response = `📋 Found medicine "${medicines[0].name}" (${medicines[0].brandName})\n\n💡 Opening purchase form with suggested quantity: ${purchaseData.quantity || 100} units`;
            } else if (medicines.length > 1) {
              // Multiple matches - show search results
              setMedicineSearchData({
                searchTerm: purchaseData.medicineName,
                filterBy: 'all',
                medicines: medicines.slice(0, 10),
                isLoading: false,
                currentPage: 1,
                totalPages: Math.ceil(medicines.length / 10),
                mode: 'purchase',
                suggestedQuantity: purchaseData.quantity
              });
              response = `🔍 Found ${medicines.length} medicines matching "${purchaseData.medicineName}". Select which one to purchase.`;
            } else {
              // No exact matches - show search panel to let user browse
              setMedicineSearchData({
                searchTerm: purchaseData.medicineName,
                filterBy: 'all',
                medicines: [],
                isLoading: false,
                currentPage: 1,
                totalPages: 1,
                mode: 'purchase',
                suggestedQuantity: purchaseData.quantity
              });
              response = `❌ No medicine found with name "${purchaseData.medicineName}". Opening search panel to browse available medicines.`;
            }
          } catch (error) {
            console.error('Medicine search error:', error);
            response = `❌ Error searching for medicine: ${error.message}`;
          }
        } else {
          // No specific medicine mentioned - show general search panel
          setMedicineSearchData({
            searchTerm: '',
            filterBy: 'all',
            medicines: [],
            isLoading: false,
            currentPage: 1,
            totalPages: 1,
            mode: 'purchase'
          });
          response = `🛒 Opening medicine search panel. Search for any medicine you want to purchase stock for.`;
        }
      } else if (userMessage.toLowerCase().includes('prescription history')) {
        // Extract mobile from "patient john doe ya 9876543210 give me prescription history"
        const mobileMatch = userMessage.match(/\b\d{10}\b/);
        if (!mobileMatch) {
          response = "Please provide a valid 10-digit mobile number. Example: 'patient john doe ya 9876543210 give me prescription history'";
        } else {
          const mobile = mobileMatch[0];
          const patient = await findPatientByMobile(mobile);

          if (!patient) {
            response = `Patient with mobile ${mobile} not found.`;
          } else {
            // Get prescription history with fulfilled/pending status
            try {
              const result = await getActivePrescriptionsByMobile(mobile);

              if (!result.found) {
                response = result.message;
              } else {
                const prescriptions = result.prescriptions || [];

                if (prescriptions.length === 0) {
                  response = `📋 ${patient.name} has no prescription history.`;
                } else {
                  // Separate fulfilled and pending prescriptions
                  const fulfilledPrescriptions = prescriptions.filter(p => p.status === 'COMPLETED' || p.status === 'FULFILLED');
                  const pendingPrescriptions = prescriptions.filter(p => p.status === 'ACTIVE' || p.status === 'PENDING');

                  response = `📋 Prescription History for ${patient.name}:\n\n`;

                  // Fulfilled prescriptions
                  if (fulfilledPrescriptions.length > 0) {
                    response += `✅ FULFILLED PRESCRIPTIONS (${fulfilledPrescriptions.length}):\n`;
                    fulfilledPrescriptions.forEach((p, idx) => {
                      response += `${idx + 1}. ID: ${p._id.slice(-6)} | ${p.medicines.length} medicines | ${new Date(p.date).toLocaleDateString()} | Status: ${p.status}\n`;
                    });
                    response += '\n';
                  }

                  // Pending prescriptions
                  if (pendingPrescriptions.length > 0) {
                    response += `⏳ PENDING PRESCRIPTIONS (${pendingPrescriptions.length}):\n`;
                    pendingPrescriptions.forEach((p, idx) => {
                      const remainingMedicines = p.medicines.filter(m => m.remainingQty > 0);
                      response += `${idx + 1}. ID: ${p._id.slice(-6)} | ${remainingMedicines.length}/${p.medicines.length} remaining | ${new Date(p.date).toLocaleDateString()} | Status: ${p.status}\n`;
                    });
                  }

                  if (fulfilledPrescriptions.length === 0 && pendingPrescriptions.length === 0) {
                    response = `📋 ${patient.name} has no prescription history.`;
                  }
                }
              }
            } catch (error) {
              response = `❌ Error fetching prescription history: ${error.message}`;
            }
          }
        }
      } else if (userMessage.toLowerCase().includes('purchase history')) {
        // Extract mobile from "patient john doe ya 9876543210 give me purchase history"
        const mobileMatch = userMessage.match(/\b\d{10}\b/);
        if (!mobileMatch) {
          response = "Please provide a valid 10-digit mobile number. Example: 'patient john doe ya 9876543210 give me purchase history'";
        } else {
          const mobile = mobileMatch[0];
          const patient = await findPatientByMobile(mobile);

          if (!patient) {
            response = `Patient with mobile ${mobile} not found.`;
          } else {
            // Get purchase history (sales records)
            try {
              const salesResponse = await fetch(`/api/medical/sales/patient/${patient._id}`);
              if (!salesResponse.ok) {
                throw new Error('Failed to fetch purchase history');
              }

              const salesData = await salesResponse.json();

              if (salesData.sales.length === 0) {
                response = `🛒 Purchase History for ${patient.name}:\n\nNo purchase history found. No medicines have been dispensed to this patient yet.`;
              } else {
                response = `🛒 Purchase History for ${patient.name}:\n\n`;

                // Show summary
                response += `📊 Summary: ${salesData.totalSales} purchases | Total spent: ${formatCurrency(salesData.totalAmount)}\n\n`;

                // Show individual purchases
                salesData.sales.forEach((sale, index) => {
                  response += `${index + 1}. 🧾 Bill: ${sale.billNumber}\n`;
                  response += `   📅 Date: ${new Date(sale.saleDate).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}\n`;
                  response += `   💰 Total: ${formatCurrency(sale.totalAmount)}\n`;
                  response += `   💳 Payment: ${sale.paymentMode}\n`;

                  // Show medicines
                  response += `   📦 Medicines:\n`;
                  sale.items.forEach(item => {
                    response += `      • ${item.medicineName}`;
                    if (item.brandName) response += ` (${item.brandName})`;
                    if (item.strength) response += ` ${item.strength}`;
                    response += ` - ${item.quantity} units @ ${formatCurrency(item.price)}\n`;
                  });

                  if (sale.prescriptionId) {
                    response += `   📋 From Prescription\n`;
                  }

                  response += `\n`;
                });

                response += `💡 This shows all medicines dispensed to the patient with bill details.`;
              }

            } catch (error) {
              response = `❌ Error fetching purchase history: ${error.message}`;
            }
          }
        }
  } else if (isAddToQueueIntent(userMessage)) {
    // Extract mobile from message
    const mobile = extractPatientMobile(userMessage);
    if (!mobile) {
      response = "Please provide a 10-digit mobile number. Example: 'add patient to queue for 9876543210'";
    } else {
      // Find patient by mobile
      const patient = await findPatientByMobile(mobile);
      if (!patient) {
        response = `Patient with mobile ${mobile} not found. Please create the patient first using 'create patient' command.`;
      } else {
        // Add patient to queue
        try {
          const queueData = {
            patientId: patient._id,
            doctorId: null, // Will be set by API based on current user
            priority: 'NORMAL',
            notes: 'Added via voice command'
          };

          const result = await addPatientToQueueAPI(queueData);
          response = `✅ Patient ${patient.name} added to queue successfully!\nToken: ${result.queueEntry.tokenNumber}\nQueue Position: ${result.queueEntry.queueNumber}`;
        } catch (error) {
          response = `❌ Failed to add patient to queue: ${error.message}`;
        }
      }
    }
  } else if (isCallNextPatientIntent(userMessage)) {
    try {
      const queueData = await getQueueStatusAPI();
      if (queueData && queueData.next && queueData.next.patient) {
        // Call the next patient
        const result = await callNextPatientAPI(queueData.next._id);
        response = `📢 Called next patient!\n${queueData.next.patient.name} (${queueData.next.patient.age}y)\nToken: ${queueData.next.tokenNumber}\nWaiting time: ${Math.floor(queueData.next.waitingTime / 60000)} minutes`;
      } else {
        response = "❌ No patients waiting in queue.";
      }
    } catch (error) {
      response = `❌ Failed to call next patient: ${error.message}`;
    }
  } else if (isCompleteVisitIntent(userMessage)) {
    try {
      const queueData = await getQueueStatusAPI();
      if (queueData.current) {
        // Complete the current visit
        const result = await completeVisitAPI(queueData.current._id);
        response = `✅ Visit completed for ${queueData.current.patient.name}!\nReady for next patient.`;
      } else {
        response = "❌ No patient is currently being seen.";
      }
    } catch (error) {
      response = `❌ Failed to complete visit: ${error.message}`;
    }
  } else if (isQueueStatusIntent(userMessage)) {
    try {
      const queueData = await getQueueStatusAPI();
      response = formatQueueStatus(queueData);
    } catch (error) {
      response = `❌ Failed to get queue status: ${error.message}`;
    }
      } else {
        response = "I'm sorry, I can help with creating patients, finding patients, creating prescriptions, serving prescriptions, creating medicines, creating suppliers, checking medicine stock, getting expiry/low stock reports, getting patient last visit details, checking/updating availability, or serving medicine. Try commands like 'create patient', 'find patient', 'create prescription for [mobile]', 'serve prescription for [mobile]', 'add medicine', 'add supplier', 'expiry medicine list', 'low stock medicine list', 'create csv expiry', 'check medicine', 'patient [name] ya [mobile] give me patient last visit details', 'check monday availability', 'update sun to tue availability', or 'serve medicine'.";
      }
    } catch (error) {
      response = `Error: ${error.message}`;
    }

    addToChat(response);
    if (ttsEnabled) {
      speak(response);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  // Availability Management Panel Component
  const AvailabilityPanel = ({ onSaveAvailability, onClose }) => {
    const [availability, setAvailability] = useState(
      availabilityData?.availability || []
    );

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const handleAvailabilityChange = (dayIndex, field, value) => {
      setAvailability(prev =>
        prev.map(item =>
          item.day === dayIndex
            ? { ...item, [field]: value }
            : item
        )
      );
    };

    const handleSave = async () => {
      try {
        // Here you would save to the backend
        // For now, just show success message
        onSaveAvailability(availability);
        setAvailabilityData(null);
      } catch (error) {
        console.error('Error saving availability:', error);
      }
    };

    return (
      <div style={{
        border: "2px solid #17a2b8",
        borderRadius: "10px",
        padding: "20px",
        marginBottom: "20px",
        backgroundColor: "#f0f8ff"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <h3 style={{ margin: 0, color: "#17a2b8" }}>📅 Doctor Availability Management</h3>
          <button
            onClick={() => setAvailabilityData(null)}
            style={{
              background: "none",
              border: "none",
              fontSize: "20px",
              cursor: "pointer",
              color: "#666"
            }}
          >
            ×
          </button>
        </div>

        <div style={{ marginBottom: "15px" }}>
          <strong>Days to Configure:</strong> {availabilityData?.days?.map(d => dayNames[d]).join(', ')}
        </div>

        <div style={{ display: "grid", gap: "15px" }}>
          {availability.map((item) => (
            <div key={item.day} style={{
              border: "1px solid #dee2e6",
              borderRadius: "8px",
              padding: "15px",
              backgroundColor: "white"
            }}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
                <input
                  type="checkbox"
                  checked={item.isAvailable}
                  onChange={(e) => handleAvailabilityChange(item.day, 'isAvailable', e.target.checked)}
                  style={{ marginRight: "10px" }}
                />
                <strong style={{ fontSize: "16px" }}>{dayNames[item.day]}</strong>
              </div>

              {item.isAvailable && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "10px", marginLeft: "25px" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", fontSize: "14px" }}>
                      Start Time:
                    </label>
                    <input
                      type="time"
                      value={item.startTime}
                      onChange={(e) => handleAvailabilityChange(item.day, 'startTime', e.target.value)}
                      style={{
                        width: "100%",
                        padding: "6px",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                        fontSize: "14px"
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", fontSize: "14px" }}>
                      End Time:
                    </label>
                    <input
                      type="time"
                      value={item.endTime}
                      onChange={(e) => handleAvailabilityChange(item.day, 'endTime', e.target.value)}
                      style={{
                        width: "100%",
                        padding: "6px",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                        fontSize: "14px"
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <button
            onClick={handleSave}
            style={{
              padding: "12px 24px",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "bold",
              marginRight: "10px"
            }}
          >
            💾 Save Availability
          </button>
          <button
            onClick={() => setAvailabilityData(null)}
            style={{
              padding: "12px 24px",
              backgroundColor: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "16px"
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  };

  // Medicine Entry Panel Component
  const MedicineEntryPanel = ({ onAddMedicine, onClose }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedMedicine, setSelectedMedicine] = useState(null);
    const [dose, setDose] = useState(1);
    const [duration, setDuration] = useState(3);
    const [timing, setTiming] = useState([]);

    const handleSearch = async (term) => {
      if (term.length < 2) {
        setSearchResults([]);
        return;
      }

      try {
        const medicines = await searchMedicinesAPI(term);
        setSearchResults(medicines.slice(0, 10)); // Limit results
      } catch (error) {
        console.error('Medicine search error:', error);
        setSearchResults([]);
      }
    };

    const handleTimingToggle = (time) => {
      setTiming(prev =>
        prev.includes(time)
          ? prev.filter(t => t !== time)
          : [...prev, time]
      );
    };

    const handleAdd = () => {
      if (!selectedMedicine || timing.length === 0) return;

      const totalQuantity = dose * duration * timing.length;
      const newMedicine = {
        medicine: selectedMedicine._id,
        medicineName: selectedMedicine.name,
        dosePerTime: dose,
        timing,
        durationDays: duration,
        totalQuantity
      };

      onAddMedicine(newMedicine);
      // Reset form
      setSearchTerm('');
      setSearchResults([]);
      setSelectedMedicine(null);
      setDose(1);
      setDuration(3);
      setTiming([]);
    };

    return (
      <div style={{
        border: "2px solid #007bff",
        borderRadius: "10px",
        padding: "20px",
        marginBottom: "20px",
        backgroundColor: "#f8f9ff"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <h3 style={{ margin: 0, color: "#007bff" }}>💊 Add Medicine</h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "20px",
              cursor: "pointer",
              color: "#666"
            }}
          >
            ×
          </button>
        </div>

        {/* Medicine Search */}
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Medicine:</label>
          <input
            type="text"
            placeholder="Search medicine..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              handleSearch(e.target.value);
            }}
            style={{
              width: "100%",
              padding: "8px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              fontSize: "14px"
            }}
          />
          {searchResults.length > 0 && (
            <div style={{
              border: "1px solid #ccc",
              borderRadius: "4px",
              maxHeight: "150px",
              overflowY: "auto",
              marginTop: "5px",
              backgroundColor: "white"
            }}>
              {searchResults.map(med => (
                <div
                  key={med._id}
                  onClick={() => {
                    setSelectedMedicine(med);
                    setSearchTerm(med.name);
                    setSearchResults([]);
                  }}
                  style={{
                    padding: "8px",
                    cursor: "pointer",
                    borderBottom: "1px solid #eee"
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = "#f5f5f5"}
                  onMouseLeave={(e) => e.target.style.backgroundColor = "white"}
                >
                  {med.name} ({med.brandName}) - {med.strength}
                </div>
              ))}
            </div>
          )}
          {selectedMedicine && (
            <div style={{ marginTop: "5px", fontSize: "12px", color: "#666" }}>
              Selected: {selectedMedicine.name} - {selectedMedicine.strength}
            </div>
          )}
        </div>

        {/* Dose Input */}
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Dose per time:</label>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              onClick={() => setDose(Math.max(1, dose - 1))}
              style={{
                padding: "5px 10px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              -
            </button>
            <span style={{ fontSize: "16px", fontWeight: "bold", minWidth: "30px", textAlign: "center" }}>
              {dose}
            </span>
            <button
              onClick={() => setDose(dose + 1)}
              style={{
                padding: "5px 10px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              +
            </button>
          </div>
        </div>

        {/* Duration Input */}
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Duration (days):</label>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              onClick={() => setDuration(Math.max(1, duration - 1))}
              style={{
                padding: "5px 10px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              -
            </button>
            <span style={{ fontSize: "16px", fontWeight: "bold", minWidth: "30px", textAlign: "center" }}>
              {duration}
            </span>
            <button
              onClick={() => setDuration(duration + 1)}
              style={{
                padding: "5px 10px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              +
            </button>
          </div>
        </div>

        {/* Timing Checkboxes */}
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Timing:</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
            {[
              'MORNING_BEFORE_FOOD',
              'MORNING_AFTER_FOOD',
              'AFTERNOON_BEFORE_FOOD',
              'AFTERNOON_AFTER_FOOD',
              'NIGHT_BEFORE_FOOD',
              'NIGHT_AFTER_FOOD'
            ].map(time => (
              <label key={time} style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={timing.includes(time)}
                  onChange={() => handleTimingToggle(time)}
                  style={{ marginRight: "5px" }}
                />
                {time.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
              </label>
            ))}
          </div>
        </div>

        {/* Total Quantity Display */}
        {selectedMedicine && timing.length > 0 && (
          <div style={{ marginBottom: "15px", padding: "10px", backgroundColor: "#e8f4fd", borderRadius: "4px" }}>
            <strong>Total Quantity:</strong> {dose * duration * timing.length} units
          </div>
        )}

        {/* Add Button */}
        <button
          onClick={handleAdd}
          disabled={!selectedMedicine || timing.length === 0}
          style={{
            padding: "10px 20px",
            backgroundColor: selectedMedicine && timing.length > 0 ? "#28a745" : "#ccc",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: selectedMedicine && timing.length > 0 ? "pointer" : "not-allowed",
            fontSize: "16px",
            fontWeight: "bold"
          }}
        >
          ➕ Add Medicine
        </button>
      </div>
    );
  };

  // Medicine Update Panel Component
  const MedicineUpdatePanel = ({ onUpdateMedicine, onClose }) => {
    const [dose, setDose] = useState(medicineUpdateData?.dose || 1);
    const [duration, setDuration] = useState(medicineUpdateData?.duration || 3);
    const [timing, setTiming] = useState(medicineUpdateData?.timing || []);

    const handleTimingToggle = (time) => {
      setTiming(prev =>
        prev.includes(time)
          ? prev.filter(t => t !== time)
          : [...prev, time]
      );
    };

    const handleUpdate = () => {
      if (!medicineUpdateData || timing.length === 0) return;

      // Recalculate total quantity
      const totalQuantity = dose * duration * timing.length;

      const updatedMedicine = {
        ...medicineUpdateData.currentMedicine,
        dosePerTime: dose,
        timing,
        durationDays: duration,
        totalQuantity
      };

      onUpdateMedicine(medicineUpdateData.medicineIndex, updatedMedicine);
      setMedicineUpdateData(null); // Close panel
    };

    if (!medicineUpdateData) return null;

    return (
      <div style={{
        border: "2px solid #ffc107",
        borderRadius: "10px",
        padding: "20px",
        marginBottom: "20px",
        backgroundColor: "#fffbf0"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <h3 style={{ margin: 0, color: "#856404" }}>📝 Update Medicine: {medicineUpdateData.currentMedicine.medicineName}</h3>
          <button
            onClick={() => setMedicineUpdateData(null)}
            style={{
              background: "none",
              border: "none",
              fontSize: "20px",
              cursor: "pointer",
              color: "#666"
            }}
          >
            ×
          </button>
        </div>

        {/* Current Values Display */}
        <div style={{ marginBottom: "15px", padding: "10px", backgroundColor: "#f8f9fa", borderRadius: "4px" }}>
          <strong>Current Values:</strong><br/>
          Dose: {medicineUpdateData.currentMedicine.dosePerTime} per time |
          Duration: {medicineUpdateData.currentMedicine.durationDays} days |
          Timing: {medicineUpdateData.currentMedicine.timing.join(', ')}
        </div>

        {/* Dose Input */}
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Dose per time:</label>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              onClick={() => setDose(Math.max(1, dose - 1))}
              style={{
                padding: "5px 10px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              -
            </button>
            <span style={{ fontSize: "16px", fontWeight: "bold", minWidth: "30px", textAlign: "center" }}>
              {dose}
            </span>
            <button
              onClick={() => setDose(dose + 1)}
              style={{
                padding: "5px 10px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              +
            </button>
          </div>
        </div>

        {/* Duration Input */}
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Duration (days):</label>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              onClick={() => setDuration(Math.max(1, duration - 1))}
              style={{
                padding: "5px 10px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              -
            </button>
            <span style={{ fontSize: "16px", fontWeight: "bold", minWidth: "30px", textAlign: "center" }}>
              {duration}
            </span>
            <button
              onClick={() => setDuration(duration + 1)}
              style={{
                padding: "5px 10px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              +
            </button>
          </div>
        </div>

        {/* Timing Checkboxes */}
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Timing:</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
            {[
              'MORNING_BEFORE_FOOD',
              'MORNING_AFTER_FOOD',
              'AFTERNOON_BEFORE_FOOD',
              'AFTERNOON_AFTER_FOOD',
              'NIGHT_BEFORE_FOOD',
              'NIGHT_AFTER_FOOD'
            ].map(time => (
              <label key={time} style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={timing.includes(time)}
                  onChange={() => handleTimingToggle(time)}
                  style={{ marginRight: "5px" }}
                />
                {time.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
              </label>
            ))}
          </div>
        </div>

        {/* New Values Preview */}
        <div style={{ marginBottom: "15px", padding: "10px", backgroundColor: "#e8f4fd", borderRadius: "4px" }}>
          <strong>New Values:</strong><br/>
          Dose: {dose} per time | Duration: {duration} days | Timing: {timing.join(', ')}<br/>
          <strong>Total Quantity: {dose * duration * timing.length} units</strong>
        </div>

        {/* Update Button */}
        <button
          onClick={handleUpdate}
          disabled={timing.length === 0}
          style={{
            padding: "10px 20px",
            backgroundColor: timing.length > 0 ? "#ffc107" : "#ccc",
            color: timing.length > 0 ? "#212529" : "white",
            border: "none",
            borderRadius: "4px",
            cursor: timing.length > 0 ? "pointer" : "not-allowed",
            fontSize: "16px",
            fontWeight: "bold"
          }}
        >
          🔄 Update Medicine
        </button>
      </div>
    );
  };

  // Patient Search Panel Component
  const PatientSearchPanel = ({ onSearchPatient, onClose }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [patients, setPatients] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchType, setSearchType] = useState('all'); // 'mobile', 'name', 'age', 'all'

    const patientsPerPage = 10;

    // Detect search type based on input
    const detectSearchType = (term) => {
      const trimmed = term.trim();

      // If it looks like a mobile number (exactly 10 digits)
      if (/^\d{10}$/.test(trimmed)) {
        return 'mobile';
      }

      // If it's just a number, check if it's a reasonable age (1-120) or mobile digits
      if (/^\d+$/.test(trimmed)) {
        const num = parseInt(trimmed);
        // If it's a reasonable age (1-120 years), treat as age search
        if (num >= 1 && num <= 120) {
          return 'age';
        }
        // Otherwise treat as mobile search (like searching for last 4 digits)
        return 'mobile';
      }

      // If it contains digits and looks like mobile (even partial, but not exactly 10)
      if (/\d/.test(trimmed) && trimmed.length <= 10) {
        return 'mobile';
      }

      // Otherwise, treat as name
      return 'name';
    };

    const handleSearch = async () => {
      if (!searchTerm.trim()) return;

      setIsLoading(true);
      try {
        const detectedType = detectSearchType(searchTerm);
        setSearchType(detectedType);

        // Get all patients (in real app, this would be paginated from server)
        const allPatients = await findPatientsAPI();

        // Filter based on search criteria
        let filteredPatients = [];
        const term = searchTerm.toLowerCase().trim();

        switch (detectedType) {
          case 'mobile':
            filteredPatients = allPatients.filter(p =>
              p.mobile.includes(term)
            );
            break;
          case 'age':
            const age = parseInt(term);
            filteredPatients = allPatients.filter(p =>
              p.age === age
            );
            break;
          case 'name':
            filteredPatients = allPatients.filter(p =>
              p.name.toLowerCase().includes(term)
            );
            break;
          default:
            // Search across all fields
            filteredPatients = allPatients.filter(p =>
              p.name.toLowerCase().includes(term) ||
              p.mobile.includes(term) ||
              p.age.toString().includes(term) ||
              p.gender.toLowerCase().includes(term)
            );
        }

        // Paginate results
        const totalPages = Math.ceil(filteredPatients.length / patientsPerPage);
        setTotalPages(totalPages);
        setCurrentPage(1);

        // Show first page
        const startIndex = 0;
        const endIndex = Math.min(patientsPerPage, filteredPatients.length);
        const pagePatients = filteredPatients.slice(startIndex, endIndex);

        setPatients(pagePatients);

        // Add search results to chat with action buttons
        if (pagePatients.length === 0) {
          addToChat(`❌ No patients found matching "${searchTerm}" (${detectedType})`, false);
        } else {
          // Create a special message object with patient results and action buttons
          const patientResultsMessage = {
            type: 'patient_results',
            totalFound: filteredPatients.length,
            currentPage,
            totalPages,
            patients: pagePatients,
            searchTerm,
            searchType: detectedType
          };
          addToChat(patientResultsMessage, false);
        }

      } catch (error) {
        console.error('Search error:', error);
        addToChat(`❌ Error searching patients: ${error.message}`, false);
      } finally {
        setIsLoading(false);
      }
    };

    const handleNextPage = () => {
      if (currentPage >= totalPages) return;

      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);

      // In real app, this would fetch from server
      // For now, we slice from the already fetched patients
      // This is a limitation of the current implementation

      addToChat(`📄 Showing page ${nextPage} of ${totalPages}\n\n[In real implementation, this would load next ${patientsPerPage} patients from server to reduce DB load]`, false);
    };

    const handleKeyPress = (e) => {
      if (e.key === 'Enter') {
        handleSearch();
      }
    };

    return (
      <div style={{
        border: "2px solid #007bff",
        borderRadius: "10px",
        padding: "20px",
        marginBottom: "20px",
        backgroundColor: "#f8f9ff"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <h3 style={{ margin: 0, color: "#007bff" }}>🔍 Find Patient</h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "20px",
              cursor: "pointer",
              color: "#666"
            }}
          >
            ×
          </button>
        </div>

        {/* Search Input */}
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
            Search by Mobile, Name, or Age:
          </label>
          <div style={{ display: "flex", gap: "10px" }}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter mobile (e.g. 9876543210), name (e.g. John), or age (e.g. 30)"
              style={{
                flex: 1,
                padding: "10px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                fontSize: "14px"
              }}
            />
            <button
              onClick={handleSearch}
              disabled={isLoading || !searchTerm.trim()}
              style={{
                padding: "10px 20px",
                backgroundColor: (searchTerm.trim() && !isLoading) ? "#007bff" : "#ccc",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: (searchTerm.trim() && !isLoading) ? "pointer" : "not-allowed",
                fontSize: "14px",
                fontWeight: "bold"
              }}
            >
              {isLoading ? "🔄 Searching..." : "🔍 Search"}
            </button>
          </div>
        </div>

        {/* Search Tips */}
        <div style={{ marginBottom: "15px", padding: "10px", backgroundColor: "#e7f3ff", borderRadius: "4px", fontSize: "12px" }}>
          <strong>💡 Search Examples:</strong><br/>
          • <code>9876543210</code> → Search by mobile number<br/>
          • <code>John</code> → Search by name<br/>
          • <code>30</code> → Find all patients aged 30<br/>
          • <code>john 9876</code> → Search across all fields
        </div>

        {/* Pagination Controls */}
        {patients.length > 0 && (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "10px", marginTop: "15px" }}>
            <span style={{ fontSize: "14px", color: "#666" }}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage >= totalPages}
              style={{
                padding: "8px 16px",
                backgroundColor: currentPage < totalPages ? "#28a745" : "#ccc",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: currentPage < totalPages ? "pointer" : "not-allowed",
                fontSize: "14px",
                fontWeight: "bold"
              }}
            >
              Next 10 Patients →
            </button>
          </div>
        )}

        {/* Patient Action Buttons */}
        {patients.length > 0 && (
          <div style={{ marginTop: "20px", padding: "15px", backgroundColor: "#f8f9fa", borderRadius: "8px" }}>
            <h4 style={{ margin: "0 0 15px 0", color: "#007bff" }}>⚡ Quick Actions for Found Patients:</h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px" }}>
              {patients.map((patient, index) => (
                <div key={patient._id || index} style={{
                  border: "1px solid #dee2e6",
                  borderRadius: "8px",
                  padding: "12px",
                  backgroundColor: "white"
                }}>
                  <div style={{ fontWeight: "bold", marginBottom: "8px", color: "#007bff" }}>
                    {patient.name} (Age: {patient.age})
                  </div>
                  <div style={{ fontSize: "12px", color: "#666", marginBottom: "10px" }}>
                    📱 ****{patient.mobile.slice(-4)} | {patient.gender}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                    <button
                      onClick={() => {
                        setMessage(`create prescription for ${patient.mobile}`);
                        setTimeout(() => handleSendMessage(), 100);
                        setPatientSearchData(null); // Close search panel
                      }}
                      style={{
                        padding: "6px 8px",
                        backgroundColor: "#28a745",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "11px",
                        fontWeight: "bold"
                      }}
                      title="Create prescription for this patient"
                    >
                      💊 Rx
                    </button>
                    <button
                      onClick={() => {
                        setMessage(`add patient to queue for ${patient.mobile}`);
                        setTimeout(() => handleSendMessage(), 100);
                        setPatientSearchData(null); // Close search panel
                      }}
                      style={{
                        padding: "6px 8px",
                        backgroundColor: "#007bff",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "11px",
                        fontWeight: "bold"
                      }}
                      title="Add patient to queue"
                    >
                      📋 Queue
                    </button>
                    <button
                      onClick={() => {
                        setMessage(`serve prescription for ${patient.mobile}`);
                        setTimeout(() => handleSendMessage(), 100);
                        setPatientSearchData(null); // Close search panel
                      }}
                      style={{
                        padding: "6px 8px",
                        backgroundColor: "#ffc107",
                        color: "#212529",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "11px",
                        fontWeight: "bold"
                      }}
                      title="Serve prescription for this patient"
                    >
                      ⚕️ Serve
                    </button>
                    <button
                      onClick={() => {
                        setMessage(`patient ${patient.name} ya ${patient.mobile} give me patient last visit details`);
                        setTimeout(() => handleSendMessage(), 100);
                        setPatientSearchData(null); // Close search panel
                      }}
                      style={{
                        padding: "6px 8px",
                        backgroundColor: "#6c757d",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "11px",
                        fontWeight: "bold"
                      }}
                      title="View patient history"
                    >
                      📋 History
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results Summary */}
        {patients.length > 0 && (
          <div style={{ marginTop: "10px", fontSize: "12px", color: "#666", textAlign: "center" }}>
            💡 Click action buttons above to perform tasks with selected patients | Showing {patients.length} patients per page to reduce database load
          </div>
        )}
      </div>
    );
  };

  // Patient Creation Panel Component
  const PatientCreationPanel = ({ onCreatePatient, onClose }) => {
    const [name, setName] = useState('');
    const [mobile, setMobile] = useState('');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState('Male');

    const handleCreate = async () => {
      if (!name.trim() || !mobile.trim() || !age || !gender) {
        alert('Please fill in all fields');
        return;
      }

      const patientData = {
        name: name.trim(),
        mobile: mobile.trim(),
        age: parseInt(age),
        gender: gender
      };

      try {
        const createdPatient = await createPatientAPI(patientData);
        const mobileLast4 = createdPatient.mobile.slice(-4);
        addToChat(`✅ Patient created successfully with name ${createdPatient.name} and mobile ending with ${mobileLast4}`, false);

        if (ttsEnabled) {
          speak(`Patient ${createdPatient.name} created successfully`);
        }

        onClose();
      } catch (error) {
        alert(`Error creating patient: ${error.message}`);
      }
    };

    return (
      <div style={{
        border: "2px solid #28a745",
        borderRadius: "10px",
        padding: "20px",
        marginBottom: "20px",
        backgroundColor: "#f8fff8"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <h3 style={{ margin: 0, color: "#155724" }}>👤 Create New Patient</h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "20px",
              cursor: "pointer",
              color: "#666"
            }}
          >
            ×
          </button>
        </div>

        {/* Name Input */}
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Patient Name:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter patient full name"
            style={{
              width: "100%",
              padding: "10px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              fontSize: "14px"
            }}
          />
        </div>

        {/* Mobile Input */}
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Mobile Number:</label>
          <input
            type="tel"
            value={mobile}
            onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
            placeholder="Enter 10-digit mobile number"
            style={{
              width: "100%",
              padding: "10px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              fontSize: "14px"
            }}
          />
        </div>

        {/* Age Input */}
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Age:</label>
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="Enter age"
            min="1"
            max="150"
            style={{
              width: "100%",
              padding: "10px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              fontSize: "14px"
            }}
          />
        </div>

        {/* Gender Select */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Gender:</label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              fontSize: "14px"
            }}
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Create Button */}
        <button
          onClick={handleCreate}
          disabled={!name.trim() || !mobile.trim() || !age || !gender}
          style={{
            padding: "12px 24px",
            backgroundColor: (name.trim() && mobile.trim() && age && gender) ? "#28a745" : "#ccc",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: (name.trim() && mobile.trim() && age && gender) ? "pointer" : "not-allowed",
            fontSize: "16px",
            fontWeight: "bold"
          }}
        >
          👤 Create Patient
        </button>
      </div>
    );
  };

  // Command Categories based on user role
  const getCommandCategories = () => {
    const categories = {
      DOCTOR: [
        { id: 'patient', name: '👤 Patient', commands: [
          'Add patient to queue',
          'Call next patient',
          'Complete visit',
          'Queue status',
          'Find patient',
          'Create patient'
        ]},
        { id: 'prescription', name: '💊 Prescription', commands: [
          'Create prescription',
          'Update prescription',
          'Check prescription',
          'Prescription history'
        ]},
        { id: 'reports', name: '📊 Reports', commands: [
          'Patient reports',
          'Queue reports',
          'Daily summary'
        ]}
      ],
      MEDICAL: [
        { id: 'patient', name: '👤 Patient', commands: [
          'Find patient',
          'Create patient'
        ]},
        { id: 'medicine', name: '💊 Medicine', commands: [
          'Check medicine stock',
          'Serve medicine',
          'Add medicine',
          'Low stock alert'
        ]},
        { id: 'prescription', name: '📋 Prescription', commands: [
          'Serve prescription',
          'Check prescription',
          'Prescription status'
        ]},
        { id: 'inventory', name: '📦 Inventory', commands: [
          'Expiry list',
          'Low stock list',
          'Manage suppliers',
          'Generate CSV'
        ]}
      ]
    };
    return categories[userRole] || categories.DOCTOR;
  };

  const handleQuickAction = (action) => {
    const actionMap = {
      'Add patient to queue': () => setMessage('add patient to queue for '),
      'Call next patient': () => setMessage('call next patient'),
      'Complete visit': () => setMessage('complete visit'),
      'Queue status': () => setMessage('queue status'),
      'Create prescription': () => setMessage('create prescription for '),
      'Check medicine stock': () => setMessage('check medicine '),
      'Serve medicine': () => setMessage('serve medicine'),
      'Find patient': () => setMessage('find patient '),
      'Create patient': () => setMessage('create patient '),
      'Serve prescription': () => setMessage('serve prescription for '),
      'Expiry list': () => setMessage('expiry medicine list'),
      'Low stock list': () => setMessage('low stock medicine list'),
      'Add supplier': () => setMessage('add supplier '),
      'Generate CSV': () => setMessage('create csv expiry'),
      'Patient reports': () => setMessage('patient reports'),
      'Queue reports': () => setMessage('queue reports'),
      'Daily summary': () => setMessage('daily summary')
    };

    if (actionMap[action]) {
      actionMap[action]();
      // Auto-submit after a short delay
      setTimeout(() => handleSendMessage(), 100);
    }
  };

  return (
    <div style={{ padding: 30, maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2>🤖 AI Assistant - {userRole} Mode</h2>
        <div style={{ fontSize: '14px', color: '#666' }}>
          Role: <strong>{userRole}</strong> | Category: <strong>{activeCategory}</strong>
        </div>
      </div>



      {/* Availability Panel - Visual Availability Management */}
      {availabilityData && (
        <AvailabilityPanel
          onSaveAvailability={(availability) => {
            addToChat(`✅ Availability updated successfully!\n${availability.map(item => {
              const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][item.day];
              return `${dayName}: ${item.isAvailable ? `${item.startTime} - ${item.endTime}` : 'Not Available'}`;
            }).join('\n')}`, false);

            if (ttsEnabled) {
              speak('Availability updated successfully');
            }
          }}
          onClose={() => setAvailabilityData(null)}
        />
      )}

      {/* Medicine Update Panel - Visual Update */}
      {medicineUpdateData && (
        <MedicineUpdatePanel
          onUpdateMedicine={(index, updatedMedicine) => {
            const updatedMedicines = [...createPrescriptionState.medicines];
            updatedMedicines[index] = updatedMedicine;

            setCreatePrescriptionState({
              ...createPrescriptionState,
              medicines: updatedMedicines
            });

            addToChat(`✅ Updated "${updatedMedicine.medicineName}":\nDose: ${updatedMedicine.dosePerTime} per time\nDuration: ${updatedMedicine.durationDays} days\nTiming: ${updatedMedicine.timing.join(', ')}\nTotal: ${updatedMedicine.totalQuantity} units`, false);

            if (ttsEnabled) {
              speak(`Updated ${updatedMedicine.medicineName}`);
            }
          }}
          onClose={() => setMedicineUpdateData(null)}
        />
      )}

      {/* Medicine Entry Panel - Hybrid UI */}
      {createPrescriptionState?.step === 'ADD_MEDICINE' && (
        <MedicineEntryPanel
          onAddMedicine={async (medicine) => {
            const updatedMedicines = [...(createPrescriptionState.medicines || []), medicine];
            setCreatePrescriptionState({
              ...createPrescriptionState,
              medicines: updatedMedicines
            });

            addToChat(`✅ Added: ${medicine.medicineName}\nDose: ${medicine.dosePerTime} per time\nDuration: ${medicine.durationDays} days\nTiming: ${medicine.timing.join(', ')}\nTotal: ${medicine.totalQuantity} units`, false);

            if (ttsEnabled) {
              speak(`Added ${medicine.medicineName} to prescription`);
            }
          }}
          onClose={() => {
            // Panel stays open, doctors can close it when done
          }}
        />
      )}

      {/* Patient Search Panel - Visual Patient Search */}
      {patientSearchData && (
        <PatientSearchPanel
          onSearchPatient={(patients) => {
            // Patient search is handled inside the component
          }}
          onClose={() => setPatientSearchData(null)}
        />
      )}

      {/* Patient Creation Panel - Visual Patient Creation */}
      {patientCreationData && (
        <PatientCreationPanel
          onCreatePatient={(patient) => {
            // Patient creation is handled inside the component
          }}
          onClose={() => setPatientCreationData(null)}
        />
      )}



      {/* Medicine Form Panel - Add/Update */}
      {medicineFormData && (
        <MedicineFormPanel
          mode={medicineFormData.mode}
          medicine={medicineFormData.medicine}
          onSave={(medicine) => {
            setMedicineFormData(null);
            // Optionally show medicine management panel again
            setMedicineManagementData({ mode: 'list' });
          }}
          onClose={() => setMedicineFormData(null)}
        />
      )}

      {/* Medicine Add Form Panel - Simple form with required fields */}
      {medicineAddFormData && (
        <MedicineAddFormPanel
          onSave={(medicine) => {
            setMedicineAddFormData(null);
            addToChat(`✅ Medicine "${medicine.name}" added successfully!`, false);
          }}
          onClose={() => setMedicineAddFormData(null)}
        />
      )}

      {/* Medicine Search Panel */}
      {medicineSearchData && (
        <MedicineSearchPanel
          onSelectMedicine={(medicine) => {
            setMedicineSearchData(null);
            addToChat(`🔍 Medicine selected: ${medicine.name} (${medicine.brandName})`, false);
          }}
          onClose={() => setMedicineSearchData(null)}
        />
      )}

      {/* Medicine Update Form Panel */}
      {medicineUpdateFormData && (
        <MedicineUpdateFormPanel
          onSave={(medicine) => {
            setMedicineUpdateFormData(null);
            addToChat(`✅ Medicine "${medicine.name}" updated successfully!`, false);
          }}
          onClose={() => setMedicineUpdateFormData(null)}
        />
      )}

      {/* Medicine Stock Panel */}
      {medicineStockData && (
        <MedicineStockPanel
          onClose={() => setMedicineStockData(null)}
        />
      )}

      {/* Inventory Overview Panel */}
      {inventoryOverviewData && (
        <InventoryOverviewPanel
          onClose={() => setInventoryOverviewData(null)}
        />
      )}

      {/* Purchase Form Panel */}
      {purchaseFormData && (
        <PurchaseFormPanel
          onSave={() => setPurchaseFormData(null)}
          onClose={() => setPurchaseFormData(null)}
        />
      )}

      {/* Multiple Purchase Panel */}
      {multiplePurchasePanelData && (
        <MultiplePurchasePanel
          onSave={(purchase) => {
            addToChat(`✅ Multiple purchase created successfully!\nInvoice: ${purchase.invoiceNumber}\nTotal: ₹${purchase.totalPurchaseAmount}\nItems: ${purchase.itemsCount}`, false);
            setMultiplePurchasePanelData(null);
          }}
          onClose={() => setMultiplePurchasePanelData(null)}
        />
      )}

      {/* Supplier Management Panel */}
      {supplierManagementData && (
        <SupplierManagementPanel
          onAction={(action, supplier) => {
            setSupplierManagementData(null);
            switch (action) {
              case 'add':
                setSupplierAddFormData({});
                break;
              case 'search':
                setSupplierSearchData({});
                break;
              case 'update':
                if (supplier) setSupplierUpdateFormData({ selectedSupplier: supplier });
                break;
              case 'delete':
                if (supplier) setSupplierDeleteData({ selectedSupplier: supplier });
                break;
            }
          }}
          onClose={() => setSupplierManagementData(null)}
        />
      )}

      {/* Supplier Add Form Panel */}
      {supplierAddFormData && (
        <SupplierAddFormPanel
          onSave={(supplier) => {
            setSupplierAddFormData(null);
            addToChat(`✅ Supplier "${supplier.name}" added successfully!`, false);
          }}
          onClose={() => setSupplierAddFormData(null)}
        />
      )}

      {/* Supplier Search Panel */}
      {supplierSearchData && (
        <SupplierSearchPanel
          onSelectSupplier={(supplier) => {
            setSupplierSearchData(null);
            addToChat(`🔍 Supplier selected: ${supplier.name} (${supplier.companyName})`, false);
          }}
          onClose={() => setSupplierSearchData(null)}
        />
      )}

      {/* Supplier Update Form Panel */}
      {supplierUpdateFormData && (
        <SupplierUpdateFormPanel
          onSave={(supplier) => {
            setSupplierUpdateFormData(null);
            addToChat(`✅ Supplier "${supplier.name}" updated successfully!`, false);
          }}
          onClose={() => setSupplierUpdateFormData(null)}
        />
      )}

      {/* Supplier Delete Confirmation Panel */}
      {supplierDeleteData && (
        <SupplierDeletePanel
          onConfirm={() => {
            setSupplierDeleteData(null);
            addToChat(`✅ Supplier "${supplierDeleteData.selectedSupplier.name}" deleted successfully!`, false);
          }}
          onCancel={() => setSupplierDeleteData(null)}
        />
      )}

      <div style={{ border: "1px solid #ccc", borderRadius: "10px", padding: "20px", height: "400px", overflowY: "auto", marginBottom: "20px", backgroundColor: "#f9f9f9" }}>
        {chatHistory.length === 0 && (
          <p style={{ color: "#666", textAlign: "center", marginTop: "150px" }}>
            Start a conversation...<br/>
            <small style={{ color: "#999" }}>
              Try: "create prescription for 9876543210" - you'll see a smart medicine panel!
            </small>
          </p>
        )}
        {chatHistory.map((msg, index) => (
          <div key={index} style={{ marginBottom: "10px", textAlign: msg.isUser ? "right" : "left" }}>
            {msg.content && typeof msg.content === 'object' && msg.content.type === 'commands' ? (
              // Render command buttons
              <div style={{
                display: "inline-block",
                padding: "15px",
                borderRadius: "15px",
                backgroundColor: "#e9ecef",
                color: "black",
                maxWidth: "70%"
              }}>
                <div style={{ marginBottom: "10px", fontWeight: "bold" }}>
                  📋 {msg.content.category} Commands:
                </div>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                  gap: "8px"
                }}>
                  {msg.content.commands.map((cmd, cmdIndex) => (
                    <button
                      key={cmdIndex}
                      onClick={() => {
                        setMessage(cmd.command);
                        // Auto-submit after a short delay
                        setTimeout(() => handleSendMessage(), 100);
                      }}
                      style={{
                        padding: "8px 12px",
                        borderRadius: "8px",
                        border: "1px solid #007bff",
                        backgroundColor: "#e7f3ff",
                        color: "#007bff",
                        cursor: "pointer",
                        fontSize: "14px",
                        textAlign: "center",
                        transition: "all 0.2s"
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = "#d1ecf1";
                        e.target.style.borderColor = "#007bff";
                        e.target.style.transform = "scale(1.02)";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = "#e7f3ff";
                        e.target.style.borderColor = "#007bff";
                        e.target.style.transform = "scale(1)";
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}>
                        <span>
                          {cmd.command.includes('patient') ? '👤' :
                           cmd.command.includes('prescription') ? '💊' :
                           cmd.command.includes('medicine') ? '💊' :
                           cmd.command.includes('queue') ? '📋' :
                           cmd.command.includes('report') ? '📊' :
                           cmd.command.includes('supplier') ? '🏢' :
                           cmd.command.includes('CSV') ? '📄' : '⚡'}
                        </span>
                        <span>{cmd.command}</span>
                        {cmd.frequency > 1 && (
                          <span style={{
                            fontSize: '10px',
                            backgroundColor: '#28a745',
                            color: 'white',
                            padding: '1px 4px',
                            borderRadius: '8px',
                            marginLeft: '4px'
                          }}>
                            {cmd.frequency}x
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
                <div style={{ marginTop: "10px", fontSize: "12px", color: "#666", textAlign: "center" }}>
                  💡 Click any button above to execute the command!
                </div>
              </div>
            ) : msg.content && typeof msg.content === 'object' && msg.content.type === 'patient_results' ? (
              // Render patient search results with action buttons
              <div style={{
                display: "inline-block",
                padding: "15px",
                borderRadius: "15px",
                backgroundColor: "#e9ecef",
                color: "black",
                maxWidth: "90%"
              }}>
                <div style={{ marginBottom: "10px", fontWeight: "bold" }}>
                  📋 Found {msg.content.totalFound} patient(s) - Showing page {msg.content.currentPage} of {msg.content.totalPages}:
                </div>

                {/* Patient list */}
                <div style={{ marginBottom: "15px" }}>
                  {msg.content.patients.map((patient, idx) => (
                    <div key={patient._id || idx} style={{
                      padding: "8px",
                      marginBottom: "5px",
                      backgroundColor: "white",
                      borderRadius: "5px",
                      border: "1px solid #dee2e6"
                    }}>
                      {idx + 1}. {patient.name} (Age: {patient.age}, {patient.gender})
                      <br/>
                      <span style={{ fontSize: "12px", color: "#666" }}>📱 ****{patient.mobile.slice(-4)}</span>
                    </div>
                  ))}
                </div>

                {/* Action buttons for each patient */}
                <div style={{ marginTop: "15px", padding: "10px", backgroundColor: "#f8f9fa", borderRadius: "8px" }}>
                  <div style={{ fontWeight: "bold", marginBottom: "10px", color: "#007bff" }}>⚡ Quick Actions:</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "8px" }}>
                    {msg.content.patients.map((patient, idx) => (
                      <div key={`actions-${patient._id || idx}`} style={{
                        padding: "10px",
                        backgroundColor: "white",
                        borderRadius: "6px",
                        border: "1px solid #dee2e6"
                      }}>
                        <div style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "6px", color: "#007bff" }}>
                          {patient.name}
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: userRole === 'MEDICAL' ? "1fr" : "1fr 1fr", gap: "4px" }}>
                          {userRole === 'MEDICAL' ? (
                            // MEDICAL staff actions
                            <>
                              <button
                                onClick={() => {
                                  setMessage(`serve medicine for ${patient.mobile}`);
                                  setTimeout(() => handleSendMessage(), 100);
                                }}
                                style={{
                                  padding: "4px 6px",
                                  backgroundColor: "#28a745",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "3px",
                                  cursor: "pointer",
                                  fontSize: "10px",
                                  fontWeight: "bold"
                                }}
                                title="Serve medicine"
                              >
                                💊 Serve Medicine
                              </button>
                              <button
                                onClick={() => {
                                  setMessage(`patient ${patient.name} ya ${patient.mobile} give me prescription history`);
                                  setTimeout(() => handleSendMessage(), 100);
                                }}
                                style={{
                                  padding: "4px 6px",
                                  backgroundColor: "#007bff",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "3px",
                                  cursor: "pointer",
                                  fontSize: "10px",
                                  fontWeight: "bold"
                                }}
                                title="View prescription history"
                              >
                                📋 Rx History
                              </button>
                              <button
                                onClick={() => {
                                  setMessage(`patient ${patient.name} ya ${patient.mobile} give me purchase history`);
                                  setTimeout(() => handleSendMessage(), 100);
                                }}
                                style={{
                                  padding: "4px 6px",
                                  backgroundColor: "#6c757d",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "3px",
                                  cursor: "pointer",
                                  fontSize: "10px",
                                  fontWeight: "bold"
                                }}
                                title="View purchase history"
                              >
                                🛒 Purchase History
                              </button>
                            </>
                          ) : userRole === 'DOCTOR' ? (
                            // DOCTOR actions
                            <>
                              <button
                                onClick={() => {
                                  setMessage(`create prescription for ${patient.mobile}`);
                                  setTimeout(() => handleSendMessage(), 100);
                                }}
                                style={{
                                  padding: "4px 6px",
                                  backgroundColor: "#28a745",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "3px",
                                  cursor: "pointer",
                                  fontSize: "10px",
                                  fontWeight: "bold"
                                }}
                                title="Create prescription"
                              >
                                💊 Rx
                              </button>
                              <button
                                onClick={() => {
                                  setMessage(`add patient to queue for ${patient.mobile}`);
                                  setTimeout(() => handleSendMessage(), 100);
                                }}
                                style={{
                                  padding: "4px 6px",
                                  backgroundColor: "#007bff",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "3px",
                                  cursor: "pointer",
                                  fontSize: "10px",
                                  fontWeight: "bold"
                                }}
                                title="Add to queue"
                              >
                                📋 Queue
                              </button>
                              <button
                                onClick={() => {
                                  setMessage(`check appointments for ${patient.mobile}`);
                                  setTimeout(() => handleSendMessage(), 100);
                                }}
                                style={{
                                  padding: "4px 6px",
                                  backgroundColor: "#17a2b8",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "3px",
                                  cursor: "pointer",
                                  fontSize: "10px",
                                  fontWeight: "bold"
                                }}
                                title="Check appointments"
                              >
                                📅 Appts
                              </button>
                              <button
                                onClick={() => {
                                  setMessage(`patient ${patient.name} ya ${patient.mobile} give me patient last visit details`);
                                  setTimeout(() => handleSendMessage(), 100);
                                }}
                                style={{
                                  padding: "4px 6px",
                                  backgroundColor: "#6c757d",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "3px",
                                  cursor: "pointer",
                                  fontSize: "10px",
                                  fontWeight: "bold"
                                }}
                                title="View history"
                              >
                                📋 History
                              </button>
                            </>
                          ) : (
                            // PATIENT actions (if needed in future)
                            <>
                              <button
                                onClick={() => {
                                  setMessage(`patient ${patient.name} ya ${patient.mobile} give me patient last visit details`);
                                  setTimeout(() => handleSendMessage(), 100);
                                }}
                                style={{
                                  padding: "6px 8px",
                                  backgroundColor: "#6c757d",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "4px",
                                  cursor: "pointer",
                                  fontSize: "11px",
                                  fontWeight: "bold"
                                }}
                                title="View history"
                              >
                                📋 History
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: "10px", fontSize: "12px", color: "#666", textAlign: "center" }}>
                  💡 Click action buttons above to perform tasks with patients
                </div>
              </div>
            ) : msg.content && typeof msg.content === 'object' && msg.content.type === 'prescription_actions' ? (
              // Render prescription action buttons
              <div style={{
                display: "inline-block",
                padding: "15px",
                borderRadius: "15px",
                backgroundColor: "#e9ecef",
                color: "black",
                maxWidth: "90%"
              }}>
                <div style={{ marginBottom: "10px" }}>
                  {msg.content.message}
                </div>

                {/* Prescription Management Action Buttons */}
                <div style={{ marginTop: "15px", padding: "10px", backgroundColor: "#f8f9fa", borderRadius: "8px" }}>
                  <div style={{ fontWeight: "bold", marginBottom: "10px", color: "#007bff" }}>⚡ Prescription Management Actions:</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "8px" }}>
                    <div style={{
                      padding: "12px",
                      backgroundColor: "white",
                      borderRadius: "6px",
                      border: "1px solid #dee2e6"
                    }}>
                      <div style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "8px", color: "#007bff" }}>
                        Current Prescription Status
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px" }}>
                        <button
                          onClick={() => {
                            setMessage(`check prescription`);
                            setTimeout(() => handleSendMessage(), 100);
                          }}
                          style={{
                            padding: "6px 8px",
                            backgroundColor: "#17a2b8",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "11px",
                            fontWeight: "bold"
                          }}
                          title="Check current prescription status"
                        >
                          📋 Status
                        </button>
                        <button
                          onClick={() => {
                            setMessage(`update prescription`);
                            setTimeout(() => handleSendMessage(), 100);
                          }}
                          style={{
                            padding: "6px 8px",
                            backgroundColor: "#ffc107",
                            color: "#212529",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "11px",
                            fontWeight: "bold"
                          }}
                          title="Update existing prescription"
                        >
                          ✏️ Update
                        </button>
                        <button
                          onClick={() => {
                            setMessage(`create prescription`);
                            setTimeout(() => handleSendMessage(), 100);
                          }}
                          style={{
                            padding: "6px 8px",
                            backgroundColor: "#28a745",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "11px",
                            fontWeight: "bold"
                          }}
                          title="Finalize and create prescription"
                        >
                          ✅ Create
                        </button>
                        <button
                          onClick={() => {
                            setMessage(`list prescription`);
                            setTimeout(() => handleSendMessage(), 100);
                          }}
                          style={{
                            padding: "6px 8px",
                            backgroundColor: "#6c757d",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "11px",
                            fontWeight: "bold"
                          }}
                          title="List all medicines in prescription"
                        >
                          📝 List
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: "10px", fontSize: "12px", color: "#666", textAlign: "center" }}>
                  💡 Click action buttons above to manage the prescription
                </div>
              </div>
            ) : msg.content && typeof msg.content === 'object' && msg.content.type === 'prescription_selection' ? (
              // Render prescription selection buttons
              <div style={{
                display: "inline-block",
                padding: "15px",
                borderRadius: "15px",
                backgroundColor: "#e9ecef",
                color: "black",
                maxWidth: "90%"
              }}>
                <div style={{ marginBottom: "10px", fontWeight: "bold" }}>
                  {msg.content.message}
                </div>

                {/* Prescription list with serve buttons */}
                <div style={{ marginTop: "15px", padding: "10px", backgroundColor: "#f8f9fa", borderRadius: "8px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "12px" }}>
                    {msg.content.prescriptions.map((prescription, idx) => (
                      <div key={prescription._id} style={{
                        padding: "12px",
                        backgroundColor: "white",
                        borderRadius: "6px",
                        border: "1px solid #dee2e6"
                      }}>
                        <div style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "8px", color: "#007bff" }}>
                          {idx + 1}. Prescription {prescription._id.slice(-6)}
                        </div>
                        <div style={{ fontSize: "12px", color: "#666", marginBottom: "10px" }}>
                          {prescription.medicines.length} medicine(s) • {new Date(prescription.date).toLocaleDateString()}
                        </div>
                        <div style={{ fontSize: "11px", color: "#666", marginBottom: "10px" }}>
                          Status: {prescription.status}
                        </div>
                        <button
                          onClick={() => {
                            // Set the selected prescription and move to serve step
                            setServePrescriptionState({
                              step: 'SERVE_MEDICINE',
                              patientId: msg.content.patient._id,
                              patientName: msg.content.patient.name,
                              prescriptions: msg.content.prescriptions,
                              selectedPrescription: prescription
                            });

                            // Create medicine dispensing panel with buttons
                            const remainingMedicines = prescription.medicines.filter(med => med.remainingQty > 0);

                            const medicineDispensingMessage = {
                              type: 'medicine_dispensing',
                              prescription: prescription,
                              medicines: remainingMedicines,
                              message: `📋 Selected Prescription: ${prescription._id.slice(-6)}\nStatus: ${prescription.status}\n\n📦 Select medicines to dispense:`
                            };
                            addToChat(medicineDispensingMessage, false);
                          }}
                          style={{
                            width: "100%",
                            padding: "8px",
                            backgroundColor: "#28a745",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "12px",
                            fontWeight: "bold"
                          }}
                          title={`Serve prescription ${prescription._id.slice(-6)}`}
                        >
                          ⚕️ Serve This Prescription
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: "10px", fontSize: "12px", color: "#666", textAlign: "center" }}>
                  💡 Click "Serve This Prescription" to select which prescription to dispense medicine for
                </div>
              </div>
            ) : msg.content && typeof msg.content === 'object' && msg.content.type === 'medicine_dispensing' ? (
              // Render medicine dispensing buttons
              <div style={{
                display: "inline-block",
                padding: "15px",
                borderRadius: "15px",
                backgroundColor: "#e9ecef",
                color: "black",
                maxWidth: "90%"
              }}>
                <div style={{ marginBottom: "10px", fontWeight: "bold" }}>
                  {msg.content.message}
                </div>

                {/* Medicine list with dispensing buttons */}
                <div style={{ marginTop: "15px", padding: "10px", backgroundColor: "#f8f9fa", borderRadius: "8px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "15px" }}>
                    {msg.content.medicines.map((medicine, idx) => (
                      <div key={medicine._id} style={{
                        padding: "15px",
                        backgroundColor: "white",
                        borderRadius: "8px",
                        border: "1px solid #dee2e6"
                      }}>
                        <div style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "10px", color: "#007bff" }}>
                          💊 {medicine.medicineName}
                        </div>
                        <div style={{ fontSize: "13px", color: "#666", marginBottom: "15px", lineHeight: "1.4" }}>
                          <div>Prescribed: <strong>{medicine.prescribedQty}</strong> units</div>
                          <div>Already Given: <strong>{medicine.dispensedQty}</strong> units</div>
                          <div>Remaining: <strong style={{ color: "#28a745" }}>{medicine.remainingQty}</strong> units</div>
                        </div>

                        {/* Quantity selection buttons */}
                        <div style={{ marginBottom: "15px" }}>
                          <div style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "8px", color: "#666" }}>
                            Select Quantity to Dispense:
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(60px, 1fr))", gap: "8px" }}>
                            {[1, 2, 3, 5, 7, 10, 15, 20].filter(qty => qty <= medicine.remainingQty).map(qty => (
                              <button
                                key={qty}
                                onClick={() => {
                                  // Set requested quantity for this medicine
                                  const updatedMedicines = msg.content.medicines.map(m =>
                                    m._id === medicine._id ? { ...m, requestedQty: qty } : m
                                  );
                                  const updatedMessage = { ...msg.content, medicines: updatedMedicines };
                                  // Update the message in chat history
                                  const updatedHistory = chatHistory.map(chatMsg =>
                                    chatMsg === msg ? { ...chatMsg, content: updatedMessage } : chatMsg
                                  );
                                  setChatHistory(updatedHistory);
                                }}
                                style={{
                                  padding: "6px 8px",
                                  backgroundColor: medicine.requestedQty === qty ? "#28a745" : "#f8f9fa",
                                  color: medicine.requestedQty === qty ? "white" : "#333",
                                  border: "1px solid #dee2e6",
                                  borderRadius: "4px",
                                  cursor: "pointer",
                                  fontSize: "12px",
                                  fontWeight: "bold"
                                }}
                              >
                                {qty}
                              </button>
                            ))}
                            <button
                              onClick={() => {
                                // Set to remaining quantity
                                const updatedMedicines = msg.content.medicines.map(m =>
                                  m._id === medicine._id ? { ...m, requestedQty: medicine.remainingQty } : m
                                );
                                const updatedMessage = { ...msg.content, medicines: updatedMedicines };
                                const updatedHistory = chatHistory.map(chatMsg =>
                                  chatMsg === msg ? { ...chatMsg, content: updatedMessage } : chatMsg
                                );
                                setChatHistory(updatedHistory);
                              }}
                              style={{
                                padding: "6px 8px",
                                backgroundColor: medicine.requestedQty === medicine.remainingQty ? "#17a2b8" : "#e9ecef",
                                color: medicine.requestedQty === medicine.remainingQty ? "white" : "#333",
                                border: "1px solid #dee2e6",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontSize: "12px",
                                fontWeight: "bold"
                              }}
                            >
                              All
                            </button>
                          </div>
                        </div>

                        {/* Selected quantity display */}
                        {medicine.requestedQty > 0 && (
                          <div style={{
                            padding: "8px",
                            backgroundColor: "#e8f4fd",
                            borderRadius: "4px",
                            fontSize: "12px",
                            marginBottom: "10px"
                          }}>
                            ✅ Selected: <strong>{medicine.requestedQty} units</strong>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Action buttons */}
                  <div style={{ marginTop: "20px", padding: "15px", backgroundColor: "white", borderRadius: "8px", border: "1px solid #dee2e6" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontSize: "14px", fontWeight: "bold", color: "#007bff" }}>
                        Selected Medicines: {msg.content.medicines.filter(m => m.requestedQty > 0).length} / {msg.content.medicines.length}
                      </div>
                      <div style={{ display: "flex", gap: "10px" }}>
                        <button
                          onClick={() => {
                            // Dispense all remaining quantities
                            const updatedMedicines = msg.content.medicines.map(m => ({
                              ...m,
                              requestedQty: m.remainingQty
                            }));
                            const updatedMessage = { ...msg.content, medicines: updatedMedicines };
                            const updatedHistory = chatHistory.map(chatMsg =>
                              chatMsg === msg ? { ...chatMsg, content: updatedMessage } : chatMsg
                            );
                            setChatHistory(updatedHistory);
                          }}
                          style={{
                            padding: "8px 16px",
                            backgroundColor: "#ffc107",
                            color: "#212529",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "13px",
                            fontWeight: "bold"
                          }}
                        >
                          📦 Dispense All
                        </button>
                        <button
                          onClick={async () => {
                            // Confirm dispensing
                            const selectedMedicines = msg.content.medicines.filter(m => m.requestedQty > 0);
                            if (selectedMedicines.length === 0) {
                              addToChat("❌ Please select at least one medicine to dispense.", false);
                              return;
                            }

                            try {
                              // Update the state with selected quantities before confirming
                              const prescription = servePrescriptionState.selectedPrescription;
                              const updatedMedicines = prescription.medicines.map(med => {
                                const selectedMed = msg.content.medicines.find(m => m._id === med._id);
                                if (selectedMed && selectedMed.requestedQty > 0) {
                                  return { ...med, requestedQty: selectedMed.requestedQty };
                                }
                                return med;
                              });

                              // Create sale directly instead of using the state machine
                              const saleItems = [];
                              for (const med of updatedMedicines) {
                                const requestedQty = med.requestedQty;
                                if (requestedQty > 0) {
                                  // Validate quantity doesn't exceed remaining
                                  if (requestedQty > med.remainingQty) {
                                    addToChat(`❌ Cannot dispense ${requestedQty} units of ${med.medicineName}. Only ${med.remainingQty} units remaining.`, false);
                                    return;
                                  }

                                  // Find available inventory for this medicine
                                  const medicineId = med.medicine._id || med.medicine;
                                  const inventory = await findAvailableInventory(medicineId);

                                  if (!inventory) {
                                    addToChat(`❌ No stock available for ${med.medicineName}`, false);
                                    return;
                                  }

                                  saleItems.push({
                                    medicineId: medicineId,
                                    inventoryId: inventory._id,
                                    quantity: requestedQty
                                  });
                                }
                              }

                              if (saleItems.length === 0) {
                                addToChat("❌ No medicines selected to dispense.", false);
                                return;
                              }

                              // Create sale with prescription reference using the proper API function
                              const saleData = {
                                patientId: servePrescriptionState.patientId,
                                prescriptionId: prescription._id,
                                items: saleItems,
                                paymentMode: "CASH" // Default to CASH for prescriptions
                              };

                              // Use the createSaleAPI function from patientNLP.js which generates bill numbers
                              const sale = await createSaleAPI(saleData);

                              // Reset state
                              setServePrescriptionState(null);

                              addToChat(`✅ Medicine dispensed successfully!\nBill No: ${sale.billNumber}\nTotal: ${formatCurrency(sale.totalAmount)}\nPayment: ${sale.paymentMode}\n\nPrescription status updated automatically.`, false);
                            } catch (error) {
                              console.error('Dispensing error:', error);
                              addToChat(`❌ Error dispensing medicine: ${error.message}`, false);
                            }
                          }}
                          disabled={msg.content.medicines.filter(m => m.requestedQty > 0).length === 0}
                          style={{
                            padding: "8px 16px",
                            backgroundColor: msg.content.medicines.filter(m => m.requestedQty > 0).length > 0 ? "#28a745" : "#ccc",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: msg.content.medicines.filter(m => m.requestedQty > 0).length > 0 ? "pointer" : "not-allowed",
                            fontSize: "13px",
                            fontWeight: "bold"
                          }}
                        >
                          ✅ Confirm & Dispense
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: "10px", fontSize: "12px", color: "#666", textAlign: "center" }}>
                  💡 Select quantities for each medicine or use "Dispense All" to serve remaining amounts
                </div>
              </div>
            ) : msg.content && typeof msg.content === 'object' && msg.content.type === 'medicine_update_selection' ? (
              // Render medicine update selection buttons
              <div style={{
                display: "inline-block",
                padding: "15px",
                borderRadius: "15px",
                backgroundColor: "#e9ecef",
                color: "black",
                maxWidth: "90%"
              }}>
                <div style={{ marginBottom: "10px", fontWeight: "bold" }}>
                  📝 {msg.content.message}
                </div>

                {/* Medicine list with update buttons */}
                <div style={{ marginTop: "15px", padding: "10px", backgroundColor: "#f8f9fa", borderRadius: "8px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "12px" }}>
                    {msg.content.medicines.map((medicine, idx) => (
                      <div key={idx} style={{
                        padding: "12px",
                        backgroundColor: "white",
                        borderRadius: "6px",
                        border: "1px solid #dee2e6"
                      }}>
                        <div style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "8px", color: "#007bff" }}>
                          {idx + 1}. {medicine.medicineName}
                        </div>
                        <div style={{ fontSize: "12px", color: "#666", marginBottom: "10px" }}>
                          Dose: {medicine.dosePerTime} | Duration: {medicine.durationDays} days<br/>
                          Timing: {medicine.timing.join(', ')} | Total: {medicine.totalQuantity} units
                        </div>
                        <button
                          onClick={() => {
                            setMessage(`update ${medicine.medicineName}`);
                            setTimeout(() => handleSendMessage(), 100);
                          }}
                          style={{
                            width: "100%",
                            padding: "8px",
                            backgroundColor: "#ffc107",
                            color: "#212529",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "12px",
                            fontWeight: "bold"
                          }}
                          title={`Update ${medicine.medicineName}`}
                        >
                          ✏️ Update This Medicine
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: "10px", fontSize: "12px", color: "#666", textAlign: "center" }}>
                  💡 Click the "Update This Medicine" button for any medicine you want to modify
                </div>
              </div>
            ) : msg.content && typeof msg.content === 'object' && msg.content.type === 'expired_medicines' ? (
              // Render expired medicines with purchase buttons
              <div style={{
                display: "inline-block",
                padding: "15px",
                borderRadius: "15px",
                backgroundColor: "#e9ecef",
                color: "black",
                maxWidth: "90%"
              }}>
                <div style={{ marginBottom: "10px", fontWeight: "bold" }}>
                  💀 {msg.content.message}
                </div>

                {/* Expired medicines list */}
                <div style={{ marginTop: "15px", padding: "10px", backgroundColor: "#f8f9fa", borderRadius: "8px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "15px" }}>
                    {msg.content.medicines.map((item, idx) => (
                      <div key={item._id} style={{
                        padding: "15px",
                        backgroundColor: "white",
                        borderRadius: "8px",
                        border: "1px solid #dee2e6"
                      }}>
                        <div style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "10px", color: "#dc3545" }}>
                          💊 {item.medicineId?.name || 'Unknown Medicine'}
                        </div>
                        <div style={{ fontSize: "13px", color: "#666", marginBottom: "15px", lineHeight: "1.4" }}>
                          <div><strong>Brand:</strong> {item.medicineId?.brandName || 'N/A'}</div>
                          <div><strong>Batch:</strong> {item.batchNumber}</div>
                          <div><strong>Expiry:</strong> {new Date(item.expiryDate).toLocaleDateString('en-IN')}</div>
                          <div><strong>Stock:</strong> {item.availableStock} units</div>
                          <div><strong>Supplier:</strong> {item.supplierId?.name || 'Unknown'}</div>
                        </div>
                        <button
                          onClick={() => {
                            setPurchaseFormData({ selectedMedicine: item.medicineId });
                          }}
                          style={{
                            width: "100%",
                            padding: "10px",
                            backgroundColor: "#28a745",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "14px",
                            fontWeight: "bold"
                          }}
                        >
                          🛒 Purchase More Stock
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: "10px", fontSize: "12px", color: "#666", textAlign: "center" }}>
                  💡 Click "Purchase More Stock" to order replacement medicine
                </div>
              </div>
            ) : msg.content && typeof msg.content === 'object' && msg.content.type === 'low_stock_medicines' ? (
              // Render low stock medicines with purchase buttons
              <div style={{
                display: "inline-block",
                padding: "15px",
                borderRadius: "15px",
                backgroundColor: "#e9ecef",
                color: "black",
                maxWidth: "90%"
              }}>
                <div style={{ marginBottom: "10px", fontWeight: "bold" }}>
                  ⚠️ {msg.content.message}
                </div>

                {/* View Toggle Buttons */}
                <div style={{ marginBottom: "15px", padding: "10px", backgroundColor: "#f8f9fa", borderRadius: "8px" }}>
                  <div style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "8px", color: "#007bff" }}>
                    📊 View Options:
                  </div>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      onClick={() => {
                        setMessage('low stock medicine list medicine');
                        setTimeout(() => handleSendMessage(), 100);
                      }}
                      disabled={msg.content.viewType === 'medicine'}
                      style={{
                        padding: "8px 16px",
                        backgroundColor: msg.content.viewType === 'medicine' ? "#28a745" : "#007bff",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: msg.content.viewType === 'medicine' ? "not-allowed" : "pointer",
                        fontSize: "13px",
                        fontWeight: "bold"
                      }}
                    >
                      💊 Medicine-wise ({msg.content.totalMedicineLowStock} medicines)
                    </button>
                    <button
                      onClick={() => {
                        setMessage('low stock medicine list batch');
                        setTimeout(() => handleSendMessage(), 100);
                      }}
                      disabled={msg.content.viewType === 'batch'}
                      style={{
                        padding: "8px 16px",
                        backgroundColor: msg.content.viewType === 'batch' ? "#28a745" : "#007bff",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: msg.content.viewType === 'batch' ? "not-allowed" : "pointer",
                        fontSize: "13px",
                        fontWeight: "bold"
                      }}
                    >
                      📦 Batch-wise ({msg.content.totalBatchLowStock} batches)
                    </button>
                  </div>
                  <div style={{ fontSize: "11px", color: "#666", marginTop: "5px" }}>
                    💡 Medicine-wise: Shows total stock across all batches • Batch-wise: Shows individual low-stock batches
                  </div>
                </div>

                {/* Low stock medicines list */}
                <div style={{ marginTop: "15px", padding: "10px", backgroundColor: "#f8f9fa", borderRadius: "8px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "15px" }}>
                    {msg.content.medicines.map((item, idx) => (
                      <div key={item._id || idx} style={{
                        padding: "15px",
                        backgroundColor: "white",
                        borderRadius: "8px",
                        border: "1px solid #dee2e6"
                      }}>
                        <div style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "10px", color: "#ffc107" }}>
                          💊 {item.medicineId?.name || item.medicineName || 'Unknown Medicine'}
                        </div>
                        <div style={{ fontSize: "13px", color: "#666", marginBottom: "15px", lineHeight: "1.4" }}>
                          {msg.content.viewType === 'batch' ? (
                            // Batch-wise display
                            <>
                              <div><strong>Brand:</strong> {item.medicineId?.brandName || 'N/A'}</div>
                              <div><strong>Batch:</strong> {item.batchNumber}</div>
                              <div><strong>Available:</strong> {item.availableStock} units</div>
                              <div><strong>Reorder Level:</strong> {item.reorderLevel} units</div>
                              <div><strong>Supplier:</strong> {item.supplierId?.name || 'Unknown'}</div>
                            </>
                          ) : (
                            // Medicine-wise display
                            <>
                              <div><strong>Brand:</strong> {item.brandName}</div>
                              <div><strong>Total Stock:</strong> {item.totalStock} units</div>
                              <div><strong>Reorder Level:</strong> {item.reorderLevel} units</div>
                              <div><strong>Low Stock Batches:</strong> {item.batches?.length || 0}</div>
                              <div><strong>Status:</strong> Medicine-level low stock</div>
                            </>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            setPurchaseFormData({
                              selectedMedicine: item.medicineId || item
                            });
                          }}
                          style={{
                            width: "100%",
                            padding: "10px",
                            backgroundColor: "#28a745",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "14px",
                            fontWeight: "bold"
                          }}
                        >
                          🛒 Purchase More Stock
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: "10px", fontSize: "12px", color: "#666", textAlign: "center" }}>
                  💡 Click "Purchase More Stock" to replenish inventory
                </div>
              </div>
            ) : msg.content && typeof msg.content === 'object' && msg.content.type === 'csv_selection' ? (
              // Render CSV selection buttons
              <div style={{
                display: "inline-block",
                padding: "15px",
                borderRadius: "15px",
                backgroundColor: "#e9ecef",
                color: "black",
                maxWidth: "90%"
              }}>
                <div style={{ marginBottom: "10px", fontWeight: "bold" }}>
                  📄 {msg.content.message}
                </div>

                {/* CSV option buttons */}
                <div style={{ marginTop: "15px", padding: "10px", backgroundColor: "#f8f9fa", borderRadius: "8px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "15px" }}>
                    {msg.content.options.map((option, idx) => (
                      <button
                        key={idx}
                        onClick={() => generateCsvByType(option.type)}
                        style={{
                          padding: "20px",
                          backgroundColor: option.bgColor,
                          border: `2px solid ${option.color}`,
                          borderRadius: "8px",
                          cursor: "pointer",
                          textAlign: "center",
                          transition: "all 0.2s"
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = "scale(1.02)";
                          e.target.style.boxShadow = "0 4px 8px rgba(0,0,0,0.1)";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = "scale(1)";
                          e.target.style.boxShadow = "none";
                        }}
                      >
                        <div style={{ fontSize: "36px", marginBottom: "10px" }}>
                          {option.icon}
                        </div>
                        <div style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "8px", color: option.color }}>
                          {option.title}
                        </div>
                        <div style={{ fontSize: "14px", color: "#666" }}>
                          {option.description}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: "10px", fontSize: "12px", color: "#666", textAlign: "center" }}>
                  💡 Click any button above to generate the corresponding CSV report
                </div>
              </div>
            ) : msg.content && typeof msg.content === 'object' && msg.content.type === 'medicine_actions' ? (
              // Render medicine action buttons
              <div style={{
                display: "inline-block",
                padding: "15px",
                borderRadius: "15px",
                backgroundColor: "#e9ecef",
                color: "black",
                maxWidth: "70%"
              }}>
                <div style={{ marginBottom: "10px", fontWeight: "bold" }}>
                  {msg.content.category} Management Actions:
                </div>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                  gap: "8px"
                }}>
                  <button
                    onClick={() => {
                      setMedicineAddFormData({}); // Open the add medicine form
                    }}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid #28a745",
                      backgroundColor: "#f8fff8",
                      color: "#28a745",
                      cursor: "pointer",
                      fontSize: "14px",
                      textAlign: "center",
                      fontWeight: "bold",
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = "#28a745";
                      e.target.style.color = "white";
                      e.target.style.transform = "scale(1.02)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = "#f8fff8";
                      e.target.style.color = "#28a745";
                      e.target.style.transform = "scale(1)";
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}>
                      <span>➕</span>
                      <span>Add Medicine</span>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setMedicineSearchData({}); // Open medicine search panel
                    }}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid #007bff",
                      backgroundColor: "#f8f9ff",
                      color: "#007bff",
                      cursor: "pointer",
                      fontSize: "14px",
                      textAlign: "center",
                      fontWeight: "bold",
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = "#007bff";
                      e.target.style.color = "white";
                      e.target.style.transform = "scale(1.02)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = "#f8f9ff";
                      e.target.style.color = "#007bff";
                      e.target.style.transform = "scale(1)";
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}>
                      <span>🔍</span>
                      <span>Search Medicines</span>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setInventoryOverviewData({}); // Open inventory overview panel
                    }}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid #17a2b8",
                      backgroundColor: "#f0f8ff",
                      color: "#17a2b8",
                      cursor: "pointer",
                      fontSize: "14px",
                      textAlign: "center",
                      fontWeight: "bold",
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = "#17a2b8";
                      e.target.style.color = "white";
                      e.target.style.transform = "scale(1.02)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = "#f0f8ff";
                      e.target.style.color = "#17a2b8";
                      e.target.style.transform = "scale(1)";
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}>
                      <span>📦</span>
                      <span>Check Inventory</span>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setMessage('low stock medicine list');
                      setTimeout(() => handleSendMessage(), 100); // Trigger low stock report
                    }}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid #dc3545",
                      backgroundColor: "#fff5f5",
                      color: "#dc3545",
                      cursor: "pointer",
                      fontSize: "14px",
                      textAlign: "center",
                      fontWeight: "bold",
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = "#dc3545";
                      e.target.style.color = "white";
                      e.target.style.transform = "scale(1.02)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = "#fff5f5";
                      e.target.style.color = "#dc3545";
                      e.target.style.transform = "scale(1)";
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}>
                      <span>⚠️</span>
                      <span>Low Stock</span>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setMessage('purchase multiple medicines');
                      setTimeout(() => handleSendMessage(), 100); // Trigger multiple purchase panel
                    }}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid #28a745",
                      backgroundColor: "#f8fff8",
                      color: "#28a745",
                      cursor: "pointer",
                      fontSize: "14px",
                      textAlign: "center",
                      fontWeight: "bold",
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = "#28a745";
                      e.target.style.color = "white";
                      e.target.style.transform = "scale(1.02)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = "#f8fff8";
                      e.target.style.color = "#28a745";
                      e.target.style.transform = "scale(1)";
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}>
                      <span>🛒</span>
                      <span>Purchase Stock</span>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setMessage('expired medicine list');
                      setTimeout(() => handleSendMessage(), 100); // Trigger expired medicine report
                    }}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid #dc3545",
                      backgroundColor: "#fff5f5",
                      color: "#dc3545",
                      cursor: "pointer",
                      fontSize: "14px",
                      textAlign: "center",
                      fontWeight: "bold",
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = "#dc3545";
                      e.target.style.color = "white";
                      e.target.style.transform = "scale(1.02)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = "#fff5f5";
                      e.target.style.color = "#dc3545";
                      e.target.style.transform = "scale(1)";
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}>
                      <span>💀</span>
                      <span>Expired Medicines</span>
                    </div>
                  </button>
                </div>
                <div style={{ marginTop: "10px", fontSize: "12px", color: "#666", textAlign: "center" }}>
                  💡 Click any button above to perform medicine management tasks!
                </div>
              </div>
            ) : (
              // Regular text message
              <div style={{
                display: "inline-block",
                padding: "10px 15px",
                borderRadius: "15px",
                backgroundColor: msg.isUser ? "#007bff" : "#e9ecef",
                color: msg.isUser ? "white" : "black",
                maxWidth: "70%",
                whiteSpace: "pre-line"
              }}>
                {msg.content || msg.text}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "10px" }}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message here..."
          style={{
            flex: 1,
            padding: "10px 15px",
            borderRadius: "25px",
            border: "1px solid #ccc",
            fontSize: "16px"
          }}
        />
        <button
          onClick={handleSendMessage}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "25px",
            cursor: "pointer"
          }}
        >
          Send
        </button>
        <button
          onClick={() => setTtsEnabled(!ttsEnabled)}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            backgroundColor: ttsEnabled ? "#dc3545" : "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "25px",
            cursor: "pointer"
          }}
        >
          {ttsEnabled ? "🔊 TTS ON" : "🔇 TTS OFF"}
        </button>
        <button
          onClick={() => ttsEnabled && speak("How can I help you?")}
          disabled={isPlaying || !ttsEnabled}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            backgroundColor: (isPlaying || !ttsEnabled) ? "#ccc" : "#28a745",
            color: "white",
            border: "none",
            borderRadius: "25px",
            cursor: (isPlaying || !ttsEnabled) ? "not-allowed" : "pointer"
          }}
        >
          {isPlaying ? "Speaking..." : "Test TTS"}
        </button>
      </div>

      <p style={{ marginTop: 10, fontSize: "14px", color: "#666", textAlign: "center" }}>
        Try: "create patient vishwa naik 8605243940 26 male" | "find patient john" | "create prescription for 9876543210" | "serve prescription for 9876543210" | "add medicine azithromycin brand azee tablet 500mg antibiotic" | "add supplier ramesh patil company patil medical distributors mobile 9876543210 email patilmedicals@gmail.com address midc road nashik maharashtra" | "expiry medicine list" | "low stock medicine list" | "create csv expiry" | "check medicine paracetamol" | "patient john ya 9876543210 give me patient last visit details" | "check monday availability" | "update sun to tue availability" | "serve medicine"
      </p>
    </div>
  );
}
