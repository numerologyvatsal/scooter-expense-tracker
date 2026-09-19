"use strict";

/* =====================================================
   SCOOTER EXPENSE TRACKER
   Main JavaScript
===================================================== */

const STORAGE_KEY = "scooterExpenseTrackerDataV1";

let appData = {
  scooters: [],
  activeScooterId: null,
  rides: [],
  expenses: [],
  services: [],
};

let pendingDelete = null;
let toastTimer = null;

/* =====================================================
   INITIALIZATION
===================================================== */

document.addEventListener("DOMContentLoaded", initializeApp);

function initializeApp() {
  loadData();
  setDefaultDates();
  registerEventListeners();
  renderApplication();

  if (appData.scooters.length === 0) {
    setTimeout(() => {
      openScooterDialog();
      showToast("શરૂઆત કરવા માટે તમારા scooterની માહિતી ઉમેરો.", "success");
    }, 300);
  }
}

/* =====================================================
   LOCAL STORAGE
===================================================== */

function loadData() {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY);

    if (!savedData) {
      return;
    }

    const parsedData = JSON.parse(savedData);

    appData = {
      scooters: Array.isArray(parsedData.scooters) ? parsedData.scooters : [],

      activeScooterId: parsedData.activeScooterId || null,

      rides: Array.isArray(parsedData.rides) ? parsedData.rides : [],

      expenses: Array.isArray(parsedData.expenses) ? parsedData.expenses : [],

      services: Array.isArray(parsedData.services) ? parsedData.services : [],
    };

    const activeScooterExists = appData.scooters.some(
      (scooter) => scooter.id === appData.activeScooterId,
    );

    if (!activeScooterExists && appData.scooters.length > 0) {
      appData.activeScooterId = appData.scooters[0].id;
    }
  } catch (error) {
    console.error("Saved data could not be loaded:", error);
    showToast("Saved data load થઈ શક્યો નથી.", "error");
  }
}

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
  } catch (error) {
    console.error("Data could not be saved:", error);
    showToast("Data save થઈ શક્યો નથી.", "error");
  }
}

/* =====================================================
   EVENT LISTENERS
===================================================== */

function registerEventListeners() {
  document.querySelectorAll(".nav-item").forEach((button) => {
    button.addEventListener("click", () => {
      showSection(button.dataset.section);
      closeMobileSidebar();
    });
  });

  document.querySelectorAll("[data-go-to]").forEach((button) => {
    button.addEventListener("click", () => {
      showSection(button.dataset.goTo);
    });
  });

  document
    .getElementById("menuButton")
    .addEventListener("click", openMobileSidebar);

  document
    .getElementById("sidebarOverlay")
    .addEventListener("click", closeMobileSidebar);

  document
    .getElementById("activeScooterSelect")
    .addEventListener("change", handleActiveScooterChange);

  registerDialogButtons();
  registerFormSubmissions();
  registerFilters();
  registerDynamicActions();

  document
    .getElementById("rideCurrentKm")
    .addEventListener("input", updateRideCalculationPreview);

  document
    .getElementById("petrolLitres")
    .addEventListener("input", calculatePetrolAmount);

  document
    .getElementById("petrolRate")
    .addEventListener("input", calculatePetrolAmount);

  document
    .getElementById("confirmDeleteButton")
    .addEventListener("click", confirmDelete);
}

function registerDialogButtons() {
  const rideButtons = [
    "openRideDialogButton",
    "dashboardRideButton",
    "ridesPageAddButton",
  ];

  rideButtons.forEach((id) => {
    document.getElementById(id).addEventListener("click", openRideDialog);
  });

  const petrolButtons = ["dashboardPetrolButton", "expensesPagePetrolButton"];

  petrolButtons.forEach((id) => {
    document.getElementById(id).addEventListener("click", openPetrolDialog);
  });

  const expenseButtons = ["dashboardExpenseButton", "expensesPageAddButton"];

  expenseButtons.forEach((id) => {
    document.getElementById(id).addEventListener("click", openExpenseDialog);
  });

  const serviceButtons = ["dashboardServiceButton", "maintenancePageAddButton"];

  serviceButtons.forEach((id) => {
    document.getElementById(id).addEventListener("click", openServiceDialog);
  });

  document
    .getElementById("scootersPageAddButton")
    .addEventListener("click", () => openScooterDialog());

  document.querySelectorAll("[data-close-dialog]").forEach((button) => {
    button.addEventListener("click", () => {
      closeDialog(button.dataset.closeDialog);
    });
  });
}

function registerFormSubmissions() {
  document
    .getElementById("scooterForm")
    .addEventListener("submit", handleScooterSubmit);

  document
    .getElementById("rideForm")
    .addEventListener("submit", handleRideSubmit);

  document
    .getElementById("petrolForm")
    .addEventListener("submit", handlePetrolSubmit);

  document
    .getElementById("expenseForm")
    .addEventListener("submit", handleExpenseSubmit);

  document
    .getElementById("serviceForm")
    .addEventListener("submit", handleServiceSubmit);
}

function registerFilters() {
  document
    .getElementById("expenseMonthFilter")
    .addEventListener("change", renderExpenseHistory);

  document
    .getElementById("expenseTypeFilter")
    .addEventListener("change", renderExpenseHistory);

  document
    .getElementById("resetExpenseFilterButton")
    .addEventListener("click", () => {
      document.getElementById("expenseMonthFilter").value = "";
      document.getElementById("expenseTypeFilter").value = "all";
      renderExpenseHistory();
    });

  document
    .getElementById("reportMonthFilter")
    .addEventListener("change", renderReports);
}

function registerDynamicActions() {
  document.addEventListener("click", (event) => {
    const deleteButton = event.target.closest("[data-delete-type]");

    if (deleteButton) {
      requestDelete(
        deleteButton.dataset.deleteType,
        deleteButton.dataset.deleteId,
      );
      return;
    }

    const editScooterButton = event.target.closest("[data-edit-scooter]");

    if (editScooterButton) {
      openScooterDialog(editScooterButton.dataset.editScooter);
      return;
    }

    const selectScooterButton = event.target.closest("[data-select-scooter]");

    if (selectScooterButton) {
      selectScooter(selectScooterButton.dataset.selectScooter);
    }
  });
}

/* =====================================================
   NAVIGATION
===================================================== */

