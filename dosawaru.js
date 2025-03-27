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
// Define lineGraph
let lineGraph = d3.select("#lines");

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
    slider();
    playpauseButton();
    getAttributeData(selectedYear, selectedAttribute);
    getAttributeData_All(selectedAttribute);
    getMinMaxValues(selectedScale, selectedYear);
    drawMap();
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

    updateMap();
    getLassoData(selectedAttribute);
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
          lineGraph.select(".line-year").remove();
        } else {
          slider.disabled = false;
          yearDisplay.innerHTML = slider.value;
          updateCurrentYearMarker();
        }
        // Get the attribute data based on the selected scale
        selectedScale == "currentYear"
          ? getAttributeData(selectedYear, selectedAttribute)
          : getAttributeData_All(selectedAttribute);
        updateMap();
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
    updateCurrentYearMarker();
    updateMap();
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

// Get the data for the selected attribute and all year
function getAttributeData_All(attribute) {
  attribute_data_all_years = finance_data.map((d) => ({
    State: d.State,
    Year: d.Year,
    values: +d[attribute],
  }));
  // console.log(attribute_data_all_years);
}

// Get the State Values based on the selected attribute
function getLassoData(selectedAttribute) {
  getAttributeData_All(selectedAttribute);

  lassoData = attribute_data_all_years
    .filter((d) => lassoStates[0].includes(d.State)) // Check if the state is in the selected states
    .map((d) => ({
      State: d.State,
      Year: d.Year,
      Values: d.values,
    }));

  // Draws lines graph if empty and lassoData has data, otherwise update line graph
  if (lassoData.length > 0 && lineGraph.select(".line-year").empty()) {
    drawLines(lassoData);
  } else {
    updateLines(lassoData);
  }
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

// Draws Map Graph
function drawMap() {
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
      .style("fill", function (d) {
        let state_value = attribute_data.filter((i) => i.State === d[0])[0]; // Filter the attribute data based on the current state
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
      .style("user-select", "none")
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
        if (isDrawing) {
          const [x, y] = d3.pointer(e);
          polygon.push([x, y]);
          drawLasso(polygon);
        }
      })
      // Lasso end
      .on("pointerup", function () {
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

        // Store an array with names of selected states
        lassoStates = [];
        lassoStates.push(selected.map((d) => d.state));

        // Get the state data that are within the lasso
        getLassoData(selectedAttribute);
      });
  });
}

// Update Map Graph
function updateMap() {
  // Update min and max values based on selected scale and year
  getMinMaxValues(selectedScale, selectedYear);

  let mapContainer = document.getElementById("map-svg");
  let width = mapContainer.offsetWidth - margin.left - margin.right;

  d3.json("state_pos.json").then(function (data) {
    let states = gridMap
      .selectAll(".state")
      .data(Object.entries(data), function (d) {
        return d[0];
      });

    const color = d3
      .scaleLinear()
      .domain([minValue, maxValue])
      .range(["#ff0000", "#0000ff"]);

    // Update State Color
    states
      .transition()
      .ease(d3.easeSinInOut)
      .duration(0)
      .style("fill", function (d) {
        let state_value = attribute_data.filter((i) => i.State === d[0])[0];
        return state_value ? color(state_value.values) : "#ccc";
      });

    // Update X-axis
    let legendScale = d3
      .scaleLinear()
      .domain([minValue, maxValue])
      .range([0, width]);

    gridMap
      .selectAll(".x-axis")
      .transition()
      .duration(500)
      .call(d3.axisBottom(legendScale).ticks(5).tickFormat(d3.format(".2s")));
  });
}

// Draw Line Graph
function drawLines(lassoData) {
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

  // Map x and y based on year and value respectively
  const line = d3
    .line()
    .x((d) => x(new Date(+d.Year, 0, 1)))
    .y((d) => y(d.Values))
    .curve(d3.curveCatmullRom);

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

  // Line Label
  lineGraph
    .selectAll("text.label")
    .data(sumstat, (d) => d[0])
    .join("text")
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
    .duration(500) // Transition when fading in
    .style("opacity", 1);

  // Create Current Year Marker
  lineGraph
    .append("line")
    .attr("class", "line-year")
    .attr("x1", x(new Date(selectedYear, 0, 1)))
    .attr("x2", x(new Date(selectedYear, 0, 1)))
    .attr("y2", height)
    .attr("y1", 0)
    .style("stroke", "white")
    .style("stroke-width", 2)
    .attr("transform", `translate(${margin.left}, 0)`);

  // X-axis label
  lineGraph
    .append("text")
    .attr("class", "x-label")
    .attr("x", width / 2 + margin.left)
    .attr("y", height + margin.top + 10)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .text("Year");

  lineGraph
    .append("g")
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
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .attr("transform", "rotate(-90)")
    .text(selectedAttribute + " ($)");

  lineGraph
    .append("g")
    .attr("class", "y-axis")
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(d3.axisLeft(y).ticks(10).tickFormat(d3.format(".2s")));
}

// Update Line Graph
function updateLines(lassoData) {
  let linesContainer = document.getElementById("lines-svg");
  let width = linesContainer.offsetWidth - margin.left - margin.right - 100;
  let height = linesContainer.offsetHeight - margin.top - margin.bottom;

  // Group data by state
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

  // Line generator
  const line = d3
    .line()
    .x((d) => x(new Date(+d.Year, 0, 1)))
    .y((d) => y(d.Values))
    .curve(d3.curveCatmullRom);

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
  if (!yearLine.empty()) {
    yearLine
      .transition()
      .ease(d3.easeSinInOut)
      .duration(250)
      .attr("x1", x(new Date(selectedYear, 0, 1)))
      .attr("x2", x(new Date(selectedYear, 0, 1)));
  } else {
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
}
