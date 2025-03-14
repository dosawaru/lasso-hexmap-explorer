let isPlaying = false;
let finance_data = [];
let selectedScale;
let yearSelected;
let selectedAttribute = "";

const range = (start, end) =>
  Array.from({ length: Math.ceil(end - start + 1) }, (_, i) => start + i);

let yearRange = range(1992, 2019);

let maxY = Math.max(...yearRange);
let minY = Math.min(...yearRange);

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
    // console.log(finance_data);

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
    console.log("Year:", this.value);
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
