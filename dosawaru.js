let isPlaying = false;
let finance_data = [];
let attribute_data = [];
let attribute_data_all_years = [];
let lassoStates = [];
let lassoData = [];
let selectedScale = "currentYear";
let selectedYear = 1992;
let selectedAttribute = "Totals.Revenue";

// Create Range
const range = (start, end) =>
  Array.from({ length: Math.ceil(end - start + 1) }, (_, i) => start + i);

// Set range of years
let yearRange = range(1992, 2004);

// Margin
let margin = { top: 25, right: 25, bottom: 50, left: 50 };

// Max and Min
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

// Get element Ids
let playButton = document.getElementById("playButton");
let slider = document.getElementById("sliderRange");
let yearDisplay = document.getElementById("year");
let toggleButton = document.getElementById("toggle-radio");
let dropdown = document.getElementById("attributeDropdown");

// Define gridMap and lineGraph
let gridMap = d3.select("#map");
let lineGraph = d3.select("#lines");

// Keep track of draw status
let mapGraphDrawnStatus = false;
let lineGraphDrawnStatus = false;

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
    dropdownMenu();
    toggleMenu();
    sliderMenu();
    playMenu();
    getAttributeData(selectedYear, selectedAttribute);
    getAttributeData_All(selectedAttribute);
    getMinMaxValues(selectedScale, selectedYear);
    getMapData();
  });
});

// Dropdown menu with selected attributes
function dropdownMenu() {
  // Add attributes to dropdown
  fiveAttributes.forEach((attribute) => {
    let option = document.createElement("option");
    option.value = attribute;
    option.textContent = attribute;
    dropdown.appendChild(option);
  });

  dropdown.addEventListener("change", function () {
    selectedAttribute = this.value;
    // Get the attribute data based on the selected scale
    selectedScale == "currentYear"
      ? getAttributeData(selectedYear, selectedAttribute)
      : getAttributeData_All(selectedAttribute);

    getMapData();
    getLassoData(selectedAttribute);
  });
}

// Toggle the scale using radio buttons
function toggleMenu() {
  toggleButton.addEventListener("change", function (event) {
    if (event.target.name === "typeofScale") {
      selectedScale = event.target.value;

      // Update Line Grah mark
      if (selectedScale === "allYear") {
        slider.disabled = true;
        playButton.disabled = true;
        yearDisplay.innerHTML = "1992 - 2004";
        updateCurrentYearMarker();
      } else {
        slider.disabled = false;
        playButton.disabled = false;
        yearDisplay.innerHTML = slider.value;
        updateCurrentYearMarker();
      }
      // Get the attribute data based on the selected scale
      selectedScale == "currentYear"
        ? getAttributeData(selectedYear, selectedAttribute)
        : getAttributeData_All(selectedAttribute);
      getMapData();
    }
  });
}

// Change Year using slider
function sliderMenu() {
  yearDisplay.innerHTML = slider.value;

  // Update slider and data based on year
  slider.addEventListener("input", function () {
    selectedYear = this.value;
    yearDisplay.innerHTML = slider.value;
    getAttributeData(selectedYear, selectedAttribute);
    updateCurrentYearMarker();
    getMapData();
  });
}

// Play animation
function playMenu() {
  playButton.addEventListener("click", function () {
    // Checks if the animation is play and line graph is no empty
    if (!isPlaying && !lineGraph.selectAll(".state-lines").empty()) {
      isPlaying = true;
      updateCurrentYearMarker();
    }
  });
}

// Get the data for the selected year and attribute
function getAttributeData(year, attribute) {
  attribute_data = finance_data
    .filter((d) => d.Year === String(year)) // Filters data based on year
    .map((d) => ({
      State: d.State,
      Year: d.Year,
      values: +d[attribute], // Gets the values of the selected attribute and converts to a num
    }));
}

// Get the data for the selected attribute and all years
function getAttributeData_All(attribute) {
  attribute_data_all_years = finance_data.map((d) => ({
    State: d.State,
    Year: d.Year,
    values: +d[attribute],
  }));
}