function showSection(sectionId) {
  document.querySelectorAll(".page-section").forEach((section) => {
    section.classList.remove("active");
  });

  document.querySelectorAll(".nav-item").forEach((button) => {
    button.classList.remove("active");
  });

  const selectedSection = document.getElementById(sectionId);

  if (selectedSection) {
    selectedSection.classList.add("active");
  }

  const selectedButton = document.querySelector(
    `[data-section="${sectionId}"]`,
  );

  if (selectedButton) {
    selectedButton.classList.add("active");
  }

  const pageTitles = {
    dashboardSection: "ડેશબોર્ડ",
    ridesSection: "Daily KM",
    expensesSection: "ખર્ચ",
    maintenanceSection: "સર્વિસ",
    reportsSection: "રિપોર્ટ",
    scootersSection: "મારા Scooter",
  };

  document.getElementById("pageTitle").textContent =
    pageTitles[sectionId] || "Scooter Tracker";

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

function openMobileSidebar() {
  document.getElementById("sidebar").classList.add("open");
  document.getElementById("sidebarOverlay").classList.add("show");
}

function closeMobileSidebar() {
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("sidebarOverlay").classList.remove("show");
}

/* =====================================================
   SCOOTER MANAGEMENT
===================================================== */

function handleScooterSubmit(event) {
  event.preventDefault();

  const editId = document.getElementById("scooterEditId").value;
  const name = document.getElementById("scooterName").value.trim();
  const registrationNumber = document
    .getElementById("scooterNumber")
    .value.trim()
    .toUpperCase();

  const modelYear =
    Number(document.getElementById("scooterModelYear").value) || null;

  const initialKm = Number(document.getElementById("scooterInitialKm").value);

  const serviceIntervalKm =
    Number(document.getElementById("serviceIntervalKm").value) || 3000;

  const oilIntervalKm =
    Number(document.getElementById("oilIntervalKm").value) || 3000;

  if (!name) {
    showToast("Scooterનું નામ દાખલ કરો.", "error");
    return;
  }

  if (editId) {
    const scooter = appData.scooters.find((item) => item.id === editId);

    if (!scooter) {
      return;
    }

    scooter.name = name;
    scooter.registrationNumber = registrationNumber;
    scooter.modelYear = modelYear;
    scooter.serviceIntervalKm = serviceIntervalKm;
    scooter.oilIntervalKm = oilIntervalKm;
    scooter.updatedAt = new Date().toISOString();

    showToast("Scooterની માહિતી update થઈ ગઈ.", "success");
  } else {
    if (!Number.isFinite(initialKm) || initialKm < 0) {
      showToast("સાચું odometer reading દાખલ કરો.", "error");
      return;
    }

    const scooterId = createId();

    const newScooter = {
      id: scooterId,
      name,
      registrationNumber,
      modelYear,
      startingKm: initialKm,
      currentKm: initialKm,
      serviceIntervalKm,
      oilIntervalKm,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    appData.scooters.push(newScooter);
    appData.activeScooterId = scooterId;

    showToast("Scooter સફળતાપૂર્વક ઉમેરાયું.", "success");
  }

  saveData();
  closeDialog("scooterDialog");
  renderApplication();
}

function openScooterDialog(scooterId = null) {
  const form = document.getElementById("scooterForm");
  const initialKmInput = document.getElementById("scooterInitialKm");

  form.reset();

  document.getElementById("scooterEditId").value = "";
  document.getElementById("serviceIntervalKm").value = 3000;
  document.getElementById("oilIntervalKm").value = 3000;

  initialKmInput.disabled = false;

  if (scooterId) {
    const scooter = appData.scooters.find((item) => item.id === scooterId);

    if (!scooter) {
      return;
    }

    document.getElementById("scooterDialogTitle").textContent =
      "Scooter Edit કરો";

    document.getElementById("scooterEditId").value = scooter.id;
    document.getElementById("scooterName").value = scooter.name;
    document.getElementById("scooterNumber").value =
      scooter.registrationNumber || "";

    document.getElementById("scooterModelYear").value = scooter.modelYear || "";

    initialKmInput.value = scooter.currentKm;
    initialKmInput.disabled = true;

    document.getElementById("serviceIntervalKm").value =
      scooter.serviceIntervalKm || 3000;

    document.getElementById("oilIntervalKm").value =
      scooter.oilIntervalKm || 3000;
  } else {
    document.getElementById("scooterDialogTitle").textContent =
      "નવું Scooter ઉમેરો";
  }

  openDialog("scooterDialog");
}

function handleActiveScooterChange(event) {
  const scooterId = event.target.value;

  if (!scooterId) {
    return;
  }

  selectScooter(scooterId);
}

function selectScooter(scooterId) {
  const scooterExists = appData.scooters.some(
    (scooter) => scooter.id === scooterId,
  );

  if (!scooterExists) {
    return;
  }

  appData.activeScooterId = scooterId;
  saveData();
  renderApplication();

  showToast("Active scooter બદલાયું.", "success");
}

/* =====================================================
   DAILY KM / RIDES
===================================================== */

function openRideDialog() {
  const scooter = getActiveScooter();

  if (!scooter) {
    requireScooter();
    return;
  }

  const form = document.getElementById("rideForm");
  form.reset();

  document.getElementById("ridePreviousKm").textContent = formatNumber(
    scooter.currentKm,
  );

  document.getElementById("rideCurrentKm").min = scooter.currentKm;

  document.getElementById("rideCurrentKm").value = "";

  document.getElementById("rideDateTime").value = getLocalDateTimeValue();

  document.getElementById("rideCalculationPreview").className =
    "calculation-preview";

  document.getElementById("rideCalculationPreview").textContent =
    "Current KM દાખલ કરવાથી ride distance અહીં દેખાશે.";

  document.getElementById("rideFormError").textContent = "";

  openDialog("rideDialog");

  setTimeout(() => {
    document.getElementById("rideCurrentKm").focus();
  }, 100);
}

function updateRideCalculationPreview() {
  const scooter = getActiveScooter();

  if (!scooter) {
    return;
  }

  const currentKm = Number(document.getElementById("rideCurrentKm").value);

  const preview = document.getElementById("rideCalculationPreview");

  preview.className = "calculation-preview";

  if (!Number.isFinite(currentKm)) {
    preview.textContent = "Current KM દાખલ કરવાથી ride distance અહીં દેખાશે.";
    return;
  }

  const rideDistance = roundNumber(currentKm - scooter.currentKm);

  if (rideDistance <= 0) {
    preview.classList.add("invalid");
    preview.textContent = `Reading ${formatNumber(scooter.currentKm)} KM કરતાં વધારે હોવું જોઈએ.`;
    return;
  }

  preview.classList.add("valid");
  preview.textContent = `આ rideનું અંતર: ${formatNumber(rideDistance)} KM`;
}

function handleRideSubmit(event) {
  event.preventDefault();

  const scooter = getActiveScooter();

  if (!scooter) {
    requireScooter();
    return;
  }

  const currentKm = Number(document.getElementById("rideCurrentKm").value);

  const dateTime = document.getElementById("rideDateTime").value;
  const note = document.getElementById("rideNote").value.trim();
  const errorElement = document.getElementById("rideFormError");

  errorElement.textContent = "";

  if (!Number.isFinite(currentKm)) {
    errorElement.textContent = "Current odometer reading દાખલ કરો.";
    return;
  }

  if (currentKm <= scooter.currentKm) {
    errorElement.textContent = `નવી reading ${formatNumber(scooter.currentKm)} KM કરતાં વધારે હોવી જોઈએ.`;
    return;
  }

  if (!dateTime) {
    errorElement.textContent = "Date અને time પસંદ કરો.";
    return;
  }

  const previousKm = scooter.currentKm;
  const distance = roundNumber(currentKm - previousKm);

  const ride = {
    id: createId(),
    scooterId: scooter.id,
    previousKm,
    currentKm,
    distance,
    dateTime,
    note,
    createdAt: new Date().toISOString(),
  };

  appData.rides.push(ride);
  scooter.currentKm = currentKm;
  scooter.updatedAt = new Date().toISOString();

  saveData();
  closeDialog("rideDialog");
  renderApplication();

  showToast(`${formatNumber(distance)} KM ride save થઈ ગઈ.`, "success");
}

/* =====================================================
   PETROL
===================================================== */

function openPetrolDialog() {
  const scooter = getActiveScooter();

  if (!scooter) {
    requireScooter();
    return;
  }

  document.getElementById("petrolForm").reset();
  document.getElementById("petrolDate").value = getLocalDateValue();

  document.getElementById("petrolOdometer").value = scooter.currentKm;

  document.getElementById("petrolFormError").textContent = "";

  openDialog("petrolDialog");
}

function calculatePetrolAmount() {
  const litres = Number(document.getElementById("petrolLitres").value);

  const rate = Number(document.getElementById("petrolRate").value);

  if (
    Number.isFinite(litres) &&
    Number.isFinite(rate) &&
    litres > 0 &&
    rate > 0
  ) {
    document.getElementById("petrolAmount").value = (litres * rate).toFixed(2);
  }
}

function handlePetrolSubmit(event) {
  event.preventDefault();

  const scooter = getActiveScooter();

  if (!scooter) {
    requireScooter();
    return;
  }

  const date = document.getElementById("petrolDate").value;
  const odometer = Number(document.getElementById("petrolOdometer").value);

  const litres = Number(document.getElementById("petrolLitres").value);

  const rate = Number(document.getElementById("petrolRate").value);

  const amount = Number(document.getElementById("petrolAmount").value);

  const fullTank = document.getElementById("petrolFullTank").checked;

  const note = document.getElementById("petrolNote").value.trim();
  const errorElement = document.getElementById("petrolFormError");

  errorElement.textContent = "";

  if (!date) {
    errorElement.textContent = "Petrolની તારીખ પસંદ કરો.";
    return;
  }

  if (!Number.isFinite(odometer) || odometer < 0) {
    errorElement.textContent = "સાચું odometer reading દાખલ કરો.";
    return;
  }

  if (!Number.isFinite(litres) || litres <= 0) {
    errorElement.textContent = "Petrolના litres દાખલ કરો.";
    return;
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    errorElement.textContent = "Petrolની total amount દાખલ કરો.";
    return;
  }

  const petrolExpense = {
    id: createId(),
    scooterId: scooter.id,
    type: "petrol",
    date,
    odometer,
    litres,
    rate: Number.isFinite(rate) ? rate : null,
    amount,
    fullTank,
    description: note || "Petrol",
    createdAt: new Date().toISOString(),
  };

  appData.expenses.push(petrolExpense);

  saveData();
  closeDialog("petrolDialog");
  renderApplication();

  showToast("Petrol entry save થઈ ગઈ.", "success");
}

/* =====================================================
   OTHER EXPENSES
===================================================== */

function openExpenseDialog() {
  const scooter = getActiveScooter();

  if (!scooter) {
    requireScooter();
    return;
  }

  document.getElementById("expenseForm").reset();
  document.getElementById("expenseDate").value = getLocalDateValue();

  document.getElementById("expenseOdometer").value = scooter.currentKm;

  document.getElementById("expenseFormError").textContent = "";

  openDialog("expenseDialog");
}

function handleExpenseSubmit(event) {
  event.preventDefault();

  const scooter = getActiveScooter();

  if (!scooter) {
    requireScooter();
    return;
  }

  const date = document.getElementById("expenseDate").value;
  const type = document.getElementById("expenseType").value;
  const amount = Number(document.getElementById("expenseAmount").value);

  const odometerValue = document.getElementById("expenseOdometer").value;

  const odometer = odometerValue ? Number(odometerValue) : null;

  const description = document
    .getElementById("expenseDescription")
    .value.trim();

  const errorElement = document.getElementById("expenseFormError");

  errorElement.textContent = "";

  if (!date || !type || !description) {
    errorElement.textContent = "બધી જરૂરી માહિતી દાખલ કરો.";
    return;
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    errorElement.textContent = "સાચી amount દાખલ કરો.";
    return;
  }

  const expense = {
    id: createId(),
    scooterId: scooter.id,
    type,
    date,
    amount,
    odometer: Number.isFinite(odometer) ? odometer : null,
    description,
    createdAt: new Date().toISOString(),
  };

  appData.expenses.push(expense);

  saveData();
  closeDialog("expenseDialog");
  renderApplication();

  showToast("ખર્ચ save થઈ ગયો.", "success");
}

/* =====================================================
   SERVICE AND MAINTENANCE
===================================================== */

function openServiceDialog() {
  const scooter = getActiveScooter();

  if (!scooter) {
    requireScooter();
    return;
  }

  document.getElementById("serviceForm").reset();
  document.getElementById("serviceDate").value = getLocalDateValue();

  document.getElementById("serviceOdometer").value = scooter.currentKm;

  document.getElementById("serviceFormError").textContent = "";

  openDialog("serviceDialog");
}

function handleServiceSubmit(event) {
  event.preventDefault();

  const scooter = getActiveScooter();

  if (!scooter) {
    requireScooter();
    return;
  }

  const date = document.getElementById("serviceDate").value;
  const type = document.getElementById("serviceType").value;

  const odometer = Number(document.getElementById("serviceOdometer").value);

  const amount = Number(document.getElementById("serviceAmount").value);

  const description = document
    .getElementById("serviceDescription")
    .value.trim();

  const serviceCenter = document.getElementById("serviceCenter").value.trim();

  const errorElement = document.getElementById("serviceFormError");

  errorElement.textContent = "";

  if (!date || !type || !description) {
    errorElement.textContent = "બધી જરૂરી service માહિતી દાખલ કરો.";
    return;
  }

  if (!Number.isFinite(odometer) || odometer < 0) {
    errorElement.textContent = "સાચું service odometer દાખલ કરો.";
    return;
  }

  if (!Number.isFinite(amount) || amount < 0) {
    errorElement.textContent = "સાચો service ખર્ચ દાખલ કરો.";
    return;
  }

  const service = {
    id: createId(),
    scooterId: scooter.id,
    type,
    date,
    odometer,
    amount,
    description,
    serviceCenter,
    createdAt: new Date().toISOString(),
  };

  appData.services.push(service);

  saveData();
  closeDialog("serviceDialog");
  renderApplication();

  showToast("Service record save થઈ ગયો.", "success");
}

/* =====================================================
   DELETE RECORDS
===================================================== */

function requestDelete(type, id) {
  pendingDelete = {
    type,
    id,
  };

  openDialog("deleteDialog");
}

function confirmDelete() {
  if (!pendingDelete) {
    closeDialog("deleteDialog");
    return;
  }

  const { type, id } = pendingDelete;

  if (type === "ride") {
    appData.rides = appData.rides.filter((ride) => ride.id !== id);

    rebuildScooterRideReadings(getRecordScooterId("ride", id));
  }

  if (type === "expense") {
    appData.expenses = appData.expenses.filter((expense) => expense.id !== id);
  }

  if (type === "service") {
    appData.services = appData.services.filter((service) => service.id !== id);
  }

  if (type === "scooter") {
    deleteScooterAndRelatedData(id);
  }

  pendingDelete = null;

  saveData();
  closeDialog("deleteDialog");
  renderApplication();

  showToast("Record delete થઈ ગયો.", "success");
}

function getRecordScooterId(type, id) {
  if (type === "ride") {
    const ride = appData.rides.find((item) => item.id === id);
    return ride ? ride.scooterId : appData.activeScooterId;
  }

  return appData.activeScooterId;
}

function rebuildScooterRideReadings(scooterId) {
  const scooter = appData.scooters.find((item) => item.id === scooterId);

  if (!scooter) {
    return;
  }

  const rides = appData.rides
    .filter((ride) => ride.scooterId === scooterId)
    .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));

  let previousKm = scooter.startingKm;

  rides.forEach((ride) => {
    ride.previousKm = previousKm;
    ride.distance = roundNumber(ride.currentKm - previousKm);

    previousKm = ride.currentKm;
  });

  scooter.currentKm = rides.length
    ? rides[rides.length - 1].currentKm
    : scooter.startingKm;
}

