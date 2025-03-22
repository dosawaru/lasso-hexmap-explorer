let isPlaying = false;
let finance_data = [];
let attribute_data = [];
let attribute_data_all_years = [];
let selectedScale = "currentYear";
let selectedYear = 1992;
let selectedAttribute = "Totals.Revenue";

// Create Range
const range = (start, end) =>
  Array.from({ length: Math.ceil(end - start + 1) }, (_, i) => start + i);

// Set range of years
let yearRange = range(1992, 2004);

// Margin
let margin = { top: 25, right: 25, bottom: 25, left: 25 };

// Max and Min in current years
let values = [];
let maxValue = 0;
let minValue = 0;

// List of attributes
let fiveAttributes = [
  "Totals.Revenue",
  "Totals.Tax",
  "Totals. Debt at end of fiscal year",
  "Details.Transportation.Highways.Highways Total Expenditure",
  "Details.Education.Education Total",
];

// Define gridMap
let gridMap = d3.select("#map");

document.addEventListener("DOMContentLoaded", function () {
  // Load the finance.csv file
  Promise.all([d3.csv("finance.csv")]).then(function (values) {
    console.log("Loaded the finance.csv");
    finance_data = values[0];
    // Filter Data to only show years from valid years, 1992 - 2004
    finance_data = finance_data.filter((d) => {
      const year = parseInt(d.Year, 10);
      return year >= 1992 && year <= 2004;
    });
    // console.log(finance_data);
    dropdownMenu();
    toggleMenu();
    slider();
    playpauseButton();
    getAttributeData(selectedYear, selectedAttribute);
    getAttributeData_All(selectedAttribute);
    getMinMaxValues(selectedScale, selectedYear);
    draw();
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
    // console.log("Selected attribute:", selectedAttribute);

    selectedScale == "currentYear"
      ? getAttributeData(selectedYear, selectedAttribute)
      : getAttributeData_All(selectedAttribute);

    updateDraw();
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
          yearDisplay.innerHTML = "1992 - 2004";
        } else {
          slider.disabled = false;
          yearDisplay.innerHTML = slider.value;
        }
        // Get the attribute data based on the selected scale
        selectedScale == "currentYear"
          ? getAttributeData(selectedYear, selectedAttribute)
          : getAttributeData_All(selectedAttribute);
        updateDraw();
      }
    });
}