// Get the Min and Max Values based on the selected year or scale
function getMinMaxValues(selectedScale, selectedYear) {
  let values = [];

  // Check the state of which scale is active and get all the values accordingly
  if (selectedScale === "allYear") {
    values = attribute_data_all_years.map((item) => item.values).flat();
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

// Get the Map Graph general data
function getMapData() {
  // Get the width of the container
  const mapContainer = document.getElementById("map-svg");
  const width = mapContainer.offsetWidth - margin.left - margin.right;

  // Set the size of the cells based on the width of the container
  const cellsize = Math.floor(width / 12);

  // Calculate height based on cells
  const height = cellsize * 8;

  // Set color range
  const color = d3
    .scaleLinear()
    .domain([minValue, maxValue])
    .range(["#ff0000", "#0000ff"]);

  // Create scale using min and max values and draw axis
  const legendScale = d3
    .scaleLinear()
    .domain([minValue, maxValue])
    .range([0, width]);

  // Loads the state_pos.json file
  d3.json("state_pos.json").then((data) => {
    // Bind data to state labels
    const states = gridMap
      .selectAll(".state")
      .data(Object.entries(data), function (d) {
        return d[0];
      });

    // Draw map graph initially, otherwise updates map graph
    if (!mapGraphDrawnStatus) {
      drawMap(states, data, width, cellsize, height, color, legendScale);
      mapGraphDrawnStatus = true;
    } else {
      updateMap(states, width);
    }
  });
}

// Get the Lassso data (state, year, values) based on the selected attribute and Line Graph general data
function getLassoData(selectedAttribute) {
  getAttributeData_All(selectedAttribute);

  lassoData = attribute_data_all_years
    .filter((d) => lassoStates[0].includes(d.State)) // Check if the state is in the selected states
    .map((d) => ({
      State: d.State,
      Year: d.Year,
      Values: d.values,
    }));

  // Define width and height
  let linesContainer = document.getElementById("lines-svg");
  let width = linesContainer.offsetWidth - margin.left - margin.right - 100;
  let height = linesContainer.offsetHeight - margin.top - margin.bottom;

  // Groups all the date based on State Name
  const sumstat = d3.group(lassoData, (d) => d.State);

  // X-axis
  const x = d3
    .scaleTime()
    .domain([new Date(1992, 0, 1), new Date(2004, 0, 1)])
    .range([0, width]);

  // Y-axis
  const y = d3
    .scaleLinear()
    .domain([0, d3.max(lassoData, (d) => d.Values)])
    .range([height, 0]);

  // Set color range
  const color = d3
    .scaleOrdinal()
    .range([
      "#e41a1c",
      "#377eb8",
      "#4daf4a",
      "#984ea3",
      "#ff7f00",
      "#ffff33",
      "#a65628",
      "#f781bf",
      "#999999",
    ]);

  // Map x and y to year and value respectively
  const line = d3
    .line()
    .x((d) => x(new Date(+d.Year, 0, 1)))
    .y((d) => y(d.Values))
    .curve(d3.curveCatmullRom);

  // Draws lines graph initially, otherwise updates line graph
  if (!lineGraphDrawnStatus) {
    drawLines(width, height, sumstat, x, y, color, line);
    lineGraphDrawnStatus = true;
  } else {
    updateLines(width, sumstat, y, color, line);
  }
}

// Draws Map Graph
function drawMap(states, data, width, cellsize, height, color, legendScale) {
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
    .style("fill", function (d) {
      const state_value = attribute_data.filter((i) => i.State === d[0])[0]; // Filter the attribute data based on the current state
      return state_value ? color(state_value.values) : "#ccc"; // Return the color based on the value of the attribute, defualt grey if no values found
    })
    .attr("stroke", "white");

  // Bind data to state labels
  const text = gridMap
    .selectAll(".state-label")
    .data(Object.entries(data), function (d) {
      return d[0];
    });

  // Draw state labels
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
    .style("user-select", "none")
    .text(function (d, i) {
      return d[1].code; // Displays the state code
    });

  // Create gradient layout
  const defs = gridMap.append("defs");
  const gradient = defs
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
      .attr("class", "gradient-color")
      .attr("offset", `${i * 10}%`)
      .attr("stop-color", color(minValue + (i / 10) * (maxValue - minValue)));
  }

  const legendHeight = height + margin.top + margin.bottom;

  // Draw gradient legend
  gridMap
    .append("rect")
    .attr("class", "color-scale")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", width)
    .attr("height", 20)
    .style("fill", "url(#gradient)")
    .attr("transform", "translate(0," + legendHeight + ")");

  // Gradient axis
  const axisBottom = d3
    .axisBottom(legendScale)
    .ticks(5)
    .tickFormat(d3.format(".2s"));

  gridMap
    .append("g")
    .attr("class", "x-axis")
    .style("user-select", "none")
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
      // Disable lasso if animation is playing
      if (!isPlaying) {
        isDrawing = true;
        polygon = [];

        // Gets the coordinates of the pointer and stores it in a array
        const [x, y] = d3.pointer(e);
        polygon.push([x, y]);
        drawLasso(polygon);
      }
    })
    // Lasso Drawing
    .on("pointermove", function (e) {
      if (isDrawing) {
        const [x, y] = d3.pointer(e);
        polygon.push([x, y]);
        drawLasso(polygon);
      }
    })
    // Lasso end
    .on("pointerup", function () {
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

      lassoStates = [];
      lassoStates.push(selected.map((d) => d.state)); // Store array with names of selected states

      getLassoData(selectedAttribute); // Get the state data that are within the lasso
    });
}