function deleteScooterAndRelatedData(scooterId) {
  appData.scooters = appData.scooters.filter(
    (scooter) => scooter.id !== scooterId,
  );

  appData.rides = appData.rides.filter((ride) => ride.scooterId !== scooterId);

  appData.expenses = appData.expenses.filter(
    (expense) => expense.scooterId !== scooterId,
  );

  appData.services = appData.services.filter(
    (service) => service.scooterId !== scooterId,
  );

  if (appData.activeScooterId === scooterId) {
    appData.activeScooterId =
      appData.scooters.length > 0 ? appData.scooters[0].id : null;
  }
}

/* =====================================================
   MAIN RENDER
===================================================== */

function renderApplication() {
  renderScooterSelector();
  renderDashboard();
  renderRideHistory();
  renderExpenseHistory();
  renderMaintenanceHistory();
  renderScooterCards();
  renderReports();
}

function renderScooterSelector() {
  const select = document.getElementById("activeScooterSelect");

  if (appData.scooters.length === 0) {
    select.innerHTML = `<option value="">Scooter પસંદ કરો</option>`;
    return;
  }

  select.innerHTML = appData.scooters
    .map((scooter) => {
      return `
                <option
                    value="${scooter.id}"
                    ${scooter.id === appData.activeScooterId ? "selected" : ""}
                >
                    ${escapeHtml(scooter.name)}
                </option>
            `;
    })
    .join("");
}