// Function to update the Year slider
function slider() {
  let slider = document.getElementById("sliderRange");
  let yearDisplay = document.getElementById("year");

  yearDisplay.innerHTML = slider.value;

  slider.addEventListener("input", function () {
    selectedYear = this.value;
    yearDisplay.innerHTML = slider.value;
    console.log("Year:", this.value);
    getAttributeData(selectedYear, selectedAttribute);
    updateDraw();
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
  // console.log(attribute_data);
}

// Function to get the data for the selected attribute and all year
function getAttributeData_All(attribute) {
  console.log(selectedAttribute);
  attribute_data_all_years = finance_data.map((d) => ({
    State: d.State,
    Year: d.Year,
    values: +d[attribute],
  }));
  // console.log(attribute_data_all_years);
}

// Function to draw Map
function draw() {
  // Get the width of the container
  let mapContainer = document.getElementById("map-svg");
  let width = mapContainer.offsetWidth - margin.left - margin.right;

  // Set the size of the cells based on the width of the container
  const cellsize = Math.floor(width / 12);

  // Calculate height based on cells
  const height = cellsize * 8;

  // Loads the state_pos.json file
  d3.json("state_pos.json").then(function (data) {
    let states = gridMap
      .selectAll(".state")
      .data(Object.entries(data), function (d) {
        return d[0]; // Returns each state
      });

    // Set color range
    const color = d3
      .scaleLinear()
      .domain([minValue, maxValue])
      .range(["#ff0000", "#0000ff"]);

    // Draw states
    states
      .enter()
      .append("rect")
      .attr("class", "state")
      // Position the cell based on the coordinates
      .attr("y", function (d) {
        return d[1].coordinates[0] * cellsize;
      })
      .attr("x", function (d) {
        return d[1].coordinates[1] * cellsize;
      })
      .attr("width", cellsize)
      .attr("height", cellsize)
      .attr("fill", function (d) {
        let state_value = attribute_data.filter((i) => i.State === d[0])[0]; // Filter the attribute dats based on the current state
        return state_value ? color(state_value.values) : "#ccc"; // Return the color based on the value of the attribute
      })
      .attr("stroke", "white");

    // Draw state labels
    let text = gridMap
      .selectAll(".state-label")
      .data(Object.entries(data), function (d) {
        return d[0];
      });

    text
      .enter()
      .append("text")
      .attr("class", "state-label")
      // Position the text in the center of the cell
      .attr("y", function (d) {
        return d[1].coordinates[0] * cellsize + cellsize / 2;
      })
      .attr("x", function (d) {
        return d[1].coordinates[1] * cellsize + cellsize / 2;
      })
      .attr("font-size", "9px")
      .style("text-anchor", "middle")
      .text(function (d, i) {
        return d[1].code; // Displays the state code
      });

    // Create gradient layout
    let defs = gridMap.append("defs");
    let gradient = defs
      .append("linearGradient")
      .attr("id", "gradient")
      .attr("x1", "0%")
      .attr("x2", "100%")
      .attr("y1", "0%")
      .attr("y2", "0%");

    // Create smooth gradiant based on color and min/max values
    for (let i = 0; i < 10; i++) {
      gradient
        .append("stop")
        .attr("offset", `${i * 10}%`)
        .attr("stop-color", color(minValue + (i / 10) * (maxValue - minValue)));
    }

    const legendHeight = height + margin.top + margin.bottom;

    // Draw gradient legend
    gridMap
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", width)
      .attr("height", 20)
      .style("fill", "url(#gradient)")
      .attr("transform", "translate(0," + legendHeight + ")");

    // Create scale using min and max values and draw axis
    let legendScale = d3
      .scaleLinear()
      .domain([minValue, maxValue])
      .range([0, width]);

    let axisBottom = d3
      .axisBottom(legendScale)
      .ticks(5)
      .tickFormat(d3.format(".2s"));

    gridMap
      .append("g")
      .attr("transform", "translate(0," + legendHeight + ")")
      .call(axisBottom);

    // Define lasso path and track state/values
    let path = d3.geoPath();
    let lassoPath = gridMap.append("path").attr("class", "lasso");
    let polygon = [];
    let isDrawing = false;

    // Function to draw the lasso
    function drawLasso(polygon) {
      // Store the corrdinates of the lasso
      lassoPath
        .datum({
          type: "LineString",
          coordinates: polygon,
        })
        .attr("d", path);

      // Gets the states contained within the lasso and sets the class to "selected"
      gridMap.selectAll(".state").classed("selected", function (d) {
        const x = d[1].coordinates[1] * cellsize;
        const y = d[1].coordinates[0] * cellsize;
        return polygon.length > 2 && d3.polygonContains(polygon, [x, y]);
      });
    }

    gridMap
      // Lasso Start
      .on("pointerdown", function (e) {
        console.log("lasso");

        // Changes state of drawing
        isDrawing = true;
        polygon = [];

        // Gets the coordinates of the pointer and stores it in a array
        const [x, y] = d3.pointer(e);
        polygon.push([x, y]);
        drawLasso(polygon);
      })
      // Lasso Drawing
      .on("pointermove", function (e) {
        console.log("drawing");

        if (isDrawing) {
          const [x, y] = d3.pointer(e);
          polygon.push([x, y]);
          drawLasso(polygon);
        }
      })
      // Lasso end
      .on("pointerup", function () {
        console.log("end");

        // Changes state of drawing
        isDrawing = false;
        drawLasso(polygon);

        // Filter through the all states and stores the data (state name) if found within polygon (array storing the lasso coord)
        const selected = Object.entries(data)
          .filter(([state, position]) => {
            const x = position.coordinates[1] * cellsize;
            const y = position.coordinates[0] * cellsize;
            return d3.polygonContains(polygon, [x, y]);
          })
          .map(([state, position]) => ({
            state: state,
          }));

        // Updates div with selected states
        let selectedStatesDiv = document.getElementById("selectedStates");
        if (selected.length > 0) {
          selectedStatesDiv.innerHTML = `Selected States: ${selected
            .map((d) => `${d.state}`)
            .join(", ")}`;
        } else {
          selectedStatesDiv.innerHTML = `Selected States: None`;
        }
      });
  });
}

// Update Map
function updateDraw() {
  gridMap = d3.select("#map");
  gridMap.selectAll("*").remove();
  getMinMaxValues(selectedScale, selectedYear);
  draw();
}

// Get the Min and Max Values based on the selected year or scale
function getMinMaxValues(selectedScale, selectedYear) {
  let values = [];

  // Check the state of which scale is active and get all the values accordingly
  if (selectedScale === "allYear") {
    values = attribute_data_all_years.map((item) => item.values).flat();
    console.log(attribute_data_all_years);
  } else {
    let filtered_data = attribute_data.filter(
      (item) => item.Year === String(selectedYear)
    );
    values = filtered_data.map((item) => item.values).flat();
  }

  // Update min and max Values
  minValue = Math.min(...values);
  maxValue = Math.max(...values);
}