// Update Map Graph
function updateMap(states, width) {
  // Update min and max values based on selected scale and year
  getMinMaxValues(selectedScale, selectedYear);

  // Update color domain
  const color = d3
    .scaleLinear()
    .domain([minValue, maxValue])
    .range(["#ff0000", "#0000ff"]);

  // Update state color
  states
    .transition()
    .duration(250)
    .style("fill", function (d) {
      const state_value = attribute_data.filter((i) => i.State === d[0])[0];
      return state_value ? color(state_value.values) : "#ccc";
    });

  // Update X-axis
  const legendScale = d3
    .scaleLinear()
    .domain([minValue, maxValue])
    .range([0, width]);

  gridMap
    .selectAll(".x-axis")
    .transition()
    .duration(500)
    .call(d3.axisBottom(legendScale).ticks(5).tickFormat(d3.format(".2s")));
}

// Draw Line Graph
function drawLines(width, height, sumstat, x, y, color, line) {
  // Draw lines
  lineGraph
    .selectAll(".line")
    .data(sumstat, (d) => d[0])
    .join("path")
    .attr("class", "state-lines")
    .attr("fill", "none")
    .attr("stroke", (d) => color(d[0]))
    .attr("stroke-width", 2)
    .attr("fill", "transparent")
    .attr("d", (d) => line(d[1]))
    .attr("transform", `translate(${margin.left}, 0)`)
    .style("opacity", 0)
    .transition()
    .duration(500) // Transition when fading in
    .style("opacity", 1);

  // Draw line label
  lineGraph
    .selectAll("text.label")
    .data(sumstat, (d) => d[0])
    .join("text")
    .attr("class", "label")
    .style("user-select", "none")
    .attr("x", width + margin.left + 5)
    .attr("y", (d) => {
      const lastpoint = d[1][d[1].length - 1].Values; // Get the values for the last year (2004)
      return y(lastpoint);
    })
    .attr("fill", (d) => color(d[0]))
    .attr("font-size", 10)
    .attr("font-family", "sans-serif")
    .text((d) => d[0])
    .style("opacity", 0)
    .transition()
    .duration(500) // Transition when fading in
    .style("opacity", 1);

  updateCurrentYearMarker();

  // X-axis label
  lineGraph
    .append("text")
    .attr("class", "x-label")
    .attr("x", width / 2 + margin.left)
    .attr("y", height + margin.top + 10)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .attr("fill", "white")
    .text("Year");

  lineGraph
    .append("g")
    .style("user-select", "none")
    .attr("class", "x-axis")
    .attr("transform", `translate(${margin.left}, ${height})`)
    .call(
      d3
        .axisBottom(x)
        .ticks(d3.timeYear.every(1))
        .tickFormat(d3.timeFormat("%Y"))
    );

  // Y-axis label
  lineGraph
    .append("text")
    .attr("class", "y-label")
    .attr("x", -height / 2)
    .attr("y", 10)
    .attr("fill", "white")
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .attr("transform", "rotate(-90)")
    .text(selectedAttribute + " ($)");

  lineGraph
    .append("g")
    .attr("class", "y-axis")
    .style("user-select", "none")
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(d3.axisLeft(y).ticks(10).tickFormat(d3.format(".2s")));
}