/* =====================================================
   DASHBOARD RENDER
===================================================== */

function renderDashboard() {
  const scooter = getActiveScooter();

  if (!scooter) {
    resetDashboard();
    return;
  }

  const scooterRides = getScooterRides(scooter.id);
  const scooterExpenses = getScooterExpenses(scooter.id);
  const scooterServices = getScooterServices(scooter.id);

  const todayKey = getLocalDateValue();
  const currentMonth = todayKey.slice(0, 7);

  const todayRides = scooterRides.filter(
    (ride) => ride.dateTime.slice(0, 10) === todayKey,
  );

  const monthRides = scooterRides.filter(
    (ride) => ride.dateTime.slice(0, 7) === currentMonth,
  );

  const monthExpenses = scooterExpenses.filter(
    (expense) => expense.date.slice(0, 7) === currentMonth,
  );

  const monthServices = scooterServices.filter(
    (service) => service.date.slice(0, 7) === currentMonth,
  );

  const todayKm = sumValues(todayRides, "distance");
  const monthKm = sumValues(monthRides, "distance");

  const monthExpense =
    sumValues(monthExpenses, "amount") + sumValues(monthServices, "amount");

  const totalKm = roundNumber(scooter.currentKm - scooter.startingKm);

  const totalExpense =
    sumValues(scooterExpenses, "amount") + sumValues(scooterServices, "amount");

  const costPerKm = totalKm > 0 ? totalExpense / totalKm : 0;

  document.getElementById("dashboardScooterName").textContent = scooter.name;

  document.getElementById("lastOdometerValue").textContent = formatNumber(
    scooter.currentKm,
  );

  document.getElementById("todayKmValue").textContent =
    `${formatNumber(todayKm)} KM`;

  document.getElementById("todayRideCount").textContent =
    todayRides.length === 0
      ? "આજે કોઈ ride નથી"
      : `${todayRides.length} ride નોંધાઈ`;

  document.getElementById("monthKmValue").textContent =
    `${formatNumber(monthKm)} KM`;

  document.getElementById("monthExpenseValue").textContent =
    formatCurrency(monthExpense);

  document.getElementById("monthExpenseCount").textContent =
    monthExpenses.length + monthServices.length === 0
      ? "કોઈ ખર્ચ નોંધાયેલ નથી"
      : `${monthExpenses.length + monthServices.length} entries`;

  document.getElementById("costPerKmValue").textContent =
    formatCurrency(costPerKm);

  renderMaintenanceReminder(scooter, scooterServices);
  renderRecentActivity(scooterRides, scooterExpenses, scooterServices);
}

