let isPlaying = false;
let finance_data = [];
let attribute_data = [];
let selectedScale;
let yearSelected = 1992;
let selectedAttribute = "Totals.Revenue";

// Create Range
const range = (start, end) =>
  Array.from({ length: Math.ceil(end - start + 1) }, (_, i) => start + i);

// Set range of years
let yearRange = range(1992, 2019);

// Max and Min years
let maxY = Math.max(...yearRange);
let minY = Math.min(...yearRange);

// List of attributes
let fiveAttributes = [
  "Totals.Revenue",
  "Totals.Tax",
  "Totals. Debt at end of fiscal year",
  "Details.Insurance benefits and repayment",
  "Details.Education.Education Total",
];

document.addEventListener("DOMContentLoaded", function () {
  // Load the finance.csv file
  Promise.all([d3.csv("finance.csv")]).then(function (values) {
    console.log("Loaded the finance.csv");
    finance_data = values[0];
    console.log(finance_data);

    test();
    dropdownMenu();
    toggleMenu();
    slider();
    playpauseButton();
  });
});

// Function to update the selected attribute from dropdown
function dropdownMenu() {
  let dropdown = document.getElementById("attributeDropdown");

  fiveAttributes.forEach((attribute) => {
    let option = document.createElement("option");
    option.value = attribute;
    option.textContent = attribute;
    dropdown.appendChild(option);
  });

  dropdown.addEventListener("change", function () {
    selectedAttribute = this.value;
    console.log("Selected attribute:", selectedAttribute);
  });
}

// Function to toggle the radio buttons
function toggleMenu() {
  document
    .getElementById("toggle-radio")
    .addEventListener("change", function (event) {
      if (event.target.name === "typeofScale") {
        selectedScale = event.target.value;
        console.log("Selected Scale:", selectedScale);

        let slider = document.getElementById("sliderRange");
        let yearDisplay = document.getElementById("year");

        if (selectedScale === "allYear") {
          slider.disabled = true;
          yearDisplay.innerHTML = "1992 - 2019";
        } else {
          slider.disabled = false;
          yearDisplay.innerHTML = slider.value;
        }
      }
    });
}

// Function to update the Year slider
function slider() {
  let slider = document.getElementById("sliderRange");
  let yearDisplay = document.getElementById("year");

  yearDisplay.innerHTML = slider.value;

  slider.addEventListener("input", function () {
    yearSelected = this.value;
    yearDisplay.innerHTML = slider.value;
    // console.log("Year:", this.value);
  });
}

// Function to play and pause the animation
function playpauseButton() {
  let playpasue = document.getElementById("play-pause");

  playpasue.addEventListener("click", function () {
    if (isPlaying) {
      isPlaying = false;
      console.log("Paused");
    } else {
      isPlaying = true;
      console.log("Playing");
    }
  });
}

// Function to get the data for the selected year and attribute
function getAttributeData(year, attribute) {
  attribute_data = finance_data
    .filter((d) => d.Year === String(year)) // Filters data based on year
    .map((d) => ({
      State: d.State,
      Year: d.Year,
      values: +d[attribute], // Gets the values of the selected attribute and converts to a num
    }));
  console.log(attribute_data);
}

// Test
function test() {
  let test = document.getElementById("test");

  test.addEventListener("click", function () {
    console.log("Year:", yearSelected);
    console.log("Attribute:", selectedAttribute);
    getAttributeData(yearSelected, selectedAttribute);
  });
}