// Update Line Graph
function updateLines(width, sumstat, y, color, line) {
  // Update lines
  lineGraph
    .selectAll(".state-lines")
    .data(sumstat, (d) => d[0])
    .join(
      (enter) =>
        enter
          .append("path")
          .attr("class", "state-lines")
          .attr("fill", "none")
          .attr("stroke", (d) => color(d[0]))
          .attr("transform", `translate(${margin.left}, 0)`)
          .attr("stroke-width", 2)
          .attr("d", (d) => line(d[1]))
          .style("opacity", 0)
          .transition()
          .duration(500) // Fade in new lines
          .style("opacity", 1),
      (update) =>
        update // Update existing lines
          .transition()
          .duration(500)
          .attr("d", (d) => line(d[1]))
          .attr("stroke", (d) => color(d[0])),
      (exit) =>
        exit // Fade out lines for unselected states
          .transition()
          .duration(500)
          .style("opacity", 0)
          .remove()
    );

  // Update labels
  lineGraph
    .selectAll("text.label")
    .data(sumstat, (d) => d[0])
    .join(
      (enter) =>
        enter
          .append("text")
          .attr("class", "label")
          .attr("x", width + margin.left + 5)
          .attr("y", (d) => {
            const lastpoint = d[1][d[1].length - 1].Values; // Get the values for the last year (2004)
            return y(lastpoint);
          })
          .attr("fill", (d) => color(d[0]))
          .attr("font-size", 10)
          .attr("font-family", "sans-serif")
          .text((d) => d[0])
          .style("opacity", 0)
          .transition()
          .duration(500) // Fade in labels
          .style("opacity", 1),
      (update) =>
        update // Update labels
          .transition()
          .duration(500)
          .attr("y", (d) => {
            const lastpoint = d[1][d[1].length - 1].Values; // Get the values for the last year (2004)
            return y(lastpoint);
          })
          .attr("fill", (d) => color(d[0])),
      (exit) =>
        exit // Fade out labels for unselected states
          .transition()
          .duration(500)
          .style("opacity", 0)
          .remove()
    );

  // Update Y-axis and label
  lineGraph
    .selectAll(".y-label")
    .transition()
    .duration(500)
    .text(selectedAttribute + " ($)");

  lineGraph
    .selectAll(".y-axis")
    .transition()
    .duration(500)
    .call(d3.axisLeft(y).ticks(10).tickFormat(d3.format(".2s")));
}

// Update Current Year Marker
function updateCurrentYearMarker() {
  let linesContainer = document.getElementById("lines-svg");
  let width = linesContainer.offsetWidth - margin.left - margin.right - 100;
  let height = linesContainer.offsetHeight - margin.top - margin.bottom;

  const x = d3
    .scaleTime()
    .domain([new Date(1992, 0, 1), new Date(2004, 0, 1)])
    .range([0, width]);

  let yearLine = lineGraph.select(".line-year");

  // Animation when moving marker
  if (selectedScale !== "allYear") {
    if (!yearLine.empty()) {
      yearLine
        .transition()
        .ease(d3.easeSinInOut)
        .duration(250)
        .attr("x1", x(new Date(selectedYear, 0, 1)))
        .attr("x2", x(new Date(selectedYear, 0, 1)));
    } else if (!lineGraph.selectAll(".state-lines").empty()) {
      drawMarker();
    }
  } else {
    yearLine
      .transition()
      .ease(d3.easeSinInOut)
      .duration(500)
      .style("opacity", 0)
      .remove();
  }

  // Add click event to line graph
  lineGraph.on("click", function (e) {
    const [mouseX] = d3.pointer(e);

    // Calculate the the year clicked on the line graph
    const clickedDate = x.invert(mouseX - margin.left / 2);
    const clickedYear = clickedDate.getFullYear();

    // Ensure that the year is within the range and correct scale
    if (
      clickedYear >= 1992 &&
      clickedYear <= 2004 &&
      selectedScale !== "allYear" &&
      !isPlaying
    ) {
      // Update selected year, slider, and display
      selectedYear = clickedYear;
      slider.value = selectedYear;
      yearDisplay.innerHTML = selectedYear;

      // Update marker, attribute data, and map
      updateCurrentYearMarker();
      getAttributeData(selectedYear, selectedAttribute);
      getMapData();
    }
  });

  if (isPlaying && selectedScale !== "allYear") {
    yearLine
      .transition()
      .on("start", () => {
        disableControlPanel(); // disable elements
      })
      .ease(d3.easeLinear)
      .duration(3000)
      .attr("x1", x(new Date(2004, 0, 1)))
      .attr("x2", x(new Date(2004, 0, 1)))
      .transition()
      .duration(500)
      .style("opacity", 0)
      .remove()
      .on("end", () => {
        drawMarker();
        enableControlPanel(); // re-enable elements
        isPlaying = false;
      });
  }

  // Draw marker
  function drawMarker() {
    lineGraph
      .append("line")
      .attr("class", "line-year")
      .attr("x1", x(new Date(selectedYear, 0, 1)))
      .attr("x2", x(new Date(selectedYear, 0, 1)))
      .attr("y2", height)
      .attr("y1", 0)
      .style("stroke", "white")
      .style("stroke-width", 2)
      .attr("transform", `translate(${margin.left}, 0)`)
      .style("opacity", 0)
      .transition()
      .duration(500)
      .style("opacity", 1);
  }

  // Disable control panel
  function disableControlPanel() {
    const controlPanel = document.getElementById("control-panel");
    const elements = controlPanel.querySelectorAll("input, select, button");
    elements.forEach((x) => (x.disabled = true));
  }

  // Enable control panel
  function enableControlPanel() {
    const controlPanel = document.getElementById("control-panel");
    const elements = controlPanel.querySelectorAll("input, select, button");
    elements.forEach((x) => (x.disabled = false));
  }
}