function resetDashboard() {
  document.getElementById("dashboardScooterName").textContent =
    "તમારું Scooter પસંદ કરો";

  document.getElementById("lastOdometerValue").textContent = "0";
  document.getElementById("todayKmValue").textContent = "0 KM";
  document.getElementById("todayRideCount").textContent = "આજે કોઈ ride નથી";

  document.getElementById("monthKmValue").textContent = "0 KM";
  document.getElementById("monthExpenseValue").textContent = "₹0";
  document.getElementById("monthExpenseCount").textContent =
    "કોઈ ખર્ચ નોંધાયેલ નથી";

  document.getElementById("costPerKmValue").textContent = "₹0.00";

  document.getElementById("recentActivityTableBody").innerHTML = `
        <tr class="empty-table-row">
            <td colspan="5">
                શરૂઆત કરવા માટે scooter ઉમેરો.
            </td>
        </tr>
    `;
}

function renderRecentActivity(rides, expenses, services) {
  const tableBody = document.getElementById("recentActivityTableBody");

  const activities = [
    ...rides.map((ride) => ({
      date: ride.dateTime,
      type: "Ride",
      typeClass: "ride",
      description: ride.note || "Daily ride",
      km: `${formatNumber(ride.distance)} KM`,
      amount: "—",
    })),

    ...expenses.map((expense) => ({
      date: expense.date,
      type:
        expense.type === "petrol"
          ? "Petrol"
          : getExpenseTypeLabel(expense.type),
      typeClass: expense.type === "petrol" ? "petrol" : "expense",
      description: expense.description,
      km: expense.odometer ? `${formatNumber(expense.odometer)} KM` : "—",
      amount: formatCurrency(expense.amount),
    })),

    ...services.map((service) => ({
      date: service.date,
      type: "Service",
      typeClass: "service",
      description: getServiceTypeLabel(service.type),
      km: `${formatNumber(service.odometer)} KM`,
      amount: formatCurrency(service.amount),
    })),
  ]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 8);

  if (activities.length === 0) {
    tableBody.innerHTML = `
            <tr class="empty-table-row">
                <td colspan="5">
                    હજી કોઈ activity નોંધાયેલ નથી.
                </td>
            </tr>
        `;
    return;
  }

  tableBody.innerHTML = activities
    .map(
      (activity) => `
            <tr>
                <td>${formatDate(activity.date)}</td>

                <td>
                    <span class="record-type ${activity.typeClass}">
                        ${escapeHtml(activity.type)}
                    </span>
                </td>

                <td>${escapeHtml(activity.description)}</td>
                <td>${activity.km}</td>
                <td>${activity.amount}</td>
            </tr>
        `,
    )
    .join("");
}

/* =====================================================
   RIDE HISTORY RENDER
===================================================== */

function renderRideHistory() {
  const scooter = getActiveScooter();
  const tableBody = document.getElementById("rideHistoryTableBody");

  if (!scooter) {
    resetRideSummary();

    tableBody.innerHTML = `
            <tr class="empty-table-row">
                <td colspan="6">
                    પહેલા scooter ઉમેરો.
                </td>
            </tr>
        `;
    return;
  }

  const rides = getScooterRides(scooter.id).sort(
    (a, b) => new Date(b.dateTime) - new Date(a.dateTime),
  );

  renderRideSummary(rides);

  if (rides.length === 0) {
    tableBody.innerHTML = `
            <tr class="empty-table-row">
                <td colspan="6">
                    પ્રથમ odometer reading દાખલ કરો.
                </td>
            </tr>
        `;
    return;
  }

  tableBody.innerHTML = rides
    .map(
      (ride) => `
            <tr>
                <td>${formatDateTime(ride.dateTime)}</td>
                <td>${formatNumber(ride.previousKm)} KM</td>
                <td><strong>${formatNumber(ride.currentKm)} KM</strong></td>
                <td>
                    <span class="record-type">
                        ${formatNumber(ride.distance)} KM
                    </span>
                </td>
                <td>${escapeHtml(ride.note || "—")}</td>

                <td>
                    <div class="action-buttons">
                        <button
                            type="button"
                            class="table-action-button delete"
                            data-delete-type="ride"
                            data-delete-id="${ride.id}"
                        >
                            Delete
                        </button>
                    </div>
                </td>
            </tr>
        `,
    )
    .join("");
}

function renderRideSummary(rides) {
  const now = new Date();
  const todayKey = getLocalDateValue(now);
  const currentMonth = todayKey.slice(0, 7);

  const startOfWeek = new Date(now);
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(now.getDate() - now.getDay());

  const todayRides = rides.filter(
    (ride) => ride.dateTime.slice(0, 10) === todayKey,
  );

  const weekRides = rides.filter(
    (ride) => new Date(ride.dateTime) >= startOfWeek,
  );

  const monthRides = rides.filter(
    (ride) => ride.dateTime.slice(0, 7) === currentMonth,
  );

  const uniqueRideDates = new Set(
    rides.map((ride) => ride.dateTime.slice(0, 10)),
  );

  const totalDistance = sumValues(rides, "distance");

  const averageDailyKm =
    uniqueRideDates.size > 0 ? totalDistance / uniqueRideDates.size : 0;

  document.getElementById("ridesTodayTotal").textContent =
    `${formatNumber(sumValues(todayRides, "distance"))} KM`;

  document.getElementById("ridesWeekTotal").textContent =
    `${formatNumber(sumValues(weekRides, "distance"))} KM`;

  document.getElementById("ridesMonthTotal").textContent =
    `${formatNumber(sumValues(monthRides, "distance"))} KM`;

  document.getElementById("averageDailyKm").textContent =
    `${formatNumber(averageDailyKm)} KM`;
}

function resetRideSummary() {
  document.getElementById("ridesTodayTotal").textContent = "0 KM";
  document.getElementById("ridesWeekTotal").textContent = "0 KM";
  document.getElementById("ridesMonthTotal").textContent = "0 KM";
  document.getElementById("averageDailyKm").textContent = "0 KM";
}

/* =====================================================
   EXPENSE HISTORY RENDER
===================================================== */

function renderExpenseHistory() {
  const scooter = getActiveScooter();
  const tableBody = document.getElementById("expenseHistoryTableBody");

  if (!scooter) {
    resetExpenseSummary();

    tableBody.innerHTML = `
            <tr class="empty-table-row">
                <td colspan="6">
                    પહેલા scooter ઉમેરો.
                </td>
            </tr>
        `;
    return;
  }

  const expenses = getScooterExpenses(scooter.id);
  const services = getScooterServices(scooter.id);

  renderExpenseSummary(expenses, services);

  const selectedMonth = document.getElementById("expenseMonthFilter").value;

  const selectedType = document.getElementById("expenseTypeFilter").value;

  const combinedRecords = [
    ...expenses.map((expense) => ({
      ...expense,
      recordType: "expense",
    })),

    ...services.map((service) => ({
      ...service,
      recordType: "service",
      description: service.description,
      type: service.type === "oil-change" ? "oil" : "service",
    })),
  ]
    .filter((record) => {
      const monthMatch =
        !selectedMonth || record.date.slice(0, 7) === selectedMonth;

      const typeMatch = selectedType === "all" || record.type === selectedType;

      return monthMatch && typeMatch;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  if (combinedRecords.length === 0) {
    tableBody.innerHTML = `
            <tr class="empty-table-row">
                <td colspan="6">
                    આ filter માટે કોઈ ખર્ચ મળ્યો નથી.
                </td>
            </tr>
        `;
    return;
  }

  tableBody.innerHTML = combinedRecords
    .map((record) => {
      const isService = record.recordType === "service";

      const label = isService
        ? getServiceTypeLabel(
            record.type === "oil" ? "oil-change" : record.type,
          )
        : getExpenseTypeLabel(record.type);

      const badgeClass = isService
        ? "service"
        : record.type === "petrol"
          ? "petrol"
          : "expense";

      return `
                <tr>
                    <td>${formatDate(record.date)}</td>

                    <td>
                        <span class="record-type ${badgeClass}">
                            ${escapeHtml(label)}
                        </span>
                    </td>

                    <td>${escapeHtml(record.description || label)}</td>

                    <td>
                        ${
                          record.odometer !== null &&
                          record.odometer !== undefined
                            ? `${formatNumber(record.odometer)} KM`
                            : "—"
                        }
                    </td>

                    <td>
                        <strong>${formatCurrency(record.amount)}</strong>
                    </td>

                    <td>
                        <div class="action-buttons">
                            <button
                                type="button"
                                class="table-action-button delete"
                                data-delete-type="${record.recordType}"
                                data-delete-id="${record.id}"
                            >
                                Delete
                            </button>
                        </div>
                    </td>
                </tr>
            `;
    })
    .join("");
}

function renderExpenseSummary(expenses, services) {
  const petrolTotal = sumValues(
    expenses.filter((expense) => expense.type === "petrol"),
    "amount",
  );

  const serviceTotal = sumValues(services, "amount");

  const otherTotal = sumValues(
    expenses.filter((expense) => expense.type !== "petrol"),
    "amount",
  );

  const grandTotal = petrolTotal + serviceTotal + otherTotal;

  document.getElementById("totalPetrolExpense").textContent =
    formatCurrency(petrolTotal);

  document.getElementById("totalServiceExpense").textContent =
    formatCurrency(serviceTotal);

  document.getElementById("totalOtherExpense").textContent =
    formatCurrency(otherTotal);

  document.getElementById("grandTotalExpense").textContent =
    formatCurrency(grandTotal);
}

function resetExpenseSummary() {
  document.getElementById("totalPetrolExpense").textContent = "₹0";
  document.getElementById("totalServiceExpense").textContent = "₹0";
  document.getElementById("totalOtherExpense").textContent = "₹0";
  document.getElementById("grandTotalExpense").textContent = "₹0";
}

/* =====================================================
   MAINTENANCE RENDER
===================================================== */

function renderMaintenanceHistory() {
  const scooter = getActiveScooter();
  const container = document.getElementById("maintenanceTimeline");

  if (!scooter) {
    container.innerHTML = createEmptyState(
      "પહેલા scooter ઉમેરો",
      "Service history જોવા માટે scooter જરૂરી છે.",
    );
    return;
  }

  const services = getScooterServices(scooter.id).sort(
    (a, b) => new Date(b.date) - new Date(a.date),
  );

  if (services.length === 0) {
    container.innerHTML = createEmptyState(
      "કોઈ service record નથી",
      "પહેલી service અથવા oil changeની entry ઉમેરો.",
    );
    return;
  }

  container.innerHTML = services
    .map(
      (service) => `
            <div class="timeline-item">

                <div class="timeline-icon">
                    ${service.type === "oil-change" ? "OIL" : "S"}
                </div>

                <div class="timeline-content">
                    <h4>${escapeHtml(getServiceTypeLabel(service.type))}</h4>

                    <p>${escapeHtml(service.description)}</p>

                    <div class="timeline-meta">
                        ${formatDate(service.date)}
                        · ${formatNumber(service.odometer)} KM
                        ${
                          service.serviceCenter
                            ? ` · ${escapeHtml(service.serviceCenter)}`
                            : ""
                        }
                    </div>

                    <div class="action-buttons">
                        <button
                            type="button"
                            class="table-action-button delete"
                            data-delete-type="service"
                            data-delete-id="${service.id}"
                        >
                            Delete
                        </button>
                    </div>
                </div>

                <div class="timeline-amount">
                    ${formatCurrency(service.amount)}
                </div>

            </div>
        `,
    )
    .join("");
}

function renderMaintenanceReminder(scooter, services) {
  const generalServices = services
    .filter((service) => service.type === "general-service")
    .sort((a, b) => b.odometer - a.odometer);

  const oilChanges = services
    .filter((service) => service.type === "oil-change")
    .sort((a, b) => b.odometer - a.odometer);

  const lastServiceKm = generalServices.length
    ? generalServices[0].odometer
    : scooter.startingKm;

  const lastOilKm = oilChanges.length
    ? oilChanges[0].odometer
    : scooter.startingKm;

  const serviceInterval = scooter.serviceIntervalKm || 3000;
  const oilInterval = scooter.oilIntervalKm || 3000;

  const nextServiceKm = lastServiceKm + serviceInterval;
  const nextOilKm = lastOilKm + oilInterval;

  const serviceRemaining = roundNumber(nextServiceKm - scooter.currentKm);

  const oilRemaining = roundNumber(nextOilKm - scooter.currentKm);

  document.getElementById("serviceKmRemaining").textContent =
    serviceRemaining > 0
      ? `${formatNumber(serviceRemaining)} KM બાકી`
      : "Service due";

  document.getElementById("oilKmRemaining").textContent =
    oilRemaining > 0
      ? `${formatNumber(oilRemaining)} KM બાકી`
      : "Oil change due";

  document.getElementById("nextServiceDetails").textContent =
    `આગામી service ${formatNumber(nextServiceKm)} KM પર`;

  document.getElementById("nextOilDetails").textContent =
    `આગામી oil change ${formatNumber(nextOilKm)} KM પર`;

  const serviceUsed =
    ((scooter.currentKm - lastServiceKm) / serviceInterval) * 100;

  const oilUsed = ((scooter.currentKm - lastOilKm) / oilInterval) * 100;

  document.getElementById("serviceProgressBar").style.width =
    `${clamp(serviceUsed, 0, 100)}%`;

  document.getElementById("oilProgressBar").style.width =
    `${clamp(oilUsed, 0, 100)}%`;
}

/* =====================================================
   SCOOTER CARDS RENDER
===================================================== */

function renderScooterCards() {
  const container = document.getElementById("scooterCardsContainer");

  if (appData.scooters.length === 0) {
    container.innerHTML = createEmptyState(
      "હજી કોઈ scooter ઉમેરેલ નથી",
      "શરૂઆત કરવા માટે તમારા scooterની માહિતી ઉમેરો.",
      true,
    );
    return;
  }

  container.innerHTML = appData.scooters
    .map((scooter) => {
      const expenses = getScooterExpenses(scooter.id);
      const services = getScooterServices(scooter.id);

      const totalExpense =
        sumValues(expenses, "amount") + sumValues(services, "amount");

      const drivenKm = roundNumber(scooter.currentKm - scooter.startingKm);

      const isActive = scooter.id === appData.activeScooterId;

      return `
                <article class="scooter-card ${
                  isActive ? "active-scooter" : ""
                }">

                    <div class="scooter-card-top">

                        <div class="scooter-avatar">
                            ${escapeHtml(scooter.name.charAt(0).toUpperCase())}
                        </div>

                        ${
                          isActive
                            ? `<span class="active-badge">Active</span>`
                            : ""
                        }
                    </div>

                    <h4>${escapeHtml(scooter.name)}</h4>

                    <p class="scooter-number">
                        ${escapeHtml(
                          scooter.registrationNumber ||
                            "Registration number નથી",
                        )}
                    </p>

                    <div class="scooter-stats">

                        <div class="scooter-stat">
                            <span>Current KM</span>
                            <strong>
                                ${formatNumber(scooter.currentKm)} KM
                            </strong>
                        </div>

                        <div class="scooter-stat">
                            <span>Driven KM</span>
                            <strong>
                                ${formatNumber(drivenKm)} KM
                            </strong>
                        </div>

                        <div class="scooter-stat">
                            <span>Total Expense</span>
                            <strong>
                                ${formatCurrency(totalExpense)}
                            </strong>
                        </div>

                        <div class="scooter-stat">
                            <span>Model Year</span>
                            <strong>
                                ${scooter.modelYear || "—"}
                            </strong>
                        </div>

                    </div>

                    <div class="scooter-card-actions">

                        ${
                          !isActive
                            ? `
                                <button
                                    type="button"
                                    class="secondary-button"
                                    data-select-scooter="${scooter.id}"
                                >
                                    Select
                                </button>
                            `
                            : ""
                        }

                        <button
                            type="button"
                            class="secondary-button"
                            data-edit-scooter="${scooter.id}"
                        >
                            Edit
                        </button>

                        <button
                            type="button"
                            class="danger-button"
                            data-delete-type="scooter"
                            data-delete-id="${scooter.id}"
                        >
                            Delete
                        </button>

                    </div>

                </article>
            `;
    })
    .join("");
}

/* =====================================================
   REPORTS
===================================================== */

function renderReports() {
  const scooter = getActiveScooter();

  if (!scooter) {
    resetReports();
    return;
  }

  const reportMonthInput = document.getElementById("reportMonthFilter");

  if (!reportMonthInput.value) {
    reportMonthInput.value = getLocalDateValue().slice(0, 7);
  }

  const selectedMonth = reportMonthInput.value;

  const rides = getScooterRides(scooter.id).filter(
    (ride) => ride.dateTime.slice(0, 7) === selectedMonth,
  );

  const expenses = getScooterExpenses(scooter.id).filter(
    (expense) => expense.date.slice(0, 7) === selectedMonth,
  );

  const services = getScooterServices(scooter.id).filter(
    (service) => service.date.slice(0, 7) === selectedMonth,
  );

  const totalKm = sumValues(rides, "distance");

  const petrolExpenses = expenses.filter(
    (expense) => expense.type === "petrol",
  );

  const otherExpenses = expenses.filter((expense) => expense.type !== "petrol");

  const petrolAmount = sumValues(petrolExpenses, "amount");
  const serviceAmount = sumValues(services, "amount");
  const otherAmount = sumValues(otherExpenses, "amount");

  const totalExpense = petrolAmount + serviceAmount + otherAmount;

  const costPerKm = totalKm > 0 ? totalExpense / totalKm : 0;

  const mileage = calculateMileage(
    getScooterExpenses(scooter.id).filter(
      (expense) => expense.type === "petrol",
    ),
  );

  document.getElementById("reportTotalKm").textContent =
    `${formatNumber(totalKm)} KM`;

  document.getElementById("reportTotalExpense").textContent =
    formatCurrency(totalExpense);

  document.getElementById("reportPetrolExpense").textContent =
    formatCurrency(petrolAmount);

  document.getElementById("reportServiceExpense").textContent =
    formatCurrency(serviceAmount);

  document.getElementById("reportCostPerKm").textContent =
    formatCurrency(costPerKm);

  document.getElementById("reportMileage").textContent =
    mileage > 0 ? `${formatNumber(mileage)} KM/L` : "Not enough data";

  document.getElementById("petrolBreakdownAmount").textContent =
    formatCurrency(petrolAmount);

  document.getElementById("serviceBreakdownAmount").textContent =
    formatCurrency(serviceAmount);

  document.getElementById("otherBreakdownAmount").textContent =
    formatCurrency(otherAmount);

  setBreakdownBar("petrolBreakdownBar", petrolAmount, totalExpense);

  setBreakdownBar("serviceBreakdownBar", serviceAmount, totalExpense);

  setBreakdownBar("otherBreakdownBar", otherAmount, totalExpense);
}

function calculateMileage(petrolEntries) {
  const entries = [...petrolEntries].sort((a, b) => {
    if (a.odometer !== b.odometer) {
      return a.odometer - b.odometer;
    }

    return new Date(a.date) - new Date(b.date);
  });

  const fullTankIndexes = [];

  entries.forEach((entry, index) => {
    if (entry.fullTank) {
      fullTankIndexes.push(index);
    }
  });

  if (fullTankIndexes.length < 2) {
    return 0;
  }

  let totalDistance = 0;
  let totalLitres = 0;

  for (let i = 1; i < fullTankIndexes.length; i++) {
    const previousIndex = fullTankIndexes[i - 1];
    const currentIndex = fullTankIndexes[i];

    const distance =
      entries[currentIndex].odometer - entries[previousIndex].odometer;

    let litres = 0;

    for (
      let entryIndex = previousIndex + 1;
      entryIndex <= currentIndex;
      entryIndex++
    ) {
      litres += Number(entries[entryIndex].litres) || 0;
    }

    if (distance > 0 && litres > 0) {
      totalDistance += distance;
      totalLitres += litres;
    }
  }

  return totalLitres > 0 ? totalDistance / totalLitres : 0;
}

function setBreakdownBar(elementId, amount, total) {
  const percentage = total > 0 ? (amount / total) * 100 : 0;

  document.getElementById(elementId).style.width =
    `${clamp(percentage, 0, 100)}%`;
}

function resetReports() {
  const zeroCurrencyIds = [
    "reportTotalExpense",
    "reportPetrolExpense",
    "reportServiceExpense",
    "reportCostPerKm",
    "petrolBreakdownAmount",
    "serviceBreakdownAmount",
    "otherBreakdownAmount",
  ];

  document.getElementById("reportTotalKm").textContent = "0 KM";
  document.getElementById("reportMileage").textContent = "0 KM/L";

  zeroCurrencyIds.forEach((id) => {
    document.getElementById(id).textContent = "₹0";
  });

  ["petrolBreakdownBar", "serviceBreakdownBar", "otherBreakdownBar"].forEach(
    (id) => {
      document.getElementById(id).style.width = "0%";
    },
  );
}

/* =====================================================
   DIALOG HELPERS
===================================================== */

function openDialog(dialogId) {
  const dialog = document.getElementById(dialogId);

  if (!dialog) {
    return;
  }

  if (typeof dialog.showModal === "function") {
    dialog.showModal();
  } else {
    dialog.setAttribute("open", "");
  }
}

function closeDialog(dialogId) {
  const dialog = document.getElementById(dialogId);

  if (!dialog) {
    return;
  }

  if (typeof dialog.close === "function") {
    dialog.close();
  } else {
    dialog.removeAttribute("open");
  }

  if (dialogId === "scooterDialog") {
    document.getElementById("scooterInitialKm").disabled = false;
  }

  if (dialogId === "deleteDialog") {
    pendingDelete = null;
  }
}

function requireScooter() {
  showToast("પહેલા તમારું scooter ઉમેરો.", "error");

  openScooterDialog();
}

/* =====================================================
   DATA HELPERS
===================================================== */

function getActiveScooter() {
  return (
    appData.scooters.find(
      (scooter) => scooter.id === appData.activeScooterId,
    ) || null
  );
}

function getScooterRides(scooterId) {
  return appData.rides.filter((ride) => ride.scooterId === scooterId);
}

function getScooterExpenses(scooterId) {
  return appData.expenses.filter((expense) => expense.scooterId === scooterId);
}

function getScooterServices(scooterId) {
  return appData.services.filter((service) => service.scooterId === scooterId);
}

function sumValues(records, key) {
  return roundNumber(
    records.reduce((total, record) => total + (Number(record[key]) || 0), 0),
  );
}

function createId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

/* =====================================================
   DATE HELPERS
===================================================== */

function setDefaultDates() {
  const reportMonth = document.getElementById("reportMonthFilter");

  if (reportMonth && !reportMonth.value) {
    reportMonth.value = getLocalDateValue().slice(0, 7);
  }
}

function getLocalDateValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getLocalDateTimeValue(date = new Date()) {
  const datePart = getLocalDateValue(date);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${datePart}T${hours}:${minutes}`;
}

function parseDateValue(value) {
  if (!value) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T00:00:00`);
  }

  return new Date(value);
}

function formatDate(value) {
  const date = parseDateValue(value);

  if (!date || Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value) {
  const date = parseDateValue(value);

  if (!date || Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/* =====================================================
   FORMATTING HELPERS
===================================================== */

function formatCurrency(value) {
  const number = Number(value) || 0;

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(number);
}

function formatNumber(value) {
  const number = Number(value) || 0;

  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(number);
}

function roundNumber(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(Number(value) || 0, minimum), maximum);
}

function getExpenseTypeLabel(type) {
  const labels = {
    petrol: "Petrol",
    repair: "Repair",
    insurance: "Insurance",
    puc: "PUC",
    accessory: "Accessory",
    washing: "Washing",
    parking: "Parking",
    fine: "Fine",
    other: "Other",
  };

  return labels[type] || type || "Expense";
}

function getServiceTypeLabel(type) {
  const labels = {
    "general-service": "General Service",
    "oil-change": "Engine Oil Change",
    tyre: "Tyre Work",
    battery: "Battery",
    brake: "Brake Work",
    repair: "Repair",
    other: "Other Service",
  };

  return labels[type] || type || "Service";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function createEmptyState(title, description, fullWidth = false) {
  return `
        <div class="empty-state ${fullWidth ? "full-width" : ""}">
            <div class="empty-icon">+</div>
            <h4>${escapeHtml(title)}</h4>
            <p>${escapeHtml(description)}</p>
        </div>
    `;
}

/* =====================================================
   TOAST
===================================================== */

function showToast(message, type = "success") {
  const toast = document.getElementById("toast");

  if (!toast) {
    return;
  }

  clearTimeout(toastTimer);

  toast.textContent = message;
  toast.className = `toast ${type} show`;

  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}
/* =====================================================
   PWA SERVICE WORKER
===================================================== */

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register(
        "./service-worker.js",
        {
          scope: "./",
        },
      );

      console.log("Scooter Tracker offline mode ready:", registration.scope);
    } catch (error) {
      console.error("Service worker registration failed:", error);
    }
  });
}

/* =====================================================
   REQUEST PERSISTENT LOCAL STORAGE
===================================================== */

async function requestPersistentAppStorage() {
  if (!navigator.storage || typeof navigator.storage.persist !== "function") {
    return;
  }

  try {
    const alreadyPersistent = await navigator.storage.persisted();

    if (alreadyPersistent) {
      console.log("Local storage is already persistent.");
      return;
    }

    const permissionGranted = await navigator.storage.persist();

    console.log(
      permissionGranted
        ? "Persistent local storage enabled."
        : "Persistent storage was not granted.",
    );
  } catch (error) {
    console.error("Persistent storage request failed:", error);
  }
}

window.addEventListener("load", requestPersistentAppStorage);
